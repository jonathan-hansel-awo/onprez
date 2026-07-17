/** @jest-environment node */

import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'

import { getCurrentUser } from '@/lib/auth/get-user'
import { businessAuthErrorResponse, requireBusinessRole } from '@/lib/auth/business-access'
import { checkRateLimit } from '@/lib/services/rate-limit'
import { POST } from '@/app/api/upload/image/route'

const mockUploadStreamEnd = jest.fn()
const mockUploadStream = jest.fn()

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload_stream: jest.fn((options, callback) => {
        mockUploadStream(options, callback)

        return {
          end: mockUploadStreamEnd,
        }
      }),
    },
  },
}))

jest.mock('@/lib/auth/get-user', () => ({
  getCurrentUser: jest.fn(),
}))

jest.mock('@/lib/services/rate-limit', () => ({
  checkRateLimit: jest.fn(),
}))

jest.mock('@/lib/auth/business-access', () => ({
  requireBusinessRole: jest.fn(),
  businessAuthErrorResponse: jest.fn(() => undefined),
  BusinessAuthError: class BusinessAuthError extends Error {
    constructor(
      message: string,
      public status: number,
      public code: string
    ) {
      super(message)
      this.name = 'BusinessAuthError'
    }
  },
}))

const mockedGetCurrentUser = getCurrentUser as jest.Mock
const mockedRequireBusinessRole = requireBusinessRole as jest.Mock
const mockedBusinessAuthErrorResponse = businessAuthErrorResponse as jest.Mock
const mockedCheckRateLimit = checkRateLimit as jest.Mock

let validPngBuffer: Buffer

function toArrayBuffer(buffer: Buffer): ArrayBuffer {
  const bytes = new Uint8Array(buffer.length)
  bytes.set(buffer)

  return bytes.buffer
}

function createPngFile(name = 'image.png') {
  return new File([toArrayBuffer(validPngBuffer)], name, { type: 'image/png' })
}

function createTextDisguisedAsPng() {
  return new File(['not really an image'], 'fake.png', { type: 'image/png' })
}

function businessUploadForm(file: File, purpose = 'gallery', businessId = 'business-1') {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('purpose', purpose)
  formData.append('businessId', businessId)

  return formData
}

function createSvgFile() {
  return new File(['<svg><script>alert(1)</script></svg>'], 'bad.svg', {
    type: 'image/svg+xml',
  })
}

function createRequestWithFormData(formData: FormData) {
  return new NextRequest('http://localhost:3000/api/upload/images', {
    method: 'POST',
    body: formData,
  })
}

const authUser = {
  id: 'user-1',
  email: 'user@example.com',
  role: 'USER',
  emailVerified: true,
  mfaEnabled: false,
}

describe('POST /api/upload/images', () => {
  beforeAll(async () => {
    validPngBuffer = await sharp({
      create: {
        width: 10,
        height: 10,
        channels: 4,
        background: { r: 10, g: 20, b: 30, alpha: 1 },
      },
    })
      .png()
      .toBuffer()
  })

  beforeEach(() => {
    jest.clearAllMocks()

    mockedGetCurrentUser.mockResolvedValue(authUser)
    mockedCheckRateLimit.mockResolvedValue({
      allowed: true,
      limit: 30,
      remaining: 29,
      resetAt: new Date(Date.now() + 60_000),
    })
    mockedRequireBusinessRole.mockResolvedValue({
      userId: 'user-1',
      businessId: 'business-1',
      role: 'OWNER',
      isOwner: true,
      business: {
        id: 'business-1',
      },
    })
    mockedBusinessAuthErrorResponse.mockReturnValue(undefined)

    mockUploadStream.mockImplementation((_options, callback) => {
      callback(null, {
        secure_url: 'https://res.cloudinary.com/demo/image/upload/test.png',
        public_id: 'onprez/users/user-1/profile/test',
        width: 100,
        height: 100,
        format: 'png',
        bytes: 1234,
      })
    })
  })

  it('requires authentication', async () => {
    mockedGetCurrentUser.mockResolvedValue(null)

    const formData = new FormData()
    formData.append('file', createPngFile())

    const response = await POST(createRequestWithFormData(formData))

    expect(response.status).toBe(401)
    expect(mockUploadStreamEnd).not.toHaveBeenCalled()
  })

  it('returns retry information before parsing a rate-limited upload', async () => {
    mockedCheckRateLimit.mockResolvedValue({
      allowed: false,
      limit: 30,
      remaining: 0,
      resetAt: new Date(Date.now() + 90_000),
      retryAfter: 90,
    })

    const formData = new FormData()
    formData.append('file', createPngFile())

    const response = await POST(createRequestWithFormData(formData))

    expect(response.status).toBe(429)
    expect(response.headers.get('Retry-After')).toBe('90')
    expect(mockedCheckRateLimit).toHaveBeenCalledWith('upload-image:user-1', 'upload:image')
    expect(mockUploadStreamEnd).not.toHaveBeenCalled()
  })

  it('rejects requests without a file', async () => {
    const formData = new FormData()

    const response = await POST(createRequestWithFormData(formData))

    expect(response.status).toBe(400)
    expect(mockUploadStreamEnd).not.toHaveBeenCalled()
  })

  it('rejects SVG files even though they are image MIME types', async () => {
    const formData = new FormData()
    formData.append('file', createSvgFile())

    const response = await POST(createRequestWithFormData(formData))

    expect(response.status).toBe(400)
    expect(mockUploadStreamEnd).not.toHaveBeenCalled()
  })

  it('rejects files whose content does not match the declared image type', async () => {
    const formData = new FormData()
    formData.append('file', createTextDisguisedAsPng())

    const response = await POST(createRequestWithFormData(formData))

    expect(response.status).toBe(400)
    expect(mockUploadStreamEnd).not.toHaveBeenCalled()
  })

  it('rejects malformed images even when their signature and MIME type look valid', async () => {
    const truncatedPng = new File(
      [new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])],
      'truncated.png',
      { type: 'image/png' }
    )
    const formData = new FormData()
    formData.append('file', truncatedPng)

    const response = await POST(createRequestWithFormData(formData))

    expect(response.status).toBe(400)
    expect(mockUploadStreamEnd).not.toHaveBeenCalled()
  })

  it('rejects mismatched file extensions and MIME types', async () => {
    const formData = new FormData()
    formData.append('file', createPngFile('image.jpg'))

    const response = await POST(createRequestWithFormData(formData))

    expect(response.status).toBe(400)
    expect(mockUploadStreamEnd).not.toHaveBeenCalled()
  })

  it('rejects files over the server-side size limit', async () => {
    const oversizedFile = new File([new Uint8Array(4 * 1024 * 1024 + 1)], 'large.png', {
      type: 'image/png',
    })
    const formData = new FormData()
    formData.append('file', oversizedFile)

    const response = await POST(createRequestWithFormData(formData))

    expect(response.status).toBe(400)
    expect(mockUploadStreamEnd).not.toHaveBeenCalled()
  })

  it('rejects images with suspiciously large dimensions', async () => {
    const wideImage = await sharp({
      create: {
        width: 8_193,
        height: 1,
        channels: 3,
        background: { r: 10, g: 20, b: 30 },
      },
    })
      .png()
      .toBuffer()

    const formData = new FormData()
    formData.append('file', new File([toArrayBuffer(wideImage)], 'wide.png', { type: 'image/png' }))

    const response = await POST(createRequestWithFormData(formData))

    expect(response.status).toBe(400)
    expect(mockUploadStreamEnd).not.toHaveBeenCalled()
  })

  it('uploads a valid personal image to the user-scoped folder', async () => {
    const formData = new FormData()
    formData.append('file', createPngFile())
    formData.append('purpose', 'profile')

    const response = await POST(createRequestWithFormData(formData))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)

    expect(mockedRequireBusinessRole).not.toHaveBeenCalled()

    expect(mockUploadStream).toHaveBeenCalledWith(
      expect.objectContaining({
        folder: 'onprez/users/user-1/profile',
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        backup: true,
        overwrite: false,
        unique_filename: true,
        use_filename: false,
      }),
      expect.any(Function)
    )

    expect(mockUploadStreamEnd).toHaveBeenCalled()
  })

  it('strips embedded image metadata before upload', async () => {
    const jpegWithMetadata = await sharp({
      create: {
        width: 10,
        height: 10,
        channels: 3,
        background: { r: 10, g: 20, b: 30 },
      },
    })
      .jpeg()
      .withMetadata({ orientation: 1 })
      .toBuffer()

    const formData = new FormData()
    formData.append(
      'file',
      new File([toArrayBuffer(jpegWithMetadata)], 'metadata.jpg', { type: 'image/jpeg' })
    )

    const response = await POST(createRequestWithFormData(formData))
    const sanitizedBuffer = mockUploadStreamEnd.mock.calls[0][0] as Buffer
    const metadata = await sharp(sanitizedBuffer).metadata()

    expect(response.status).toBe(200)
    expect(metadata.exif).toBeUndefined()
    expect(metadata.icc).toBeUndefined()
    expect(metadata.xmp).toBeUndefined()
  })

  it('requires an explicit business context for business assets', async () => {
    const formData = new FormData()
    formData.append('file', createPngFile())
    formData.append('purpose', 'gallery')

    const response = await POST(createRequestWithFormData(formData))

    expect(response.status).toBe(400)
    expect(mockedRequireBusinessRole).not.toHaveBeenCalled()
    expect(mockUploadStreamEnd).not.toHaveBeenCalled()
  })

  it('rejects unknown upload purposes instead of silently changing folders', async () => {
    const response = await POST(
      createRequestWithFormData(businessUploadForm(createPngFile(), 'unknown-purpose'))
    )

    expect(response.status).toBe(400)
    expect(mockedRequireBusinessRole).not.toHaveBeenCalled()
    expect(mockUploadStreamEnd).not.toHaveBeenCalled()
  })

  it('requires business role before uploading a business-scoped image', async () => {
    const formData = businessUploadForm(createPngFile(), 'business-logo')

    const response = await POST(createRequestWithFormData(formData))

    expect(response.status).toBe(200)

    expect(mockedRequireBusinessRole).toHaveBeenCalledWith('user-1', 'business-1', [
      'ADMIN',
      'MANAGER',
    ])

    expect(mockUploadStream).toHaveBeenCalledWith(
      expect.objectContaining({
        folder: 'onprez/businesses/business-1/business-logo',
      }),
      expect.any(Function)
    )
  })

  it('does not upload into a business folder when access is denied', async () => {
    const accessError = new Error('Forbidden business')
    mockedRequireBusinessRole.mockRejectedValue(accessError)
    mockedBusinessAuthErrorResponse.mockImplementation(error =>
      error === accessError
        ? NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
        : undefined
    )

    const response = await POST(
      createRequestWithFormData(businessUploadForm(createPngFile(), 'gallery', 'another-business'))
    )

    expect(response.status).toBe(403)
    expect(mockedRequireBusinessRole).toHaveBeenCalledWith('user-1', 'another-business', [
      'ADMIN',
      'MANAGER',
    ])
    expect(mockUploadStreamEnd).not.toHaveBeenCalled()
  })

  it('returns 500 if Cloudinary upload fails', async () => {
    mockUploadStream.mockImplementation((_options, callback) => {
      callback(new Error('Cloudinary failure'), null)
    })

    const formData = new FormData()
    formData.append('file', createPngFile())

    const response = await POST(createRequestWithFormData(formData))

    expect(response.status).toBe(500)
  })
})
