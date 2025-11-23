import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface StoryData {
  writer: string;
  title: string;
  country: string;
  comment?: string;
  written_by?: string;
  illustrated_by?: string;
  edited_by?: string;
  preface?: string;
  founder_message?: string;
  story: string;
  source_file: string;
  difficulty_level?: string;
  word_count?: number;
  character_count?: number;
  difficulty_score?: number;
  vocabulary_distribution?: {
    Basic: number;
    Intermediate: number;
    Advanced: number;
  };
  story_word_count?: number;
  story_character_count?: number;
  story_difficulty_level?: string;
  educational_categories?: string[];
  cover_image?: string;
}

async function importTextStories() {
  try {
    const jsonFiles = [
      './scripts/data/stories_sample_part01.json',
      './scripts/data/stories_sample_part02.json',
      './scripts/data/stories_sample_part03.json',
      './scripts/data/stories_sample_part04.json',
      './scripts/data/stories_sample_part04a.json',
      './scripts/data/stories_sample_part04b.json',
    ];

    let totalImported = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;

    for (const filePath of jsonFiles) {
      console.log(`\n📄 Processing ${path.basename(filePath)}...`);

      if (!fs.existsSync(filePath)) {
        console.log(`   ⚠️  File not found, skipping: ${filePath}`);
        continue;
      }

      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const stories: StoryData[] = JSON.parse(fileContent);

      console.log(`   Found ${stories.length} stories in file`);

      for (const story of stories) {
        if (!story.story || !story.title) {
          console.log(`   ⚠️  Skipping story without content: ${story.title || 'Untitled'}`);
          totalSkipped++;
          continue;
        }

        try {
          const existingBook = await prisma.book.findFirst({
            where: {
              title: story.title,
              authorName: story.writer || story.written_by || 'Unknown'
            }
          });

          const bookData = {
            title: story.title,
            authorName: story.writer || story.written_by || 'Unknown',
            language: 'en',
            contentType: 'TEXT' as const,
            content: story.story,
            summary: story.comment || `Story from ${story.country}`,
            country: story.country,
            category: story.educational_categories || ['IMPORTED'],
            ageRange: 'ALL',
            readingTime: story.word_count ? Math.ceil(story.word_count / 200) : undefined,
            difficultyScore: story.difficulty_score ? Math.round(story.difficulty_score) : undefined,
            readingLevel: story.difficulty_level || story.story_difficulty_level,
            educationalCategories: story.educational_categories,
            isPublished: true,
            viewCount: 0,
            likeCount: 0,
          };

          if (existingBook) {
            await prisma.book.update({
              where: { id: existingBook.id },
              data: bookData
            });
            console.log(`   ✅ Updated: ${story.title}`);
            totalUpdated++;
          } else {
            await prisma.book.create({
              data: bookData
            });
            console.log(`   ✅ Imported: ${story.title}`);
            totalImported++;
          }
        } catch (error) {
          console.error(`   ❌ Failed to process "${story.title}":`, error);
          totalSkipped++;
        }
      }
    }

    console.log(`\n📊 Import Summary:`);
    console.log(`   ✅ Successfully imported: ${totalImported}`);
    console.log(`   🔄 Updated existing: ${totalUpdated}`);
    console.log(`   ⚠️  Skipped (errors): ${totalSkipped}`);
    console.log(`   📚 Total processed: ${totalImported + totalUpdated + totalSkipped}`);

  } catch (error) {
    console.error('❌ Import failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

importTextStories()
  .then(() => {
    console.log('\n✅ Import completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Import failed:', error);
    process.exit(1);
  });
