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
import { tenants } from './platform'
import { users } from './auth'
import { contacts } from './crm'
import { properties } from './properties'
import { proposals } from './proposals'

export const contractStatusEnum = pgEnum('contract_status', [
  'draft', 'pending_signatures', 'active', 'completed', 'cancelled', 'disputed'
])

// Contracts
export const contracts = pgTable('contracts', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  number: varchar('number', { length: 20 }).notNull(), // e.g., CON-2024-001
  proposalId: uuid('proposal_id').references(() => proposals.id),
  propertyId: uuid('property_id').notNull().references(() => properties.id),
  buyerContactId: uuid('buyer_contact_id').notNull().references(() => contacts.id),
  sellerContactId: uuid('seller_contact_id').references(() => contacts.id),
  agentId: uuid('agent_id').references(() => users.id),
  type: varchar('type', { length: 20 }).notNull(), // sale, rent, exclusivity
  status: contractStatusEnum('status').notNull().default('draft'),
  totalValue: integer('total_value').notNull(), // in cents
  commissionPercentage: real('commission_percentage'),
  commissionValue: integer('commission_value'), // in cents
  startDate: date('start_date'),
  endDate: date('end_date'),
  // Installments (for sales)
  installments: jsonb('installments').$type<Array<{
    number: number
    dueDate: string
    amount: number
    status: 'pending' | 'paid' | 'overdue'
    paidAt?: string
  }>>().default([]),
  // Clicksign
  clicksignDocumentKey: varchar('clicksign_document_key', { length: 100 }),
  clicksignStatus: varchar('clicksign_status', { length: 50 }),
  signedDocumentUrl: text('signed_document_url'),
  // Files
  templateId: uuid('template_id'),
  pdfUrl: text('pdf_url'),
  // Observations
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('contracts_tenant_idx').on(table.tenantId),
}))

export const contractsRelations = relations(contracts, ({ one }) => ({
  tenant: one(tenants, { fields: [contracts.tenantId], references: [tenants.id] }),
  proposal: one(proposals, { fields: [contracts.proposalId], references: [proposals.id] }),
  property: one(properties, { fields: [contracts.propertyId], references: [properties.id] }),
}))

