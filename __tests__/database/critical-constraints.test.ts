/** @jest-environment node */

import fs from 'fs'
import path from 'path'

const root = process.cwd()
const schema = fs.readFileSync(path.join(root, 'prisma/schema.prisma'), 'utf8')
const migration = fs.readFileSync(
  path.join(root, 'prisma/migrations/20260713033000_strengthen_business_constraints/migration.sql'),
  'utf8'
)

describe('critical database constraints', () => {
  it('keeps handles and customers unique at the database layer', () => {
    expect(schema).toMatch(/slug\s+String\s+@unique/)
    expect(schema).toContain('@@unique([businessId, email])')
    expect(migration).toContain('businesses_slug_format_check')
    expect(migration).toContain('customers_email_normalized_check')
  })

  it('enforces deterministic service and category positions per business', () => {
    expect(schema).toContain('@@unique([businessId, order])')
    expect(migration).toContain('services_businessId_order_key')
    expect(migration).toContain('service_categories_businessId_order_key')
    expect(migration).toContain('ROW_NUMBER() OVER')
  })

  it('prevents appointments from crossing business ownership boundaries', () => {
    expect(schema).toContain(
      '@relation(fields: [serviceId, businessId], references: [id, businessId])'
    )
    expect(schema).toContain(
      '@relation(fields: [customerId, businessId], references: [id, businessId])'
    )
    expect(migration).toContain('appointments_serviceId_businessId_fkey')
    expect(migration).toContain('appointments_customerId_businessId_fkey')
  })

  it('protects booking times, amounts, and service values with check constraints', () => {
    expect(migration).toContain('appointments_time_and_amount_check')
    expect(migration).toContain('"endTime" > "startTime"')
    expect(migration).toContain('"duration" > 0')
    expect(migration).toContain('services_values_check')
    expect(migration).toContain('customers_counters_and_amounts_check')
  })

  it('defines business-scoped indexes for public and dashboard query paths', () => {
    for (const index of [
      'businesses_isPublished_isActive_slug_idx',
      'services_businessId_active_order_idx',
      'services_businessId_active_featured_order_idx',
      'appointments_businessId_startTime_idx',
      'appointments_businessId_status_startTime_idx',
      'appointments_businessId_createdAt_idx',
      'customers_businessId_lastBookingAt_idx',
    ]) {
      expect(migration).toContain(index)
    }
  })

  it('cascades every direct business-owned sensitive record', () => {
    for (const model of [
      'Appointment',
      'AppointmentStatusTransition',
      'BookingIdempotencyKey',
      'BusinessMember',
      'BusinessHours',
      'Customer',
      'FAQ',
      'Inquiry',
      'Page',
      'Review',
      'Service',
      'ServiceCategory',
      'SpecialDate',
      'TeamInvitation',
    ]) {
      const modelBody = schema.match(new RegExp(`model ${model} \\{([\\s\\S]*?)\\n\\}`))?.[1]
      expect(modelBody).toBeDefined()
      expect(modelBody).toMatch(
        /business\s+Business\s+@relation\(fields: \[businessId\], references: \[id\], onDelete: Cascade\)/
      )
    }
  })
})
