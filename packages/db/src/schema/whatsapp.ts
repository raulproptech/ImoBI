import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  integer,
  jsonb,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { tenants } from './platform'
import { users } from './auth'
import { contacts } from './crm'

export const conversationStatusEnum = pgEnum('conversation_status', [
  'open', 'waiting_ai', 'waiting_agent', 'in_progress', 'resolved', 'spam'
])
export const messageDirectionEnum = pgEnum('message_direction', ['inbound', 'outbound'])
export const messageTypeEnum = pgEnum('message_type', [
  'text', 'image', 'document', 'audio', 'video', 'sticker', 'location',
  'template', 'interactive', 'reaction', 'system'
])
export const messageStatusEnum = pgEnum('message_status', [
  'pending', 'sent', 'delivered', 'read', 'failed', 'deleted'
])

// WhatsApp instances (phone numbers per tenant)
export const waInstances = pgTable('wa_instances', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  displayName: varchar('display_name', { length: 100 }).notNull(),
  phoneNumber: varchar('phone_number', { length: 20 }).notNull(),
  waPhoneNumberId: varchar('wa_phone_number_id', { length: 100 }).notNull().unique(),
  waBusinessAccountId: varchar('wa_business_account_id', { length: 100 }),
  accessToken: text('access_token'),
  webhookVerifyToken: varchar('webhook_verify_token', { length: 100 }),
  isActive: boolean('is_active').notNull().default(true),
  isDefault: boolean('is_default').notNull().default(false),
  assignedAgentId: uuid('assigned_agent_id').references(() => users.id),
  // Chatbot settings
  botEnabled: boolean('bot_enabled').notNull().default(true),
  botName: varchar('bot_name', { length: 100 }).default('Assistente'),
  systemPrompt: text('system_prompt'),
  // Business hours for this number
  useBusinessHours: boolean('use_business_hours').notNull().default(true),
  outsideHoursMessage: text('outside_hours_message'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// Conversations
export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  instanceId: uuid('instance_id').notNull().references(() => waInstances.id),
  contactId: uuid('contact_id').references(() => contacts.id),
  // WhatsApp identifiers
  waContactPhone: varchar('wa_contact_phone', { length: 20 }).notNull(),
  waContactName: varchar('wa_contact_name', { length: 255 }),
  // Status
  status: conversationStatusEnum('status').notNull().default('open'),
  assignedAgentId: uuid('assigned_agent_id').references(() => users.id),
  botActive: boolean('bot_active').notNull().default(true),
  // AI context
  aiContextSummary: text('ai_context_summary'),
  aiContextTokens: integer('ai_context_tokens').default(0),
  // Stats
  messageCount: integer('message_count').default(0),
  lastMessageAt: timestamp('last_message_at', { withTimezone: true }),
  lastMessagePreview: text('last_message_preview'),
  firstResponseAt: timestamp('first_response_at', { withTimezone: true }),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('conversations_tenant_idx').on(table.tenantId),
  statusIdx: index('conversations_status_idx').on(table.status),
  phoneIdx: index('conversations_phone_idx').on(table.waContactPhone),
  lastMessageIdx: index('conversations_last_message_idx').on(table.lastMessageAt),
}))

// Messages
export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  conversationId: uuid('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  direction: messageDirectionEnum('direction').notNull(),
  type: messageTypeEnum('type').notNull().default('text'),
  content: text('content'),
  // Media
  mediaUrl: text('media_url'),
  mediaId: varchar('media_id', { length: 100 }), // WhatsApp media ID
  mediaMimeType: varchar('media_mime_type', { length: 100 }),
  mediaCaption: text('media_caption'),
  mediaFileName: varchar('media_file_name', { length: 255 }),
  // Template message
  templateName: varchar('template_name', { length: 100 }),
  templateComponents: jsonb('template_components'),
  // Interactive
  interactiveData: jsonb('interactive_data'),
  // Status tracking
  waMessageId: varchar('wa_message_id', { length: 100 }).unique(), // external WA ID
  status: messageStatusEnum('status').notNull().default('pending'),
  statusUpdatedAt: timestamp('status_updated_at', { withTimezone: true }),
  // Sender
  sentByUserId: uuid('sent_by_user_id').references(() => users.id),
  aiGenerated: boolean('ai_generated').notNull().default(false),
  aiModel: varchar('ai_model', { length: 50 }),
  aiInputTokens: integer('ai_input_tokens'),
  aiOutputTokens: integer('ai_output_tokens'),
  // Reply to
  replyToMessageId: uuid('reply_to_message_id'),
  // Timestamps
  waTimestamp: timestamp('wa_timestamp', { withTimezone: true }), // WA server time
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  conversationIdx: index('messages_conversation_idx').on(table.conversationId),
  waIdIdx: index('messages_wa_id_idx').on(table.waMessageId),
  tenantIdx: index('messages_tenant_idx').on(table.tenantId),
}))

// WhatsApp Templates
export const waTemplates = pgTable('wa_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  instanceId: uuid('instance_id').references(() => waInstances.id),
  name: varchar('name', { length: 100 }).notNull(),
  displayName: varchar('display_name', { length: 255 }),
  waTemplateName: varchar('wa_template_name', { length: 100 }), // Meta approved name
  category: varchar('category', { length: 50 }), // MARKETING, UTILITY, AUTHENTICATION
  language: varchar('language', { length: 10 }).default('pt_BR'),
  status: varchar('status', { length: 50 }).default('draft'), // draft, pending, approved, rejected
  components: jsonb('components').notNull(), // header, body, footer, buttons
  variables: jsonb('variables').$type<string[]>().default([]), // {{1}}, {{2}}, etc.
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// Chatbot Flows
export const chatbotFlows = pgTable('chatbot_flows', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  instanceId: uuid('instance_id').references(() => waInstances.id),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  trigger: varchar('trigger', { length: 50 }).notNull(), // first_message, keyword, schedule
  triggerKeywords: jsonb('trigger_keywords').$type<string[]>().default([]),
  nodes: jsonb('nodes').notNull().default([]), // flow builder nodes
  edges: jsonb('edges').notNull().default([]), // connections between nodes
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// Relations
export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  tenant: one(tenants, { fields: [conversations.tenantId], references: [tenants.id] }),
  instance: one(waInstances, { fields: [conversations.instanceId], references: [waInstances.id] }),
  contact: one(contacts, { fields: [conversations.contactId], references: [contacts.id] }),
  assignedAgent: one(users, { fields: [conversations.assignedAgentId], references: [users.id] }),
  messages: many(messages),
}))

export const messagesRelations = relations(messages, ({ one }) => ({
  tenant: one(tenants, { fields: [messages.tenantId], references: [tenants.id] }),
  conversation: one(conversations, { fields: [messages.conversationId], references: [conversations.id] }),
  sentBy: one(users, { fields: [messages.sentByUserId], references: [users.id] }),
}))
