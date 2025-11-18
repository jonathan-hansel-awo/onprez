/**
 * Generate SEO-friendly alt text for images
 */
export function generateAltText(filename: string, context?: string): string {
  // Remove file extension and clean up
  const cleaned = filename
    .replace(/\.[^/.]+$/, '') // Remove extension
    .replace(/[-_]/g, ' ') // Replace dashes/underscores with spaces
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim()

  // Capitalize first letter
  const formatted = cleaned.charAt(0).toUpperCase() + cleaned.slice(1)

  // Add context if provided
  return context ? `${formatted} - ${context}` : formatted
}

/**
 * Validate if alt text is SEO-friendly
 */
export function validateAltText(altText: string): {
  isValid: boolean
  issues: string[]
} {
  const issues: string[] = []

  if (!altText || altText.trim().length === 0) {
    issues.push('Alt text is missing')
  }

  if (altText.length < 5) {
    issues.push('Alt text is too short (minimum 5 characters)')
  }

  if (altText.length > 125) {
    issues.push('Alt text is too long (maximum 125 characters)')
  }

  if (/^image\d*$/i.test(altText.trim())) {
    issues.push('Alt text should be descriptive, not generic (e.g., "image1")')
  }

  return {
    isValid: issues.length === 0,
    issues,
  }
}

/**
 * Generate meta description from content
 */
export function generateMetaDescription(content: string, maxLength: number = 160): string {
  // Remove HTML tags
  const text = content.replace(/<[^>]*>/g, '')

  // Trim to max length
  if (text.length <= maxLength) {
    return text
  }

  // Cut at last complete word
  const trimmed = text.substring(0, maxLength)
  const lastSpace = trimmed.lastIndexOf(' ')

  return lastSpace > 0 ? trimmed.substring(0, lastSpace) + '...' : trimmed + '...'
}

/**
 * Generate keywords from content
 */
export function extractKeywords(content: string, count: number = 10): string[] {
  // Remove common words
  const stopWords = new Set([
    'the',
    'a',
    'an',
    'and',
    'or',
    'but',
    'in',
    'on',
    'at',
    'to',
    'for',
    'of',
    'with',
    'by',
    'from',
    'as',
    'is',
    'was',
    'are',
    'were',
    'been',
    'be',
    'have',
    'has',
    'had',
    'do',
    'does',
    'did',
    'will',
    'would',
    'could',
    'should',
  ])

  // Extract words
  const words = content
    .toLowerCase()
    .replace(/<[^>]*>/g, '') // Remove HTML
    .replace(/[^\w\s]/g, ' ') // Remove punctuation
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word))

  // Count frequency
  const frequency: Record<string, number> = {}
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1
  })

  // Sort by frequency and return top N
  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([word]) => word)
}
