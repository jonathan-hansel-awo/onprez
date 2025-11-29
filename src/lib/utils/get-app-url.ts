export function getAppUrl() {
  // Check if we're on Vercel
  if (process.env.VERCEL_ENV === 'production') {
    // Use your production domain
    return 'https://onprez.com'
  }

  if (process.env.VERCEL_URL) {
    // Preview deployments
    return `https://${process.env.VERCEL_URL}`
  }

  // Local development
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
}

// For client-side
export function getClientAppUrl() {
  if (typeof window !== 'undefined') {
    // Client-side: use window.location
    return window.location.origin
  }

  return getAppUrl()
}
