# Environment Variables Guide

## Overview

OnPrez uses environment variables for configuration. This guide explains how to set them up and use them correctly.

## Quick Start

### 1. Copy the example file:

```bash
cp .env.example .env.local
```

### 2. Fill in the required values:

```bash
# Edit .env.local with your values
# Only NEXT_PUBLIC_APP_URL is required for basic development
```

### 3. Restart your dev server:

```bash
npm run dev
```

## File Structure

```
.env.example          # Template (committed to git)
.env.local           # Your local values (gitignored)
.env.development     # Development defaults (optional)
.env.production      # Production values (Vercel handles this)
.env.test            # Test environment (optional)
```

## Priority Order

Next.js loads env files in this order (later files override earlier):

1. `.env` - Default values
2. `.env.local` - Local overrides (gitignored)
3. `.env.development` or `.env.production` - Environment-specific
4. `.env.development.local` or `.env.production.local` - Local environment-specific

**Note:** `.env.local` is always loaded, except during tests.

## Using Environment Variables

### ✅ Correct Way (Type-Safe):

```typescript
import { env } from '@/lib/env'

// In server-side code (API routes, server components)
const dbUrl = env.DATABASE_URL
const apiKey = env.RESEND_API_KEY

// In client-side code (only NEXT_PUBLIC_* vars)
const appUrl = env.NEXT_PUBLIC_APP_URL
const stripeKey = env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
```

### ❌ Wrong Way (Not Type-Safe):

```typescript
// DON'T DO THIS - No validation, no type safety
const dbUrl = process.env.DATABASE_URL
```

## Variable Types

### App Configuration

```bash
NODE_ENV=development                    # development | production | test
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=OnPrez
```

### Database (Milestone 2)

```bash
DATABASE_URL=postgresql://...           # For Prisma with connection pooling
DIRECT_URL=postgresql://...             # For migrations (direct connection)
```

### Authentication (Milestone 3)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...       # Server-side only!
```

### Email Service

```bash
RESEND_API_KEY=re_...                   # From resend.com
```

### Payment Processing

```bash
STRIPE_SECRET_KEY=sk_test_...          # Server-side only!
STRIPE_WEBHOOK_SECRET=whsec_...        # For webhook verification
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Feature Flags

```bash
NEXT_PUBLIC_ENABLE_ANALYTICS=true      # Enable/disable features
```

## Public vs Private Variables

### NEXT*PUBLIC*\* Variables

- **Exposed to browser** - Anyone can see these!
- Use for: App URLs, public API keys, feature flags
- Example: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

### Private Variables

- **Server-side only** - Never sent to browser
- Use for: API secrets, database URLs, private keys
- Example: `STRIPE_SECRET_KEY`, `DATABASE_URL`

## Helper Functions

Use the helper functions for common tasks:

```typescript
import { getBaseUrl, hasDatabaseConfigured, hasSupabaseConfigured, devLog } from '@/lib/env-helper'

// Get base URL
const url = getBaseUrl() // 'http://localhost:3000'

// Check if services are configured
if (hasDatabaseConfigured()) {
  // Use database
}

// Development-only logging
devLog('Debug info', { data: 'value' })
```

## Validation

All environment variables are validated at startup using Zod:

- ✅ Required variables must be present
- ✅ URLs must be valid URLs
- ✅ Enums must be specific values
- ✅ Types are enforced (string, boolean, etc.)

If validation fails, the app won't start and will show clear error messages.

## Best Practices

### ✅ DO:

- Use `env` from `@/lib/env` for type safety
- Add new variables to `src/lib/env.ts` schema
- Document variables in `.env.example`
- Keep secrets in `.env.local` (gitignored)
- Use `NEXT_PUBLIC_` prefix for client-accessible vars

### ❌ DON'T:

- Commit `.env.local` to git
- Use `process.env` directly
- Put secrets in `NEXT_PUBLIC_` variables
- Hardcode values that should be configurable
- Store API keys in source code

## Vercel Deployment

Vercel handles environment variables through their dashboard:

1. Go to: Project Settings → Environment Variables
2. Add variables for Production, Preview, Development
3. Deploy - Vercel injects them automatically

**Note:** You don't need to create `.env` files in Vercel!

## Troubleshooting

### "Invalid environment variables" error

- Check `.env.local` exists
- Verify all required variables are set
- Check for typos in variable names
- Ensure URLs are valid (include http:// or https://)

### Variable not available in browser

- Did you prefix it with `NEXT_PUBLIC_`?
- Did you restart the dev server?
- Check browser console for the value

### Variable showing as undefined

- Is it in the Zod schema in `src/lib/env.ts`?
- Is it marked as optional? Use `.optional()` in schema
- Did you import from `@/lib/env` not `process.env`?

## Security Checklist

- [ ] `.env.local` is in `.gitignore`
- [ ] No secrets in `NEXT_PUBLIC_*` variables
- [ ] Production secrets are in Vercel dashboard
- [ ] API keys are rotated regularly
- [ ] Database URL uses connection pooling
- [ ] Webhook secrets are configured

## Adding New Variables

1. **Add to Zod schema** (`src/lib/env.ts`):

```typescript
MY_NEW_VAR: z.string().optional(),
```

2. **Add to `.env.example`**:

```bash
MY_NEW_VAR=example_value
```

3. **Add to your `.env.local`**:

```bash
MY_NEW_VAR=actual_value
```

4. **Use it**:

```typescript
import { env } from '@/lib/env'
const myVar = env.MY_NEW_VAR
```

5. **Update Vercel** (for production):
   Add the variable in Vercel dashboard.

---

## Next Steps

- **Milestone 2:** Configure database environment variables
- **Milestone 3:** Configure Supabase Auth variables
- **Later:** Add Stripe, Resend, and other service variables

For more help, check the [Next.js Environment Variables docs](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables).
