-- Preserve every retired public business handle as a direct mapping to the
-- owning business. The application always derives the redirect destination
-- from businesses.slug, so redirect chains cannot be stored.
CREATE TABLE "business_handle_redirects" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "sourceHandle" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_handle_redirects_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "business_handle_redirects_sourceHandle_key"
ON "business_handle_redirects"("sourceHandle");

CREATE INDEX "business_handle_redirects_businessId_createdAt_idx"
ON "business_handle_redirects"("businessId", "createdAt");

ALTER TABLE "business_handle_redirects"
ADD CONSTRAINT "business_handle_redirects_businessId_fkey"
FOREIGN KEY ("businessId") REFERENCES "businesses"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "business_handle_redirects"
ADD CONSTRAINT "business_handle_redirects_source_handle_format_check"
CHECK (
    "sourceHandle" = LOWER("sourceHandle")
    AND CHAR_LENGTH("sourceHandle") BETWEEN 3 AND 30
    AND "sourceHandle" ~ '^[a-z0-9-]+$'
);

-- A handle must be unique across both current and retired handles. Advisory
-- transaction locks close the cross-table race that separate unique indexes
-- cannot prevent under concurrent writes.
CREATE OR REPLACE FUNCTION lock_and_check_business_handle()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD."slug" = NEW."slug" THEN
        RETURN NEW;
    END IF;

    IF TG_OP = 'UPDATE' THEN
        PERFORM pg_advisory_xact_lock(hashtextextended(LEAST(OLD."slug", NEW."slug"), 0));
        PERFORM pg_advisory_xact_lock(hashtextextended(GREATEST(OLD."slug", NEW."slug"), 0));
    ELSE
        PERFORM pg_advisory_xact_lock(hashtextextended(NEW."slug", 0));
    END IF;

    IF EXISTS (
        SELECT 1
        FROM "business_handle_redirects"
        WHERE "sourceHandle" = NEW."slug"
    ) THEN
        RAISE EXCEPTION 'business handle is reserved by redirect history'
            USING ERRCODE = '23505', CONSTRAINT = 'business_handle_namespace_key';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "businesses_handle_namespace_guard"
BEFORE INSERT OR UPDATE OF "slug" ON "businesses"
FOR EACH ROW EXECUTE FUNCTION lock_and_check_business_handle();

CREATE OR REPLACE FUNCTION lock_and_check_retired_business_handle()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM pg_advisory_xact_lock(hashtextextended(NEW."sourceHandle", 0));

    IF EXISTS (
        SELECT 1
        FROM "businesses"
        WHERE "slug" = NEW."sourceHandle"
    ) THEN
        RAISE EXCEPTION 'retired handle conflicts with a current business handle'
            USING ERRCODE = '23505', CONSTRAINT = 'business_handle_namespace_key';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "business_handle_redirects_namespace_guard"
BEFORE INSERT OR UPDATE OF "sourceHandle" ON "business_handle_redirects"
FOR EACH ROW EXECUTE FUNCTION lock_and_check_retired_business_handle();
