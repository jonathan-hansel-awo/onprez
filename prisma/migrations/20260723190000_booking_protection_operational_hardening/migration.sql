-- Booking Protection phase 5: refunds, reconciliation, and durable webhook idempotency
CREATE TYPE "BookingRefundStatus" AS ENUM ('NOT_REQUESTED', 'PENDING', 'SUCCEEDED', 'FAILED');
CREATE TYPE "StripeWebhookEventStatus" AS ENUM ('PROCESSING', 'SUCCEEDED', 'FAILED');

ALTER TABLE "booking_payments"
ADD COLUMN "refundStatus" "BookingRefundStatus" NOT NULL DEFAULT 'NOT_REQUESTED',
ADD COLUMN "refundReason" TEXT,
ADD COLUMN "refundRequestedAt" TIMESTAMP(3),
ADD COLUMN "refundRequestedBy" TEXT,
ADD COLUMN "refundAttempt" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "refundFailureCode" TEXT,
ADD COLUMN "refundFailureMessage" TEXT,
ADD COLUMN "retainedAt" TIMESTAMP(3),
ADD COLUMN "retainedReason" TEXT,
ADD COLUMN "retainedBy" TEXT,
ADD COLUMN "lastReconciledAt" TIMESTAMP(3),
ADD COLUMN "reconciliationSource" TEXT;

CREATE UNIQUE INDEX "booking_payments_providerRefundId_key"
ON "booking_payments"("providerRefundId");

CREATE INDEX "booking_payments_businessId_refundStatus_updatedAt_idx"
ON "booking_payments"("businessId", "refundStatus", "updatedAt");

CREATE TABLE "stripe_webhook_events" (
  "id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "objectKey" TEXT,
  "objectId" TEXT,
  "accountId" TEXT,
  "livemode" BOOLEAN NOT NULL DEFAULT false,
  "status" "StripeWebhookEventStatus" NOT NULL DEFAULT 'PROCESSING',
  "attempts" INTEGER NOT NULL DEFAULT 1,
  "lastError" TEXT,
  "stripeCreatedAt" TIMESTAMP(3),
  "processedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "stripe_webhook_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "stripe_webhook_events_objectKey_idx"
ON "stripe_webhook_events"("objectKey");
CREATE INDEX "stripe_webhook_events_status_updatedAt_idx"
ON "stripe_webhook_events"("status", "updatedAt");
CREATE INDEX "stripe_webhook_events_type_createdAt_idx"
ON "stripe_webhook_events"("type", "createdAt");
