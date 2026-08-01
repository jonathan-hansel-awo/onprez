import { createHash } from 'node:crypto'
import sharp from 'sharp'

export const MAX_IMAGE_SIZE_BYTES = 4 * 1024 * 1024
export const MAX_IMAGE_PIXELS = 25_000_000
export const MAX_IMAGE_DIMENSION = 8_192

export type ImageUploadPurpose =
  | 'profile'
  | 'business-logo'
  | 'business-cover'
  | 'service'
  | 'gallery'

export type ImageUploadPolicy = {
  maxWidth: number
  maxHeight: number
  quality: number
}

export const IMAGE_UPLOAD_POLICIES: Record<ImageUploadPurpose, ImageUploadPolicy> = {
  profile: { maxWidth: 1_024, maxHeight: 1_024, quality: 82 },
  'business-logo': { maxWidth: 1_200, maxHeight: 1_200, quality: 82 },
  'business-cover': { maxWidth: 1_920, maxHeight: 1_080, quality: 82 },
  service: { maxWidth: 1_600, maxHeight: 1_600, quality: 82 },
  gallery: { maxWidth: 1_600, maxHeight: 1_600, quality: 82 },
}

type SupportedImage = {
  extension: '.jpg' | '.jpeg' | '.png' | '.webp'
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp'
  format: 'jpeg' | 'png' | 'webp'
}

const SUPPORTED_IMAGES: SupportedImage[] = [
  { extension: '.jpg', mimeType: 'image/jpeg', format: 'jpeg' },
  { extension: '.jpeg', mimeType: 'image/jpeg', format: 'jpeg' },
  { extension: '.png', mimeType: 'image/png', format: 'png' },
  { extension: '.webp', mimeType: 'image/webp', format: 'webp' },
]

export class ImageUploadValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ImageUploadValidationError'
  }
}

function assertFileSize(file: File) {
  if (file.size <= 0) {
    throw new ImageUploadValidationError('File is empty')
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new ImageUploadValidationError('File too large. Maximum size is 4MB.')
  }
}

function getFileExtension(filename: string) {
  const lastDot = filename.lastIndexOf('.')

  return lastDot >= 0 ? filename.slice(lastDot).toLowerCase() : ''
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

  return null
}

function resolveSupportedImage(file: File, buffer: Buffer) {
  const extension = getFileExtension(file.name)
  const supportedImage = SUPPORTED_IMAGES.find(image => image.extension === extension)

  if (!supportedImage) {
    throw new ImageUploadValidationError('Only JPG, JPEG, PNG, and WEBP files are allowed')
  }

  if (file.type !== supportedImage.mimeType) {
    throw new ImageUploadValidationError('File extension and declared image type do not match')
  }

  if (detectImageMimeType(buffer) !== supportedImage.mimeType) {
    throw new ImageUploadValidationError('File content does not match its declared image type')
  }

  return supportedImage
}

export async function fingerprintImageUpload(file: File) {
  assertFileSize(file)
  const buffer = Buffer.from(await file.arrayBuffer())
  resolveSupportedImage(file, buffer)

  return {
    buffer,
    fingerprint: createHash('sha256').update(buffer).digest('hex'),
  }
}

function imageDecoder(buffer: Buffer) {
  return sharp(buffer, {
    failOn: 'warning',
    limitInputPixels: MAX_IMAGE_PIXELS,
    sequentialRead: true,
  })
}

export async function sanitizeImageUpload(
  file: File,
  purpose: ImageUploadPurpose = 'profile',
  sourceBuffer?: Buffer
) {
  assertFileSize(file)
  const buffer = sourceBuffer ?? Buffer.from(await file.arrayBuffer())
  const supportedImage = resolveSupportedImage(file, buffer)

  try {
    const metadata = await imageDecoder(buffer).metadata()
    const pages = metadata.pages || 1

    if (
      metadata.format !== supportedImage.format ||
      !metadata.width ||
      !metadata.height ||
      pages !== 1
    ) {
      throw new ImageUploadValidationError('Image is malformed or uses an unsupported format')
    }

    if (
      metadata.width > MAX_IMAGE_DIMENSION ||
      metadata.height > MAX_IMAGE_DIMENSION ||
      metadata.width * metadata.height > MAX_IMAGE_PIXELS
    ) {
      throw new ImageUploadValidationError('Image dimensions are too large')
    }

    const policy = IMAGE_UPLOAD_POLICIES[purpose]
    let sanitizer = imageDecoder(buffer).rotate().resize({
      width: policy.maxWidth,
      height: policy.maxHeight,
      fit: 'inside',
      withoutEnlargement: true,
    })

    switch (supportedImage.format) {
      case 'jpeg':
        sanitizer = sanitizer.jpeg({ quality: policy.quality, mozjpeg: true })
        break
      case 'png':
        sanitizer = sanitizer.png({ compressionLevel: 9, quality: policy.quality })
        break
      case 'webp':
        sanitizer = sanitizer.webp({ quality: policy.quality })
        break
    }

    // Re-encoding discards EXIF/XMP/IPTC metadata and any trailing payload,
    // leaving only decoded pixels in a canonical supported format.
    const sanitized = await sanitizer.toBuffer({ resolveWithObject: true })

    if (sanitized.data.length > MAX_IMAGE_SIZE_BYTES) {
      throw new ImageUploadValidationError('Sanitized image exceeds the 4MB size limit')
    }

    return {
      buffer: sanitized.data,
      mimeType: supportedImage.mimeType,
      extension: supportedImage.extension,
      width: sanitized.info.width,
      height: sanitized.info.height,
      bytes: sanitized.data.length,
      policy,
    }
  } catch (error) {
    if (error instanceof ImageUploadValidationError) {
      throw error
    }

    throw new ImageUploadValidationError('Image is malformed or could not be safely decoded')
  }
}
