import { processAIResponse } from '../../workers/ai.worker.js'
import { db, conversations } from '@imobi/db'
import { eq } from 'drizzle-orm'

export async function triggerAIForConversation(conversationId: string) {
  // Update status
  await db.update(conversations)
    .set({ status: 'waiting_ai', updatedAt: new Date() })
    .where(eq(conversations.id, conversationId))

  // Process (in production this would go through BullMQ)
  await processAIResponse(conversationId)
}
