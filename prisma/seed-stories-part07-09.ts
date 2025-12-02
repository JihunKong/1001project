import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface StoryData {
  writer: string;
  title: string;
  country: string;
  comment?: string;
  written_by: string;
  illustrated_by: string;
  edited_by: string;
  preface?: string;
  founder_message?: string;
  story: string;
  source_file?: string;
  categories?: string[];
  violence_level?: string;
  violence_score?: number;
  emotional_intensity?: string;
  age_appropriateness?: string;
  cover_image?: string;
  difficulty_level: string;
  word_count: number;
  character_count: number;
  difficulty_score: number;
  vocabulary_distribution: {
    Basic: number;
    Intermediate: number;
    Advanced: number;
  };
  story_word_count?: number;
  story_character_count?: number;
  story_difficulty_level?: string;
  educational_categories?: string[];
}

function extractSummary(storyText: string): string {
  const cleaned = storyText
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const sentences = cleaned.match(/[^.!?]+[.!?]+/g) || [];
  let summary = '';

  for (const sentence of sentences) {
    if (summary.length + sentence.length > 300) break;
    summary += sentence + ' ';
  }

  return summary.trim() || cleaned.substring(0, 300) + '...';
}

function normalizeCoverPath(coverImagePath?: string): string | null {
  if (!coverImagePath) return null;
  const filename = path.basename(coverImagePath);
  const publicPath = path.join(process.cwd(), 'public', 'covers', filename);
  if (fs.existsSync(publicPath)) {
    return `/covers/${filename}`;
  }
  console.log(`⚠️  Cover image not found: ${filename}`);
  return null;
}

function mapDifficultyToLevel(difficultyLevel: string): string {
  if (difficultyLevel.toLowerCase().includes('high school')) {
    return 'ADVANCED';
  } else if (difficultyLevel.toLowerCase().includes('middle school')) {
    return 'INTERMEDIATE';
  }
  return 'BEGINNER';
}

function mapDifficultyToAge(difficultyLevel: string): string {
  if (difficultyLevel.toLowerCase().includes('high school')) {
    return '13-18';
  } else if (difficultyLevel.toLowerCase().includes('middle school')) {
    return '9-12';
  }
  return '5-8';
}

async function main() {
  console.log('🚀 Starting stories import (part07, part08, part09)...\n');

  const jsonFiles = [
    '/Users/jihunkong/Downloads/stories_sample_part07.json',
    '/Users/jihunkong/Downloads/stories_sample_part08.json',
    '/Users/jihunkong/Downloads/stories_sample_part09.json'
  ];

  let totalStories = 0;
  let createdCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const jsonFile of jsonFiles) {
    console.log(`📖 Processing ${path.basename(jsonFile)}...`);

    if (!fs.existsSync(jsonFile)) {
      console.log(`❌ File not found: ${jsonFile}`);
      continue;
    }

    const fileContent = fs.readFileSync(jsonFile, 'utf-8');
    const stories: StoryData[] = JSON.parse(fileContent);

    console.log(`   Found ${stories.length} stories\n`);

    for (const storyData of stories) {
      totalStories++;

      try {
        const existingBook = await prisma.book.findFirst({
          where: {
            title: {
              equals: storyData.title,
              mode: 'insensitive'
            }
          }
        });

        if (existingBook) {
          console.log(`⏭️  Skipped (duplicate): "${storyData.title}"`);
          skippedCount++;
          continue;
        }

        const readingTime = Math.ceil(storyData.word_count / 200);
        const readingLevel = mapDifficultyToLevel(storyData.difficulty_level);
        const ageRange = mapDifficultyToAge(storyData.difficulty_level);
        const summary = storyData.preface || extractSummary(storyData.story);
        const coverImage = normalizeCoverPath(storyData.cover_image);

        const book = await prisma.book.create({
          data: {
            title: storyData.title,
            authorName: storyData.written_by || storyData.writer,
            illustratorName: storyData.illustrated_by || null,
            editorName: storyData.edited_by || null,
            country: storyData.country,
            content: storyData.story,
            summary: summary,
            contentType: 'TEXT',
            language: 'en',
            readingLevel,
            readingTime,
            ageRange,
            coverImage,
            educationalCategories: storyData.educational_categories || storyData.categories || [],
            category: storyData.educational_categories || storyData.categories || [],
            difficultyScore: storyData.difficulty_score,
            vocabularyDistribution: storyData.vocabulary_distribution
              ? JSON.parse(JSON.stringify(storyData.vocabulary_distribution))
              : undefined,
            isPublished: true,
            visibility: 'PUBLIC',
            featured: false,
            viewCount: 0,
            likeCount: 0,
            downloadCount: 0,
          },
        });

        console.log(`✅ Created: "${book.title}" from ${storyData.country}`);
        if (coverImage) {
          console.log(`   📸 Cover: ${coverImage}`);
        }
        console.log(`   📊 Level: ${readingLevel}, Age: ${ageRange}, Time: ${readingTime}min`);
        console.log('');
        createdCount++;

      } catch (error) {
        console.error(`❌ Error creating "${storyData.title}":`, error);
        errorCount++;
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Import Summary');
  console.log('='.repeat(60));
  console.log(`Total stories processed: ${totalStories}`);
  console.log(`✅ Successfully created: ${createdCount}`);
  console.log(`⏭️  Skipped (duplicates): ${skippedCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log('='.repeat(60) + '\n');
}

main()
  .catch((e) => {
    console.error('Import failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
