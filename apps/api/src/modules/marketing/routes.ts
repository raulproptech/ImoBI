import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { db, campaigns, emailTemplates, landingPages } from '@imobi/db'
import { eq, and, desc } from 'drizzle-orm'

export async function marketingRoutes(app: FastifyInstance) {

  // Campaigns
  app.get('/campaigns', async (request) => {
    const { tenantId } = request.tenantContext
    return db.query.campaigns.findMany({
      where: eq(campaigns.tenantId, tenantId),
      with: { template: { columns: { id: true, name: true } } },
      orderBy: [desc(campaigns.createdAt)],
    })
  })

  app.post('/campaigns', async (request, reply) => {
    const { tenantId, userId } = request.tenantContext

    const schema = z.object({
      name: z.string().min(1),
      type: z.enum(['email', 'whatsapp', 'sms']),
      subject: z.string().optional(),
      content: z.string().optional(),
      templateId: z.string().uuid().optional(),
      audienceFilter: z.record(z.unknown()).default({}),
      scheduledAt: z.string().datetime().optional(),
    })

    const body = schema.parse(request.body)

    const [campaign] = await db.insert(campaigns).values({
      ...body,
      tenantId,
      createdByUserId: userId,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
    }).returning()

    return reply.status(201).send(campaign)
  })

  // Email templates
  app.get('/templates', async (request) => {
    const { tenantId } = request.tenantContext
    return db.query.emailTemplates.findMany({
      where: eq(emailTemplates.tenantId, tenantId),
    })
  })

  // Landing pages
  app.get('/landing-pages', async (request) => {
    const { tenantId } = request.tenantContext
    return db.query.landingPages.findMany({
      where: eq(landingPages.tenantId, tenantId),
      orderBy: [desc(landingPages.createdAt)],
    })
  })
}
