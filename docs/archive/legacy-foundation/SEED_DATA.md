# Seed Data Documentation

> [!WARNING]
> **ARCHIVED — NOT CURRENT GUIDANCE.** Superseded on 3 August 2026 because the referenced `db:seed`
> script and fixture accounts are not part of the current repository. Start with
> [`CURRENT_STATE.md`](../../../CURRENT_STATE.md) and the active
> [`TESTING_STRATEGY.md`](../../testing/TESTING_STRATEGY.md). The content below is retained only as
> historical context and must never be applied to production.

## Overview

OnPrez includes comprehensive seed data for development and testing.

## Running Seed

```bash
# Run seed script
npm run db:seed

# Reset database and re-seed
npm run db:reset
```

## Test Accounts

### Users

| Email               | Password    | Businesses             |
| ------------------- | ----------- | ---------------------- |
| <demo@onprez.com>   | password123 | Demo Salon             |
| <sarah@example.com> | password123 | Sarah's Spa & Wellness |
| <mike@example.com>  | password123 | Mike Fitness Studio    |

## Test Businesses

### Demo Salon

- **Slug:** demo-salon
- **Category:** Hair Salon
- **Status:** Published
- **Services:** 4 (Haircut, Color, Treatment, Consultation)
- **URL:** onprez.com/demo-salon

### Sarah's Spa & Wellness

- **Slug:** sarahs-spa
- **Category:** Spa
- **Status:** Published (Premium)
- **Services:** 2 (Swedish Massage, Deep Tissue)
- **URL:** onprez.com/sarahs-spa

### Mike Fitness Studio

- **Slug:** mike-fitness
- **Category:** Fitness
- **Status:** Unpublished
- **Services:** 1 (Personal Training)
- **URL:** onprez.com/mike-fitness

## Test Customers

### Demo Salon Customers

1. **John Doe** (VIP Regular)
   - Email: <john.doe@example.com>
   - Tags: regular, vip
   - Total Bookings: 5
   - Total Spent: $250

2. **Jane Smith** (Regular)
   - Email: <jane.smith@example.com>
   - Tags: regular
   - Total Bookings: 3
   - Total Spent: $150

3. **Alex Johnson** (New)
   - Email: <alex.johnson@example.com>
   - Tags: new
   - Total Bookings: 1
   - Total Spent: $0

### Sarah's Spa Customers

1. **Emily Brown** (VIP)
   - Email: <emily.brown@example.com>
   - Tags: regular, referral
   - Total Bookings: 8
   - Total Spent: $560

## Test Appointments

### Past Appointments

- ✅ Completed haircut (14 days ago)
- ❌ Cancelled color service (7 days ago)

### Upcoming Appointments

- 📅 Confirmed haircut (3 days from now)
- ⏳ Pending color service (7 days from now)
- 📅 Confirmed massage with deposit (5 days from now)

## Test Reviews

- 5⭐ "Excellent service!" - John Doe
- 4⭐ "Great experience" - Jane Smith (with business response)
- 5⭐ "So relaxing!" - Emily Brown

## Service Categories

### Demo Salon

- Hair Services (4 services)
- Treatments (1 service)

### Sarah's Spa

- Massage Therapy (2 services)

## Rate Limit Configurations

- auth:login - 5 attempts / 15 minutes
- booking:create - 10 attempts / 1 hour

## Seed Data Scenarios

### Testing Appointment Statuses

- COMPLETED - Past haircut
- CANCELLED - Past color service
- CONFIRMED - Upcoming haircut and massage
- PENDING - Upcoming color service

### Testing Customer Segments

- VIP - John Doe, Emily Brown
- Regular - Jane Smith
- New - Alex Johnson
- At-risk - (create by not booking for 90+ days)

###
