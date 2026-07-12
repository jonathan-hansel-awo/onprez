/** @jest-environment node */

import { NextRequest } from 'next/server'

import { getCurrentUser } from '@/lib/auth/get-user'
import { requireBusinessRole } from '@/lib/auth/business-access'
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

function createPngFile(name = 'image.png') {
  const pngBytes = new Uint8Array([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
  ])

  return new File([pngBytes], name, { type: 'image/png' })
}

function createTextDisguisedAsPng() {
  return new File(['not really an image'], 'fake.png', { type: 'image/png' })
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
  beforeEach(() => {
    jest.clearAllMocks()

    mockedGetCurrentUser.mockResolvedValue(authUser)
    mockedRequireBusinessRole.mockResolvedValue({
      userId: 'user-1',
      businessId: 'business-1',
      role: 'OWNER',
      isOwner: true,
      business: {
        id: 'business-1',
      },
    })

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
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
        overwrite: false,
        unique_filename: true,
        use_filename: false,
      }),
      expect.any(Function)
    )

    expect(mockUploadStreamEnd).toHaveBeenCalled()
  })

  it('requires business role before uploading a business-scoped image', async () => {
    const formData = new FormData()
    formData.append('file', createPngFile())
    formData.append('businessId', 'business-1')
    formData.append('purpose', 'business-logo')

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
