import type { FastifyInstance } from 'fastify'
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { db, propertyMedia, properties } from '@imobi/db'
import { eq, and } from 'drizzle-orm'
import { randomUUID } from 'crypto'

const s3 = new S3Client({
  region: process.env['S3_REGION'] ?? 'auto',
  endpoint: process.env['S3_ENDPOINT'],
  credentials: {
    accessKeyId: process.env['S3_ACCESS_KEY_ID']!,
    secretAccessKey: process.env['S3_SECRET_ACCESS_KEY']!,
  },
})

export async function uploadRoutes(app: FastifyInstance) {

  // Get presigned URL for direct S3 upload
  app.post('/presigned', { preHandler: [app.authenticate] }, async (request, reply) => {
    const { tenantId } = request.tenantContext
    const { fileName, mimeType, context } = request.body as {
      fileName: string
      mimeType: string
      context: 'property' | 'avatar' | 'document' | 'logo'
    }

    const ext = fileName.split('.').pop()
    const key = `${tenantId}/${context}/${randomUUID()}.${ext}`

    const command = new PutObjectCommand({
      Bucket: process.env['S3_BUCKET']!,
      Key: key,
      ContentType: mimeType,
    })

    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 300 })
    const publicUrl = `${process.env['S3_ENDPOINT']}/${process.env['S3_BUCKET']}/${key}`

    return { uploadUrl: signedUrl, publicUrl, key }
  })

  // Register uploaded property media
  app.post('/property-media', { preHandler: [app.authenticate] }, async (request, reply) => {
    const { tenantId } = request.tenantContext
    const { propertyId, url, thumbnailUrl, type, fileName, fileSize, mimeType, isCover } = request.body as {
      propertyId: string
      url: string
      thumbnailUrl?: string
      type: string
      fileName?: string
      fileSize?: number
      mimeType?: string
      isCover?: boolean
    }

    const [media] = await db.insert(propertyMedia).values({
      tenantId,
      propertyId,
      url,
      thumbnailUrl,
      type,
      fileName,
      fileSize,
      mimeType,
      isCover: isCover ?? false,
    }).returning()

    // Update cover image on property
    if (isCover) {
      await db.update(properties)
        .set({ coverImageUrl: url, updatedAt: new Date() })
        .where(and(eq(properties.id, propertyId), eq(properties.tenantId, tenantId)))
    }

    // Update media count
    await db.execute(
      `UPDATE properties SET media_count = (SELECT COUNT(*) FROM property_media WHERE property_id = '${propertyId}') WHERE id = '${propertyId}'`
    )

    return reply.status(201).send(media)
  })
}
