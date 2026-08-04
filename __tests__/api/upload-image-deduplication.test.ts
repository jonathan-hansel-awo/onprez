/** @jest-environment node */

import { v2 as cloudinary } from 'cloudinary'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/upload/image/route'
import { requireBusinessRole } from '@/lib/auth/business-access'
import { getCurrentUser } from '@/lib/auth/get-user'
import { checkRateLimit } from '@/lib/services/rate-limit'
import { fingerprintImageUpload, sanitizeImageUpload } from '@/lib/uploads/image-security'
import { recordBusinessMediaAsset } from '@/lib/usage/media-asset'

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    api: { resource: jest.fn() },
    uploader: { upload_stream: jest.fn() },
  },
}))

jest.mock('@/lib/auth/get-user', () => ({ getCurrentUser: jest.fn() }))
jest.mock('@/lib/auth/business-access', () => ({
  requireBusinessRole: jest.fn(),
  businessAuthErrorResponse: jest.fn(() => null),
}))
jest.mock('@/lib/services/rate-limit', () => ({ checkRateLimit: jest.fn() }))
jest.mock('@/lib/api/error-response', () => ({ logApiError: jest.fn() }))
jest.mock('@/lib/observability/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn() },
  withRequestLogging: jest.fn((_request: NextRequest, handler: () => unknown) => handler()),
}))
jest.mock('@/lib/uploads/image-security', () => ({
  ImageUploadValidationError: class ImageUploadValidationError extends Error {},
  fingerprintImageUpload: jest.fn(),
  sanitizeImageUpload: jest.fn(),
}))
jest.mock('@/lib/usage/media-asset', () => ({ recordBusinessMediaAsset: jest.fn() }))

const mockGetCurrentUser = jest.mocked(getCurrentUser)
const mockRequireBusinessRole = jest.mocked(requireBusinessRole)
const mockCheckRateLimit = jest.mocked(checkRateLimit)
const mockFingerprint = jest.mocked(fingerprintImageUpload)
const mockSanitize = jest.mocked(sanitizeImageUpload)
const mockRecordBusinessMediaAsset = jest.mocked(recordBusinessMediaAsset)
const mockResource = cloudinary.api.resource as jest.Mock
const mockUploadStream = cloudinary.uploader.upload_stream as jest.Mock

const storedImage = {
  secure_url: 'https://res.cloudinary.com/test/image/upload/existing.jpg',
  public_id: `onprez/businesses/business-1/service/${'a'.repeat(64)}`,
  width: 1_200,
  height: 800,
  format: 'jpg',
  bytes: 42_000,
}

function request() {
  const formData = new FormData()
  formData.append(
    'file',
    new File([new Uint8Array([0xff, 0xd8, 0xff])], 'service.jpg', {
      type: 'image/jpeg',
    })
  )
  formData.append('businessId', 'business-1')
  formData.append('purpose', 'service')

  return new NextRequest('https://onprez.test/api/upload/image', {
    method: 'POST',
    body: formData,
  })
}

describe('image upload duplicate prevention', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetCurrentUser.mockResolvedValue({ id: 'user-1', role: 'USER' } as never)
    mockRequireBusinessRole.mockResolvedValue({ businessId: 'business-1' } as never)
    mockCheckRateLimit.mockResolvedValue({
      allowed: true,
      limit: 20,
      remaining: 19,
      resetAt: new Date(Date.now() + 60_000),
    } as never)
    mockFingerprint.mockResolvedValue({
      buffer: Buffer.from([0xff, 0xd8, 0xff]),
      fingerprint: 'a'.repeat(64),
    })
  })

  it('reuses an existing scoped asset without compressing or uploading it again', async () => {
    mockResource.mockResolvedValue(storedImage)

    const response = await POST(request())
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data).toEqual(
      expect.objectContaining({ url: storedImage.secure_url, reused: true })
    )
    expect(json.message).toContain('reused it instead of uploading a duplicate')
    expect(mockRequireBusinessRole.mock.invocationCallOrder[0]).toBeLessThan(
      mockResource.mock.invocationCallOrder[0]
    )
    expect(mockResource).toHaveBeenCalledWith(storedImage.public_id, {
      resource_type: 'image',
    })
    expect(mockSanitize).not.toHaveBeenCalled()
    expect(mockUploadStream).not.toHaveBeenCalled()
    expect(mockRecordBusinessMediaAsset).toHaveBeenCalledWith({
      businessId: 'business-1',
      purpose: 'service',
      fingerprint: 'a'.repeat(64),
      image: storedImage,
    })
  })

  it('optimises and uploads a new image using its deterministic fingerprint', async () => {
    mockResource.mockRejectedValue({ http_code: 404 })
    mockSanitize.mockResolvedValue({
      buffer: Buffer.from('optimised'),
      mimeType: 'image/jpeg',
      extension: '.jpg',
      width: 1_200,
      height: 800,
      bytes: 9,
      policy: { maxWidth: 1_600, maxHeight: 1_600, quality: 82 },
    })
    mockUploadStream.mockImplementation((options, callback) => ({
      end: jest.fn(() => callback(null, storedImage)),
      options,
    }))

    const response = await POST(request())
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data.reused).toBe(false)
    expect(mockSanitize).toHaveBeenCalledWith(
      expect.any(File),
      'service',
      Buffer.from([0xff, 0xd8, 0xff])
    )
    expect(mockUploadStream).toHaveBeenCalledWith(
      expect.objectContaining({
        folder: 'onprez/businesses/business-1/service',
        public_id: 'a'.repeat(64),
        overwrite: false,
        unique_filename: false,
      }),
      expect.any(Function)
    )
    expect(mockRecordBusinessMediaAsset).toHaveBeenCalledWith({
      businessId: 'business-1',
      purpose: 'service',
      fingerprint: 'a'.repeat(64),
      image: storedImage,
    })
  })
})
