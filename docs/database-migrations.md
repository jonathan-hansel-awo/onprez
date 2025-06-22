# Database Migration Guide

## Development Workflow

1. Make changes to `prisma/schema.prisma`
2. Create migration: `npm run db:migrate`
3. Apply to other environments: `npm run db:push`

## Common Commands

- View database: `npm run db:studio`
- Generate types: `npm run db:generate`
- Seed database: `npm run db:seed`
- Reset database: `npx prisma migrate reset`

## Production Migrations

1. Test migration in development
2. Review generated SQL in `prisma/migrations`
3. Apply to production via Supabase dashboard
