/**
 * Optimize Cloudinary image URLs for better performance
 */
export function optimizeCloudinaryUrl(
  url: string,
  options: {
    width?: number
    height?: number
    quality?: number | 'auto'
    format?: 'auto' | 'webp' | 'avif'
    crop?: 'fill' | 'fit' | 'scale' | 'crop'
  } = {}
): string {
  if (!url || !url.includes('cloudinary.com')) {
    return url
  }

  const { width, height, quality = 'auto', format = 'auto', crop = 'fill' } = options

  // Build transformation string
  const transformations: string[] = []

  if (width) transformations.push(`w_${width}`)
  if (height) transformations.push(`h_${height}`)
  if (quality) transformations.push(`q_${quality}`)
  if (format) transformations.push(`f_${format}`)
  if (crop) transformations.push(`c_${crop}`)

  const transformString = transformations.join(',')

  // Insert transformations into URL
  // Example: https://res.cloudinary.com/xxx/image/upload/v123/image.jpg
  // Becomes: https://res.cloudinary.com/xxx/image/upload/w_800,q_auto,f_auto/v123/image.jpg
  return url.replace('/upload/', `/upload/${transformString}/`)
}

/**
 * Get responsive image srcset for Cloudinary
 */
export function getResponsiveSrcSet(url: string, widths: number[] = [640, 828, 1200, 1920]) {
  return widths
    .map(width => {
      const optimizedUrl = optimizeCloudinaryUrl(url, { width, quality: 'auto', format: 'auto' })
      return `${optimizedUrl} ${width}w`
    })
    .join(', ')
}

/**
 * Preload critical images
 */
export function preloadImage(url: string, as: 'image' = 'image') {
  if (typeof document === 'undefined') return

  const link = document.createElement('link')
  link.rel = 'preload'
  link.as = as
  link.href = url
  document.head.appendChild(link)
}
