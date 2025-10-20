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
