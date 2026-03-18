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
import { tenants } from './platform.ts'
import { users } from './auth.ts'

export const taskStatusEnum = pgEnum('task_status', ['todo', 'in_progress', 'review', 'done', 'cancelled'])
export const taskPriorityEnum = pgEnum('task_priority', ['low', 'medium', 'high', 'urgent'])
export const notificationTypeEnum = pgEnum('notification_type', [
  'lead_assigned', 'deal_updated', 'message_received', 'task_due',
  'commission_approved', 'contract_signed', 'system'
])

// Teams
export const teams = pgTable('teams', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  leaderId: uuid('leader_id').references(() => users.id),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const teamMembers = pgTable('team_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamId: uuid('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
})

// Tasks
export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  status: taskStatusEnum('status').notNull().default('todo'),
  priority: taskPriorityEnum('priority').notNull().default('medium'),
  createdByUserId: uuid('created_by_user_id').references(() => users.id),
  assignedToUserId: uuid('assigned_to_user_id').references(() => users.id),
  teamId: uuid('team_id').references(() => teams.id),
  // Relations to other entities
  contactId: uuid('contact_id'),
  propertyId: uuid('property_id'),
  dealId: uuid('deal_id'),
  // Timing
  dueAt: timestamp('due_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  estimatedHours: integer('estimated_hours'),
  actualHours: integer('actual_hours'),
  // Checklists
  checklist: jsonb('checklist').$type<Array<{
    id: string; text: string; completed: boolean
  }>>().default([]),
  tags: jsonb('tags').$type<string[]>().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('tasks_tenant_idx').on(table.tenantId),
  assigneeIdx: index('tasks_assignee_idx').on(table.assignedToUserId),
  dueIdx: index('tasks_due_idx').on(table.dueAt),
}))

// Documents
export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 50 }),
  fileUrl: text('file_url').notNull(),
  fileSize: integer('file_size'),
  mimeType: varchar('mime_type', { length: 100 }),
  version: integer('version').notNull().default(1),
  parentDocumentId: uuid('parent_document_id'),
  // Relations
  contactId: uuid('contact_id'),
  propertyId: uuid('property_id'),
  contractId: uuid('contract_id'),
  // Access
  isPublic: boolean('is_public').notNull().default(false),
  uploadedByUserId: uuid('uploaded_by_user_id').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// In-app Notifications
export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: notificationTypeEnum('type').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  body: text('body'),
  data: jsonb('data').default({}), // entity refs, URLs, etc.
  readAt: timestamp('read_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdx: index('notifications_user_idx').on(table.userId),
  unreadIdx: index('notifications_unread_idx').on(table.userId, table.readAt),
}))
