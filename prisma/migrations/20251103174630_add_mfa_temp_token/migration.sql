-- CreateTable
CREATE TABLE "mfa_temp_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mfa_temp_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mfa_temp_tokens_token_key" ON "mfa_temp_tokens"("token");

-- CreateIndex
CREATE INDEX "mfa_temp_tokens_userId_idx" ON "mfa_temp_tokens"("userId");

-- CreateIndex
CREATE INDEX "mfa_temp_tokens_token_idx" ON "mfa_temp_tokens"("token");

-- AddForeignKey
ALTER TABLE "mfa_temp_tokens" ADD CONSTRAINT "mfa_temp_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
