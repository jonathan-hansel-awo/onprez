/** @jest-environment node */

import { createHash } from 'node:crypto'
import sharp from 'sharp'
import {
  fingerprintImageUpload,
  IMAGE_UPLOAD_POLICIES,
  sanitizeImageUpload,
} from '@/lib/uploads/image-security'

function imageFile(buffer: Buffer, name = 'image.jpg', type = 'image/jpeg') {
  return new File([new Uint8Array(buffer)], name, { type })
}

describe('image upload optimisation', () => {
  it('creates a stable SHA-256 identity from the original bytes before optimisation', async () => {
    const source = await sharp({
      create: {
        width: 80,
        height: 60,
        channels: 3,
        background: '#335577',
      },
    })
      .jpeg()
      .toBuffer()
    const file = imageFile(source)

    const first = await fingerprintImageUpload(file)
    const second = await fingerprintImageUpload(file)

    expect(first.fingerprint).toBe(createHash('sha256').update(source).digest('hex'))
    expect(second.fingerprint).toBe(first.fingerprint)
    expect(first.buffer).toEqual(source)
  })

  it.each([
    ['profile', 1_024, 1_024],
    ['business-logo', 1_200, 1_200],
    ['business-cover', 1_920, 1_080],
    ['service', 1_600, 1_600],
    ['gallery', 1_600, 1_600],
  ] as const)('enforces the %s delivery policy', async (purpose, maxWidth, maxHeight) => {
    expect(IMAGE_UPLOAD_POLICIES[purpose]).toEqual(
      expect.objectContaining({ maxWidth, maxHeight, quality: 82 })
    )

    const source = await sharp({
      create: {
        width: 2_400,
        height: 1_800,
        channels: 3,
        background: '#557799',
      },
    })
      .jpeg({ quality: 95 })
      .toBuffer()

    const result = await sanitizeImageUpload(imageFile(source), purpose, source)

    expect(result.width).toBeLessThanOrEqual(maxWidth)
    expect(result.height).toBeLessThanOrEqual(maxHeight)
    expect(result.policy).toEqual(IMAGE_UPLOAD_POLICIES[purpose])
  })

  it('rejects a disguised non-image before a storage lookup can be useful', async () => {
    const file = imageFile(Buffer.from('not an image'), 'fake.jpg', 'image/jpeg')

    await expect(fingerprintImageUpload(file)).rejects.toThrow(
      'File content does not match its declared image type'
    )
  })
})
