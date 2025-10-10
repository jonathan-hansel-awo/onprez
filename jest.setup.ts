// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock environment variables for testing
// Use Object.defineProperty to override read-only properties
Object.defineProperty(process.env, 'NODE_ENV', {
  value: 'test',
  writable: true,
})

Object.defineProperty(process.env, 'NEXT_PUBLIC_APP_URL', {
  value: 'http://localhost:3000',
  writable: true,
})

Object.defineProperty(process.env, 'NEXT_PUBLIC_APP_NAME', {
  value: 'OnPrez',
  writable: true,
})

Object.defineProperty(process.env, 'NEXT_PUBLIC_ENABLE_ANALYTICS', {
  value: 'false',
  writable: true,
})

// Mock database and auth variables
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
process.env.DIRECT_URL = 'postgresql://test:test@localhost:5432/test'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
