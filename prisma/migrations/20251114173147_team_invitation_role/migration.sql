/*
  Warnings:

  - The `role` column on the `team_invitations` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "team_invitations" DROP COLUMN "role",
ADD COLUMN     "role" "BusinessRole" NOT NULL DEFAULT 'STAFF';
