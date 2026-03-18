import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import jwt from '@fastify/jwt'
import rateLimit from '@fastify/rate-limit'
import websocket from '@fastify/websocket'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import multipart from '@fastify/multipart'

import { tenantPlugin } from './plugins/tenant.js'
import { redisPlugin } from './plugins/redis.js'
import { authRoutes } from './modules/auth/routes.js'
import { crmRoutes } from './modules/crm/routes.js'
import { propertiesRoutes } from './modules/properties/routes.js'
import { whatsappRoutes } from './modules/whatsapp/routes.js'
import { financialRoutes } from './modules/financial/routes.js'
import { marketingRoutes } from './modules/marketing/routes.js'
import { adminRoutes } from './modules/admin/routes.js'
import { analyticsRoutes } from './modules/analytics/routes.js'
import { uploadRoutes } from './modules/upload/routes.js'
import { webhookRoutes } from './modules/webhooks/routes.js'
import { dashboardRoutes } from './modules/dashboard/routes.js'

const app = Fastify({
  logger: {
    level: process.env['NODE_ENV'] === 'production' ? 'info' : 'debug',
    transport: process.env['NODE_ENV'] !== 'production'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
  },
})

async function bootstrap() {
  // Security
  await app.register(helmet, { contentSecurityPolicy: false })
  await app.register(cors, {
    origin: (origin, cb) => {
      // Allow subdomains of the platform and localhost
      const allowed = !origin ||
        origin.includes('localhost') ||
        origin.includes('.imobi.com.br')
      cb(null, allowed)
    },
    credentials: true,
  })

  // Rate limiting
  await app.register(rateLimit, {
    max: 200,
    timeWindow: '1 minute',
    redis: app.redis,
  })

  // JWT
  await app.register(jwt, {
    secret: process.env['JWT_SECRET']!,
    sign: { expiresIn: '15m' },
  })

  // File uploads
  await app.register(multipart, {
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  })

  // WebSocket
  await app.register(websocket)

  // Swagger docs (dev only)
  if (process.env['NODE_ENV'] !== 'production') {
    await app.register(swagger, {
      openapi: {
        info: { title: 'ImoBI API', version: '1.0.0' },
        components: {
          securitySchemes: {
            bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
          },
        },
      },
    })
    await app.register(swaggerUi, { routePrefix: '/docs' })
  }

  // Custom plugins
  await app.register(redisPlugin)
  await app.register(tenantPlugin)

  // Health check
  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }))

  // Routes — prefix all tenant routes
  await app.register(authRoutes, { prefix: '/auth' })
  await app.register(webhookRoutes, { prefix: '/webhooks' }) // no auth - webhook verification
  await app.register(uploadRoutes, { prefix: '/upload' })

  // Authenticated tenant routes
  await app.register(async (tenantApp) => {
    tenantApp.addHook('preHandler', tenantApp.authenticate)
    await tenantApp.register(dashboardRoutes, { prefix: '/dashboard' })
    await tenantApp.register(crmRoutes, { prefix: '/crm' })
    await tenantApp.register(propertiesRoutes, { prefix: '/properties' })
    await tenantApp.register(whatsappRoutes, { prefix: '/whatsapp' })
    await tenantApp.register(financialRoutes, { prefix: '/financial' })
    await tenantApp.register(marketingRoutes, { prefix: '/marketing' })
    await tenantApp.register(adminRoutes, { prefix: '/admin' })
    await tenantApp.register(analyticsRoutes, { prefix: '/analytics' })
  }, { prefix: '/api/v1' })

  const port = parseInt(process.env['API_PORT'] ?? '3001')
  await app.listen({ port, host: '0.0.0.0' })
  app.log.info(`ImoBI API running on port ${port}`)
}

bootstrap().catch((err) => {
  console.error(err)
  process.exit(1)
})
