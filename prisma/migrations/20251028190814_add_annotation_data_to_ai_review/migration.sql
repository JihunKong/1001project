-- AlterTable
ALTER TABLE "ai_reviews" ADD COLUMN IF NOT EXISTS "annotationData" JSONB;
