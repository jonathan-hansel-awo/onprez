-- AlterTable
ALTER TABLE "Page" ADD COLUMN     "lastPublishedBy" TEXT,
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "publishedContent" JSONB,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;
