-- Add thumbnail storage fields to Book model
ALTER TABLE "books" ADD COLUMN "thumbnails" JSONB;
ALTER TABLE "books" ADD COLUMN "thumbnail_generated_at" TIMESTAMP(3);
ALTER TABLE "books" ADD COLUMN "thumbnail_config" JSONB;

-- Create index for thumbnail queries
CREATE INDEX "books_thumbnail_generated_at_idx" ON "books"("thumbnail_generated_at");

-- Update existing books with default thumbnail config
UPDATE "books" SET "thumbnail_config" = '{"frontCover": {"width": 400, "height": 533, "quality": 90}, "backCover": {"width": 400, "height": 533, "quality": 90}, "pages": {"width": 400, "height": 533, "quality": 90, "maxPages": 20}}' WHERE "thumbnail_config" IS NULL;