# OnPrez Assisted Setup Admin

This document describes the platform-admin workspace for helping customers configure their OnPrez presence and services.

## Access model

The workspace is available at `/admin` only to authenticated users whose `users.role` value is `ADMIN` or `SUPERADMIN`.

Promote an account manually in Neon/Prisma Studio:

```sql
UPDATE users
SET role = 'ADMIN'
WHERE email = 'your-email@example.com';
```

Remove access:

```sql
UPDATE users
SET role = 'USER'
WHERE email = 'your-email@example.com';
```

Sign out and sign back in after changing the role so the latest database-backed session user is loaded.

## Capabilities

- Search businesses by business name, handle, or owner email.
- Review setup and publication state.
- Update business profile and contact content.
- Open the complete presence editor for a selected business.
- Save draft presence sections and publish or unpublish on the business's behalf.
- Create, edit, activate, feature, and delete services.
- Preview the public presence page.

## Security boundaries

- Admin access is checked server-side for every page and API route.
- Platform admins are not inserted as business members and do not impersonate users.
- Every admin mutation writes a security-log entry containing the admin user, target business, action, request IP, and user agent.
- Service mutations verify that the target service belongs to the selected business.
- Services with appointment history cannot be deleted; they should be hidden instead.
- Draft saves do not silently replace published content. Publishing is an explicit action.
