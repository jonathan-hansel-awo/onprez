import { readFileSync, writeFileSync } from 'node:fs'

function replaceOnce(source, search, replacement, marker) {
  if (source.includes(marker)) return source
  if (!source.includes(search)) {
    throw new Error(`Unable to find schema insertion point: ${marker}`)
  }
  return source.replace(search, replacement)
}

const schemaPath = 'prisma/schema.prisma'
let schema = readFileSync(schemaPath, 'utf8')

schema = replaceOnce(
  schema,
  '  pages                  Page[]\n\n  @@index([ownerId])',
  '  pages                  Page[]\n  featureEntitlements    FeatureEntitlement[]\n  stripeConnectedAccount StripeConnectedAccount?\n  bookingPayments        BookingPayment[]\n\n  @@index([ownerId])',
  'featureEntitlements    FeatureEntitlement[]'
)

schema = replaceOnce(
  schema,
  '  @@map("businesses")\n}\n\nmodel Page {',
  `  @@map("businesses")
}

model FeatureEntitlement {
  id         String            @id @default(cuid())
  businessId String
  feature    FeatureKey
  enabled    Boolean           @default(true)
  source     EntitlementSource
  expiresAt  DateTime?
  metadata   Json?
  createdAt  DateTime          @default(now())
  updatedAt  DateTime          @updatedAt
  business   Business          @relation(fields: [businessId], references: [id], onDelete: Cascade)

  @@unique([businessId, feature])
  @@index([feature, enabled])
  @@index([expiresAt])
  @@map("feature_entitlements")
}

model StripeConnectedAccount {
  id                        String                       @id @default(cuid())
  businessId                String                       @unique
  stripeAccountId           String                       @unique
  country                    String?
  defaultCurrency            String?
  detailsSubmitted           Boolean                      @default(false)
  chargesEnabled             Boolean                      @default(false)
  payoutsEnabled             Boolean                      @default(false)
  status                     StripeConnectedAccountStatus @default(PENDING)
  disabledReason             String?
  requirementsDue            String[]                     @default([])
  requirementsPastDue        String[]                     @default([])
  requirementsEventuallyDue  String[]                     @default([])
  lastSyncedAt               DateTime?
  createdAt                  DateTime                     @default(now())
  updatedAt                  DateTime                     @updatedAt
  business                   Business                     @relation(fields: [businessId], references: [id], onDelete: Cascade)

  @@index([status])
  @@map("stripe_connected_accounts")
}

model Page {`,
  'model FeatureEntitlement {'
)

schema = replaceOnce(
  schema,
  '  metadata            Json?\n  createdAt           DateTime                      @default(now())',
  '  metadata                     Json?\n  cancellationPolicyVersion      String?\n  cancellationPolicyAcceptedAt   DateTime?\n  cancellationPolicySnapshot     Json?\n  createdAt                    DateTime                      @default(now())',
  'cancellationPolicyAcceptedAt'
)

schema = replaceOnce(
  schema,
  '  statusTransitions   AppointmentStatusTransition[]\n\n  @@index([serviceId])',
  '  statusTransitions   AppointmentStatusTransition[]\n  payments            BookingPayment[]\n\n  @@index([serviceId])',
  'payments            BookingPayment[]'
)

schema = replaceOnce(
  schema,
  '  @@map("appointments")\n}\n\nmodel AppointmentStatusTransition {',
  `  @@map("appointments")
}

model BookingPayment {
  id                        String               @id @default(cuid())
  businessId                String
  appointmentId             String
  provider                  PaymentProvider      @default(STRIPE)
  purpose                   PaymentPurpose       @default(BOOKING_DEPOSIT)
  status                    BookingPaymentStatus @default(PENDING)
  amount                    Decimal              @db.Decimal(10, 2)
  currency                  String               @default("GBP")
  providerAccountId         String?
  providerCheckoutSessionId String?              @unique
  providerPaymentIntentId   String?              @unique
  providerChargeId          String?              @unique
  providerRefundId          String?
  idempotencyKey            String?              @unique
  policyVersion             String?
  policyAcceptedAt          DateTime?
  policySnapshot            Json?
  refundedAmount            Decimal              @default(0) @db.Decimal(10, 2)
  failureCode               String?
  failureMessage            String?
  metadata                  Json?
  paidAt                    DateTime?
  failedAt                  DateTime?
  refundedAt                DateTime?
  createdAt                 DateTime             @default(now())
  updatedAt                 DateTime             @updatedAt
  business                  Business             @relation(fields: [businessId], references: [id], onDelete: Cascade)
  appointment               Appointment          @relation(fields: [appointmentId], references: [id], onDelete: Cascade)

  @@index([appointmentId])
  @@index([businessId, status, createdAt])
  @@map("booking_payments")
}

model AppointmentStatusTransition {`,
  'model BookingPayment {'
)

schema = replaceOnce(
  schema,
  'enum UserRole {',
  `enum FeatureKey {
  BOOKING_DEPOSITS
}

enum EntitlementSource {
  ALPHA
  SUBSCRIPTION
  PROMOTION
  ADMIN
}

enum StripeConnectedAccountStatus {
  PENDING
  RESTRICTED
  READY
  DISCONNECTED
}

enum PaymentProvider {
  STRIPE
}

enum PaymentPurpose {
  BOOKING_DEPOSIT
}

enum BookingPaymentStatus {
  PENDING
  REQUIRES_ACTION
  PROCESSING
  SUCCEEDED
  FAILED
  CANCELLED
  PARTIALLY_REFUNDED
  REFUNDED
}

enum UserRole {`,
  'enum FeatureKey {'
)

writeFileSync(schemaPath, schema)

const packagePath = 'package.json'
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'))
packageJson.scripts['entitlement:booking-deposits'] =
  'tsx scripts/set-booking-deposit-entitlement.ts'
writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`)

const environmentPath = '.env.example'
let environmentExample = readFileSync(environmentPath, 'utf8').trimEnd()
if (!environmentExample.includes('STRIPE_SECRET_KEY=')) {
  environmentExample += `

# Stripe Connect and booking deposits (optional until Booking Protection is enabled)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
`
}
writeFileSync(environmentPath, environmentExample)
