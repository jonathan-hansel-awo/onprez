-- Give each business explicit control over whether its published presence page
-- may be indexed and included in the public sitemap.
ALTER TABLE "businesses"
ADD COLUMN "allowSearchEngineIndexing" BOOLEAN NOT NULL DEFAULT true;
