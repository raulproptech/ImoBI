import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { db, properties, propertyMedia, propertyTypes, proposals, contracts } from '@imobi/db'
import { eq, and, desc, gte, lte, ilike, inArray, sql, count } from 'drizzle-orm'
import { generateCode, slugify } from '@imobi/shared'

export async function propertiesRoutes(app: FastifyInstance) {

  // List properties
  app.get('/', async (request) => {
    const { tenantId } = request.tenantContext
    const query = request.query as Record<string, string>

    const page = parseInt(query['page'] ?? '1')
    const pageSize = Math.min(parseInt(query['pageSize'] ?? '20'), 100)
    const offset = (page - 1) * pageSize

    const conditions = [eq(properties.tenantId, tenantId)]

    if (query['status']) conditions.push(eq(properties.status, query['status'] as any))
    if (query['transactionType']) conditions.push(eq(properties.transactionType, query['transactionType'] as any))
    if (query['agentId']) conditions.push(eq(properties.assignedAgentId, query['agentId']))
    if (query['neighborhood']) conditions.push(ilike(properties.addressNeighborhood, `%${query['neighborhood']}%`))
    if (query['city']) conditions.push(eq(properties.addressCity, query['city']))
    if (query['minPrice']) conditions.push(gte(properties.priceSale, parseInt(query['minPrice'])))
    if (query['maxPrice']) conditions.push(lte(properties.priceSale, parseInt(query['maxPrice'])))
    if (query['minBedrooms']) conditions.push(gte(properties.bedrooms, parseInt(query['minBedrooms'])))
    if (query['search']) conditions.push(ilike(properties.title, `%${query['search']}%`))

    const [rows, total] = await Promise.all([
      db.query.properties.findMany({
        where: and(...conditions),
        with: {
          type: { columns: { id: true, name: true } },
          assignedAgent: { columns: { id: true, fullName: true, avatarUrl: true } },
          media: {
            where: eq(propertyMedia.isCover, true),
            limit: 1,
            columns: { url: true, thumbnailUrl: true },
          },
        },
        limit: pageSize,
        offset,
        orderBy: [desc(properties.createdAt)],
      }),
      db.select({ count: count() }).from(properties).where(and(...conditions)),
    ])

    return { data: rows, meta: { page, pageSize, total: total[0]?.count ?? 0 } }
  })

  // Get single property
  app.get('/:id', async (request, reply) => {
    const { tenantId } = request.tenantContext
    const { id } = request.params as { id: string }

    const property = await db.query.properties.findFirst({
      where: and(eq(properties.id, id), eq(properties.tenantId, tenantId)),
      with: {
        type: true,
        owner: { columns: { id: true, fullName: true, phoneWhatsapp: true, email: true } },
        assignedAgent: { columns: { id: true, fullName: true, avatarUrl: true } },
        media: { orderBy: [({ position }) => asc(position)] },
      },
    })

    if (!property) return reply.status(404).send({ error: 'Property not found' })
    return property
  })

  // Create property
  app.post('/', async (request, reply) => {
    const { tenantId, userId } = request.tenantContext

    const schema = z.object({
      title: z.string().min(5),
      transactionType: z.enum(['sale', 'rent', 'both', 'launch']),
      typeId: z.string().uuid().optional(),
      priceSale: z.number().optional(),
      priceRent: z.number().optional(),
      priceCondo: z.number().optional(),
      priceIptu: z.number().optional(),
      areaTotal: z.number().optional(),
      areaUseful: z.number().optional(),
      bedrooms: z.number().default(0),
      bathrooms: z.number().default(0),
      suites: z.number().default(0),
      parkingSpots: z.number().default(0),
      addressCep: z.string().optional(),
      addressStreet: z.string().optional(),
      addressNumber: z.string().optional(),
      addressNeighborhood: z.string().optional(),
      addressCity: z.string().optional(),
      addressState: z.string().max(2).optional(),
      features: z.array(z.string()).default([]),
      description: z.string().optional(),
      ownerContactId: z.string().uuid().optional(),
      assignedAgentId: z.string().uuid().optional(),
    })

    const body = schema.parse(request.body)

    // Generate unique code
    const countResult = await db.select({ count: count() }).from(properties).where(eq(properties.tenantId, tenantId))
    const num = (countResult[0]?.count ?? 0) + 1
    const prefix = body.transactionType === 'rent' ? 'AL' : 'VD'
    const code = generateCode(prefix, num)

    // Generate SEO slug
    const baseSlug = slugify(`${body.addressNeighborhood ?? 'imovel'}-${body.addressCity ?? ''}-${code}`.trim())

    const [property] = await db.insert(properties).values({
      ...body,
      tenantId,
      code,
      seoSlug: baseSlug,
      assignedAgentId: body.assignedAgentId ?? userId,
      status: 'draft',
    }).returning()

    return reply.status(201).send(property)
  })

  // Update property
  app.patch('/:id', async (request, reply) => {
    const { tenantId } = request.tenantContext
    const { id } = request.params as { id: string }

    const [updated] = await db.update(properties)
      .set({ ...(request.body as object), updatedAt: new Date() })
      .where(and(eq(properties.id, id), eq(properties.tenantId, tenantId)))
      .returning()

    if (!updated) return reply.status(404).send({ error: 'Property not found' })
    return updated
  })

  // Publish/unpublish property
  app.patch('/:id/status', async (request, reply) => {
    const { tenantId } = request.tenantContext
    const { id } = request.params as { id: string }
    const { status } = request.body as { status: string }

    const [updated] = await db.update(properties)
      .set({
        status: status as any,
        publishedAt: status === 'active' ? new Date() : undefined,
        updatedAt: new Date(),
      })
      .where(and(eq(properties.id, id), eq(properties.tenantId, tenantId)))
      .returning()

    return updated
  })

  // Get media list
  app.get('/:id/media', async (request) => {
    const { id } = request.params as { id: string }
    return db.query.propertyMedia.findMany({
      where: eq(propertyMedia.propertyId, id),
      orderBy: [({ position }) => asc(position)],
    })
  })

  // Reorder media
  app.patch('/:id/media/reorder', async (request) => {
    const { tenantId } = request.tenantContext
    const { id } = request.params as { id: string }
    const { order } = request.body as { order: Array<{ id: string; position: number }> }

    await Promise.all(order.map(item =>
      db.update(propertyMedia)
        .set({ position: item.position })
        .where(and(eq(propertyMedia.id, item.id), eq(propertyMedia.tenantId, tenantId)))
    ))

    return { success: true }
  })

  // Property types
  app.get('/types', async (request) => {
    const { tenantId } = request.tenantContext
    return db.query.propertyTypes.findMany({
      where: eq(propertyTypes.tenantId, tenantId),
    })
  })

  // Stats
  app.get('/stats/overview', async (request) => {
    const { tenantId } = request.tenantContext

    const stats = await db.execute(sql`
      SELECT
        COUNT(*) FILTER (WHERE status = 'active') as active,
        COUNT(*) FILTER (WHERE status = 'draft') as draft,
        COUNT(*) FILTER (WHERE status = 'sold') as sold,
        COUNT(*) FILTER (WHERE status = 'rented') as rented,
        COUNT(*) FILTER (WHERE transaction_type = 'sale') as for_sale,
        COUNT(*) FILTER (WHERE transaction_type = 'rent') as for_rent,
        AVG(price_sale) FILTER (WHERE price_sale IS NOT NULL) as avg_price_sale,
        AVG(price_rent) FILTER (WHERE price_rent IS NOT NULL) as avg_price_rent
      FROM properties
      WHERE tenant_id = ${tenantId}
    `)

    return stats[0]
  })
}
