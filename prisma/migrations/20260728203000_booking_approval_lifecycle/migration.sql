-- Complete approval-required booking lifecycle
ALTER TABLE "appointments"
ADD COLUMN "approvalExpiresAt" TIMESTAMP(3),
ADD COLUMN "approvalRespondedAt" TIMESTAMP(3);

-- Give existing pending requests a fresh response window on deployment.
UPDATE "appointments"
SET "approvalExpiresAt" = LEAST(
  "startTime",
  CURRENT_TIMESTAMP + INTERVAL '24 hours'
)
WHERE "status" = 'PENDING';

CREATE INDEX "appointments_status_approvalExpiresAt_idx"
ON "appointments"("status", "approvalExpiresAt");
