import fp from 'fastify-plugin'
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { db } from '@imobi/db'
import { tenants, users } from '@imobi/db'
import { eq } from 'drizzle-orm'

export interface TenantContext {
  tenantId: string
  tenantSlug: string
  userId: string
  userRole: string
  userEmail: string
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
  interface FastifyRequest {
    tenantContext: TenantContext
  }
}

export const tenantPlugin = fp(async (app: FastifyInstance) => {
  app.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify()
      const payload = request.user as { userId: string; tenantId: string }

      // Load user and tenant from DB
      const user = await db.query.users.findFirst({
        where: eq(users.id, payload.userId),
        columns: {
          id: true,
          tenantId: true,
          role: true,
          email: true,
          isActive: true,
        },
      })

      if (!user || !user.isActive) {
        return reply.status(401).send({ error: 'Unauthorized' })
      }

      // Set RLS context on DB connection
      await db.execute(
        `SELECT set_config('app.current_tenant_id', '${user.tenantId}', true)`
      )

      request.tenantContext = {
        tenantId: user.tenantId,
        tenantSlug: '',
        userId: user.id,
        userRole: user.role,
        userEmail: user.email,
      }
    } catch (err) {
      reply.status(401).send({ error: 'Unauthorized' })
    }
  })
})
