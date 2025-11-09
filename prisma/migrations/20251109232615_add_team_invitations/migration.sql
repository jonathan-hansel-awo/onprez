-- CreateTable
CREATE TABLE "team_invitations" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "invitedBy" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "team_invitations_token_key" ON "team_invitations"("token");

-- CreateIndex
CREATE INDEX "team_invitations_email_idx" ON "team_invitations"("email");

-- CreateIndex
CREATE INDEX "team_invitations_token_idx" ON "team_invitations"("token");

-- CreateIndex
CREATE INDEX "team_invitations_status_idx" ON "team_invitations"("status");

-- CreateIndex
CREATE UNIQUE INDEX "team_invitations_businessId_email_key" ON "team_invitations"("businessId", "email");

-- AddForeignKey
ALTER TABLE "team_invitations" ADD CONSTRAINT "team_invitations_invitedBy_fkey" FOREIGN KEY ("invitedBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_invitations" ADD CONSTRAINT "team_invitations_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
