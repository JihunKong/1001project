import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface StorySample {
  writer: string;
  title: string;
  country: string;
  comment: string;
  written_by: string;
  illustrated_by: string;
  edited_by: string;
  preface?: string;
  founder_message?: string;
  story: string;
  source_file: string;
  difficulty_level: string;
  word_count: number;
  character_count: number;
  difficulty_score: number;
  vocabulary_distribution: {
    Basic: number;
    Intermediate: number;
    Advanced: number;
  };
  story_word_count: number;
  story_character_count: number;
  story_difficulty_level: string;
  educational_categories: string[];
}

async function main() {
  console.log('🚀 Starting sample stories import...');

  // Read JSON file
  const jsonPath = path.join(__dirname, 'stories_sample.json');
  const jsonData = fs.readFileSync(jsonPath, 'utf-8');
  const stories: StorySample[] = JSON.parse(jsonData);

  console.log(`📚 Found ${stories.length} stories to import`);

  let successCount = 0;
  let errorCount = 0;

  for (const story of stories) {
    try {
      // Calculate reading time (assuming 200 words per minute)
      const readingTime = Math.ceil(story.word_count / 200);

      // Map difficulty level to reading level
      let readingLevel = 'BEGINNER';
      if (story.difficulty_level.includes('Middle School')) {
        readingLevel = 'INTERMEDIATE';
      } else if (story.difficulty_level.includes('High School')) {
        readingLevel = 'ADVANCED';
      }

      // Determine age range based on difficulty
      let ageRange = '5-8';
      if (story.difficulty_level.includes('Middle School')) {
        ageRange = '9-12';
      } else if (story.difficulty_level.includes('High School')) {
        ageRange = '13-18';
      }

      // Create book record
      const book = await prisma.book.create({
        data: {
          title: story.title,
          authorName: story.written_by || story.writer,
          illustratorName: story.illustrated_by,
          editorName: story.edited_by,
          country: story.country,
          content: story.story,
          summary: story.preface || `A story from ${story.country} about ${story.title}`,
          contentType: 'TEXT',
          language: 'en',
          readingLevel,
          readingTime,
          ageRange,

          // Educational metadata
          educationalCategories: story.educational_categories,
          category: story.educational_categories,

          // Difficulty analysis
          difficultyScore: story.difficulty_score,
          vocabularyDistribution: story.vocabulary_distribution,

          // Publishing settings
          isPublished: true,
          visibility: 'PUBLIC',
          featured: false,

          // Metrics
          viewCount: 0,
          likeCount: 0,
          downloadCount: 0,
        },
      });

      console.log(`✅ Imported: "${book.title}" from ${story.country}`);
      successCount++;
    } catch (error) {
      console.error(`❌ Error importing "${story.title}":`, error);
      errorCount++;
    }
  }

  console.log('\n📊 Import Summary:');
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`   📚 Total: ${stories.length}`);
}

main()
  .catch((e) => {
    console.error('Fatal error during import:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
