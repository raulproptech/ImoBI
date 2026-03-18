import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  integer,
  jsonb,
  index,
} from 'drizzle-orm/pg-core'
import { tenants } from './platform'

// Immutable event log (append-only) — source of truth for analytics
export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  userId: uuid('user_id'),
  sessionId: varchar('session_id', { length: 100 }),
  // Event classification
  category: varchar('category', { length: 50 }).notNull(), // crm, property, whatsapp, financial, marketing
  action: varchar('action', { length: 100 }).notNull(), // lead.created, deal.won, message.received, etc.
  // References
  entityType: varchar('entity_type', { length: 50 }),
  entityId: uuid('entity_id'),
  // Data
  properties: jsonb('properties').notNull().default({}),
  // Context
  channel: varchar('channel', { length: 50 }), // web, whatsapp, api, system
  deviceType: varchar('device_type', { length: 20 }),
  ipAddress: varchar('ip_address', { length: 45 }),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('events_tenant_idx').on(table.tenantId),
  actionIdx: index('events_action_idx').on(table.action),
  occurredIdx: index('events_occurred_idx').on(table.tenantId, table.occurredAt),
  entityIdx: index('events_entity_idx').on(table.entityType, table.entityId),
}))

// Saved reports
export const reports = pgTable('reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 50 }).notNull(), // funnel, table, chart, kpi
  config: jsonb('config').notNull(), // filters, dimensions, metrics, chart type
  isDefault: boolean('is_default').notNull().default(false),
  // Scheduled delivery
  scheduleEnabled: boolean('schedule_enabled').notNull().default(false),
  scheduleConfig: jsonb('schedule_config'), // cron, recipients, format
  lastRunAt: timestamp('last_run_at', { withTimezone: true }),
  createdByUserId: uuid('created_by_user_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// Report snapshots (cached results)
export const reportSnapshots = pgTable('report_snapshots', {
  id: uuid('id').primaryKey().defaultRandom(),
  reportId: uuid('report_id').notNull().references(() => reports.id, { onDelete: 'cascade' }),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  data: jsonb('data').notNull(),
  periodStart: timestamp('period_start', { withTimezone: true }),
  periodEnd: timestamp('period_end', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
