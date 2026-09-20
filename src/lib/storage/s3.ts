// ============================================
// Zar30 - Object Storage (S3-compatible / MinIO dev)
// ============================================
// مدارک KYC در bucket خصوصی نگه‌داری می‌شوند — بدون Public URL
// فایل‌ها قبل از آپلود AES-256-GCM رمزنگاری می‌شوند
// ============================================

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
} from '@aws-sdk/client-s3'
import { env } from '@/lib/config/env'
import { logger } from '@/lib/logger/logger'

let client: S3Client | null = null
let bucketEnsured = false

function s3(): S3Client {
  if (!client) {
    client = new S3Client({
      endpoint: env.S3_ENDPOINT,
      region: env.S3_REGION,
      forcePathStyle: env.S3_FORCE_PATH_STYLE,
      credentials: { accessKeyId: env.S3_ACCESS_KEY, secretAccessKey: env.S3_SECRET_KEY },
    })
  }
  return client
}

// ایجاد bucket در صورت نبود — idempotent؛ در production bucket از قبل مدیریت‌شده است
async function ensureBucket(): Promise<void> {
  if (bucketEnsured) return
  try {
    await s3().send(new HeadBucketCommand({ Bucket: env.S3_BUCKET }))
  } catch {
    try {
      await s3().send(new CreateBucketCommand({ Bucket: env.S3_BUCKET }))
      logger.info({ bucket: env.S3_BUCKET }, 'Storage bucket created')
    } catch (err) {
      logger.warn({ err, bucket: env.S3_BUCKET }, 'Bucket ensure failed')
    }
  }
  bucketEnsured = true
}

export async function storagePut(key: string, body: Buffer, contentType: string): Promise<void> {
  await ensureBucket()
  await s3().send(
    new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      // فایل‌ها قبل از put رمزنگاری می‌شوند؛ این metadata صرفاً تشخیصی است
      Metadata: { 'x-zar30-encrypted': 'true' },
    }),
  )
}

export async function storageGet(key: string): Promise<Buffer | null> {
  await ensureBucket()
  try {
    const res = await s3().send(new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: key }))
    if (!res.Body) return null
    return Buffer.from(await res.Body.transformToByteArray())
  } catch (err) {
    const name = (err as { name?: string }).name
    if (name === 'NoSuchKey' || name === 'NotFound') return null
    throw err
  }
}

export async function storageDelete(key: string): Promise<void> {
  await ensureBucket()
  await s3().send(new DeleteObjectCommand({ Bucket: env.S3_BUCKET, Key: key }))
}
