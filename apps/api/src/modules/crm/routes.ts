import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { db, contacts, pipelines, pipelineStages, deals, activities, leadSources } from '@imobi/db'
import { eq, and, desc, asc, ilike, inArray, sql, count, sum } from 'drizzle-orm'

export async function crmRoutes(app: FastifyInstance) {

  // ========== CONTACTS ==========

  // List contacts with filters
  app.get('/contacts', async (request) => {
    const { tenantId } = request.tenantContext
    const query = request.query as Record<string, string>

    const page = parseInt(query['page'] ?? '1')
    const pageSize = parseInt(query['pageSize'] ?? '20')
    const offset = (page - 1) * pageSize

    let whereConditions = [eq(contacts.tenantId, tenantId)]

    if (query['type']) whereConditions.push(eq(contacts.type, query['type'] as any))
    if (query['status']) whereConditions.push(eq(contacts.status, query['status'] as any))
    if (query['stageId']) whereConditions.push(eq(contacts.stageId, query['stageId']))
    if (query['agentId']) whereConditions.push(eq(contacts.assignedAgentId, query['agentId']))
    if (query['search']) {
      whereConditions.push(ilike(contacts.fullName, `%${query['search']}%`))
    }

    const [rows, total] = await Promise.all([
      db.query.contacts.findMany({
        where: and(...whereConditions),
        with: {
          assignedAgent: { columns: { id: true, fullName: true, avatarUrl: true } },
          leadSource: { columns: { id: true, name: true, color: true } },
          stage: { columns: { id: true, name: true, color: true } },
        },
        limit: pageSize,
        offset,
        orderBy: [desc(contacts.createdAt)],
      }),
      db.select({ count: count() }).from(contacts).where(and(...whereConditions)),
    ])

    return {
      data: rows,
      meta: { page, pageSize, total: total[0]?.count ?? 0 },
    }
  })

  // Get single contact with full timeline
  app.get('/contacts/:id', async (request, reply) => {
    const { tenantId } = request.tenantContext
    const { id } = request.params as { id: string }

    const contact = await db.query.contacts.findFirst({
      where: and(eq(contacts.id, id), eq(contacts.tenantId, tenantId)),
      with: {
        assignedAgent: { columns: { id: true, fullName: true, avatarUrl: true } },
        leadSource: { columns: { id: true, name: true } },
        stage: { columns: { id: true, name: true, color: true } },
        deals: {
          with: {
            pipeline: { columns: { id: true, name: true } },
            stage: { columns: { id: true, name: true } },
          },
        },
        activities: {
          orderBy: [desc(activities.createdAt)],
          limit: 50,
        },
      },
    })

    if (!contact) return reply.status(404).send({ error: 'Contact not found' })
    return contact
  })

  // Create contact
  app.post('/contacts', async (request, reply) => {
    const { tenantId, userId } = request.tenantContext

    const schema = z.object({
      type: z.enum(['lead', 'client', 'owner', 'partner', 'supplier']).default('lead'),
      fullName: z.string().min(2),
      email: z.string().email().optional(),
      phoneWhatsapp: z.string().optional(),
      leadSourceId: z.string().uuid().optional(),
      stageId: z.string().uuid().optional(),
      assignedAgentId: z.string().uuid().optional(),
      interestProfile: z.object({
        transactionType: z.enum(['sale', 'rent', 'both']).optional(),
        propertyTypes: z.array(z.string()).optional(),
        neighborhoods: z.array(z.string()).optional(),
        minPrice: z.number().optional(),
        maxPrice: z.number().optional(),
        minBedrooms: z.number().optional(),
      }).optional(),
      tags: z.array(z.string()).optional(),
    })

    const body = schema.parse(request.body)

    const [contact] = await db.insert(contacts).values({
      ...body,
      tenantId,
      assignedAgentId: body.assignedAgentId ?? userId,
    }).returning()

    return reply.status(201).send(contact)
  })

  // Update contact
  app.patch('/contacts/:id', async (request, reply) => {
    const { tenantId } = request.tenantContext
    const { id } = request.params as { id: string }

    const [updated] = await db.update(contacts)
      .set({ ...(request.body as object), updatedAt: new Date() })
      .where(and(eq(contacts.id, id), eq(contacts.tenantId, tenantId)))
      .returning()

    if (!updated) return reply.status(404).send({ error: 'Contact not found' })
    return updated
  })

  // Update contact stage (pipeline move)
  app.patch('/contacts/:id/stage', async (request, reply) => {
    const { tenantId } = request.tenantContext
    const { id } = request.params as { id: string }
    const { stageId } = request.body as { stageId: string }

    const [updated] = await db.update(contacts)
      .set({ stageId, updatedAt: new Date() })
      .where(and(eq(contacts.id, id), eq(contacts.tenantId, tenantId)))
      .returning()

    return updated
  })

  // Delete contact (soft delete for LGPD)
  app.delete('/contacts/:id', async (request, reply) => {
    const { tenantId } = request.tenantContext
    const { id } = request.params as { id: string }

    await db.update(contacts)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(contacts.id, id), eq(contacts.tenantId, tenantId)))

    return { success: true }
  })

  // ========== ACTIVITIES ==========

  app.post('/contacts/:id/activities', async (request, reply) => {
    const { tenantId, userId } = request.tenantContext
    const { id } = request.params as { id: string }

    const schema = z.object({
      type: z.enum(['call', 'email', 'whatsapp', 'visit', 'meeting', 'note', 'task']),
      title: z.string(),
      description: z.string().optional(),
      dueAt: z.string().datetime().optional(),
      assignedToId: z.string().uuid().optional(),
    })

    const body = schema.parse(request.body)

    const [activity] = await db.insert(activities).values({
      ...body,
      tenantId,
      contactId: id,
      userId,
      dueAt: body.dueAt ? new Date(body.dueAt) : undefined,
    }).returning()

    return reply.status(201).send(activity)
  })

  // ========== PIPELINE ==========

  // Get pipeline board (Kanban)
  app.get('/pipelines/:id/board', async (request) => {
    const { tenantId } = request.tenantContext
    const { id } = request.params as { id: string }

    const stages = await db.query.pipelineStages.findMany({
      where: and(eq(pipelineStages.pipelineId, id), eq(pipelineStages.tenantId, tenantId)),
      with: {
        deals: {
          where: eq(deals.status, 'open'),
          with: {
            contact: {
              columns: { id: true, fullName: true, avatarUrl: true, phoneWhatsapp: true },
            },
            assignedAgent: {
              columns: { id: true, fullName: true, avatarUrl: true },
            },
          },
          orderBy: [desc(deals.updatedAt)],
        },
      },
      orderBy: [asc(pipelineStages.position)],
    })

    return stages.map(stage => ({
      ...stage,
      totalDeals: stage.deals.length,
      totalValue: stage.deals.reduce((sum, d) => sum + (d.value ?? 0), 0),
    }))
  })

  // List all pipelines
  app.get('/pipelines', async (request) => {
    const { tenantId } = request.tenantContext
    return db.query.pipelines.findMany({
      where: eq(pipelines.tenantId, tenantId),
      with: { stages: { orderBy: [asc(pipelineStages.position)] } },
    })
  })

  // Create pipeline
  app.post('/pipelines', async (request, reply) => {
    const { tenantId } = request.tenantContext
    const body = request.body as { name: string; type?: string }

    const [pipeline] = await db.insert(pipelines).values({
      tenantId,
      name: body.name,
      type: body.type ?? 'sales',
    }).returning()

    // Create default stages
    const defaultStages = [
      { name: 'Novo Lead', color: '#6B7280', position: 0 },
      { name: 'Contactado', color: '#3B82F6', position: 1 },
      { name: 'Qualificado', color: '#8B5CF6', position: 2 },
      { name: 'Visita Agendada', color: '#F59E0B', position: 3 },
      { name: 'Proposta Enviada', color: '#EF4444', position: 4 },
      { name: 'Negociando', color: '#EC4899', position: 5 },
      { name: 'Ganho', color: '#10B981', position: 6, isWon: true },
      { name: 'Perdido', color: '#6B7280', position: 7, isLost: true },
    ]

    await db.insert(pipelineStages).values(
      defaultStages.map(s => ({ ...s, tenantId, pipelineId: pipeline!.id }))
    )

    return reply.status(201).send(pipeline)
  })

  // ========== DEALS ==========

  app.post('/deals', async (request, reply) => {
    const { tenantId, userId } = request.tenantContext

    const schema = z.object({
      title: z.string(),
      contactId: z.string().uuid(),
      pipelineId: z.string().uuid(),
      stageId: z.string().uuid(),
      value: z.number().optional(),
      propertyId: z.string().uuid().optional(),
    })

    const body = schema.parse(request.body)

    const [deal] = await db.insert(deals).values({
      ...body,
      tenantId,
      assignedAgentId: userId,
    }).returning()

    return reply.status(201).send(deal)
  })

  // Move deal to different stage
  app.patch('/deals/:id/stage', async (request) => {
    const { tenantId } = request.tenantContext
    const { id } = request.params as { id: string }
    const { stageId } = request.body as { stageId: string }

    const [updated] = await db.update(deals)
      .set({ stageId, updatedAt: new Date() })
      .where(and(eq(deals.id, id), eq(deals.tenantId, tenantId)))
      .returning()

    return updated
  })

  // ========== LEAD SOURCES ==========

  app.get('/lead-sources', async (request) => {
    const { tenantId } = request.tenantContext
    return db.query.leadSources.findMany({
      where: and(eq(leadSources.tenantId, tenantId), eq(leadSources.isActive, true)),
    })
  })
}
