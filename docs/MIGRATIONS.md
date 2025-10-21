# Database Migrations Guide

## Overview

OnPrez uses Prisma Migrate for production-safe database changes. All schema changes go through migrations.

## Migration Workflow

### Development (Preview Branch)

1. **Make schema changes** in `prisma/schema.prisma`

2. **Create migration:**

```bash
   npm run db:migrate -- --name description_of_change
```

Example:

```bash
   npm run db:migrate -- --name add_customer_birthday
```

3. **Review the generated SQL** in `prisma/migrations/[timestamp]_[name]/migration.sql`

4. **Test locally** to ensure everything works

5. **Commit migration files:**

```bash
   git add prisma/migrations
   git add prisma/schema.prisma
   git commit -m "feat: add migration for customer birthday field"
```

### Production Deployment (Main Branch)

1. **Update environment to point to main branch:**

```bash
   DATABASE_URL="[main-branch-pooled-url]"
   DIRECT_URL="[main-branch-direct-url]"
   DATABASE_ENV="production"
```

2. **Deploy migrations:**

```bash
   npm run db:migrate:deploy
```

3. **Verify deployment:**

```bash
   npm run db:test
```

4. **Switch back to preview:**

```bash
   DATABASE_URL="[preview-branch-pooled-url]"
   DIRECT_URL="[preview-branch-direct-url]"
   DATABASE_ENV="preview"
```

## Important Commands

### Development

- `npm run db:migrate -- --name [name]` - Create and apply new migration
- `npm run db:migrate` - Apply pending migrations
- `npm run db:push` - Push schema without migration (dev only)
- `npm run db:studio` - Open Prisma Studio
- `npm run db:generate` - Regenerate Prisma Client

### Production

- `npm run db:migrate:deploy` - Deploy migrations (production)
- `npm run db:migrate -- --create-only --name [name]` - Create migration without applying

### Utilities

- `npm run db:reset` - Reset database and reapply all migrations (dev only)

## Migration Best Practices

### ✅ DO

- Create migrations for all schema changes
- Use descriptive migration names
- Review generated SQL before committing
- Test migrations on preview branch first
- Commit migration files with schema changes
- Keep migrations small and focused
- Add data migrations when needed

### ❌ DON'T

- Use `db:push` in production
- Edit existing migration files (create new ones)
- Deploy untested migrations
- Skip migration review
- Delete migration files
- Make breaking changes without data migration

## Migration Naming Convention

Use clear, descriptive names:

```bash
# Good names
npm run db:migrate -- --name init
npm run db:migrate -- --name add_customer_preferences
npm run db:migrate -- --name add_service_categories
npm run db:migrate -- --name update_appointment_status_enum

# Bad names
npm run db:migrate -- --name update
npm run db:migrate -- --name fix
npm run db:migrate -- --name changes
```

## Common Migration Patterns

### Adding a New Field

```bash
# 1. Add field to schema.prisma
model Customer {
  // ... existing fields
  birthday DateTime?
}

# 2. Create migration
npm run db:migrate -- --name add_customer_birthday

# 3. Test
npm run db:test
```

### Adding a New Table

```bash
# 1. Add model to schema.prisma
model Notification {
  id String @id @default(cuid())
  // ... fields
}

# 2. Create migration
npm run db:migrate -- --name add_notifications_table

# 3. Test
npm run db:test
```

### Modifying Existing Data

When you need to migrate existing data:

```bash
# 1. Create empty migration
npm run db:migrate -- --create-only --name migrate_customer_data

# 2. Edit the migration.sql file to include data migration
# 3. Apply migration
npm run db:migrate
```

Example data migration:

```sql
-- Update existing customers
UPDATE customers
SET email_opt_in = true
WHERE email_opt_in IS NULL;
```

## Rollback Strategy

Prisma doesn't support automatic rollbacks, but you can:

1. **Create a reverse migration** with opposite changes
2. **Use database backups** (Neon provides automatic backups)
3. **Use Neon branching** to test risky migrations

## CI/CD Integration

For automated deployments:

```yaml
# Example GitHub Actions workflow
- name: Deploy migrations
  run: npm run db:migrate:deploy
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
    DIRECT_URL: ${{ secrets.DIRECT_URL }}
```

## Troubleshooting

### "Migration already applied"

- Migration was already run, safe to ignore
- Check `_prisma_migrations` table

### "Migration failed"

- Review error message
- Check migration SQL syntax
- Verify database permissions
- Check for data conflicts

### "Schema is out of sync"

- Run `npm run db:migrate` to apply pending migrations
- Or run `npm run db:push` in development

### "Connection timeout"

- Check database URL is correct
- Verify Neon compute is active
- Check network connectivity

## Migration History

View migration status:

```bash
# See which migrations have been applied
npx prisma migrate status
```

View migrations in database:

```sql
-- Query the migrations table
SELECT * FROM _prisma_migrations ORDER BY finished_at DESC;
```

## Emergency Procedures

### Need to Reset Everything (Development Only)

```bash
# ⚠️ WARNING: This deletes all data!
npm run db:reset
```

### Production Data Recovery

1. Use Neon's point-in-time recovery
2. Contact support if needed
3. Always test on preview branch first

## Resources

- [Prisma Migrate Docs](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Neon Branching](https://neon.tech/docs/guides/branching)
- OnPrez Migration History: `prisma/migrations/`
