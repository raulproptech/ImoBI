import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  jsonb,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { tenants } from './platform'

export const permissionResourceEnum = pgEnum('permission_resource', [
  'user',
  'tenant',
  'property',
  'contact',
  'deal',
  'task',
  'document',
  'financial',
  'whatsapp',
  'campaign',
  'report',
  'settings',
])

export const permissionActionEnum = pgEnum('permission_action', [
  'read',
  'create',
  'update',
  'delete',
  'admin',
])

export const roleTypeEnum = pgEnum('role_type', [
  'global', // platform wide
  'tenant', // per tenant
])

// Roles
export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  type: roleTypeEnum('type').notNull().default('tenant'),
  isSystem: boolean('is_system').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('roles_tenant_idx').on(table.tenantId),
}))

// Permissions master list
export const permissions = pgTable('permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  resource: permissionResourceEnum('resource').notNull(),
  action: permissionActionEnum('action').notNull(),
  description: text('description').notNull(),
  isSystem: boolean('is_system').notNull().default(false),
}, (table) => ({
  uniqueResourceAction: index('permissions_unique_resource_action').on(table.resource, table.action),
}))

// Role-Permission junction
export const rolePermissions = pgTable('role_permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  roleId: uuid('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  permissionId: uuid('permission_id').notNull().references(() => permissions.id, { onDelete: 'cascade' }),
}, (table) => ({
  uniqueRolePermission: index('role_permissions_unique_role_permission').on(table.roleId, table.permissionId),
}))

// Relations
export const rolesRelations = relations(roles, ({ one, many }) => ({
  tenant: one(tenants, { fields: [roles.tenantId], references: [tenants.id] }),
  permissions: many(rolePermissions),
}))

export const permissionsRelations = relations(permissions, ({ many }) => ({
  roles: many(rolePermissions),
}))

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, { fields: [rolePermissions.roleId], references: [roles.id] }),
  permission: one(permissions, { fields: [rolePermissions.permissionId], references: [permissions.id] }),
}))

