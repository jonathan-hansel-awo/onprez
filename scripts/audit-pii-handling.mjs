import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = relativePath => fs.readFileSync(path.join(root, relativePath), 'utf8')
const inventory = JSON.parse(read('docs/privacy/PII_INVENTORY.json'))
const failures = []

function fail(message) {
  failures.push(message)
}

function parsePrismaFields(source) {
  const fields = new Set()
  let model = null

  for (const line of source.split(/\r?\n/)) {
    const modelMatch = line.match(/^model\s+(\w+)\s+\{$/)
    if (modelMatch) {
      model = modelMatch[1]
      continue
    }
    if (model && line.trim() === '}') {
      model = null
      continue
    }
    if (!model) continue

    const fieldMatch = line.match(/^\s{2}(\w+)\s+[^\s/]+/)
    if (fieldMatch && !fieldMatch[1].startsWith('@@')) {
      fields.add(`${model}.${fieldMatch[1]}`)
    }
  }

  return fields
}

const prismaFields = parsePrismaFields(read('prisma/schema.prisma'))
const inventoryFields = new Set()
const requiredPolicyKeys = [
  'classification',
  'protection',
  'retention',
  'deletionOwner',
  'deletionAction',
]

for (const [index, policy] of inventory.fieldPolicies.entries()) {
  if (!Array.isArray(policy.fields) || policy.fields.length === 0) {
    fail(`fieldPolicies[${index}] has no fields`)
    continue
  }

  for (const key of requiredPolicyKeys) {
    if (typeof policy[key] !== 'string' || !policy[key].trim()) {
      fail(`fieldPolicies[${index}] is missing ${key}`)
    }
  }

  if (!inventory.owners[policy.deletionOwner]) {
    fail(`fieldPolicies[${index}] uses unknown deletion owner ${policy.deletionOwner}`)
  }

  for (const field of policy.fields) {
    if (inventoryFields.has(field)) fail(`${field} appears in more than one policy`)
    inventoryFields.add(field)
    if (!prismaFields.has(field)) fail(`${field} does not exist in prisma/schema.prisma`)
  }
}

const sensitiveNames = new Set(
  [
    'email',
    'passwordHash',
    'token',
    'encryptedSecret',
    'hashedCode',
    'endpoint',
    'auth',
    'p256dh',
    'deviceInfo',
    'deviceName',
    'deviceFingerprint',
    'userAgent',
    'ipAddress',
    'phone',
    'alternatePhone',
    'address',
    'city',
    'state',
    'zipCode',
    'country',
    'latitude',
    'longitude',
    'socialLinks',
    'settings',
    'branding',
    'content',
    'publishedContent',
    'lastPublishedBy',
    'customerName',
    'firstName',
    'lastName',
    'customerNotes',
    'businessNotes',
    'notes',
    'cancellationReason',
    'cancellationDetails',
    'rescheduleReason',
    'refundReason',
    'refundFailureMessage',
    'retainedReason',
    'failureReason',
    'failureMessage',
    'lastError',
    'holdReason',
    'details',
    'metadata',
    'birthday',
    'gender',
    'preferredLanguage',
    'preferences',
    'tags',
    'customFields',
    'source',
    'referredBy',
    'subject',
    'message',
    'comment',
    'businessResponse',
    'bookingSource',
    'bookingIp',
    'policySnapshot',
    'cancellationPolicySnapshot',
    'requestHash',
    'payload',
    'stripeAccountId',
  ].map(name => name.toLowerCase())
)
const sensitiveExactFields = new Set([
  'Business.name',
  'Appointment.customerName',
  'Customer.name',
  'Inquiry.customerName',
])
const modelFieldExemptions = new Set([
  'Service.preparationNotes',
  'Service.aftercareNotes',
  'FeatureEntitlement.metadata',
  'FeatureEntitlement.source',
  'RateLimit.endpoint',
  'RateLimitConfig.endpoint',
  'StripeConnectedAccount.disabledReason',
])

for (const field of prismaFields) {
  const fieldName = field.split('.')[1]
  if (
    (sensitiveNames.has(fieldName.toLowerCase()) ||
      sensitiveExactFields.has(field) ||
      /^(?:provider.*Id|provider.*Url)$/i.test(fieldName)) &&
    !modelFieldExemptions.has(field) &&
    !inventoryFields.has(field)
  ) {
    fail(`Potential personal-data field is missing from the inventory: ${field}`)
  }
}

const reviewedAt = Date.parse(inventory.reviewedAt)
const nextReviewDue = Date.parse(inventory.nextReviewDue)
if (
  !Number.isFinite(reviewedAt) ||
  !Number.isFinite(nextReviewDue) ||
  nextReviewDue <= reviewedAt
) {
  fail('Inventory review dates are invalid')
}
if (Date.now() > nextReviewDue) {
  fail(`PII inventory review is overdue (due ${inventory.nextReviewDue})`)
}
if (!Array.isArray(inventory.processingActivities) || inventory.processingActivities.length < 5) {
  fail('The inventory must retain the canonical processing-activity map')
}

const clientFiles = []
function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name)
    if (entry.isDirectory()) walk(absolute)
    else if (/\.(?:ts|tsx)$/.test(entry.name) && !/\.(?:test|spec)\./.test(entry.name)) {
      const source = fs.readFileSync(absolute, 'utf8')
      if (source.startsWith("'use client'")) clientFiles.push([absolute, source])
    }
  }
}
walk(path.join(root, 'src'))

const forbiddenClientUrlPatterns = [
  [/\?(?:[^`'"\s]*&)?(?:e-?mail|customerEmail|customerName|phone)=/i, 'PII query template'],
  [
    /searchParams\.set\(['"](?:e-?mail|customerEmail|customerName|phone)['"]/i,
    'PII URLSearchParams write',
  ],
]
for (const [absolute, source] of clientFiles) {
  for (const [pattern, label] of forbiddenClientUrlPatterns) {
    if (pattern.test(source)) fail(`${label} found in ${path.relative(root, absolute)}`)
  }
}

const analytics = read('src/components/analytics/analytics-wrapper.tsx')
if (/useSearchParams|searchParams\.toString|window\.location\.search/.test(analytics)) {
  fail('Optional analytics must not receive query strings')
}
if (!analytics.includes('privacySafeAnalyticsPath(pathname)')) {
  fail('Optional analytics must use coarse privacy-safe page groups')
}

const pushOutbox = read('src/lib/push/outbox.ts')
if (/customerName|customerEmail|customerPhone|customerNotes/.test(pushOutbox)) {
  fail('Push payloads must not contain customer identity, contact details or notes')
}

const calendarNotifications = read('src/lib/services/booking-notifications.ts')
const calendarUrlBuilder = calendarNotifications.match(
  /export function buildBusinessBookingCalendarUrl[\s\S]*?(?=export function buildBusinessBookingCalendarAttachment)/
)?.[0]
if (!calendarUrlBuilder || /input\.customer(?:Name|Email|Phone|Notes)/.test(calendarUrlBuilder)) {
  fail('Third-party calendar URLs must not contain customer PII')
}

const logger = read('src/lib/observability/logger.ts')
for (const control of ['customer-?name', 'e-?mail', 'ip-?address', 'user-?agent']) {
  if (!logger.includes(control))
    fail(`Structured logger is missing the ${control} redaction control`)
}
if (!logger.includes('A-Z0-9._%+-')) fail('Structured logger must scrub emails embedded in strings')

for (const sentryConfig of [
  'src/instrumentation-client.ts',
  'src/sentry.server.config.ts',
  'src/sentry.edge.config.ts',
]) {
  const source = read(sentryConfig)
  if (!source.includes('sendDefaultPii: false') || !source.includes('scrubSentryEvent(event)')) {
    fail(`${sentryConfig} must disable default PII and scrub events`)
  }
}

for (const [absolute, source] of clientFiles) {
  const riskyConsole =
    /console\.(?:log|info|warn|error|debug)\([^\n]*(?:customerEmail|customerPhone|customerName|password|token|secret)/i
  if (riskyConsole.test(source)) {
    fail(`Potential direct PII/secret console logging found in ${path.relative(root, absolute)}`)
  }
}

if (failures.length > 0) {
  console.error('PII handling audit failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.warn(
  `PII handling audit passed: ${inventoryFields.size} classified fields, ${inventory.processingActivities.length} processing activities, review due ${inventory.nextReviewDue}.`
)
