import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const PRESIGN_EXPIRY = 300 // 5 minutes

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

interface PresignRequest {
  filename: string
  contentType: string
  fileSize: number
  amenityId?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: PresignRequest = await request.json()
    const { filename, contentType, fileSize, amenityId } = body

    // Validate content type
    if (!ALLOWED_TYPES.includes(contentType)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed: ${ALLOWED_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate file size
    if (fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      )
    }

    // Generate unique key
    const timestamp = Date.now()
    const randomId = crypto.randomUUID().slice(0, 8)
    const extension = filename.split('.').pop()?.toLowerCase() || 'jpg'
    const sanitizedName = filename
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9-_]/g, '_')
      .slice(0, 50)

    // Key format: amenities/{amenityId or 'pending'}/{timestamp}-{randomId}-{name}.{ext}
    const prefix = amenityId || 'pending'
    const r2Key = `amenities/${prefix}/${timestamp}-${randomId}-${sanitizedName}.${extension}`

    // Generate presigned URL
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: r2Key,
      ContentType: contentType,
    })

    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: PRESIGN_EXPIRY,
    })

    // CDN URL for serving (after upload)
    const cdnUrl = `${process.env.R2_PUBLIC_URL}/${r2Key}`

    return NextResponse.json({
      presignedUrl,
      r2Key,
      cdnUrl,
      expiresIn: PRESIGN_EXPIRY,
    })
  } catch (error) {
    console.error('Error generating presigned URL:', error)
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    )
  }
}
