import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary'
import { NextRequest, NextResponse } from 'next/server'
import { logApiError } from '@/lib/api/error-response'
import { businessAuthErrorResponse, requireBusinessRole } from '@/lib/auth/business-access'
import { getCurrentUser } from '@/lib/auth/get-user'
import { logger, withRequestLogging } from '@/lib/observability/logger'
import { checkRateLimit } from '@/lib/services/rate-limit'
import {
  fingerprintImageUpload,
  ImageUploadValidationError,
  type ImageUploadPurpose,
  sanitizeImageUpload,
} from '@/lib/uploads/image-security'

const PERSONAL_PURPOSES = new Set<ImageUploadPurpose>(['profile'])
const BUSINESS_PURPOSES = new Set<ImageUploadPurpose>([
  'business-logo',
  'business-cover',
  'service',
  'gallery',
])
const BUSINESS_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/
const REUSED_IMAGE_MESSAGE =
  'This image already exists in your media library, so OnPrez reused it instead of uploading a duplicate.'

type StoredCloudinaryImage = {
  secure_url: string
  public_id: string
  width: number
  height: number
  format: string
  bytes: number
}

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

function getStringFormValue(formData: FormData, key: string) {
  const value = formData.get(key)

  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function isCloudinaryNotFound(error: unknown) {
  if (!error || typeof error !== 'object') return false

  const candidate = error as { http_code?: unknown; error?: { http_code?: unknown } }
  return candidate.http_code === 404 || candidate.error?.http_code === 404
}

function toStoredImage(resource: unknown): StoredCloudinaryImage {
  const image = resource as Partial<StoredCloudinaryImage>

  if (
    typeof image.secure_url !== 'string' ||
    typeof image.public_id !== 'string' ||
    typeof image.width !== 'number' ||
    typeof image.height !== 'number' ||
    typeof image.format !== 'string' ||
    typeof image.bytes !== 'number'
  ) {
    throw new Error('Cloudinary returned incomplete image metadata')
  }

  return image as StoredCloudinaryImage
}

async function findStoredImage(publicId: string) {
  try {
    return toStoredImage(
      await cloudinary.api.resource(publicId, {
        resource_type: 'image',
      })
    )
  } catch (error) {
    if (isCloudinaryNotFound(error)) return null
    throw error
  }
}

function uploadToCloudinary(
  buffer: Buffer,
  folder: string,
  mimeType: string,
  fingerprint: string
) {
  return new Promise<UploadApiResponse>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder,
          public_id: fingerprint,
          resource_type: 'image',
          allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
          backup: true,
          overwrite: false,
          unique_filename: false,
          use_filename: false,
          context: {
            source: 'onprez',
            mimeType,
            fingerprint,
          },
        },
        (error, result) => {
          if (error) {
            reject(error)
            return
          }

          if (!result) {
            reject(new Error('Cloudinary upload returned no result'))
            return
          }

          resolve(result)
        }
      )
      .end(buffer)
  })
}

function imageResponse(image: StoredCloudinaryImage, reused: boolean) {
  return NextResponse.json({
    success: true,
    message: reused ? REUSED_IMAGE_MESSAGE : 'Image uploaded successfully.',
    data: {
      url: image.secure_url,
      publicId: image.public_id,
      width: image.width,
      height: image.height,
      format: image.format,
      bytes: image.bytes,
      reused,
    },
  })
}

async function handlePost(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const rateLimit = await checkRateLimit(`upload-image:${user.id}`, 'upload:image')

    if (!rateLimit.allowed) {
      const resetInSeconds = Math.max(
        1,
        Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000)
      )

      return NextResponse.json(
        { success: false, error: 'Too many image uploads. Please try again later.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimit.limit.toString(),
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': Math.floor(rateLimit.resetAt.getTime() / 1000).toString(),
            'Retry-After': (rateLimit.retryAfter || resetInSeconds).toString(),
          },
        }
      )
    }

    const formData = await request.formData()
    const fileValue = formData.get('file')

    if (!(fileValue instanceof File)) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 })
    }

    const businessId = getStringFormValue(formData, 'businessId')
    const purposeValue = getStringFormValue(formData, 'purpose') || 'profile'
    const purpose = purposeValue as ImageUploadPurpose
    const isPersonalPurpose = PERSONAL_PURPOSES.has(purpose)
    const isBusinessPurpose = BUSINESS_PURPOSES.has(purpose)

    if (!isPersonalPurpose && !isBusinessPurpose) {
      return NextResponse.json({ success: false, error: 'Invalid upload purpose' }, { status: 400 })
    }

    if (isBusinessPurpose && (!businessId || !BUSINESS_ID_PATTERN.test(businessId))) {
      return NextResponse.json(
        { success: false, error: 'A valid business context is required for this upload' },
        { status: 400 }
      )
    }

    if (isPersonalPurpose && businessId) {
      return NextResponse.json(
        { success: false, error: 'Personal uploads cannot target a business folder' },
        { status: 400 }
      )
    }

    let folder = `onprez/users/${user.id}/${purpose}`

    if (isBusinessPurpose && businessId) {
      // Resolve authorization before checking storage so an upload cannot reveal whether
      // another tenant already owns a particular image.
      const isPlatformAdmin = user.role === 'ADMIN' || user.role === 'SUPERADMIN'
      if (!isPlatformAdmin) {
        await requireBusinessRole(user.id, businessId, ['ADMIN', 'MANAGER'])
      }

      folder = `onprez/businesses/${businessId}/${purpose}`
    }

    const { buffer: sourceBuffer, fingerprint } = await fingerprintImageUpload(fileValue)
    const publicId = `${folder}/${fingerprint}`
    const existingImage = await findStoredImage(publicId)

    if (existingImage) {
      logger.info('upload.image.reused', {
        userId: user.id,
        businessId,
        purpose,
        publicId,
      })
      return imageResponse(existingImage, true)
    }

    const sanitizedImage = await sanitizeImageUpload(fileValue, purpose, sourceBuffer)

    try {
      const result = await uploadToCloudinary(
        sanitizedImage.buffer,
        folder,
        sanitizedImage.mimeType,
        fingerprint
      )

      logger.info('upload.image.succeeded', {
        userId: user.id,
        businessId,
        purpose,
        mimeType: sanitizedImage.mimeType,
        bytes: result.bytes,
        publicId: result.public_id,
      })

      return imageResponse(toStoredImage(result), false)
    } catch (uploadError) {
      // A concurrent request may have stored the same content after our first lookup.
      const racedImage = await findStoredImage(publicId)
      if (racedImage) {
        logger.info('upload.image.reused_after_race', {
          userId: user.id,
          businessId,
          purpose,
          publicId,
        })
        return imageResponse(racedImage, true)
      }

      throw uploadError
    }
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    if (error instanceof ImageUploadValidationError) {
      logger.warn('upload.image.rejected', { reason: error.message })
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }

    logApiError('upload-image-api', error, { area: 'upload' })
    return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 })
  }
}

export function POST(request: NextRequest) {
  return withRequestLogging(request, () => handlePost(request))
}
