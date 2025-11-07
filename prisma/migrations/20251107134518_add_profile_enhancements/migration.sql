-- AlterTable
ALTER TABLE "profiles" ADD COLUMN "avatarUrl" TEXT,
ADD COLUMN "coverImageUrl" TEXT,
ADD COLUMN "tags" TEXT[],
ADD COLUMN "cachedStats" JSONB,
ADD COLUMN "statsUpdatedAt" TIMESTAMP(3);
