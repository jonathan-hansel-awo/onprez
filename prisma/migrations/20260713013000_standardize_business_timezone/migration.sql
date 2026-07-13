ALTER TABLE "businesses"
ALTER COLUMN "timezone" SET DEFAULT 'Europe/London';

UPDATE "businesses"
SET "timezone" = 'Europe/London'
WHERE "timezone" IN ('BST/LONDON', 'GMT/BST', 'BST', 'GMT')
   OR BTRIM("timezone") = '';
