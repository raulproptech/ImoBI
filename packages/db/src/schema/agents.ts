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
import { properties } from './properties.ts'
import { contacts } from './crm.ts'

export const agentStatusEnum = pgEnum('agent_status', ['active', 'inactive', 'suspended', 'onboarding'])
export const agentLevelEnum = pgEnum('agent_level', ['junior', 'pleno', 'senior', 'manager'])

// Agents
export const agents = pgTable('agents', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id),
  name: varchar('name', { length: 256 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  phone: varchar('phone', { length: 20 }),
  creci: varchar('creci', { length: 50 }),
  status: agentStatusEnum('status').notNull().default('active'),
  level: agentLevelEnum('level').default('junior'),
  commissionRate: real('commission_rate').default(0.06),
  targetsMonthly: integer('targets_monthly').default(5),
  performanceScore: real('performance_score').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  tenantIdx: index('agents_tenant_idx').on(table.tenantId),
}))
