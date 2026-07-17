const { withSentryConfig } = require('@sentry/nextjs')

/** @type {import('next').NextConfig} */

const isDevelopment = process.env.NODE_ENV === 'development'
const sentryRelease = process.env.SENTRY_RELEASE || process.env.VERCEL_GIT_COMMIT_SHA
const sentryEnvironment =
  process.env.SENTRY_ENVIRONMENT || process.env.VERCEL_ENV || process.env.NODE_ENV

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "font-src 'self' data: https://fonts.gstatic.com",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "img-src 'self' blob: data: https://res.cloudinary.com https://i.pravatar.cc https://images.unsplash.com https://www.google-analytics.com",
  "media-src 'self' https://res.cloudinary.com",
  "object-src 'none'",
  `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ''} https://www.googletagmanager.com`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "connect-src 'self' https://api.cloudinary.com https://www.google-analytics.com https://*.google-analytics.com https://*.ingest.sentry.io https://*.ingest.us.sentry.io",
  ...(isDevelopment ? [] : ['upgrade-insecure-requests']),
].join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'browsing-topics=(), camera=(), geolocation=(), microphone=()',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains',
  },
]

const nextConfig = {
  env: {
    NEXT_PUBLIC_SENTRY_RELEASE: sentryRelease || 'development',
    NEXT_PUBLIC_SENTRY_ENVIRONMENT: sentryEnvironment,
  },

  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: '*.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  swMinify: true,
  compress: true,
}

module.exports = withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  telemetry: false,
  widenClientFileUpload: true,
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
  },
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
    deleteSourcemapsAfterUpload: true,
  },
  release: {
    name: sentryRelease,
    create: Boolean(process.env.SENTRY_AUTH_TOKEN && sentryRelease),
    finalize: Boolean(process.env.SENTRY_AUTH_TOKEN && sentryRelease),
  },
})
