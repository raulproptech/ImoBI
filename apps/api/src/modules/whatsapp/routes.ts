import type { FastifyInstance } from 'fastify'
import { db, conversations, messages, waInstances, contacts, waTemplates } from '@imobi/db'
import { eq, and, desc, asc, ne, count } from 'drizzle-orm'
import { z } from 'zod'

export async function whatsappRoutes(app: FastifyInstance) {

  // List conversations (inbox)
  app.get('/conversations', async (request) => {
    const { tenantId } = request.tenantContext
    const query = request.query as Record<string, string>

    const conditions = [eq(conversations.tenantId, tenantId)]
    if (query['status']) conditions.push(eq(conversations.status, query['status'] as any))
    if (query['agentId']) conditions.push(eq(conversations.assignedAgentId, query['agentId']))
    if (query['instanceId']) conditions.push(eq(conversations.instanceId, query['instanceId']))

    const rows = await db.query.conversations.findMany({
      where: and(...conditions),
      with: {
        contact: {
          columns: { id: true, fullName: true, avatarUrl: true, leadScore: true },
        },
        assignedAgent: {
          columns: { id: true, fullName: true, avatarUrl: true },
        },
        instance: {
          columns: { id: true, displayName: true, phoneNumber: true },
        },
      },
      orderBy: [desc(conversations.lastMessageAt)],
      limit: parseInt(query['pageSize'] ?? '30'),
      offset: ((parseInt(query['page'] ?? '1')) - 1) * parseInt(query['pageSize'] ?? '30'),
    })

    return rows
  })

  // Get conversation messages
  app.get('/conversations/:id/messages', async (request, reply) => {
    const { tenantId } = request.tenantContext
    const { id } = request.params as { id: string }
    const query = request.query as Record<string, string>

    const conversation = await db.query.conversations.findFirst({
      where: and(eq(conversations.id, id), eq(conversations.tenantId, tenantId)),
      with: {
        contact: true,
        assignedAgent: { columns: { id: true, fullName: true, avatarUrl: true } },
      },
    })

    if (!conversation) return reply.status(404).send({ error: 'Conversation not found' })

    const msgs = await db.query.messages.findMany({
      where: eq(messages.conversationId, id),
      orderBy: [desc(messages.createdAt)],
      limit: parseInt(query['pageSize'] ?? '50'),
      offset: ((parseInt(query['page'] ?? '1')) - 1) * 50,
    })

    return { conversation, messages: msgs.reverse() }
  })

  // Send message
  app.post('/conversations/:id/messages', async (request, reply) => {
    const { tenantId, userId } = request.tenantContext
    const { id } = request.params as { id: string }

    const schema = z.object({
      type: z.enum(['text', 'template', 'interactive']).default('text'),
      content: z.string().min(1),
      templateName: z.string().optional(),
      templateComponents: z.array(z.any()).optional(),
    })

    const body = schema.parse(request.body)

    const conversation = await db.query.conversations.findFirst({
      where: and(eq(conversations.id, id), eq(conversations.tenantId, tenantId)),
      with: { instance: true },
    })

    if (!conversation) return reply.status(404).send({ error: 'Conversation not found' })

    // Save message to DB first
    const [message] = await db.insert(messages).values({
      tenantId,
      conversationId: id,
      direction: 'outbound',
      type: body.type,
      content: body.content,
      sentByUserId: userId,
      aiGenerated: false,
      status: 'pending',
    }).returning()

    // Queue sending to WhatsApp (BullMQ job)
    // The queue will pick this up and call Meta API
    await app.redis.lpush('wa:outbound', JSON.stringify({
      messageId: message!.id,
      conversationId: id,
      instanceId: conversation.instanceId,
      to: conversation.waContactPhone,
      type: body.type,
      content: body.content,
    }))

    // Update conversation
    await db.update(conversations)
      .set({
        lastMessageAt: new Date(),
        lastMessagePreview: body.content.substring(0, 100),
        updatedAt: new Date(),
      })
      .where(eq(conversations.id, id))

    return reply.status(201).send(message)
  })

  // Assign conversation to agent
  app.patch('/conversations/:id/assign', async (request) => {
    const { tenantId } = request.tenantContext
    const { id } = request.params as { id: string }
    const { agentId } = request.body as { agentId: string }

    const [updated] = await db.update(conversations)
      .set({ assignedAgentId: agentId, updatedAt: new Date() })
      .where(and(eq(conversations.id, id), eq(conversations.tenantId, tenantId)))
      .returning()

    return updated
  })

  // Toggle bot on/off for conversation
  app.patch('/conversations/:id/bot', async (request) => {
    const { tenantId } = request.tenantContext
    const { id } = request.params as { id: string }
    const { botActive } = request.body as { botActive: boolean }

    const [updated] = await db.update(conversations)
      .set({
        botActive,
        status: botActive ? 'waiting_ai' : 'waiting_agent',
        updatedAt: new Date(),
      })
      .where(and(eq(conversations.id, id), eq(conversations.tenantId, tenantId)))
      .returning()

    return updated
  })

  // Resolve conversation
  app.patch('/conversations/:id/resolve', async (request) => {
    const { tenantId } = request.tenantContext
    const { id } = request.params as { id: string }

    const [updated] = await db.update(conversations)
      .set({
        status: 'resolved',
        resolvedAt: new Date(),
        botActive: false,
        updatedAt: new Date(),
      })
      .where(and(eq(conversations.id, id), eq(conversations.tenantId, tenantId)))
      .returning()

    return updated
  })

  // WhatsApp instances management
  app.get('/instances', async (request) => {
    const { tenantId } = request.tenantContext
    return db.query.waInstances.findMany({
      where: eq(waInstances.tenantId, tenantId),
    })
  })

  // Templates
  app.get('/templates', async (request) => {
    const { tenantId } = request.tenantContext
    return db.query.waTemplates.findMany({
      where: and(eq(waTemplates.tenantId, tenantId), eq(waTemplates.status, 'approved')),
    })
  })

  // WA Inbox stats
  app.get('/stats', async (request) => {
    const { tenantId } = request.tenantContext

    const stats = await db.execute(
      `SELECT
        COUNT(*) FILTER (WHERE status = 'open') as open,
        COUNT(*) FILTER (WHERE status = 'waiting_agent') as waiting_agent,
        COUNT(*) FILTER (WHERE status = 'waiting_ai') as waiting_ai,
        COUNT(*) FILTER (WHERE status = 'resolved') as resolved,
        COUNT(*) FILTER (WHERE bot_active = true) as bot_active
      FROM conversations WHERE tenant_id = '${tenantId}'`
    )

    return stats[0]
  })
}
