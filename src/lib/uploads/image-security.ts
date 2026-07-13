import sharp from 'sharp'

export const MAX_IMAGE_SIZE_BYTES = 4 * 1024 * 1024
export const MAX_IMAGE_PIXELS = 25_000_000
export const MAX_IMAGE_DIMENSION = 8_192

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

function imageDecoder(buffer: Buffer) {
  return sharp(buffer, {
    failOn: 'warning',
    limitInputPixels: MAX_IMAGE_PIXELS,
    sequentialRead: true,
  })
}

export async function sanitizeImageUpload(file: File) {
  if (file.size <= 0) {
    throw new ImageUploadValidationError('File is empty')
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new ImageUploadValidationError('File too large. Maximum size is 4MB.')
  }

  const extension = getFileExtension(file.name)
  const supportedImage = SUPPORTED_IMAGES.find(image => image.extension === extension)

  if (!supportedImage) {
    throw new ImageUploadValidationError('Only JPG, JPEG, PNG, and WEBP files are allowed')
  }

  if (file.type !== supportedImage.mimeType) {
    throw new ImageUploadValidationError('File extension and declared image type do not match')
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const detectedMimeType = detectImageMimeType(buffer)

  if (detectedMimeType !== supportedImage.mimeType) {
    throw new ImageUploadValidationError('File content does not match its declared image type')
  }

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

    let sanitizer = imageDecoder(buffer).rotate()

    switch (supportedImage.format) {
      case 'jpeg':
        sanitizer = sanitizer.jpeg({ quality: 85, mozjpeg: true })
        break
      case 'png':
        sanitizer = sanitizer.png({ compressionLevel: 9 })
        break
      case 'webp':
        sanitizer = sanitizer.webp({ quality: 85 })
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
    }
  } catch (error) {
    if (error instanceof ImageUploadValidationError) {
      throw error
    }

    throw new ImageUploadValidationError('Image is malformed or could not be safely decoded')
  }
}
