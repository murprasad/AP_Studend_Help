// Apply Flashcard + FlashcardReview tables + FlashcardType enum to prod
// Postgres. Same HTTP-adapter pattern as apply-funnel-event-table.mjs.
//
// Idempotent: all DDL uses IF NOT EXISTS.
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

// 1. Create FlashcardType enum (can't use IF NOT EXISTS on CREATE TYPE,
//    so we wrap in a DO block that checks pg_type first).
console.log(`Creating FlashcardType enum...`);
await sql`
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'FlashcardType') THEN
      CREATE TYPE "FlashcardType" AS ENUM (
        'RECALL', 'APPLICATION', 'CLOZE', 'MISCONCEPTION',
        'COMPARE_CONTRAST', 'SEQUENCE', 'DIAGRAM', 'EXAM_TIP'
      );
    END IF;
  END $$;
`;

// 2. Flashcards table.
console.log(`Creating flashcards table...`);
await sql`
  CREATE TABLE IF NOT EXISTS "flashcards" (
    "id" TEXT NOT NULL,
    "course" "ApCourse" NOT NULL,
    "unit" "ApUnit" NOT NULL,
    "topic" TEXT NOT NULL,
    "concept" TEXT NOT NULL,
    "cardType" "FlashcardType" NOT NULL,
    "difficulty" "Difficulty" NOT NULL DEFAULT 'MEDIUM',
    "front" TEXT NOT NULL,
    "back" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "cardData" JSONB,
    "hints" JSONB,
    "examRelevance" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "bloomLevel" TEXT,
    "contentHash" TEXT NOT NULL,
    "isApproved" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "modelUsed" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "flashcards_pkey" PRIMARY KEY ("id")
  )
`;
await sql`CREATE UNIQUE INDEX IF NOT EXISTS "flashcards_contentHash_key" ON "flashcards"("contentHash")`;
await sql`CREATE INDEX IF NOT EXISTS "flashcards_course_unit_cardType_difficulty_idx" ON "flashcards"("course","unit","cardType","difficulty")`;
await sql`CREATE INDEX IF NOT EXISTS "flashcards_course_concept_idx" ON "flashcards"("course","concept")`;
await sql`CREATE INDEX IF NOT EXISTS "flashcards_userId_unit_cardType_idx" ON "flashcards"("userId","unit","cardType")`;

// 3. FlashcardReview table with FKs to users + flashcards.
console.log(`Creating flashcard_reviews table...`);
await sql`
  CREATE TABLE IF NOT EXISTS "flashcard_reviews" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "flashcardId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "responseTimeMs" INTEGER NOT NULL DEFAULT 0,
    "easeFactor" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "interval" INTEGER NOT NULL DEFAULT 1,
    "repetitions" INTEGER NOT NULL DEFAULT 0,
    "nextReviewAt" TIMESTAMP(3) NOT NULL,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "flashcard_reviews_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "flashcard_reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "flashcard_reviews_flashcardId_fkey" FOREIGN KEY ("flashcardId") REFERENCES "flashcards"("id") ON DELETE CASCADE ON UPDATE CASCADE
  )
`;
await sql`CREATE INDEX IF NOT EXISTS "flashcard_reviews_userId_flashcardId_reviewedAt_idx" ON "flashcard_reviews"("userId","flashcardId","reviewedAt")`;
await sql`CREATE INDEX IF NOT EXISTS "flashcard_reviews_userId_nextReviewAt_idx" ON "flashcard_reviews"("userId","nextReviewAt")`;

// 4. Verify by counting rows (both tables should exist and have 0 rows).
const flashcards = await sql`SELECT COUNT(*)::int AS n FROM "flashcards"`;
const reviews = await sql`SELECT COUNT(*)::int AS n FROM "flashcard_reviews"`;
console.log(`\nVerification:`);
console.log(`  flashcards: ${flashcards[0].n} rows`);
console.log(`  flashcard_reviews: ${reviews[0].n} rows`);
