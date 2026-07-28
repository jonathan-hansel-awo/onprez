-- CreateEnum
CREATE TYPE "PushNotificationEventType" AS ENUM (
    'NEW_BOOKING',
    'BOOKING_CANCELLED',
    'BOOKING_RESCHEDULED'
);

-- CreateEnum
CREATE TYPE "PushNotificationOutboxStatus" AS ENUM (
    'PENDING',
    'PROCESSING',
    'DELIVERED',
    'PARTIAL',
    'FAILED',
    'NO_RECIPIENTS'
);

-- CreateEnum
CREATE TYPE "PushNotificationDeliveryStatus" AS ENUM (
    'PENDING',
    'DELIVERED',
    'RETRY',
    'FAILED',
    'EXPIRED'
);

-- CreateTable
CREATE TABLE "push_notification_outbox" (
    "id" TEXT NOT NULL,
    "eventKey" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "eventType" "PushNotificationEventType" NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "PushNotificationOutboxStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastAttemptAt" TIMESTAMP(3),
    "processedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "push_notification_outbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "push_notification_deliveries" (
    "id" TEXT NOT NULL,
    "outboxId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "status" "PushNotificationDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "failureCode" TEXT,
    "lastError" TEXT,
    "deviceName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "push_notification_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "push_notification_outbox_eventKey_key"
ON "push_notification_outbox"("eventKey");

-- CreateIndex
CREATE INDEX "push_notification_outbox_status_availableAt_idx"
ON "push_notification_outbox"("status", "availableAt");

-- CreateIndex
CREATE INDEX "push_notification_outbox_businessId_createdAt_idx"
ON "push_notification_outbox"("businessId", "createdAt");

-- CreateIndex
CREATE INDEX "push_notification_outbox_appointmentId_createdAt_idx"
ON "push_notification_outbox"("appointmentId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "push_notification_deliveries_outboxId_subscriptionId_key"
ON "push_notification_deliveries"("outboxId", "subscriptionId");

-- CreateIndex
CREATE INDEX "push_notification_deliveries_outboxId_status_idx"
ON "push_notification_deliveries"("outboxId", "status");

-- CreateIndex
CREATE INDEX "push_notification_deliveries_userId_createdAt_idx"
ON "push_notification_deliveries"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "push_notification_outbox"
ADD CONSTRAINT "push_notification_outbox_businessId_fkey"
FOREIGN KEY ("businessId") REFERENCES "businesses"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "push_notification_outbox"
ADD CONSTRAINT "push_notification_outbox_appointmentId_fkey"
FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "push_notification_deliveries"
ADD CONSTRAINT "push_notification_deliveries_outboxId_fkey"
FOREIGN KEY ("outboxId") REFERENCES "push_notification_outbox"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "push_notification_deliveries"
ADD CONSTRAINT "push_notification_deliveries_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "push_notification_deliveries"
ADD CONSTRAINT "push_notification_deliveries_subscriptionId_fkey"
FOREIGN KEY ("subscriptionId") REFERENCES "push_subscriptions"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
