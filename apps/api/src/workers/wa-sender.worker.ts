import { messages, db } from '@imobi/db'
import { eq } from 'drizzle-orm'

interface OutboundMessage {
  messageId: string
  conversationId: string
  instanceId: string
  to: string
  type: string
  content: string
  templateName?: string
  templateComponents?: any[]
}

export async function sendWhatsAppMessage(job: OutboundMessage) {
  const { to, type, content, messageId } = job

  // Load instance for access token
  const { waInstances } = await import('@imobi/db')
  const instance = await db.query.waInstances.findFirst({
    where: eq(waInstances.id, job.instanceId),
  })

  if (!instance?.accessToken) {
    throw new Error('No access token for WA instance')
  }

  const phoneNumberId = instance.waPhoneNumberId
  const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`

  let body: Record<string, unknown>

  if (type === 'text') {
    body = {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: content },
    }
  } else if (type === 'template') {
    body = {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: job.templateName,
        language: { code: 'pt_BR' },
        components: job.templateComponents ?? [],
      },
    }
  } else {
    body = {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: content },
    }
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${instance.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const error = await response.json()
    await db.update(messages)
      .set({ status: 'failed', statusUpdatedAt: new Date() })
      .where(eq(messages.id, messageId))
    throw new Error(`WhatsApp API error: ${JSON.stringify(error)}`)
  }

  const result = await response.json() as any
  const waMessageId = result.messages?.[0]?.id

  await db.update(messages)
    .set({
      waMessageId,
      status: 'sent',
      statusUpdatedAt: new Date(),
    })
    .where(eq(messages.id, messageId))

  return waMessageId
}
