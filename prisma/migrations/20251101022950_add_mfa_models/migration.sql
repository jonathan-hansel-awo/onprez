/*
  Warnings:

  - You are about to drop the column `code` on the `mfa_backup_codes` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `mfa_secrets` table. All the data in the column will be lost.
  - You are about to drop the column `secret` on the `mfa_secrets` table. All the data in the column will be lost.
  - You are about to drop the column `verifiedAt` on the `mfa_secrets` table. All the data in the column will be lost.
  - Added the required column `hashedCode` to the `mfa_backup_codes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `encryptedSecret` to the `mfa_secrets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `iv` to the `mfa_secrets` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."mfa_secrets_userId_idx";

-- DropIndex
DROP INDEX "public"."users_email_idx";

-- AlterTable
ALTER TABLE "mfa_backup_codes" DROP COLUMN "code",
ADD COLUMN     "hashedCode" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "mfa_secrets" DROP COLUMN "isActive",
DROP COLUMN "secret",
DROP COLUMN "verifiedAt",
ADD COLUMN     "encryptedSecret" TEXT NOT NULL,
ADD COLUMN     "iv" TEXT NOT NULL,
ADD COLUMN     "verified" BOOLEAN NOT NULL DEFAULT false;
