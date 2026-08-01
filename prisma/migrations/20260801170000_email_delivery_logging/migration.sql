-- P2-024: durable transactional email delivery history, provider events, retries and suppressions.

CREATE TYPE "EmailDeliveryCategory" AS ENUM (
  'BOOKING_CUSTOMER_CONFIRMATION',
  'BOOKING_BUSINESS_NOTIFICATION',
  'APPOINTMENT_STATUS_UPDATE',
  'APPOINTMENT_REMINDER',
  'INQUIRY_CUSTOMER_ACKNOWLEDGEMENT',
  'INQUIRY_BUSINESS_NOTIFICATION'
);

CREATE TYPE "EmailDeliveryAudience" AS ENUM ('CUSTOMER', 'BUSINESS');

CREATE TYPE "EmailDeliveryStatus" AS ENUM (
  'PENDING',
  'SENT',
  'DELIVERED',
  'DELAYED',
  'BOUNCED',
  'COMPLAINED',
  'FAILED',
  'SUPPRESSED'
);

CREATE TYPE "EmailDeliveryEventSource" AS ENUM ('APPLICATION', 'RESEND');

CREATE TYPE "EmailSuppressionReason" AS ENUM (
  'BOUNCE',
  'COMPLAINT',
  'PROVIDER_SUPPRESSION'
);

CREATE TABLE "email_deliveries" (
  "id" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "appointmentId" TEXT,
  "inquiryId" TEXT,
  "dedupeKey" TEXT NOT NULL,
  "providerMessageId" TEXT,
  "category" "EmailDeliveryCategory" NOT NULL,
  "audience" "EmailDeliveryAudience" NOT NULL,
  "status" "EmailDeliveryStatus" NOT NULL DEFAULT 'PENDING',
  "recipientHash" TEXT NOT NULL,
  "recipientMasked" TEXT NOT NULL,
  "appointmentStatus" "AppointmentStatus",
  "reminderType" TEXT,
  "attempts" INTEGER NOT NULL DEFAULT 1,
  "maxAttempts" INTEGER NOT NULL DEFAULT 3,
  "lastAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "sentAt" TIMESTAMP(3),
  "deliveredAt" TIMESTAMP(3),
  "lastErrorCode" TEXT,
  "lastError" TEXT,
  "retriedByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "email_deliveries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "email_delivery_events" (
  "id" TEXT NOT NULL,
  "deliveryId" TEXT NOT NULL,
  "providerEventId" TEXT,
  "type" TEXT NOT NULL,
  "status" "EmailDeliveryStatus" NOT NULL,
  "source" "EmailDeliveryEventSource" NOT NULL,
  "errorCode" TEXT,
  "errorMessage" TEXT,
  "occurredAt" TIMESTAMP(3) NOT NULL,
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "email_delivery_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "email_suppressions" (
  "id" TEXT NOT NULL,
  "recipientHash" TEXT NOT NULL,
  "recipientMasked" TEXT NOT NULL,
  "reason" "EmailSuppressionReason" NOT NULL,
  "providerMessageId" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "occurredAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "email_suppressions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "email_deliveries_dedupeKey_key" ON "email_deliveries"("dedupeKey");
CREATE UNIQUE INDEX "email_deliveries_providerMessageId_key" ON "email_deliveries"("providerMessageId");
CREATE INDEX "email_deliveries_businessId_createdAt_idx" ON "email_deliveries"("businessId", "createdAt");
CREATE INDEX "email_deliveries_businessId_status_createdAt_idx" ON "email_deliveries"("businessId", "status", "createdAt");
CREATE INDEX "email_deliveries_appointmentId_createdAt_idx" ON "email_deliveries"("appointmentId", "createdAt");
CREATE INDEX "email_deliveries_inquiryId_createdAt_idx" ON "email_deliveries"("inquiryId", "createdAt");
CREATE INDEX "email_deliveries_recipientHash_createdAt_idx" ON "email_deliveries"("recipientHash", "createdAt");

CREATE UNIQUE INDEX "email_delivery_events_providerEventId_key" ON "email_delivery_events"("providerEventId");
CREATE INDEX "email_delivery_events_deliveryId_occurredAt_idx" ON "email_delivery_events"("deliveryId", "occurredAt");
CREATE INDEX "email_delivery_events_type_occurredAt_idx" ON "email_delivery_events"("type", "occurredAt");

CREATE UNIQUE INDEX "email_suppressions_recipientHash_key" ON "email_suppressions"("recipientHash");
CREATE INDEX "email_suppressions_active_occurredAt_idx" ON "email_suppressions"("active", "occurredAt");

ALTER TABLE "email_deliveries"
  ADD CONSTRAINT "email_deliveries_businessId_fkey"
  FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "email_deliveries"
  ADD CONSTRAINT "email_deliveries_appointmentId_fkey"
  FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "email_deliveries"
  ADD CONSTRAINT "email_deliveries_inquiryId_fkey"
  FOREIGN KEY ("inquiryId") REFERENCES "inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "email_deliveries"
  ADD CONSTRAINT "email_deliveries_retriedByUserId_fkey"
  FOREIGN KEY ("retriedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "email_delivery_events"
  ADD CONSTRAINT "email_delivery_events_deliveryId_fkey"
  FOREIGN KEY ("deliveryId") REFERENCES "email_deliveries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
