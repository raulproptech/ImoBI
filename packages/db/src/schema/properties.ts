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
  doublePrecision,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { tenants } from './platform'
import { users } from './auth'
import { contacts } from './crm'

export const propertyTransactionEnum = pgEnum('property_transaction', ['sale', 'rent', 'both', 'launch'])
export const propertyStatusEnum = pgEnum('property_status', [
  'draft', 'active', 'inactive', 'sold', 'rented', 'suspended'
])



// Property Types
export const propertyTypes = pgTable('property_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(), // Apartamento, Casa, Terreno, etc.
  icon: varchar('icon', { length: 50 }),
  isActive: boolean('is_active').notNull().default(true),
})

// Properties
export const properties = pgTable('properties', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  // Identification
  code: varchar('code', { length: 50 }).notNull(), // human-readable code (e.g., AP0001)
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  // Classification
  typeId: uuid('type_id').references(() => propertyTypes.id),
  transactionType: propertyTransactionEnum('transaction_type').notNull(),
  status: propertyStatusEnum('status').notNull().default('draft'),
  // Pricing (in cents BRL)
  priceSale: integer('price_sale'),
  priceRent: integer('price_rent'),
  priceCondo: integer('price_condo'),
  priceIptu: integer('price_iptu'),
  priceMonthlyTotal: integer('price_monthly_total'), // rent + condo + iptu
  // Physical attributes
  areaTotal: real('area_total'), // m2
  areaUseful: real('area_useful'), // m2
  areaLand: real('area_land'), // for houses/land
  bedrooms: integer('bedrooms').default(0),
  bathrooms: integer('bathrooms').default(0),
  suites: integer('suites').default(0),
  parkingSpots: integer('parking_spots').default(0),
  floor: integer('floor'),
  totalFloors: integer('total_floors'),
  // Location
  addressCep: varchar('address_cep', { length: 10 }),
  addressStreet: varchar('address_street', { length: 255 }),
  addressNumber: varchar('address_number', { length: 20 }),
  addressComplement: varchar('address_complement', { length: 100 }),
  addressNeighborhood: varchar('address_neighborhood', { length: 100 }),
  addressCity: varchar('address_city', { length: 100 }),
  addressState: varchar('address_state', { length: 2 }),
  addressCountry: varchar('address_country', { length: 50 }).default('BR'),
  addressJson: jsonb('address_json'), // full ViaCEP response
  latitude: doublePrecision('latitude'),
  longitude: doublePrecision('longitude'),
  showExactAddress: boolean('show_exact_address').notNull().default(false),
  // Ownership
  ownerContactId: uuid('owner_contact_id').references(() => contacts.id),
  assignedAgentId: uuid('assigned_agent_id').references(() => users.id),
  exclusivity: boolean('exclusivity').notNull().default(false),
  exclusivityEndsAt: date('exclusivity_ends_at'),
  // Features
  features: jsonb('features').$type<string[]>().default([]), // amenities list
  nearbyPlaces: jsonb('nearby_places').default([]),
  // Media
  mediaCount: integer('media_count').default(0),
  coverImageUrl: text('cover_image_url'),
  videoUrl: text('video_url'),
  tourUrl: text('tour_url'), // 360 virtual tour
  // Portal syndication
  portalSyncStatus: jsonb('portal_sync_status').$type<{
    zapImoveis?: { synced: boolean; listingId?: string; lastSyncAt?: string; error?: string }
    vivaReal?: { synced: boolean; listingId?: string; lastSyncAt?: string; error?: string }
    olx?: { synced: boolean; listingId?: string; lastSyncAt?: string; error?: string }
  }>().default({}),
  publishToPortals: boolean('publish_to_portals').notNull().default(false),
  // SEO
  seoSlug: varchar('seo_slug', { length: 255 }).unique(),
  metaTitle: varchar('meta_title', { length: 160 }),
  metaDescription: text('meta_description'),
  // AI-generated content
  aiDescription: text('ai_description'),
  // Metrics
  viewCount: integer('view_count').default(0),
  inquiryCount: integer('inquiry_count').default(0),
  favoriteCount: integer('favorite_count').default(0),
  // Custom
  customFields: jsonb('custom_fields').default({}),
  // Timestamps
  publishedAt: timestamp('published_at', { withTimezone: true }),
  soldAt: timestamp('sold_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('properties_tenant_idx').on(table.tenantId),
  statusIdx: index('properties_status_idx').on(table.status),
  transactionIdx: index('properties_transaction_idx').on(table.transactionType),
  agentIdx: index('properties_agent_idx').on(table.assignedAgentId),
  locationIdx: index('properties_location_idx').on(table.addressNeighborhood, table.addressCity),
  slugIdx: index('properties_slug_idx').on(table.seoSlug),
}))

// Property Media






// Relations
export const propertiesRelations = relations(properties, ({ one, many }) => ({
  tenant: one(tenants, { fields: [properties.tenantId], references: [tenants.id] }),
  type: one(propertyTypes, { fields: [properties.typeId], references: [propertyTypes.id] }),
  owner: one(contacts, { fields: [properties.ownerContactId], references: [contacts.id] }),
  assignedAgent: one(users, { fields: [properties.assignedAgentId], references: [users.id] }),



}))
