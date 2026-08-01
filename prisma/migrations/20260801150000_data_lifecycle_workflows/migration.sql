-- CreateEnum
CREATE TYPE "DataLifecycleRequestType" AS ENUM ('ACCOUNT_DELETION');

-- CreateEnum
CREATE TYPE "DataLifecycleRequestStatus" AS ENUM (
  'REQUESTED',
  'SCHEDULED',
  'REVIEW_REQUIRED',
  'CANCELLED',
  'COMPLETED',
  'REJECTED'
);

-- Keep lifecycle audit records after an account is removed.
ALTER TABLE "security_logs"
  DROP CONSTRAINT IF EXISTS "security_logs_userId_fkey";

ALTER TABLE "security_logs"
  ADD CONSTRAINT "security_logs_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "data_lifecycle_requests" (
  "id" TEXT NOT NULL,
  "type" "DataLifecycleRequestType" NOT NULL,
  "status" "DataLifecycleRequestStatus" NOT NULL DEFAULT 'REQUESTED',
  "requestedByUserId" TEXT,
  "subjectUserId" TEXT,
  "businessId" TEXT,
  "verificationMethod" TEXT NOT NULL DEFAULT 'CURRENT_PASSWORD',
  "scheduledFor" TIMESTAMP(3),
  "holdReason" TEXT,
  "metadata" JSONB,
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "cancelledAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "data_lifecycle_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "data_lifecycle_requests_requestedByUserId_requestedAt_idx"
  ON "data_lifecycle_requests"("requestedByUserId", "requestedAt");
CREATE INDEX "data_lifecycle_requests_subjectUserId_status_idx"
  ON "data_lifecycle_requests"("subjectUserId", "status");
CREATE INDEX "data_lifecycle_requests_businessId_status_idx"
  ON "data_lifecycle_requests"("businessId", "status");
CREATE INDEX "data_lifecycle_requests_status_scheduledFor_idx"
  ON "data_lifecycle_requests"("status", "scheduledFor");
CREATE UNIQUE INDEX "data_lifecycle_requests_one_active_account_deletion_idx"
  ON "data_lifecycle_requests"("subjectUserId", "type")
  WHERE "type" = 'ACCOUNT_DELETION'
    AND "status" IN ('REQUESTED', 'SCHEDULED', 'REVIEW_REQUIRED');

ALTER TABLE "data_lifecycle_requests"
  ADD CONSTRAINT "data_lifecycle_requests_requestedByUserId_fkey"
  FOREIGN KEY ("requestedByUserId") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "data_lifecycle_requests"
  ADD CONSTRAINT "data_lifecycle_requests_subjectUserId_fkey"
  FOREIGN KEY ("subjectUserId") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "data_lifecycle_requests"
  ADD CONSTRAINT "data_lifecycle_requests_businessId_fkey"
  FOREIGN KEY ("businessId") REFERENCES "businesses"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
