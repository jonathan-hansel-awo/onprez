import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary'
import { getCurrentUser } from '@/lib/auth/get-user'
import { businessAuthErrorResponse } from '@/lib/auth/business-access'
import { requireBusinessRole } from '@/lib/auth/business-access'
import { checkRateLimit } from '@/lib/services/rate-limit'

const MAX_IMAGE_SIZE_BYTES = 4 * 1024 * 1024

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

const ALLOWED_PURPOSES = new Set([
  'profile',
  'business-logo',
  'business-cover',
  'service',
  'gallery',
])

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

function getStringFormValue(formData: FormData, key: string) {
  const value = formData.get(key)

  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function detectImageMimeType(buffer: Buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg'
  }

  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png'
  }

  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'image/webp'
  }

  if (
    buffer.length >= 6 &&
    (buffer.subarray(0, 6).toString('ascii') === 'GIF87a' ||
      buffer.subarray(0, 6).toString('ascii') === 'GIF89a')
  ) {
    return 'image/gif'
  }

  return null
}

function uploadToCloudinary(buffer: Buffer, folder: string, mimeType: string) {
  return new Promise<UploadApiResponse>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder,
          resource_type: 'image',
          allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
          overwrite: false,
          unique_filename: true,
          use_filename: false,
          context: {
            source: 'onprez',
            mimeType,
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

export async function POST(request: NextRequest) {
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

    if (fileValue.size <= 0) {
      return NextResponse.json({ success: false, error: 'File is empty' }, { status: 400 })
    }

    if (fileValue.size > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, error: 'File too large. Maximum size is 4MB.' },
        { status: 400 }
      )
    }

    if (!ALLOWED_MIME_TYPES.has(fileValue.type)) {
      return NextResponse.json(
        { success: false, error: 'Only JPEG, PNG, WEBP, and GIF images are allowed' },
        { status: 400 }
      )
    }

    const bytes = await fileValue.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const detectedMimeType = detectImageMimeType(buffer)

    if (!detectedMimeType || detectedMimeType !== fileValue.type) {
      return NextResponse.json(
        { success: false, error: 'File content does not match an allowed image type' },
        { status: 400 }
      )
    }

    const businessId = getStringFormValue(formData, 'businessId')
    const requestedPurpose = getStringFormValue(formData, 'purpose') || 'profile'
    const purpose = ALLOWED_PURPOSES.has(requestedPurpose) ? requestedPurpose : 'profile'

    let folder = `onprez/users/${user.id}/${purpose}`

    if (businessId) {
      await requireBusinessRole(user.id, businessId, ['ADMIN', 'MANAGER'])

      folder = `onprez/businesses/${businessId}/${purpose}`
    }

    const result = await uploadToCloudinary(buffer, folder, detectedMimeType)

    return NextResponse.json({
      success: true,
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
      },
    })
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Upload image error:', error)
    return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 })
  }
}
