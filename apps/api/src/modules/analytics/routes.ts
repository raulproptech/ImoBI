import type { FastifyInstance } from 'fastify'
import { db, events, reports } from '@imobi/db'
import { eq, and, gte, lte, sql } from 'drizzle-orm'
import { z } from 'zod'

export async function analyticsRoutes(app: FastifyInstance) {

  // Track event
  app.post('/events', async (request, reply) => {
    const { tenantId, userId } = request.tenantContext

    const schema = z.object({
      category: z.string(),
      action: z.string(),
      entityType: z.string().optional(),
      entityId: z.string().uuid().optional(),
      properties: z.record(z.unknown()).default({}),
      channel: z.string().optional(),
    })

    const body = schema.parse(request.body)

    await db.insert(events).values({
      tenantId,
      userId,
      ...body,
      channel: body.channel ?? 'web',
    })

    return reply.status(201).send({ tracked: true })
  })

  // Agent performance
  app.get('/agents-performance', async (request) => {
    const { tenantId } = request.tenantContext
    const query = request.query as Record<string, string>
    const since = new Date(Date.now() - parseInt(query['days'] ?? '30') * 24 * 60 * 60 * 1000)

    const data = await db.execute(sql`
      SELECT
        u.id,
        u.full_name,
        u.avatar_url,
        COUNT(DISTINCT c.id) as total_leads,
        COUNT(DISTINCT d.id) FILTER (WHERE d.status = 'won') as deals_won,
        COUNT(DISTINCT d.id) FILTER (WHERE d.status = 'open') as deals_open,
        SUM(d.value) FILTER (WHERE d.status = 'won') as revenue_won,
        COUNT(DISTINCT conv.id) as conversations,
        AVG(EXTRACT(EPOCH FROM (conv.first_response_at - conv.created_at))/60) as avg_response_min
      FROM users u
      LEFT JOIN contacts c ON c.assigned_agent_id = u.id AND c.tenant_id = u.tenant_id AND c.created_at >= ${since}
      LEFT JOIN deals d ON d.assigned_agent_id = u.id AND d.tenant_id = u.tenant_id
      LEFT JOIN conversations conv ON conv.assigned_agent_id = u.id AND conv.tenant_id = u.tenant_id
      WHERE u.tenant_id = ${tenantId} AND u.is_active = true
      GROUP BY u.id, u.full_name, u.avatar_url
      ORDER BY deals_won DESC
    `)

    return data
  })

  // Lead source analysis
  app.get('/lead-sources', async (request) => {
    const { tenantId } = request.tenantContext

    const data = await db.execute(sql`
      SELECT
        ls.name as source,
        ls.color,
        COUNT(c.id) as total_leads,
        COUNT(c.id) FILTER (WHERE c.converted_at IS NOT NULL) as converted,
        ROUND(COUNT(c.id) FILTER (WHERE c.converted_at IS NOT NULL)::numeric / NULLIF(COUNT(c.id), 0) * 100, 1) as conversion_rate,
        AVG(c.lead_score) as avg_score
      FROM lead_sources ls
      LEFT JOIN contacts c ON c.lead_source_id = ls.id
      WHERE ls.tenant_id = ${tenantId}
      GROUP BY ls.id, ls.name, ls.color
      ORDER BY total_leads DESC
    `)

    return data
  })

  // Reports CRUD
  app.get('/reports', async (request) => {
    const { tenantId } = request.tenantContext
    return db.query.reports.findMany({ where: eq(reports.tenantId, tenantId) })
  })
}
