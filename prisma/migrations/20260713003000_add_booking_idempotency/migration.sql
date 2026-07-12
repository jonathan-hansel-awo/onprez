CREATE TABLE "booking_idempotency_keys" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_idempotency_keys_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "booking_idempotency_keys_businessId_key_key"
ON "booking_idempotency_keys"("businessId", "key");
CREATE INDEX "booking_idempotency_keys_expiresAt_idx"
ON "booking_idempotency_keys"("expiresAt");
CREATE INDEX "booking_idempotency_keys_appointmentId_idx"
ON "booking_idempotency_keys"("appointmentId");

ALTER TABLE "booking_idempotency_keys"
ADD CONSTRAINT "booking_idempotency_keys_businessId_fkey"
FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "booking_idempotency_keys"
ADD CONSTRAINT "booking_idempotency_keys_appointmentId_fkey"
FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
