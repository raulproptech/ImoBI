import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema/index'

const connectionString = process.env['DATABASE_URL']

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required')
}

// Connection pool for general queries
const pool = postgres(connectionString, {
  max: 20,
  idle_timeout: 20,
  connect_timeout: 10,
})

export const db = drizzle(pool, { schema, logger: process.env['NODE_ENV'] === 'development' })

// Set tenant context for RLS — call at start of each request
export async function withTenant<T>(
  tenantId: string,
  fn: () => Promise<T>
): Promise<T> {
  // Use a dedicated connection for tenant-scoped queries
  const conn = postgres(connectionString!, { max: 1 })
  const tenantDb = drizzle(conn, { schema })

  try {
    await conn`SELECT set_config('app.current_tenant_id', ${tenantId}, true)`
    return await fn()
  } finally {
    await conn.end()
  }
}

export type Database = typeof db
