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
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// Enums
export const planTypeEnum = pgEnum('plan_type', ['starter', 'professional', 'enterprise', 'custom'])
export const billingCycleEnum = pgEnum('billing_cycle', ['monthly', 'annual'])
export const tenantStatusEnum = pgEnum('tenant_status', ['trial', 'active', 'suspended', 'cancelled'])

// Platform Plans
export const plans = pgTable('plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  type: planTypeEnum('type').notNull(),
  priceMonthly: integer('price_monthly').notNull(), // in cents BRL
  priceAnnual: integer('price_annual').notNull(),   // in cents BRL
  maxUsers: integer('max_users').notNull().default(5),
  maxProperties: integer('max_properties').notNull().default(100),
  maxWhatsappNumbers: integer('max_whatsapp_numbers').notNull().default(1),
  maxMonthlyLeads: integer('max_monthly_leads').notNull().default(500),
  aiChatEnabled: boolean('ai_chat_enabled').notNull().default(false),
  marketingEnabled: boolean('marketing_enabled').notNull().default(false),
  financialEnabled: boolean('financial_enabled').notNull().default(false),
  portalSyncEnabled: boolean('portal_sync_enabled').notNull().default(false),
  features: jsonb('features').$type<string[]>().default([]),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// Tenants (each real estate agency)
export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  planId: uuid('plan_id').notNull().references(() => plans.id),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(), // subdomain
  cnpj: varchar('cnpj', { length: 20 }).unique(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  logoUrl: text('logo_url'),
  faviconUrl: text('favicon_url'),
  primaryColor: varchar('primary_color', { length: 7 }).default('#2563EB'),
  secondaryColor: varchar('secondary_color', { length: 7 }).default('#16A34A'),
  customDomain: varchar('custom_domain', { length: 255 }).unique(),
  timezone: varchar('timezone', { length: 50 }).default('America/Sao_Paulo'),
  locale: varchar('locale', { length: 10 }).default('pt-BR'),
  currency: varchar('currency', { length: 3 }).default('BRL'),
  status: tenantStatusEnum('status').notNull().default('trial'),
  trialEndsAt: timestamp('trial_ends_at', { withTimezone: true }),
  billingCycle: billingCycleEnum('billing_cycle').default('monthly'),
  settings: jsonb('settings').default({}),
  // WhatsApp Business settings
  waBusinessId: varchar('wa_business_id', { length: 100 }),
  // Business hours
  businessHours: jsonb('business_hours').$type<{
    [day: string]: { open: string; close: string; enabled: boolean }
  }>(),
  // LGPD
  dpoName: varchar('dpo_name', { length: 255 }),
  dpoEmail: varchar('dpo_email', { length: 255 }),
  privacyPolicyUrl: text('privacy_policy_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// Tenant billing/subscription tracking
export const tenantBilling = pgTable('tenant_billing', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  asaasCustomerId: varchar('asaas_customer_id', { length: 100 }),
  asaasSubscriptionId: varchar('asaas_subscription_id', { length: 100 }),
  status: varchar('status', { length: 50 }).notNull().default('active'),
  currentPeriodStart: timestamp('current_period_start', { withTimezone: true }),
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
  canceledAt: timestamp('canceled_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// Platform audit log (immutable)
export const auditLog = pgTable('audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id'),
  userId: uuid('user_id'),
  action: varchar('action', { length: 100 }).notNull(),
  entityType: varchar('entity_type', { length: 100 }),
  entityId: uuid('entity_id'),
  oldValues: jsonb('old_values'),
  newValues: jsonb('new_values'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// Relations
export const tenantsRelations = relations(tenants, ({ one, many }) => ({
  plan: one(plans, { fields: [tenants.planId], references: [plans.id] }),
  billing: one(tenantBilling, { fields: [tenants.id], references: [tenantBilling.tenantId] }),
}))
