import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface StoryData {
  title: string;
  writer: string;
  country: string;
  story: string;
  cover_image?: string;
  educational_categories?: string[];
  difficulty_score?: number;
  vocabulary_distribution?: {
    Basic: number;
    Intermediate: number;
    Advanced: number;
  };
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

  const pdfPath = path.join(process.cwd(), 'public', 'covers', filename.replace(/\..+$/, '.pdf'));
  if (fs.existsSync(pdfPath)) {
    return `/covers/${path.basename(pdfPath)}`;
  }

  const jpgPath = path.join(process.cwd(), 'public', 'covers', filename.replace(/\..+$/, '.jpg'));
  if (fs.existsSync(jpgPath)) {
    return `/covers/${path.basename(jpgPath)}`;
  }

  console.log(`⚠️  Cover image not found: ${filename}`);
  return null;
}

async function main() {
  console.log('🚀 Starting migration: Adding cover images and summaries to books\n');

  const jsonFiles = [
    '/tmp/stories_sample_part01.json',
    '/tmp/stories_sample_part02.json',
    '/tmp/stories_sample_part03.json',
    '/tmp/stories_sample_part04a.json',
    '/tmp/stories_sample_part04b.json'
  ];

  let totalStories = 0;
  let updatedCount = 0;
  let notFoundCount = 0;
  let errorCount = 0;

  for (const jsonFile of jsonFiles) {
    console.log(`📖 Reading ${path.basename(jsonFile)}...`);

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

        if (!existingBook) {
          console.log(`⚠️  Book not found in database: "${storyData.title}"`);
          notFoundCount++;
          continue;
        }

        const summary = extractSummary(storyData.story);
        const coverImage = normalizeCoverPath(storyData.cover_image);

        await prisma.book.update({
          where: { id: existingBook.id },
          data: {
            summary: summary,
            coverImage: coverImage,
            educationalCategories: storyData.educational_categories || [],
            difficultyScore: storyData.difficulty_score,
            vocabularyDistribution: storyData.vocabulary_distribution
              ? JSON.parse(JSON.stringify(storyData.vocabulary_distribution))
              : undefined
          }
        });

        console.log(`✅ Updated: "${storyData.title}"`);
        if (coverImage) {
          console.log(`   📸 Cover: ${coverImage}`);
        } else {
          console.log(`   ⚠️  No cover image`);
        }
        console.log(`   📝 Summary: ${summary.substring(0, 80)}...`);
        console.log('');

        updatedCount++;

      } catch (error) {
        console.error(`❌ Error updating "${storyData.title}":`, error);
        errorCount++;
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Migration Summary');
  console.log('='.repeat(60));
  console.log(`Total stories processed: ${totalStories}`);
  console.log(`✅ Successfully updated: ${updatedCount}`);
  console.log(`⚠️  Not found in database: ${notFoundCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log('='.repeat(60) + '\n');
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
