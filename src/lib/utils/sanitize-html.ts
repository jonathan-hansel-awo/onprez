// Simple HTML sanitizer for user content
// This allows basic formatting tags but removes potentially harmful scripts

export function sanitizeHtml(html: string): string {
  // This is a basic sanitizer. For production, consider using a library like DOMPurify
  // For now, we'll do basic script tag removal

  let sanitized = html

  // Remove script tags
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')

  // Remove event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '')
  sanitized = sanitized.replace(/\son\w+\s*=\s*[^\s>]*/gi, '')

  // Remove javascript: URLs
  sanitized = sanitized.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, '')

  // Remove data: URLs (except for images)
  sanitized = sanitized.replace(/href\s*=\s*["']data:[^"']*["']/gi, '')

  return sanitized
}

// Validate that HTML only contains allowed tags
export function validateHtml(html: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check for script tags
  if (/<script/i.test(html)) {
    errors.push('Script tags are not allowed')
  }

  // Check for event handlers
  if (/\son\w+\s*=/i.test(html)) {
    errors.push('Event handlers are not allowed')
  }

  // Check for javascript: URLs
  if (/javascript:/i.test(html)) {
    errors.push('JavaScript URLs are not allowed')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
