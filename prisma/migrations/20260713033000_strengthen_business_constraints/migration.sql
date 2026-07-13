-- Normalize existing display positions before enforcing per-business uniqueness.
WITH ranked_services AS (
    SELECT "id", ROW_NUMBER() OVER (
        PARTITION BY "businessId"
        ORDER BY "order", "createdAt", "id"
    ) - 1 AS normalized_order
    FROM "services"
)
UPDATE "services" AS service
SET "order" = ranked_services.normalized_order
FROM ranked_services
WHERE service."id" = ranked_services."id";

WITH ranked_categories AS (
    SELECT "id", ROW_NUMBER() OVER (
        PARTITION BY "businessId"
        ORDER BY "order", "createdAt", "id"
    ) - 1 AS normalized_order
    FROM "service_categories"
)
UPDATE "service_categories" AS category
SET "order" = ranked_categories.normalized_order
FROM ranked_categories
WHERE category."id" = ranked_categories."id";

CREATE UNIQUE INDEX "services_businessId_order_key"
ON "services"("businessId", "order");

CREATE UNIQUE INDEX "services_id_businessId_key"
ON "services"("id", "businessId");

CREATE UNIQUE INDEX "service_categories_businessId_order_key"
ON "service_categories"("businessId", "order");

CREATE UNIQUE INDEX "customers_id_businessId_key"
ON "customers"("id", "businessId");

-- An appointment's service and customer must belong to that same business.
ALTER TABLE "appointments"
DROP CONSTRAINT "appointments_serviceId_fkey";

ALTER TABLE "appointments"
DROP CONSTRAINT "appointments_customerId_fkey";

ALTER TABLE "appointments"
ADD CONSTRAINT "appointments_serviceId_businessId_fkey"
FOREIGN KEY ("serviceId", "businessId")
REFERENCES "services"("id", "businessId")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "appointments"
ADD CONSTRAINT "appointments_customerId_businessId_fkey"
FOREIGN KEY ("customerId", "businessId")
REFERENCES "customers"("id", "businessId")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- Replace broad single-column indexes with the actual dashboard/public query shapes.
DROP INDEX IF EXISTS "businesses_slug_idx";
DROP INDEX IF EXISTS "services_businessId_idx";
DROP INDEX IF EXISTS "services_active_idx";
DROP INDEX IF EXISTS "services_featured_idx";
DROP INDEX IF EXISTS "services_order_idx";
DROP INDEX IF EXISTS "service_categories_businessId_idx";
DROP INDEX IF EXISTS "appointments_businessId_idx";
DROP INDEX IF EXISTS "appointments_startTime_idx";
DROP INDEX IF EXISTS "appointments_status_idx";
DROP INDEX IF EXISTS "appointments_customerEmail_idx";
DROP INDEX IF EXISTS "appointments_createdAt_idx";
DROP INDEX IF EXISTS "customers_businessId_idx";
DROP INDEX IF EXISTS "customers_isVip_idx";
DROP INDEX IF EXISTS "customers_lastBookingAt_idx";

CREATE INDEX "businesses_isPublished_isActive_slug_idx"
ON "businesses"("isPublished", "isActive", "slug");

CREATE INDEX "services_businessId_active_order_idx"
ON "services"("businessId", "active", "order");

CREATE INDEX "services_businessId_active_featured_order_idx"
ON "services"("businessId", "active", "featured", "order");

CREATE INDEX "services_businessId_categoryId_active_order_idx"
ON "services"("businessId", "categoryId", "active", "order");

CREATE INDEX "appointments_businessId_startTime_idx"
ON "appointments"("businessId", "startTime");

CREATE INDEX "appointments_businessId_status_startTime_idx"
ON "appointments"("businessId", "status", "startTime");

CREATE INDEX "appointments_businessId_createdAt_idx"
ON "appointments"("businessId", "createdAt");

CREATE INDEX "appointments_businessId_customerEmail_idx"
ON "appointments"("businessId", "customerEmail");

CREATE INDEX "customers_businessId_isVip_idx"
ON "customers"("businessId", "isVip");

CREATE INDEX "customers_businessId_lastBookingAt_idx"
ON "customers"("businessId", "lastBookingAt");

CREATE INDEX "customers_businessId_totalBookings_lastBookingAt_idx"
ON "customers"("businessId", "totalBookings", "lastBookingAt");

-- CHECK constraints are added NOT VALID so deployments do not discard legacy data;
-- PostgreSQL still enforces them for every new or subsequently updated row.
ALTER TABLE "businesses"
ADD CONSTRAINT "businesses_slug_format_check"
CHECK (
    "slug" = LOWER("slug")
    AND CHAR_LENGTH("slug") BETWEEN 3 AND 30
    AND "slug" ~ '^[a-z0-9-]+$'
) NOT VALID;

ALTER TABLE "services"
ADD CONSTRAINT "services_values_check"
CHECK (
    "order" >= 0
    AND "duration" > 0
    AND "bufferTime" >= 0
    AND "price" >= 0
    AND ("depositAmount" IS NULL OR "depositAmount" >= 0)
    AND ("priceRangeMin" IS NULL OR "priceRangeMin" >= 0)
    AND ("priceRangeMax" IS NULL OR "priceRangeMax" >= 0)
    AND (
        "priceRangeMin" IS NULL
        OR "priceRangeMax" IS NULL
        OR "priceRangeMin" <= "priceRangeMax"
    )
) NOT VALID;

ALTER TABLE "service_categories"
ADD CONSTRAINT "service_categories_order_check"
CHECK ("order" >= 0) NOT VALID;

ALTER TABLE "appointments"
ADD CONSTRAINT "appointments_time_and_amount_check"
CHECK (
    "endTime" > "startTime"
    AND "duration" > 0
    AND "totalAmount" >= 0
    AND ("depositAmount" IS NULL OR "depositAmount" >= 0)
    AND ("endDate" IS NULL OR "endDate" >= "startTime")
) NOT VALID;

ALTER TABLE "customers"
ADD CONSTRAINT "customers_counters_and_amounts_check"
CHECK (
    "totalBookings" >= 0
    AND "completedBookings" >= 0
    AND "cancelledBookings" >= 0
    AND "noShowCount" >= 0
    AND "totalSpent" >= 0
    AND ("averageRating" IS NULL OR "averageRating" BETWEEN 0 AND 5)
) NOT VALID;

ALTER TABLE "customers"
ADD CONSTRAINT "customers_email_normalized_check"
CHECK ("email" = LOWER(BTRIM("email"))) NOT VALID;
