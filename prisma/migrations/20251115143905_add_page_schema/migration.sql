-- CreateEnum
CREATE TYPE "SectionType" AS ENUM ('HERO', 'ABOUT', 'SERVICES', 'GALLERY', 'CONTACT', 'FAQ', 'TESTIMONIALS', 'CUSTOM_HTML');

-- CreateTable
CREATE TABLE "Page" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "content" JSONB NOT NULL DEFAULT '[]',
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Page_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Page_businessId_idx" ON "Page"("businessId");

-- CreateIndex
CREATE INDEX "Page_businessId_isPublished_idx" ON "Page"("businessId", "isPublished");

-- CreateIndex
CREATE UNIQUE INDEX "Page_businessId_slug_key" ON "Page"("businessId", "slug");

-- AddForeignKey
ALTER TABLE "Page" ADD CONSTRAINT "Page_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
