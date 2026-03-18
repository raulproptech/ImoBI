import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { db, users, teams, teamMembers, tasks, documents, notifications } from '@imobi/db'
import { eq, and, desc, count } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

export async function adminRoutes(app: FastifyInstance) {

  // ========== USERS ==========

  app.get('/users', async (request) => {
    const { tenantId } = request.tenantContext
    return db.query.users.findMany({
      where: eq(users.tenantId, tenantId),
      columns: {
        id: true, email: true, fullName: true, avatarUrl: true,
        role: true, phone: true, creci: true, isActive: true,
        lastLoginAt: true, createdAt: true,
      },
    })
  })

  app.post('/users', async (request, reply) => {
    const { tenantId } = request.tenantContext

    const schema = z.object({
      email: z.string().email(),
      fullName: z.string().min(2),
      password: z.string().min(8),
      role: z.enum(['admin', 'broker', 'agent', 'financial', 'marketing', 'viewer']),
      phone: z.string().optional(),
      creci: z.string().optional(),
    })

    const body = schema.parse(request.body)
    const passwordHash = await bcrypt.hash(body.password, 12)

    const [user] = await db.insert(users).values({
      ...body,
      tenantId,
      passwordHash,
    }).returning({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      role: users.role,
    })

    return reply.status(201).send(user)
  })

  app.patch('/users/:id', async (request) => {
    const { tenantId } = request.tenantContext
    const { id } = request.params as { id: string }

    const [updated] = await db.update(users)
      .set({ ...(request.body as object), updatedAt: new Date() })
      .where(and(eq(users.id, id), eq(users.tenantId, tenantId)))
      .returning({
        id: users.id, email: users.email, fullName: users.fullName, role: users.role,
      })

    return updated
  })

  // ========== TEAMS ==========

  app.get('/teams', async (request) => {
    const { tenantId } = request.tenantContext
    return db.query.teams.findMany({
      where: eq(teams.tenantId, tenantId),
      with: {
        leader: { columns: { id: true, fullName: true, avatarUrl: true } },
        members: { with: { user: { columns: { id: true, fullName: true, avatarUrl: true } } } },
      },
    })
  })

  // ========== TASKS ==========

  app.get('/tasks', async (request) => {
    const { tenantId, userId } = request.tenantContext
    const query = request.query as Record<string, string>

    const conditions = [eq(tasks.tenantId, tenantId)]
    if (query['assignedToMe'] === 'true') conditions.push(eq(tasks.assignedToUserId, userId))
    if (query['status']) conditions.push(eq(tasks.status, query['status'] as any))

    return db.query.tasks.findMany({
      where: and(...conditions),
      with: {
        assignedToUser: { columns: { id: true, fullName: true, avatarUrl: true } },
        createdByUser: { columns: { id: true, fullName: true } },
      },
      orderBy: [desc(tasks.dueAt)],
    })
  })

  app.post('/tasks', async (request, reply) => {
    const { tenantId, userId } = request.tenantContext

    const schema = z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
      assignedToUserId: z.string().uuid().optional(),
      dueAt: z.string().datetime().optional(),
      contactId: z.string().uuid().optional(),
      propertyId: z.string().uuid().optional(),
    })

    const body = schema.parse(request.body)

    const [task] = await db.insert(tasks).values({
      ...body,
      tenantId,
      createdByUserId: userId,
      dueAt: body.dueAt ? new Date(body.dueAt) : undefined,
    }).returning()

    return reply.status(201).send(task)
  })

  // ========== NOTIFICATIONS ==========

  app.get('/notifications', async (request) => {
    const { tenantId, userId } = request.tenantContext
    return db.query.notifications.findMany({
      where: and(eq(notifications.tenantId, tenantId), eq(notifications.userId, userId)),
      orderBy: [desc(notifications.createdAt)],
      limit: 50,
    })
  })

  app.patch('/notifications/:id/read', async (request) => {
    const { tenantId, userId } = request.tenantContext
    const { id } = request.params as { id: string }

    await db.update(notifications)
      .set({ readAt: new Date() })
      .where(and(
        eq(notifications.id, id),
        eq(notifications.userId, userId),
        eq(notifications.tenantId, tenantId)
      ))

    return { success: true }
  })

  // Tenant settings
  app.get('/settings', async (request) => {
    const { tenantId } = request.tenantContext
    const { tenants } = await import('@imobi/db')
    const { eq } = await import('drizzle-orm')

    return db.query.tenants.findFirst({
      where: eq(tenants.id, tenantId),
      columns: {
        id: true, name: true, slug: true, cnpj: true, email: true,
        phone: true, logoUrl: true, primaryColor: true, secondaryColor: true,
        timezone: true, businessHours: true, dpoEmail: true,
      },
    })
  })
}
