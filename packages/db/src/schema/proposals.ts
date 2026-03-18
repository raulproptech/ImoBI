import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
  text,
  boolean,
  pgEnum,
  index,
  jsonb,
  date
} from 'drizzle-orm/pg-core'

import { relations } from 'drizzle-orm'
import { tenants } from './platform'
import { properties } from './properties'
import { contacts } from './crm'
import { users } from './auth'

// Enums
export const proposalStatusEnum = pgEnum('proposal_status', [
  'draft',
  'sent',
  'viewed',
  'negotiating',
  'accepted',
  'rejected',
  'expired'
])

export const proposalTypeEnum = pgEnum('proposal_type', [
  'buy',
  'rent',
  'exclusivity'
])

// Proposals
export const proposals = pgTable('proposals', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  number: varchar('number', { length: 20 }).notNull().unique(), // PRO-2024-001
  propertyId: uuid('property_id').notNull().references(() => properties.id, { onDelete: 'cascade' }),
  contactId: uuid('contact_id').notNull().references(() => contacts.id),
  agentId: uuid('agent_id').references(() => users.id),
  status: proposalStatusEnum('status').notNull().default('draft'),
  type: proposalTypeEnum('type').notNull(),
  proposedPrice: integer('proposed_price'), // cents BRL
  counterPrice: integer('counter_price'),
  finalPrice: integer('final_price'),
  conditions: text('conditions'),
  observations: text('observations'),
  validUntil: date('valid_until'),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
  rejectedAt: timestamp('rejected_at', { withTimezone: true }),
  pdfUrl: text('pdf_url'),
  customFields: jsonb('custom_fields').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('proposals_tenant_idx').on(table.tenantId),
  propertyIdx: index('proposals_property_idx').on(table.propertyId),
  statusIdx: index('proposals_status_idx').on(table.status),
}))

export const proposalsRelations = relations(proposals, ({ one }) => ({
  tenant: one(tenants, { fields: [proposals.tenantId], references: [tenants.id] }),
  property: one(properties, { fields: [proposals.propertyId], references: [properties.id] }),
  contact: one(contacts, { fields: [proposals.contactId], references: [contacts.id] }),
  agent: one(users, { fields: [proposals.agentId], references: [users.id] }),
}))
