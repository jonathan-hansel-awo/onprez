# Services API Documentation

## Endpoints

### List Services

`GET /api/services?businessId={id}`

- Returns all services for a business
- Includes categories and variants

### Create Service

`POST /api/services`

- Body: Service data
- Returns created service

### Get Service

`GET /api/services/[id]`

- Returns single service with full details

### Update Service

`PUT /api/services/[id]`

- Body: Service data to update
- Returns updated service

### Delete Service

`DELETE /api/services/[id]`

- Deletes service (cascade to variants)

### Toggle Active Status

`PATCH /api/services/[id]/toggle`

- Toggles active/inactive
- Returns updated service

### Reorder Services

`PUT /api/services/reorder`

- Body: `{ serviceIds: string[] }`
- Updates order field

### Duplicate Service

`POST /api/services/[id]/duplicate`

- Creates copy with "(Copy)" suffix
- Inactive by default
- Includes variants

### Bulk Update

`POST /api/services/bulk`

- Body: `{ serviceIds: string[], action: 'activate' | 'deactivate' | 'delete' | 'feature' | 'unfeature' }`
- Updates multiple services at once

### Service Statistics

`GET /api/services/stats?businessId={id}`

- Returns service analytics
- Most booked, revenue, counts

## Public Endpoints

### Get Public Services

`GET /api/public/businesses/[handle]/services?ids={csv}`

- Returns active services for public display
- Optional: filter by IDs
