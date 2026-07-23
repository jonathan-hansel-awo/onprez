-- Booking Protection phase 4: Stripe Checkout-backed booking deposits
ALTER TABLE "booking_payments"
ADD COLUMN "providerCheckoutUrl" TEXT,
ADD COLUMN "expiresAt" TIMESTAMP(3),
ADD COLUMN "notificationSentAt" TIMESTAMP(3);

CREATE INDEX "booking_payments_expiresAt_idx" ON "booking_payments"("expiresAt");
