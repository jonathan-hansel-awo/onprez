// jest.env.ts
import { config } from 'dotenv'

config({ path: '.env.local' })

// Set test environment variables with fallbacks
process.env.DATABASE_URL ??= 'postgresql://ci:ci@localhost:5432/onprez'
process.env.DIRECT_URL ??= 'postgresql://ci:ci@localhost:5432/onprez'
process.env.APP_URL ??= 'http://localhost:3000'
process.env.NEXT_PUBLIC_APP_URL ??= 'http://localhost:3000'
process.env.RESEND_API_KEY ??= 're_ci_placeholder'
process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ??= 'ci-placeholder'
process.env.CLOUDINARY_API_KEY ??= 'ci-placeholder'
process.env.CLOUDINARY_API_SECRET ??= 'ci-placeholder'
process.env.JWT_SECRET ??= 'ci-only-jwt-secret-at-least-32-characters'
