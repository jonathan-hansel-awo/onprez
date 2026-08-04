-- P3-002: canonical plan attribution, business media accounting, and reproducible
-- provider-cost planning rates. Usage remains observational; this migration does
-- not enforce plan limits.

CREATE TYPE "PlanTier" AS ENUM ('FREE', 'PROFESSIONAL', 'BUSINESS');

ALTER TABLE "businesses"
  ADD COLUMN "planTier" "PlanTier" NOT NULL DEFAULT 'FREE';

-- Preserve the meaning of the legacy premium flag until subscription state has a
-- dedicated source of truth. This is plan attribution only, not billing evidence.
UPDATE "businesses"
SET "planTier" = 'PROFESSIONAL'
WHERE "isPremium" = true;

CREATE TABLE "media_assets" (
  "id" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "provider" TEXT NOT NULL DEFAULT 'CLOUDINARY',
  "publicId" TEXT NOT NULL,
  "fingerprint" TEXT NOT NULL,
  "purpose" TEXT NOT NULL,
  "secureUrl" TEXT NOT NULL,
  "bytes" BIGINT NOT NULL,
  "width" INTEGER NOT NULL,
  "height" INTEGER NOT NULL,
  "format" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "media_assets_publicId_key" ON "media_assets"("publicId");
CREATE UNIQUE INDEX "media_assets_businessId_purpose_fingerprint_key"
  ON "media_assets"("businessId", "purpose", "fingerprint");
CREATE INDEX "media_assets_businessId_createdAt_idx"
  ON "media_assets"("businessId", "createdAt");

ALTER TABLE "media_assets"
  ADD CONSTRAINT "media_assets_businessId_fkey"
  FOREIGN KEY ("businessId") REFERENCES "businesses"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "provider_cost_rates" (
  "id" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "metric" TEXT NOT NULL,
  "unit" TEXT NOT NULL,
  "rate" DECIMAL(20,10) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'GBP',
  "effectiveFrom" TIMESTAMP(3) NOT NULL,
  "effectiveTo" TIMESTAMP(3),
  "source" TEXT NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "provider_cost_rates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "provider_cost_rates_provider_metric_effectiveFrom_key"
  ON "provider_cost_rates"("provider", "metric", "effectiveFrom");
CREATE INDEX "provider_cost_rates_provider_metric_effectiveFrom_idx"
  ON "provider_cost_rates"("provider", "metric", "effectiveFrom");

-- These rates reproduce the 26 July 2026 planning model. They are estimated
-- allocation equivalents, not provider invoices or live price guarantees.
INSERT INTO "provider_cost_rates" (
  "id", "provider", "metric", "unit", "rate", "currency",
  "effectiveFrom", "source", "notes", "updatedAt"
) VALUES
  (
    'p3-002-cloudinary-storage-gib',
    'CLOUDINARY',
    'MEDIA_STORAGE',
    'GIB_MONTH',
    0.4224000000,
    'GBP',
    '2026-07-26T00:00:00.000Z',
    'OnPrez pricing strategy planning snapshot dated 26 July 2026',
    'Variable allocation equivalent derived from the Cloudinary Plus planning cost; excludes delivery and transformations.',
    CURRENT_TIMESTAMP
  ),
  (
    'p3-002-resend-email',
    'RESEND',
    'EMAIL_SEND',
    'EMAIL',
    0.0003840000,
    'GBP',
    '2026-07-26T00:00:00.000Z',
    'OnPrez pricing strategy planning snapshot dated 26 July 2026',
    'Variable allocation equivalent derived from the Resend Pro planning cost and 50,000-email allowance.',
    CURRENT_TIMESTAMP
  );
