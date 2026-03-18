import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { db, transactions, commissions, invoices, bankAccounts, accounts } from '@imobi/db'
import { eq, and, desc, gte, lte, sql, count, sum } from 'drizzle-orm'

export async function financialRoutes(app: FastifyInstance) {

  // ========== TRANSACTIONS ==========

  app.get('/transactions', async (request) => {
    const { tenantId } = request.tenantContext
    const query = request.query as Record<string, string>

    const conditions = [eq(transactions.tenantId, tenantId)]
    if (query['type']) conditions.push(eq(transactions.type, query['type'] as any))
    if (query['status']) conditions.push(eq(transactions.status, query['status'] as any))
    if (query['startDate']) conditions.push(gte(transactions.dueDate, query['startDate']))
    if (query['endDate']) conditions.push(lte(transactions.dueDate, query['endDate']))
    if (query['bankAccountId']) conditions.push(eq(transactions.bankAccountId, query['bankAccountId']))

    const page = parseInt(query['page'] ?? '1')
    const pageSize = parseInt(query['pageSize'] ?? '20')

    const [rows, total] = await Promise.all([
      db.query.transactions.findMany({
        where: and(...conditions),
        with: {
          contact: { columns: { id: true, fullName: true } },
          bankAccount: { columns: { id: true, name: true } },
        },
        orderBy: [desc(transactions.dueDate)],
        limit: pageSize,
        offset: (page - 1) * pageSize,
      }),
      db.select({ count: count() }).from(transactions).where(and(...conditions)),
    ])

    return { data: rows, meta: { page, pageSize, total: total[0]?.count ?? 0 } }
  })

  // Create transaction
  app.post('/transactions', async (request, reply) => {
    const { tenantId, userId } = request.tenantContext

    const schema = z.object({
      type: z.enum(['income', 'expense', 'transfer']),
      amount: z.number().positive(), // in cents
      description: z.string().min(1),
      category: z.string().optional(),
      bankAccountId: z.string().uuid().optional(),
      contactId: z.string().uuid().optional(),
      contractId: z.string().uuid().optional(),
      paymentMethod: z.string().optional(),
      dueDate: z.string().optional(),
      isRecurring: z.boolean().default(false),
      recurringConfig: z.any().optional(),
    })

    const body = schema.parse(request.body)

    const [tx] = await db.insert(transactions).values({
      ...body,
      tenantId,
      userId,
      dueDate: body.dueDate,
      status: 'pending',
    }).returning()

    return reply.status(201).send(tx)
  })

  // Mark as paid
  app.patch('/transactions/:id/pay', async (request) => {
    const { tenantId } = request.tenantContext
    const { id } = request.params as { id: string }
    const { paidAt, paymentMethod } = request.body as { paidAt?: string; paymentMethod?: string }

    const [updated] = await db.update(transactions)
      .set({
        status: 'completed',
        paidAt: new Date(paidAt ?? Date.now()),
        paymentMethod: paymentMethod,
        updatedAt: new Date(),
      })
      .where(and(eq(transactions.id, id), eq(transactions.tenantId, tenantId)))
      .returning()

    return updated
  })

  // ========== COMMISSIONS ==========

  app.get('/commissions', async (request) => {
    const { tenantId } = request.tenantContext
    const query = request.query as Record<string, string>

    const conditions = [eq(commissions.tenantId, tenantId)]
    if (query['status']) conditions.push(eq(commissions.status, query['status'] as any))
    if (query['agentId']) conditions.push(eq(commissions.agentId, query['agentId']))

    return db.query.commissions.findMany({
      where: and(...conditions),
      with: {
        agent: { columns: { id: true, fullName: true, avatarUrl: true } },
        contract: { columns: { id: true, number: true, type: true } },
      },
      orderBy: [desc(commissions.createdAt)],
    })
  })

  // Approve commission
  app.patch('/commissions/:id/approve', async (request) => {
    const { tenantId, userId } = request.tenantContext
    const { id } = request.params as { id: string }

    const [updated] = await db.update(commissions)
      .set({
        status: 'approved',
        approvedById: userId,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(commissions.id, id), eq(commissions.tenantId, tenantId)))
      .returning()

    return updated
  })

  // ========== BANK ACCOUNTS ==========

  app.get('/bank-accounts', async (request) => {
    const { tenantId } = request.tenantContext
    return db.query.bankAccounts.findMany({
      where: and(eq(bankAccounts.tenantId, tenantId), eq(bankAccounts.isActive, true)),
    })
  })

  // ========== REPORTS ==========

  // Cash flow report
  app.get('/reports/cash-flow', async (request) => {
    const { tenantId } = request.tenantContext
    const query = request.query as Record<string, string>
    const period = query['period'] ?? '30'

    const data = await db.execute(sql`
      SELECT
        DATE_TRUNC('day', due_date) as day,
        SUM(amount) FILTER (WHERE type = 'income' AND status = 'completed') as income,
        SUM(amount) FILTER (WHERE type = 'expense' AND status = 'completed') as expense,
        SUM(amount) FILTER (WHERE type = 'income' AND status = 'pending') as pending_income,
        SUM(amount) FILTER (WHERE type = 'expense' AND status = 'pending') as pending_expense
      FROM transactions
      WHERE tenant_id = ${tenantId}
        AND due_date >= NOW() - INTERVAL '${sql.raw(period)} days'
        AND due_date <= NOW() + INTERVAL '${sql.raw(period)} days'
      GROUP BY DATE_TRUNC('day', due_date)
      ORDER BY day ASC
    `)

    return data
  })

  // DRE (Income Statement)
  app.get('/reports/dre', async (request) => {
    const { tenantId } = request.tenantContext
    const query = request.query as Record<string, string>

    const data = await db.execute(sql`
      SELECT
        category,
        type,
        SUM(amount) as total,
        COUNT(*) as count
      FROM transactions
      WHERE tenant_id = ${tenantId}
        AND status = 'completed'
        AND due_date >= ${query['startDate'] ?? sql`NOW() - INTERVAL '30 days'`}
        AND due_date <= ${query['endDate'] ?? sql`NOW()`}
      GROUP BY category, type
      ORDER BY type, total DESC
    `)

    return data
  })

  // Commissions summary
  app.get('/reports/commissions', async (request) => {
    const { tenantId } = request.tenantContext

    const data = await db.execute(sql`
      SELECT
        u.full_name as agent_name,
        COUNT(c.id) as total_commissions,
        SUM(c.gross_amount) as total_gross,
        SUM(c.agent_net_amount) as total_net,
        SUM(c.agent_net_amount) FILTER (WHERE c.status = 'paid') as total_paid,
        SUM(c.agent_net_amount) FILTER (WHERE c.status = 'approved') as total_approved,
        SUM(c.agent_net_amount) FILTER (WHERE c.status = 'pending') as total_pending
      FROM commissions c
      JOIN users u ON u.id = c.agent_id
      WHERE c.tenant_id = ${tenantId}
      GROUP BY u.id, u.full_name
      ORDER BY total_net DESC
    `)

    return data
  })
}
