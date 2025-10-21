# Database Setup Guide

## Neon PostgreSQL Configuration

### Branches

We use Neon's branch feature for database environments:

- **main** - Production database (live app)
- **preview** - Staging/development database (safe testing)

### Connection Strings

Neon provides two types of connections:

1. **Pooled Connection** (`DATABASE_URL`)
   - Uses PgBouncer for connection pooling
   - Use for all application queries
   - Better performance, handles many connections
   - Port: 5432 (appears as standard PostgreSQL)

2. **Direct Connection** (`DIRECT_URL`)
   - Direct database connection
   - Use ONLY for migrations
   - Port: 5432
   - Required for DDL operations (CREATE, ALTER, DROP)

### Environment Setup

1. Copy `.env.example` to `.env.local`
2. Get connection strings from Neon Console
3. Set `DATABASE_ENV=preview` for development
4. Set `DATABASE_ENV=production` for production deployments

### Switching Between Environments

```bash
# Development (use preview branch)
DATABASE_ENV="preview"

# Production (use main branch)
DATABASE_ENV="production"
```

### Vercel Deployment

In Vercel, set these environment variables:

- `DATABASE_URL` → Main branch pooled connection
- `DIRECT_URL` → Main branch direct connection
- `DATABASE_ENV` → `"production"`

For preview deployments, Vercel can automatically use preview branch.

## Security Notes

- ✅ Connection strings include passwords - keep them secret!
- ✅ Never commit `.env.local` to git
- ✅ Use preview branch for all development
- ✅ Only deploy to production after testing on preview
- ✅ Neon connections use SSL by default (secure)

## Troubleshooting

### Connection Timeout

- Check if IP is allowed (Neon allows all by default)
- Verify SSL mode is set to `require`

### "Too Many Connections"

- You're using direct connection instead of pooled
- Switch to `DATABASE_URL` (pooled) for app queries

### Migration Fails

- Use `DIRECT_URL` for migrations
- Pooled connections don't support some migration operations.

## Prisma Configuration

### Connection Management

We use Prisma with Neon's serverless adapter for optimal performance:

- **Development:** Standard Prisma Client with connection reuse
- **Production:** Neon serverless adapter with connection pooling

### Useful Commands

```bash
# Generate Prisma Client (after schema changes)
npm run db:generate

# Push schema changes (development only)
npm run db:push

# Create and run migrations
npm run db:migrate

# Open Prisma Studio (visual editor)
npm run db:studio

# Test database connection
npm run db:test
```

### Schema Location

All database models are defined in `prisma/schema.prisma`

### Accessing the Database

```typescript
import { prisma } from '@/lib/prisma'

// Use prisma client
const users = await prisma.user.findMany()
```

### Environment Switching

The database automatically connects to the right environment based on `DATABASE_ENV`:

- `DATABASE_ENV=preview` → Uses `PREVIEW_DATABASE_URL`
- `DATABASE_ENV=production` → Uses `DATABASE_URL`

## Database Schema

### User & Authentication Tables

- **users** - User accounts with security fields
- **sessions** - Active user sessions with device tracking
- **auth_attempts** - Login attempt history for security monitoring
- **password_reset_tokens** - Time-limited password reset tokens
- **email_verification_tokens** - Email verification tokens
- **mfa_secrets** - Multi-factor authentication TOTP secrets
- **mfa_backup_codes** - Backup codes for MFA recovery
- **security_logs** - Audit trail of security events
- **rate_limits** - Rate limiting data

### Business Tables (Placeholder)

- **businesses** - Business profiles (will be expanded in Milestone 2.4)

### Schema Features

✅ **Security First:**

- Account locking after failed attempts
- Session management with device tracking
- MFA support (TOTP + backup codes)
- Comprehensive security logging
- Rate limiting built-in

✅ **Data Integrity:**

- Foreign key constraints
- Cascade deletes where appropriate
- Unique constraints on critical fields
- Indexed fields for performance

✅ **Privacy:**

- Passwords are never stored (only hashes)
- Sensitive data can be encrypted
- Audit trail for compliance.

## Business & Service Tables

### Business Management

- **businesses** - Business profiles with complete information
  - Basic info (name, slug, category, description)
    - Contact information (email, phone, address, location)
      - Media (logo, cover image)
        - Social links (Instagram, Facebook, etc.)
          - Settings (booking rules, notifications, display options)
            - Branding (colors, fonts)
              - SEO metadata
                - Status flags (published, premium, active)

                - **business_hours** - Operating hours by day of week
                  - Day-specific hours (open/close times)
                    - Closed days support
                      - Special notes

                      ### Service & Booking Tables (Placeholders)

                      These will be expanded in later milestones:
                      - **services** - Bookable services offered by businesses
                      - **appointments** - Customer bookings
                      - **customers** - Customer database per business

                      ### Business Features

                      ✅ **Multi-tenancy:**
                      - Each business isolated by businessId
                      - Slug-based routing (onprez.com/[slug])
                      - User can own multiple businesses

                      ✅ **Flexible Configuration:**
                      - JSONB fields for settings and branding
                      - Business category enum
                      - Timezone support
                      - Location data (lat/lng)

                      ✅ **SEO Optimized:**
                      - Custom meta titles and descriptions
                      - Keywords array
                      - Social sharing ready

## Service Management Tables

### Services

- **services** - Bookable services offered by businesses
  - Basic info (name, description, tagline)
  - Flexible pricing (fixed, range, starting at, free)
  - Duration and buffer time configuration
  - Service category assignment
  - Media (single image + gallery)
  - Booking settings (approval, deposit)
  - Display options (featured, active, ordering)
  - SEO metadata
  - Preparation and aftercare notes

- **service_categories** - Custom service categories per business
  - Category name and description
  - Display order
  - Color coding for UI
  - Icon/emoji support

### Service Features

✅ **Flexible Pricing:**

- Fixed price: $50
- Price range: $50-$80
- Starting at: From $50
- Free services

✅ **Time Management:**

- Service duration (5 min to 8 hours)
- Buffer time between appointments
- Per-service advance booking limits

✅ **Organization:**

- Custom categories per business
- Featured services
- Drag-and-drop ordering
- Active/inactive toggle

✅ **Media:**

- Featured image
- Gallery support
- Image optimization ready

### Price Type Enum

- `FIXED` - Exact price
- `RANGE` - Min to max range
- `STARTING_AT` - Base price (can go up)
- `FREE` - No charge

## Appointment & Booking Tables

### Appointments

- **appointments** - Customer bookings with complete tracking
  - Time scheduling (start, end, duration, timezone)
  - Status workflow (pending → confirmed → completed)
  - Confirmation tracking (when, by whom)
  - Cancellation tracking (source, reason, timestamp)
  - Rescheduling support (linked appointments)
  - Customer information (name, email, phone)
  - Notes (customer and business private notes)
  - Payment tracking (deposit, total, status)
  - Reminder management (sent time, count)
  - Booking metadata (source, IP)

### Appointment Features

✅ **Status Workflow:**

- PENDING → Awaiting confirmation
- CONFIRMED → Business confirmed
- COMPLETED → Service finished
- CANCELLED → Cancelled by customer/business
- NO_SHOW → Customer didn't show
- RESCHEDULED → Moved to different time

✅ **Payment Tracking:**

- Deposit requirements
- Payment status (unpaid, partially paid, paid, refunded, failed)
- Amount tracking

✅ **Cancellation Management:**

- Track who cancelled (customer, business, system)
- Cancellation reason
- Timestamp tracking

✅ **Rescheduling:**

- Link original and new appointments
- Track reschedule history
- Reschedule reason

✅ **Customer Communication:**

- Customer notes (visible to business)
- Business notes (private)
- Reminder tracking

### Appointment Status Enum

- `PENDING` - Awaiting confirmation
- `CONFIRMED` - Confirmed by business
- `COMPLETED` - Service completed
- `CANCELLED` - Cancelled
- `NO_SHOW` - Customer didn't show
- `RESCHEDULED` - Moved to different time

### Payment Status Enum

- `UNPAID` - Not paid
- `PARTIALLY_PAID` - Partial payment received
- `PAID` - Fully paid
- `REFUNDED` - Payment refunded
- `FAILED` - Payment failed

### Cancellation Source Enum

- `CUSTOMER` - Cancelled by customer
- `BUSINESS` - Cancelled by business
- `SYSTEM` - Cancelled by system (e.g., automated)
