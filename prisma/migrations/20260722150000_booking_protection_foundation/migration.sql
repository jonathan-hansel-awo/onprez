-- CreateEnum
CREATE TYPE "FeatureKey" AS ENUM ('BOOKING_DEPOSITS');

-- CreateEnum
CREATE TYPE "EntitlementSource" AS ENUM ('ALPHA', 'SUBSCRIPTION', 'PROMOTION', 'ADMIN');

-- CreateEnum
CREATE TYPE "StripeConnectedAccountStatus" AS ENUM ('PENDING', 'RESTRICTED', 'READY', 'DISCONNECTED');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('STRIPE');

-- CreateEnum
CREATE TYPE "PaymentPurpose" AS ENUM ('BOOKING_DEPOSIT');

-- CreateEnum
CREATE TYPE "BookingPaymentStatus" AS ENUM ('PENDING', 'REQUIRES_ACTION', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'PARTIALLY_REFUNDED', 'REFUNDED');

-- AlterTable
ALTER TABLE "appointments"
ADD COLUMN "cancellationPolicyVersion" TEXT,
ADD COLUMN "cancellationPolicyAcceptedAt" TIMESTAMP(3),
ADD COLUMN "cancellationPolicySnapshot" JSONB;

-- CreateTable
CREATE TABLE "feature_entitlements" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "feature" "FeatureKey" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "source" "EntitlementSource" NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_entitlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stripe_connected_accounts" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "stripeAccountId" TEXT NOT NULL,
    "country" TEXT,
    "defaultCurrency" TEXT,
    "detailsSubmitted" BOOLEAN NOT NULL DEFAULT false,
    "chargesEnabled" BOOLEAN NOT NULL DEFAULT false,
    "payoutsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "status" "StripeConnectedAccountStatus" NOT NULL DEFAULT 'PENDING',
    "disabledReason" TEXT,
    "requirementsDue" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "requirementsPastDue" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "requirementsEventuallyDue" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stripe_connected_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_payments" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL DEFAULT 'STRIPE',
    "purpose" "PaymentPurpose" NOT NULL DEFAULT 'BOOKING_DEPOSIT',
    "status" "BookingPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "providerAccountId" TEXT,
    "providerCheckoutSessionId" TEXT,
    "providerPaymentIntentId" TEXT,
    "providerChargeId" TEXT,
    "providerRefundId" TEXT,
    "idempotencyKey" TEXT,
    "policyVersion" TEXT,
    "policyAcceptedAt" TIMESTAMP(3),
    "policySnapshot" JSONB,
    "refundedAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "failureCode" TEXT,
    "failureMessage" TEXT,
    "metadata" JSONB,
    "paidAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "feature_entitlements_businessId_feature_key" ON "feature_entitlements"("businessId", "feature");

-- CreateIndex
CREATE INDEX "feature_entitlements_feature_enabled_idx" ON "feature_entitlements"("feature", "enabled");

-- CreateIndex
CREATE INDEX "feature_entitlements_expiresAt_idx" ON "feature_entitlements"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "stripe_connected_accounts_businessId_key" ON "stripe_connected_accounts"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "stripe_connected_accounts_stripeAccountId_key" ON "stripe_connected_accounts"("stripeAccountId");

-- CreateIndex
CREATE INDEX "stripe_connected_accounts_status_idx" ON "stripe_connected_accounts"("status");

-- CreateIndex
CREATE UNIQUE INDEX "booking_payments_providerCheckoutSessionId_key" ON "booking_payments"("providerCheckoutSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "booking_payments_providerPaymentIntentId_key" ON "booking_payments"("providerPaymentIntentId");

-- CreateIndex
CREATE UNIQUE INDEX "booking_payments_providerChargeId_key" ON "booking_payments"("providerChargeId");

-- CreateIndex
CREATE UNIQUE INDEX "booking_payments_idempotencyKey_key" ON "booking_payments"("idempotencyKey");

-- CreateIndex
CREATE INDEX "booking_payments_appointmentId_idx" ON "booking_payments"("appointmentId");

-- CreateIndex
CREATE INDEX "booking_payments_businessId_status_createdAt_idx" ON "booking_payments"("businessId", "status", "createdAt");

-- AddForeignKey
ALTER TABLE "feature_entitlements" ADD CONSTRAINT "feature_entitlements_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stripe_connected_accounts" ADD CONSTRAINT "stripe_connected_accounts_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_payments" ADD CONSTRAINT "booking_payments_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_payments" ADD CONSTRAINT "booking_payments_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
