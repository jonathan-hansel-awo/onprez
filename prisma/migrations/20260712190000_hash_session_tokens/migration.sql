-- Existing rows contain bearer credentials and cannot be converted safely in SQL.
-- Force a one-time logout during deployment before all new sessions use SHA-256 digests.
DELETE FROM "sessions";

COMMENT ON COLUMN "sessions"."token" IS 'SHA-256 digest of the access token; never store the bearer token';
COMMENT ON COLUMN "sessions"."refreshToken" IS 'SHA-256 digest of the refresh token; never store the bearer token';
