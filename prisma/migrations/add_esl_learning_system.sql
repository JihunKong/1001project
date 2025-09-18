-- ESL Learning System Database Migration
-- This migration adds core tables for the ESL learning platform

-- Learning Progress table
CREATE TABLE IF NOT EXISTS "LearningProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "pagesRead" INTEGER DEFAULT 0,
    "totalPages" INTEGER DEFAULT 0,
    "readingTime" INTEGER DEFAULT 0,
    "lastPageRead" INTEGER DEFAULT 0,
    "startedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "isCompleted" BOOLEAN DEFAULT false,
    "metrics" JSONB,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "LearningProgress_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "LearningProgress_userId_bookId_key" UNIQUE ("userId", "bookId")
);

-- Vocabulary table
CREATE TABLE IF NOT EXISTS "Vocabulary" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "word" VARCHAR(100) NOT NULL,
    "definition" TEXT NOT NULL,
    "translations" JSONB,
    "pronunciation" TEXT,
    "partOfSpeech" TEXT,
    "contexts" JSONB[] DEFAULT ARRAY[]::JSONB[],
    "bookId" TEXT,
    "masteryLevel" INTEGER DEFAULT 0,
    "timesSeen" INTEGER DEFAULT 1,
    "timesCorrect" INTEGER DEFAULT 0,
    "lastSeen" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "Vocabulary_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Vocabulary_userId_word_key" UNIQUE ("userId", "word")
);

-- Quiz table
CREATE TABLE IF NOT EXISTS "Quiz" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT DEFAULT 'COMPREHENSION',
    "difficulty" TEXT,
    "questions" JSONB NOT NULL,
    "passingScore" INTEGER DEFAULT 70,
    "timeLimit" INTEGER,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "Quiz_pkey" PRIMARY KEY ("id")
);

-- Quiz Attempt table
CREATE TABLE IF NOT EXISTS "QuizAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "answers" JSONB NOT NULL,
    "timeSpent" INTEGER,
    "passed" BOOLEAN NOT NULL,
    "feedback" JSONB,
    "attemptNumber" INTEGER DEFAULT 1,
    "completedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "QuizAttempt_pkey" PRIMARY KEY ("id")
);

-- Book Club table
CREATE TABLE IF NOT EXISTS "BookClub" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN DEFAULT true,
    "isPublic" BOOLEAN DEFAULT true,
    "maxMembers" INTEGER,
    "language" TEXT,
    "level" TEXT,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "BookClub_pkey" PRIMARY KEY ("id")
);

-- Book Club Member table
CREATE TABLE IF NOT EXISTS "BookClubMember" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "BookClubMember_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "BookClubMember_clubId_userId_key" UNIQUE ("clubId", "userId")
);

-- Book Club Post table
CREATE TABLE IF NOT EXISTS "BookClubPost" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "parentId" TEXT,
    "likes" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "BookClubPost_pkey" PRIMARY KEY ("id")
);

-- Achievement table
CREATE TABLE IF NOT EXISTS "Achievement" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT,
    "category" TEXT NOT NULL,
    "criteria" JSONB NOT NULL,
    "xpValue" INTEGER DEFAULT 0,
    "tier" TEXT DEFAULT 'BRONZE',
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Achievement_name_key" UNIQUE ("name")
);

-- User Achievement table
CREATE TABLE IF NOT EXISTS "UserAchievement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "progress" INTEGER DEFAULT 0,
    "earnedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "UserAchievement_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "UserAchievement_userId_achievementId_key" UNIQUE ("userId", "achievementId")
);

-- User Stats table
CREATE TABLE IF NOT EXISTS "UserStats" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalXP" INTEGER DEFAULT 0,
    "level" INTEGER DEFAULT 1,
    "streak" INTEGER DEFAULT 0,
    "lastActive" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "booksRead" INTEGER DEFAULT 0,
    "wordsLearned" INTEGER DEFAULT 0,
    "quizzesPassed" INTEGER DEFAULT 0,
    "totalReadingTime" INTEGER DEFAULT 0,
    "postsCreated" INTEGER DEFAULT 0,
    "likesReceived" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "UserStats_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "UserStats_userId_key" UNIQUE ("userId")
);

-- Reading Session table
CREATE TABLE IF NOT EXISTS "ReadingSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "duration" INTEGER,
    "pagesRead" INTEGER DEFAULT 0,
    "wordsClicked" JSONB[] DEFAULT ARRAY[]::JSONB[],
    "highlights" JSONB[] DEFAULT ARRAY[]::JSONB[],
    "notes" JSONB[] DEFAULT ARRAY[]::JSONB[],
    
    CONSTRAINT "ReadingSession_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "LearningProgress_userId_idx" ON "LearningProgress"("userId");
CREATE INDEX IF NOT EXISTS "LearningProgress_bookId_idx" ON "LearningProgress"("bookId");
CREATE INDEX IF NOT EXISTS "Vocabulary_userId_idx" ON "Vocabulary"("userId");
CREATE INDEX IF NOT EXISTS "Vocabulary_word_idx" ON "Vocabulary"("word");
CREATE INDEX IF NOT EXISTS "Quiz_bookId_idx" ON "Quiz"("bookId");
CREATE INDEX IF NOT EXISTS "QuizAttempt_userId_idx" ON "QuizAttempt"("userId");
CREATE INDEX IF NOT EXISTS "QuizAttempt_quizId_idx" ON "QuizAttempt"("quizId");
CREATE INDEX IF NOT EXISTS "BookClub_bookId_idx" ON "BookClub"("bookId");
CREATE INDEX IF NOT EXISTS "BookClub_creatorId_idx" ON "BookClub"("creatorId");
CREATE INDEX IF NOT EXISTS "BookClubMember_userId_idx" ON "BookClubMember"("userId");
CREATE INDEX IF NOT EXISTS "BookClubPost_clubId_idx" ON "BookClubPost"("clubId");
CREATE INDEX IF NOT EXISTS "BookClubPost_userId_idx" ON "BookClubPost"("userId");
CREATE INDEX IF NOT EXISTS "UserAchievement_userId_idx" ON "UserAchievement"("userId");
CREATE INDEX IF NOT EXISTS "ReadingSession_userId_idx" ON "ReadingSession"("userId");
CREATE INDEX IF NOT EXISTS "ReadingSession_bookId_idx" ON "ReadingSession"("bookId");

-- Add foreign key constraints
ALTER TABLE "LearningProgress" ADD CONSTRAINT "LearningProgress_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
ALTER TABLE "LearningProgress" ADD CONSTRAINT "LearningProgress_bookId_fkey" 
    FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE;

ALTER TABLE "Vocabulary" ADD CONSTRAINT "Vocabulary_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
ALTER TABLE "Vocabulary" ADD CONSTRAINT "Vocabulary_bookId_fkey" 
    FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE SET NULL;

ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_bookId_fkey" 
    FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE;

ALTER TABLE "QuizAttempt" ADD CONSTRAINT "QuizAttempt_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
ALTER TABLE "QuizAttempt" ADD CONSTRAINT "QuizAttempt_quizId_fkey" 
    FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE;

ALTER TABLE "BookClub" ADD CONSTRAINT "BookClub_bookId_fkey" 
    FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE;
ALTER TABLE "BookClub" ADD CONSTRAINT "BookClub_creatorId_fkey" 
    FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT;

ALTER TABLE "BookClubMember" ADD CONSTRAINT "BookClubMember_clubId_fkey" 
    FOREIGN KEY ("clubId") REFERENCES "BookClub"("id") ON DELETE CASCADE;
ALTER TABLE "BookClubMember" ADD CONSTRAINT "BookClubMember_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;

ALTER TABLE "BookClubPost" ADD CONSTRAINT "BookClubPost_clubId_fkey" 
    FOREIGN KEY ("clubId") REFERENCES "BookClub"("id") ON DELETE CASCADE;
ALTER TABLE "BookClubPost" ADD CONSTRAINT "BookClubPost_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
ALTER TABLE "BookClubPost" ADD CONSTRAINT "BookClubPost_parentId_fkey" 
    FOREIGN KEY ("parentId") REFERENCES "BookClubPost"("id") ON DELETE SET NULL;

ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_achievementId_fkey" 
    FOREIGN KEY ("achievementId") REFERENCES "Achievement"("id") ON DELETE RESTRICT;

ALTER TABLE "UserStats" ADD CONSTRAINT "UserStats_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;

ALTER TABLE "ReadingSession" ADD CONSTRAINT "ReadingSession_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
ALTER TABLE "ReadingSession" ADD CONSTRAINT "ReadingSession_bookId_fkey" 
    FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE;