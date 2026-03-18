import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { db, users, sessions, tenants, plans } from '@imobi/db'
import { eq, and, sql } from 'drizzle-orm'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

const registerSchema = z.object({
  agencyName: z.string().min(2),
  cnpj: z.string().optional(),
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
  phone: z.string().optional(),
})

export async function authRoutes(app: FastifyInstance) {
  // Login
  app.post('/login', async (request, reply) => {
    const body = loginSchema.parse(request.body)

    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, sql`gen_random_uuid()`), // demo first
    })

    if (!tenant || tenant.status === 'suspended' || tenant.status === 'cancelled') {
      return reply.status(401).send({ error: 'Demo tenant not active - docker up first' })
    }

    const user = await db.query.users.findFirst({
      where: and(
        eq(users.tenantId, tenant.id),
        eq(users.email, body.email.toLowerCase()),
        eq(users.isActive, true)
      ),
    })

    if (!user || !user.passwordHash) {
      return reply.status(401).send({ error: 'Invalid credentials' })
    }

    const validPassword = await bcrypt.compare(body.password, user.passwordHash)
    if (!validPassword) {
      return reply.status(401).send({ error: 'Invalid credentials' })
    }

    const accessToken = app.jwt.sign({
      userId: user.id,
      tenantId: tenant.id,
      role: user.role,
    })

    const refreshToken = app.jwt.sign(
      { userId: user.id, tenantId: tenant.id, type: 'refresh' },
      { expiresIn: '30d' }
    )

    // Save session
    await db.insert(sessions).values({
      userId: user.id,
      tenantId: tenant.id,
      token: accessToken,
      refreshToken,
      ipAddress: request.ip,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    })

    // Update last login
    await db.update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id))

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        logoUrl: tenant.logoUrl,
        primaryColor: tenant.primaryColor,
      },
    }
  })

  // Register new agency (tenant)
  app.post('/register', async (request, reply) => {
    const body = registerSchema.parse(request.body)

    // Get default starter plan
    const starterPlan = await db.query.plans.findFirst({
      where: eq(plans.type, 'starter'),
    })

    if (!starterPlan) {
      return reply.status(500).send({ error: 'No plans available' })
    }

    // Generate unique slug from agency name
    const baseSlug = body.agencyName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

    let slug = baseSlug
    let suffix = 1
    while (await db.query.tenants.findFirst({ where: eq(tenants.slug, slug) })) {
      slug = `${baseSlug}-${suffix++}`
    }

    const passwordHash = await bcrypt.hash(body.password, 12)

    // Create tenant
    const [tenant] = await db.insert(tenants).values({
      planId: starterPlan.id,
      name: body.agencyName,
      slug,
      cnpj: body.cnpj,
      email: body.email,
      phone: body.phone,
      status: 'trial',
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
    }).returning()

    if (!tenant) throw new Error('Failed to create tenant')

    // Create owner user
    const [user] = await db.insert(users).values({
      tenantId: tenant.id,
      email: body.email.toLowerCase(),
      passwordHash,
      fullName: body.fullName,
      role: 'owner',
    }).returning()

    if (!user) throw new Error('Failed to create user')

    const accessToken = app.jwt.sign({ userId: user.id, tenantId: tenant.id, role: user.role })

    return reply.status(201).send({
      accessToken,
      user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
      tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug },
    })
  })

  // Refresh token
  app.post('/refresh', async (request, reply) => {
    const { refreshToken } = request.body as { refreshToken: string }
    try {
      const payload = app.jwt.verify(refreshToken) as {
        userId: string; tenantId: string; type: string
      }
      if (payload.type !== 'refresh') throw new Error('Invalid token type')

      const newAccessToken = app.jwt.sign({
        userId: payload.userId,
        tenantId: payload.tenantId,
      })

      return { accessToken: newAccessToken }
    } catch {
      return reply.status(401).send({ error: 'Invalid refresh token' })
    }
  })

  // Get current user profile
  app.get('/me', { preHandler: [app.authenticate] }, async (request) => {
    const { userId, tenantId } = request.tenantContext

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        id: true, email: true, fullName: true, avatarUrl: true,
        role: true, phone: true, creci: true, preferences: true,
      },
    })

    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, tenantId),
      columns: {
        id: true, name: true, slug: true, logoUrl: true,
        primaryColor: true, secondaryColor: true, status: true,
        trialEndsAt: true, businessHours: true, timezone: true,
      },
    })

    return { user, tenant }
  })

  // Logout
  app.post('/logout', { preHandler: [app.authenticate] }, async (request) => {
    await db.delete(sessions).where(
      eq(sessions.userId, request.tenantContext.userId)
    )
    return { success: true }
  })
}
