-- CreateTable
CREATE TABLE "public"."book_favorites" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "book_favorites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "book_favorites_userId_idx" ON "public"."book_favorites"("userId");

-- CreateIndex
CREATE INDEX "book_favorites_bookId_idx" ON "public"."book_favorites"("bookId");

-- CreateIndex
CREATE UNIQUE INDEX "book_favorites_userId_bookId_key" ON "public"."book_favorites"("userId", "bookId");

-- AddForeignKey
ALTER TABLE "public"."book_favorites" ADD CONSTRAINT "book_favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."book_favorites" ADD CONSTRAINT "book_favorites_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "public"."books"("id") ON DELETE CASCADE ON UPDATE CASCADE;
