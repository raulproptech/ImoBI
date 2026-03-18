import type { FastifyInstance } from 'fastify'
import { db, contacts, deals, properties, conversations, commissions, transactions } from '@imobi/db'
import { eq, and, gte, count, sum, sql } from 'drizzle-orm'

export async function dashboardRoutes(app: FastifyInstance) {

  app.get('/overview', async (request) => {
    const { tenantId } = request.tenantContext
    const query = request.query as Record<string, string>
    const days = parseInt(query['days'] ?? '30')
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const [
      leadStats,
      propertyStats,
      financialStats,
      waStats,
    ] = await Promise.all([
      // Lead KPIs
      db.execute(sql`
        SELECT
          COUNT(*) FILTER (WHERE created_at >= ${since}) as new_leads,
          COUNT(*) FILTER (WHERE converted_at >= ${since}) as converted,
          COUNT(*) FILTER (WHERE lead_score >= 70) as hot_leads,
          AVG(lead_score) as avg_score
        FROM contacts
        WHERE tenant_id = ${tenantId} AND deleted_at IS NULL
      `),
      // Property KPIs
      db.execute(sql`
        SELECT
          COUNT(*) FILTER (WHERE status = 'active') as active,
          COUNT(*) FILTER (WHERE status = 'sold' AND sold_at >= ${since}) as sold_period,
          COUNT(*) FILTER (WHERE status = 'draft') as draft,
          AVG(EXTRACT(DAY FROM (CURRENT_TIMESTAMP - published_at))) FILTER (WHERE status = 'active') as avg_days_active
        FROM properties
        WHERE tenant_id = ${tenantId}
      `),
      // Financial KPIs
      db.execute(sql`
        SELECT
          SUM(amount) FILTER (WHERE type = 'income' AND status = 'completed' AND paid_at >= ${since}) as income_period,
          SUM(amount) FILTER (WHERE type = 'expense' AND status = 'completed' AND paid_at >= ${since}) as expense_period,
          SUM(amount) FILTER (WHERE type = 'income' AND status = 'pending') as pending_income,
          SUM(agent_net_amount) FILTER (WHERE status IN ('pending','approved')) as pending_commissions
        FROM transactions t
        LEFT JOIN commissions c ON c.tenant_id = t.tenant_id
        WHERE t.tenant_id = ${tenantId}
      `),
      // WhatsApp KPIs
      db.execute(sql`
        SELECT
          COUNT(*) FILTER (WHERE status = 'open') as open_conversations,
          COUNT(*) FILTER (WHERE status = 'waiting_agent') as waiting_agent,
          COUNT(*) FILTER (WHERE created_at >= ${since}) as new_conversations,
          AVG(EXTRACT(EPOCH FROM (first_response_at - created_at))/60) FILTER (WHERE first_response_at IS NOT NULL) as avg_response_time_min
        FROM conversations
        WHERE tenant_id = ${tenantId}
      `),
    ])

    return {
      leads: leadStats[0],
      properties: propertyStats[0],
      financial: financialStats[0],
      whatsapp: waStats[0],
      period: { days, since: since.toISOString() },
    }
  })

  // Funnel report
  app.get('/funnel', async (request) => {
    const { tenantId } = request.tenantContext

    const data = await db.execute(sql`
      WITH funnel AS (
        SELECT
          COUNT(*) as total_leads,
          COUNT(*) FILTER (WHERE last_contacted_at IS NOT NULL) as contacted,
          COUNT(DISTINCT d.contact_id) as in_deal,
          COUNT(DISTINCT d.contact_id) FILTER (WHERE d.status = 'won') as won
        FROM contacts c
        LEFT JOIN deals d ON d.contact_id = c.id AND d.tenant_id = c.tenant_id
        WHERE c.tenant_id = ${tenantId} AND c.deleted_at IS NULL
      )
      SELECT
        total_leads,
        contacted,
        ROUND(contacted::numeric / NULLIF(total_leads, 0) * 100, 1) as contact_rate,
        in_deal,
        ROUND(in_deal::numeric / NULLIF(contacted, 0) * 100, 1) as deal_rate,
        won,
        ROUND(won::numeric / NULLIF(in_deal, 0) * 100, 1) as win_rate
      FROM funnel
    `)

    return data[0]
  })
}
