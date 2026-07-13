import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary'
import { getCurrentUser } from '@/lib/auth/get-user'
import { businessAuthErrorResponse } from '@/lib/auth/business-access'
import { requireBusinessRole } from '@/lib/auth/business-access'
import { checkRateLimit } from '@/lib/services/rate-limit'
import { ImageUploadValidationError, sanitizeImageUpload } from '@/lib/uploads/image-security'

const PERSONAL_PURPOSES = new Set(['profile'])
const BUSINESS_PURPOSES = new Set(['business-logo', 'business-cover', 'service', 'gallery'])
const BUSINESS_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

function getStringFormValue(formData: FormData, key: string) {
  const value = formData.get(key)

  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function uploadToCloudinary(buffer: Buffer, folder: string, mimeType: string) {
  return new Promise<UploadApiResponse>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder,
          resource_type: 'image',
          allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
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

    const businessId = getStringFormValue(formData, 'businessId')
    const purpose = getStringFormValue(formData, 'purpose') || 'profile'
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
      // Authorize the destination before performing expensive image decoding.
      await requireBusinessRole(user.id, businessId, ['ADMIN', 'MANAGER'])

      folder = `onprez/businesses/${businessId}/${purpose}`
    }

    const sanitizedImage = await sanitizeImageUpload(fileValue)
    const result = await uploadToCloudinary(sanitizedImage.buffer, folder, sanitizedImage.mimeType)

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

    if (error instanceof ImageUploadValidationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }

    console.error('Upload image error:', error)
    return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 })
  }
}
