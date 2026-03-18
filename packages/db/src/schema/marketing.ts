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

export const campaignTypeEnum = pgEnum('campaign_type', ['email', 'whatsapp', 'sms'])
export const campaignStatusEnum = pgEnum('campaign_status', [
  'draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled'
])

// Email/WA Campaign templates
export const emailTemplates = pgTable('email_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  subject: varchar('subject', { length: 255 }),
  htmlContent: text('html_content').notNull(),
  textContent: text('text_content'),
  variables: jsonb('variables').$type<string[]>().default([]),
  category: varchar('category', { length: 50 }),
  isSystem: boolean('is_system').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// Marketing Campaigns
export const campaigns = pgTable('campaigns', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  type: campaignTypeEnum('type').notNull(),
  status: campaignStatusEnum('status').notNull().default('draft'),
  subject: varchar('subject', { length: 255 }),
  content: text('content'),
  templateId: uuid('template_id').references(() => emailTemplates.id),
  fromName: varchar('from_name', { length: 100 }),
  fromEmail: varchar('from_email', { length: 255 }),
  // Audience
  audienceFilter: jsonb('audience_filter').default({}), // CRM filter criteria
  recipientCount: integer('recipient_count').default(0),
  // Scheduling
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  // Metrics
  sent: integer('sent').default(0),
  delivered: integer('delivered').default(0),
  opened: integer('opened').default(0),
  clicked: integer('clicked').default(0),
  unsubscribed: integer('unsubscribed').default(0),
  bounced: integer('bounced').default(0),
  // UTM
  utmSource: varchar('utm_source', { length: 100 }),
  utmMedium: varchar('utm_medium', { length: 100 }),
  utmCampaign: varchar('utm_campaign', { length: 100 }),
  createdByUserId: uuid('created_by_user_id').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('campaigns_tenant_idx').on(table.tenantId),
  statusIdx: index('campaigns_status_idx').on(table.status),
}))

// Landing Pages
export const landingPages = pgTable('landing_pages', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull(),
  description: text('description'),
  htmlContent: text('html_content').notNull(),
  cssContent: text('css_content'),
  jsContent: text('js_content'),
  metaTitle: varchar('meta_title', { length: 160 }),
  metaDescription: text('meta_description'),
  // Lead form config
  formFields: jsonb('form_fields').default([]),
  redirectUrl: text('redirect_url'),
  thankYouMessage: text('thank_you_message'),
  // Tracking
  pixelFbId: varchar('pixel_fb_id', { length: 50 }),
  pixelGaId: varchar('pixel_ga_id', { length: 50 }),
  utmDefaults: jsonb('utm_defaults').default({}),
  // Stats
  viewCount: integer('view_count').default(0),
  conversionCount: integer('conversion_count').default(0),
  isPublished: boolean('is_published').notNull().default(false),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  slugIdx: index('landing_pages_slug_idx').on(table.tenantId, table.slug),
}))

// UTM Tracking events
export const utmTracking = pgTable('utm_tracking', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  contactId: uuid('contact_id'),
  landingPageId: uuid('landing_page_id').references(() => landingPages.id),
  campaignId: uuid('campaign_id').references(() => campaigns.id),
  utmSource: varchar('utm_source', { length: 100 }),
  utmMedium: varchar('utm_medium', { length: 100 }),
  utmCampaign: varchar('utm_campaign', { length: 100 }),
  utmContent: varchar('utm_content', { length: 100 }),
  utmTerm: varchar('utm_term', { length: 100 }),
  referrer: text('referrer'),
  userAgent: text('user_agent'),
  ipAddress: varchar('ip_address', { length: 45 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
