CREATE TABLE "appointment_status_transitions" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "fromStatus" "AppointmentStatus" NOT NULL,
    "toStatus" "AppointmentStatus" NOT NULL,
    "changedBy" TEXT,
    "changedByType" TEXT NOT NULL,
    "reason" TEXT,
    "metadata" JSONB,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "appointment_status_transitions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "appointment_status_transitions_appointmentId_changedAt_idx"
ON "appointment_status_transitions"("appointmentId", "changedAt");

CREATE INDEX "appointment_status_transitions_businessId_changedAt_idx"
ON "appointment_status_transitions"("businessId", "changedAt");

ALTER TABLE "appointment_status_transitions"
ADD CONSTRAINT "appointment_status_transitions_appointmentId_fkey"
FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "appointment_status_transitions"
ADD CONSTRAINT "appointment_status_transitions_businessId_fkey"
FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
