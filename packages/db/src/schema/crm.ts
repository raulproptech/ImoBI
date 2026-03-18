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
  real,
  date,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { tenants } from './platform.ts'
import { users } from './auth.ts'

export const contactTypeEnum = pgEnum('contact_type', ['lead', 'client', 'owner', 'partner', 'supplier'])
export const contactStatusEnum = pgEnum('contact_status', ['active', 'inactive', 'blacklisted'])
export const dealStatusEnum = pgEnum('deal_status', ['open', 'won', 'lost', 'paused'])
export const activityTypeEnum = pgEnum('activity_type', [
  'call', 'email', 'whatsapp', 'visit', 'meeting', 'note', 'task', 'proposal', 'contract'
])
export const lgpdConsentEnum = pgEnum('lgpd_consent', ['pending', 'granted', 'revoked'])

// Lead sources
export const leadSources = pgTable('lead_sources', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  type: varchar('type', { length: 50 }), // whatsapp, website, portal, referral, etc.
  color: varchar('color', { length: 7 }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// Contacts (leads and clients)
export const contacts = pgTable('contacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  type: contactTypeEnum('type').notNull().default('lead'),
  status: contactStatusEnum('status').notNull().default('active'),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }),
  phoneWhatsapp: varchar('phone_whatsapp', { length: 20 }),
  phoneSecondary: varchar('phone_secondary', { length: 20 }),
  cpfCnpj: text('cpf_cnpj'), // stored encrypted
  birthDate: date('birth_date'),
  gender: varchar('gender', { length: 20 }),
  // Address (populated from ViaCEP)
  addressCep: varchar('address_cep', { length: 10 }),
  addressJson: jsonb('address_json'), // full address from ViaCEP response
  // CRM fields
  leadSourceId: uuid('lead_source_id').references(() => leadSources.id),
  leadScore: integer('lead_score').default(0), // 0-100 AI-generated
  assignedAgentId: uuid('assigned_agent_id').references(() => users.id),
  stageId: uuid('stage_id'), // FK to pipeline_stages (circular ref handled below)
  // Interest profile
  interestProfile: jsonb('interest_profile').$type<{
    transactionType?: 'sale' | 'rent' | 'both'
    propertyTypes?: string[]
    neighborhoods?: string[]
    minBedrooms?: number
    maxBedrooms?: number
    minPrice?: number
    maxPrice?: number
    minArea?: number
    maxArea?: number
    amenities?: string[]
    notes?: string
  }>(),
  // Metadata
  customFields: jsonb('custom_fields').default({}),
  tags: jsonb('tags').$type<string[]>().default([]),
  // LGPD
  lgpdConsent: lgpdConsentEnum('lgpd_consent').notNull().default('pending'),
  lgpdConsentAt: timestamp('lgpd_consent_at', { withTimezone: true }),
  lgpdConsentChannel: varchar('lgpd_consent_channel', { length: 50 }),
  // Timestamps
  lastContactedAt: timestamp('last_contacted_at', { withTimezone: true }),
  convertedAt: timestamp('converted_at', { withTimezone: true }), // lead -> client
  deletedAt: timestamp('deleted_at', { withTimezone: true }), // soft delete (LGPD)
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('contacts_tenant_idx').on(table.tenantId),
  phoneIdx: index('contacts_phone_idx').on(table.phoneWhatsapp),
  stageIdx: index('contacts_stage_idx').on(table.stageId),
  agentIdx: index('contacts_agent_idx').on(table.assignedAgentId),
  scoreIdx: index('contacts_score_idx').on(table.leadScore),
}))

// Sales Pipelines
export const pipelines = pgTable('pipelines', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  type: varchar('type', { length: 50 }).default('sales'), // sales, rental, launch
  isDefault: boolean('is_default').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// Pipeline Stages (Kanban columns)
export const pipelineStages = pgTable('pipeline_stages', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  pipelineId: uuid('pipeline_id').notNull().references(() => pipelines.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  color: varchar('color', { length: 7 }).default('#6B7280'),
  position: integer('position').notNull().default(0),
  // SLA configuration
  slaHours: integer('sla_hours'), // max hours contact should stay in this stage
  autoActions: jsonb('auto_actions').default([]), // actions to trigger on entry
  isWon: boolean('is_won').notNull().default(false),
  isLost: boolean('is_lost').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// Deals (opportunities)
export const deals = pgTable('deals', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  contactId: uuid('contact_id').notNull().references(() => contacts.id),
  pipelineId: uuid('pipeline_id').notNull().references(() => pipelines.id),
  stageId: uuid('stage_id').notNull().references(() => pipelineStages.id),
  assignedAgentId: uuid('assigned_agent_id').references(() => users.id),
  propertyId: uuid('property_id'), // FK to properties (set below)
  value: integer('value'), // in cents BRL
  status: dealStatusEnum('status').notNull().default('open'),
  lostReason: text('lost_reason'),
  expectedCloseDate: date('expected_close_date'),
  closedAt: timestamp('closed_at', { withTimezone: true }),
  probability: integer('probability').default(50), // 0-100%
  customFields: jsonb('custom_fields').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('deals_tenant_idx').on(table.tenantId),
  contactIdx: index('deals_contact_idx').on(table.contactId),
  stageIdx: index('deals_stage_idx').on(table.stageId),
}))

// Activities (timeline events)
export const activities = pgTable('activities', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  type: activityTypeEnum('type').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  contactId: uuid('contact_id').references(() => contacts.id),
  dealId: uuid('deal_id').references(() => deals.id),
  userId: uuid('user_id').references(() => users.id), // who created it
  assignedToId: uuid('assigned_to_id').references(() => users.id), // who should do it
  dueAt: timestamp('due_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  outcome: text('outcome'), // result of call, meeting, etc.
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('activities_tenant_idx').on(table.tenantId),
  contactIdx: index('activities_contact_idx').on(table.contactId),
  dueIdx: index('activities_due_idx').on(table.dueAt),
}))

// Relations
export const contactsRelations = relations(contacts, ({ one, many }) => ({
  tenant: one(tenants, { fields: [contacts.tenantId], references: [tenants.id] }),
  assignedAgent: one(users, { fields: [contacts.assignedAgentId], references: [users.id] }),
  stage: one(pipelineStages, { fields: [contacts.stageId], references: [pipelineStages.id] }),
  leadSource: one(leadSources, { fields: [contacts.leadSourceId], references: [leadSources.id] }),
  deals: many(deals),
  activities: many(activities),
}))

export const dealsRelations = relations(deals, ({ one, many }) => ({
  tenant: one(tenants, { fields: [deals.tenantId], references: [tenants.id] }),
  contact: one(contacts, { fields: [deals.contactId], references: [contacts.id] }),
  pipeline: one(pipelines, { fields: [deals.pipelineId], references: [pipelines.id] }),
  stage: one(pipelineStages, { fields: [deals.stageId], references: [pipelineStages.id] }),
  assignedAgent: one(users, { fields: [deals.assignedAgentId], references: [users.id] }),
  activities: many(activities),
}))

export const pipelinesRelations = relations(pipelines, ({ one, many }) => ({
  tenant: one(tenants, { fields: [pipelines.tenantId], references: [tenants.id] }),
  stages: many(pipelineStages),
  deals: many(deals),
}))
