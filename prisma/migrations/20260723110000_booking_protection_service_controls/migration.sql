-- Booking Protection phase 3: business defaults and per-service deposit policy
CREATE TYPE "ServiceDepositMode" AS ENUM ('NONE', 'BUSINESS_DEFAULT', 'CUSTOM');

ALTER TABLE "services"
ADD COLUMN "depositMode" "ServiceDepositMode" NOT NULL DEFAULT 'BUSINESS_DEFAULT';

-- Preserve services that were already explicitly configured with a valid deposit.
UPDATE "services"
SET "depositMode" = 'CUSTOM'
WHERE "requiresDeposit" = true
  AND "depositAmount" IS NOT NULL
  AND "depositAmount" > 0;

-- Free services cannot require a deposit.
UPDATE "services"
SET "depositMode" = 'NONE',
    "requiresDeposit" = false,
    "depositAmount" = NULL
WHERE "price" <= 0;
