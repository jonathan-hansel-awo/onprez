-- Keep basic service creation compatible with production databases that predate
-- the service gallery field or created it without a database default.
ALTER TABLE "services"
ADD COLUMN IF NOT EXISTS "galleryImages" TEXT[];

UPDATE "services"
SET "galleryImages" = ARRAY[]::TEXT[]
WHERE "galleryImages" IS NULL;

ALTER TABLE "services"
ALTER COLUMN "galleryImages" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "galleryImages" SET NOT NULL;
