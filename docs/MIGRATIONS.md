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

### Preview and Production Deployment

Never place production database credentials in a local `.env` file to deploy a migration. Database
deployment is controlled by `.github/workflows/migrate.yml` and is separate from application builds.

1. Merge the reviewed schema and migration files into `main`.
2. Open **GitHub → Actions → Deploy database migrations → Run workflow**.
3. Select `preview` to deploy only to the preview database.
4. Select `production` to deploy the selected `main` revision to preview first. The production job
   starts only after preview succeeds and the protected `production` environment is approved.
5. Confirm both the deployment and migration-status steps succeeded before deploying application
   code that requires the new schema.

The workflow is deliberately manual. Pull-request CI and `npm run build` validate code and schema,
but neither command applies migrations.

### Application Deployment Order

When application code depends on a new schema, use two releases so an automatic Vercel deployment
cannot race the database migration:

1. Merge a backward-compatible, additive migration into `main` without code that requires it.
2. Run the production migration workflow and verify its status.
3. Merge and deploy the application code that uses the new schema.

For renames, removals, and constraint changes, use expand-and-contract: add the replacement schema,
deploy code that supports both versions, backfill and verify data, then remove the old schema in a
later release. Never combine a breaking migration with code that assumes the migration has already
finished.

### One-time GitHub Environment Setup

Create two GitHub environments named exactly `preview` and `production`. Add these environment
secrets to each one using the matching Neon branch credentials:

- `DATABASE_URL` — pooled runtime connection URL.
- `DIRECT_URL` — direct connection URL used by Prisma Migrate.

Protect the `production` environment with required approval and restrict it to the `main` branch.
Do not create repository-wide production database secrets when environment-scoped secrets suffice.

## Important Commands

### Development

- `npm run db:migrate -- --name [name]` - Create and apply new migration
- `npm run db:migrate` - Apply pending migrations
- `npm run db:push` - Push schema without migration (dev only)
- `npm run db:studio` - Open Prisma Studio
- `npm run db:generate` - Regenerate Prisma Client

### Production

- `npm run db:migrate:deploy` - Deploy migrations (production)
- `npm run db:validate` - Validate the Prisma schema without changing a database
- `npm run db:migrate:status` - Verify migration history and pending migrations
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

## Rollback and Recovery Strategy

Prisma does not automatically roll back a production migration. Never run `migrate reset`, delete
migration records, or edit an already successful migration during an incident.

### If a migration has not started

Stop the release, correct the migration on a development branch, test it against preview, and submit
a new pull request.

### If a migration failed

1. Stop the application release and preserve the workflow logs.
2. Record the failed migration name and inspect its `_prisma_migrations.logs` entry.
3. Determine which SQL statements committed and whether data was changed.
4. Restore/revert any partial SQL safely, then mark the failed migration rolled back:

```bash
npx prisma migrate resolve --rolled-back MIGRATION_NAME
```

5. Correct the migration, test it on an isolated Neon branch or restored preview database, and run
   the controlled deployment again.

If the migration was completed manually instead, only an authorised operator may reconcile it with
`prisma migrate resolve --applied MIGRATION_NAME` after confirming the database exactly matches the
migration SQL.

### If a migration succeeded but must be reversed

Create and review a new forward migration that reverses the schema change. Restore from a verified
Neon backup or point-in-time recovery only when a forward repair cannot safely preserve the data.
Application rollback and database rollback are separate decisions: old application code must remain
compatible with the migrated schema until recovery is complete.

For destructive or high-volume migrations, record the backup/restore point and rehearse the recovery
on a Neon branch before production approval.

## CI/CD Separation

- `.github/workflows/test.yml` runs quality checks and `npm run build`; it never receives production
  database credentials and never runs a migration.
- `.github/workflows/migrate.yml` is manually triggered, serialised, and uses environment-scoped
  credentials.
- A production run applies the same selected revision to preview first and depends on its success.
- The `production` GitHub environment supplies the final human approval gate.

## Troubleshooting

### "Migration already applied"

- Migration was already run, safe to ignore
- Check `_prisma_migrations` table

### "Migration failed"

- Review error message
- Inspect the failed row's `logs` value in `_prisma_migrations`
- Check migration SQL syntax
- Verify database permissions
- Check for data conflicts
- Follow the failed-migration recovery procedure above; do not repeatedly rerun it blindly

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
