-- Reconcile models that pre-date the repository's Prisma migration history.
--
-- Existing long-lived databases received these additive fields and tables before
-- Prisma Migrate became the deployment authority. IF NOT EXISTS and guarded
-- constraints keep this migration safe for those databases while making a fresh
-- migration replay match schema.prisma before later constraints are installed.

-- Special-date availability exceptions.
CREATE TABLE IF NOT EXISTS "special_dates" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "name" TEXT NOT NULL,
    "isClosed" BOOLEAN NOT NULL DEFAULT true,
    "openTime" TEXT,
    "closeTime" TEXT,
    "notes" TEXT,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "special_dates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "special_dates_businessId_date_key"
ON "special_dates"("businessId", "date");

CREATE INDEX IF NOT EXISTS "special_dates_businessId_idx"
ON "special_dates"("businessId");

CREATE INDEX IF NOT EXISTS "special_dates_businessId_date_idx"
ON "special_dates"("businessId", "date");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'special_dates_businessId_fkey'
    ) THEN
        ALTER TABLE "special_dates"
        ADD CONSTRAINT "special_dates_businessId_fkey"
        FOREIGN KEY ("businessId") REFERENCES "businesses"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Service availability settings that already exist in the Prisma model.
ALTER TABLE "services"
ADD COLUMN IF NOT EXISTS "useBusinessHours" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "customAvailability" JSONB,
ADD COLUMN IF NOT EXISTS "availableDays" INTEGER[] NOT NULL DEFAULT ARRAY[0, 1, 2, 3, 4, 5, 6]::INTEGER[],
ADD COLUMN IF NOT EXISTS "minAdvanceBookingHours" INTEGER;

ALTER TABLE "services"
ALTER COLUMN "currency" SET DEFAULT 'GBP',
ALTER COLUMN "galleryImages" SET DEFAULT ARRAY[]::TEXT[];

UPDATE "services"
SET "galleryImages" = ARRAY[]::TEXT[]
WHERE "galleryImages" IS NULL;

ALTER TABLE "services"
ALTER COLUMN "galleryImages" SET NOT NULL;

-- Multi-day, recurring, and audit fields used by appointment services.
ALTER TABLE "appointments"
ADD COLUMN IF NOT EXISTS "cancellationDetails" TEXT,
ADD COLUMN IF NOT EXISTS "rescheduledBy" TEXT,
ADD COLUMN IF NOT EXISTS "isMultiDay" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "endDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "recurrencePattern" JSONB,
ADD COLUMN IF NOT EXISTS "parentId" TEXT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'appointments_parentId_fkey'
    ) THEN
        ALTER TABLE "appointments"
        ADD CONSTRAINT "appointments_parentId_fkey"
        FOREIGN KEY ("parentId") REFERENCES "appointments"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Appointment reminder delivery history.
CREATE TABLE IF NOT EXISTS "ReminderLog" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "reminderType" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "error" TEXT,

    CONSTRAINT "ReminderLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ReminderLog_appointmentId_idx"
ON "ReminderLog"("appointmentId");

CREATE INDEX IF NOT EXISTS "ReminderLog_sentAt_idx"
ON "ReminderLog"("sentAt");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'ReminderLog_appointmentId_fkey'
    ) THEN
        ALTER TABLE "ReminderLog"
        ADD CONSTRAINT "ReminderLog_appointmentId_fkey"
        FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Service variants and their enum also pre-date the migration baseline.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'VariantType') THEN
        CREATE TYPE "VariantType" AS ENUM ('OPTION', 'ADDON');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS "service_variants" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priceAdjustment" DECIMAL(10,2) NOT NULL,
    "durationAdjustment" INTEGER NOT NULL DEFAULT 0,
    "type" "VariantType" NOT NULL DEFAULT 'OPTION',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_variants_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "service_variants_serviceId_idx"
ON "service_variants"("serviceId");

CREATE INDEX IF NOT EXISTS "service_variants_serviceId_order_idx"
ON "service_variants"("serviceId", "order");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'service_variants_serviceId_fkey'
    ) THEN
        ALTER TABLE "service_variants"
        ADD CONSTRAINT "service_variants_serviceId_fkey"
        FOREIGN KEY ("serviceId") REFERENCES "services"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
