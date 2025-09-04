-- Add tokenVersion column to users table for JWT session invalidation
-- This column was manually added to the database but never properly migrated
ALTER TABLE "users" ADD COLUMN "tokenVersion" INTEGER DEFAULT 1;

-- Add index for better performance on token validation queries
CREATE INDEX "users_tokenVersion_idx" ON "users"("tokenVersion");

-- Comments for documentation
-- This column is used for JWT token versioning to enable session invalidation
-- When a user's tokenVersion is incremented, all existing JWTs become invalid
-- Default value of 1 ensures all existing users have a valid tokenVersion