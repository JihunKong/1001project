import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface StoryData {
  title: string;
  writer?: string;
  written_by?: string;
  country?: string;
  story: string;
  comment?: string;
  educational_categories?: string[];
  difficulty_level?: string;
  difficulty_score?: number;
  vocabulary_distribution?: {
    Basic?: number;
    Intermediate?: number;
    Advanced?: number;
  };
  word_count?: number;
  cover_image?: string;
}

function extractSummary(content: string): string {
  if (!content) return '';
  const stripped = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return stripped.substring(0, 300) + (stripped.length > 300 ? '...' : '');
}

function titleToFilename(title: string): string {
  return title.replace(/\s+/g, '_').replace(/[^\w-]/g, '');
}

async function enhanceTextBooksMetadata() {
  try {
    const jsonFiles = [
      '/app/uploads/data/stories_sample_part01.json',
      '/app/uploads/data/stories_sample_part02.json',
      '/app/uploads/data/stories_sample_part03.json',
      '/app/uploads/data/stories_sample_part04.json',
    ];

    const storyMap = new Map<string, StoryData>();

    for (const filePath of jsonFiles) {
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  File not found: ${filePath}`);
        continue;
      }

      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const stories: StoryData[] = JSON.parse(fileContent);

      for (const story of stories) {
        const lowerTitle = story.title.toLowerCase();
        storyMap.set(lowerTitle, story);
      }
    }

    console.log(`📊 Loaded ${storyMap.size} stories from JSON files\n`);

    const textBooks = await prisma.book.findMany({
      where: { contentType: 'TEXT' },
      select: {
        id: true,
        title: true,
        authorName: true,
        coverImage: true,
        educationalCategories: true,
        tags: true,
        summary: true,
      }
    });

    console.log(`📚 Found ${textBooks.length} TEXT books in database\n`);

    let updated = 0;
    let notMatched = 0;

    for (const book of textBooks) {
      const lowerTitle = book.title.toLowerCase();
      const story = storyMap.get(lowerTitle);

      if (!story) {
        console.log(`⚠️  No JSON match for: "${book.title}"`);
        notMatched++;
        continue;
      }

      const coverPath = story.cover_image
        ? story.cover_image
            .replace('images/covers/', '/covers/')
            .replace('.pdf', '.jpg')
        : null;

      const updateData: any = {};

      if (coverPath) {
        const localPath = path.join('./public', coverPath);
        if (fs.existsSync(localPath)) {
          updateData.coverImage = coverPath;
        }
      }

      if (story.educational_categories && story.educational_categories.length > 0) {
        updateData.educationalCategories = story.educational_categories;
        updateData.tags = story.educational_categories;
      }

      const categories: string[] = [];
      if (story.country) {
        categories.push(story.country);
        updateData.country = story.country;
      }
      if (story.difficulty_level) {
        categories.push(story.difficulty_level);
        updateData.readingLevel = story.difficulty_level;
      }
      if (categories.length > 0) {
        updateData.category = categories;
      }

      if (story.comment && story.comment.trim()) {
        updateData.summary = story.comment.trim();
      } else if (story.story && (!book.summary || book.summary.trim() === '')) {
        updateData.summary = extractSummary(story.story);
      }

      if (story.difficulty_score !== undefined) {
        updateData.difficultyScore = Math.round(story.difficulty_score);
      }

      if (story.vocabulary_distribution) {
        updateData.vocabularyDistribution = story.vocabulary_distribution;
      }

      if (story.word_count) {
        updateData.readingTime = Math.ceil(story.word_count / 200);
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.book.update({
          where: { id: book.id },
          data: updateData
        });

        console.log(`✅ Updated: "${book.title}"`);
        if (updateData.coverImage) console.log(`   📷 Cover: ${updateData.coverImage}`);
        if (updateData.educationalCategories) console.log(`   🏷️  Categories: ${updateData.educationalCategories.join(', ')}`);
        if (updateData.summary) console.log(`   📝 Summary: ${updateData.summary.substring(0, 50)}...`);
        if (updateData.country) console.log(`   🌍 Country: ${updateData.country}`);
        console.log('');
        updated++;
      }
    }

    console.log(`\n📊 Enhancement Summary:`);
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ⚠️  No match: ${notMatched}`);
    console.log(`   📚 Total TEXT books: ${textBooks.length}`);

  } catch (error) {
    console.error('❌ Enhancement failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

enhanceTextBooksMetadata()
  .then(() => {
    console.log('\n✅ Enhancement completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Enhancement failed:', error);
    process.exit(1);
  });
