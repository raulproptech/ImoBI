import type { FastifyInstance } from 'fastify'
import { db, conversations, messages, contacts, waInstances } from '@imobi/db'
import { eq, and } from 'drizzle-orm'
import type { WAInboundMessage } from '@imobi/shared'

export async function webhookRoutes(app: FastifyInstance) {

  // Meta WhatsApp webhook verification
  app.get('/whatsapp', async (request, reply) => {
    const query = request.query as Record<string, string>
    const mode = query['hub.mode']
    const token = query['hub.verify_token']
    const challenge = query['hub.challenge']

    if (mode === 'subscribe' && token === process.env['META_WEBHOOK_VERIFY_TOKEN']) {
      return reply.status(200).send(challenge)
    }
    return reply.status(403).send('Forbidden')
  })

  // Meta WhatsApp webhook events
  app.post('/whatsapp', async (request, reply) => {
    const body = request.body as WAInboundMessage

    // Acknowledge immediately (Meta requires < 5s response)
    reply.status(200).send('OK')

    // Process asynchronously
    setImmediate(async () => {
      try {
        for (const entry of body.entry ?? []) {
          for (const change of entry.changes ?? []) {
            if (change.field !== 'messages') continue

            const value = change.value
            const phoneNumberId = value.metadata.phone_number_id

            // Find the WA instance
            const instance = await db.query.waInstances.findFirst({
              where: eq(waInstances.waPhoneNumberId, phoneNumberId),
              with: { tenant: true },
            })

            if (!instance) continue

            // Handle incoming messages
            for (const msg of value.messages ?? []) {
              await handleIncomingMessage(instance, msg, value.contacts?.[0])
            }

            // Handle status updates
            for (const status of value.statuses ?? []) {
              await handleStatusUpdate(status)
            }
          }
        }
      } catch (err) {
        app.log.error(err, 'WhatsApp webhook processing error')
      }
    })
  })
}

async function handleIncomingMessage(instance: any, msg: any, waContact: any) {
  // Deduplication check
  const existing = await db.query.messages.findFirst({
    where: eq(messages.waMessageId, msg.id),
  })
  if (existing) return

  const tenantId = instance.tenantId
  const phone = msg.from

  // Find or create contact
  let contact = await db.query.contacts.findFirst({
    where: and(
      eq(contacts.tenantId, tenantId),
      eq(contacts.phoneWhatsapp, phone)
    ),
  })

  if (!contact) {
    const [newContact] = await db.insert(contacts).values({
      tenantId,
      fullName: waContact?.profile?.name ?? phone,
      phoneWhatsapp: phone,
      type: 'lead',
      leadSource: 'whatsapp',
    }).returning()
    contact = newContact!
  }

  // Find or create conversation
  let conversation = await db.query.conversations.findFirst({
    where: and(
      eq(conversations.instanceId, instance.id),
      eq(conversations.waContactPhone, phone),
      eq(conversations.status, 'open')
    ),
  })

  if (!conversation) {
    const [newConv] = await db.insert(conversations).values({
      tenantId,
      instanceId: instance.id,
      contactId: contact.id,
      waContactPhone: phone,
      waContactName: waContact?.profile?.name,
      status: 'open',
      botActive: instance.botEnabled,
    }).returning()
    conversation = newConv!
  }

  // Determine content
  let content: string | undefined
  let type = msg.type
  if (msg.type === 'text') content = msg.text?.body
  else if (msg.type === 'image') content = msg.image?.caption
  else content = `[${msg.type}]`

  // Save message
  const [savedMessage] = await db.insert(messages).values({
    tenantId,
    conversationId: conversation.id,
    direction: 'inbound',
    type: msg.type,
    content,
    waMessageId: msg.id,
    waTimestamp: new Date(parseInt(msg.timestamp) * 1000),
    status: 'delivered',
  }).returning()

  // Update conversation
  await db.update(conversations)
    .set({
      lastMessageAt: new Date(),
      lastMessagePreview: content?.substring(0, 100),
      messageCount: (conversation.messageCount ?? 0) + 1,
      updatedAt: new Date(),
    })
    .where(eq(conversations.id, conversation.id))

  // Queue AI processing if bot is active
  if (conversation.botActive && instance.botEnabled) {
    // This will be picked up by the AI worker
    // (imported separately - see workers/ai.worker.ts)
  }
}

async function handleStatusUpdate(status: any) {
  await db.update(messages)
    .set({
      status: status.status,
      statusUpdatedAt: new Date(),
    })
    .where(eq(messages.waMessageId, status.id))
}
