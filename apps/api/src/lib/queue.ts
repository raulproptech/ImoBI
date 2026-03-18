import { Queue, Worker } from 'bullmq'
import type { Redis } from 'ioredis'

let connection: Redis

export function initQueues(redis: Redis) {
  connection = redis
}

// Queue names
export const QUEUES = {
  AI_PROCESS: 'ai:process',
  WA_OUTBOUND: 'wa:outbound',
  EMAIL_SEND: 'email:send',
  REPORT_GEN: 'report:generate',
} as const

export function getQueue(name: string) {
  return new Queue(name, { connection })
}

// Job types
export interface AIProcessJob {
  conversationId: string
  tenantId: string
}

export interface WAOutboundJob {
  messageId: string
  conversationId: string
  instanceId: string
  to: string
  type: string
  content: string
  templateName?: string
  templateComponents?: unknown[]
}

export interface EmailSendJob {
  to: string
  subject: string
  html: string
  from?: string
  replyTo?: string
}
