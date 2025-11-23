import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import * as fs from 'fs';
import * as path from 'path';

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

export async function POST(req: NextRequest) {
  try {
    // Authentication check - ADMIN only
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin only' },
        { status: 403 }
      );
    }

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
    const results: string[] = [];

    for (const filePath of jsonFiles) {
      results.push(`\n📄 Processing ${path.basename(filePath)}...`);

      if (!fs.existsSync(filePath)) {
        results.push(`   ⚠️  File not found, skipping: ${filePath}`);
        continue;
      }

      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const stories: StoryData[] = JSON.parse(fileContent);

      results.push(`   Found ${stories.length} stories in file`);

      for (const story of stories) {
        if (!story.story || !story.title) {
          results.push(`   ⚠️  Skipping story without content: ${story.title || 'Untitled'}`);
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
            results.push(`   ✅ Updated: ${story.title}`);
            totalUpdated++;
          } else {
            await prisma.book.create({
              data: bookData
            });
            results.push(`   ✅ Imported: ${story.title}`);
            totalImported++;
          }
        } catch (error) {
          results.push(`   ❌ Failed to process "${story.title}": ${error}`);
          totalSkipped++;
        }
      }
    }

    results.push(`\n📊 Import Summary:`);
    results.push(`   ✅ Successfully imported: ${totalImported}`);
    results.push(`   🔄 Updated existing: ${totalUpdated}`);
    results.push(`   ⚠️  Skipped (errors): ${totalSkipped}`);
    results.push(`   📚 Total processed: ${totalImported + totalUpdated + totalSkipped}`);

    return NextResponse.json({
      success: true,
      totalImported,
      totalUpdated,
      totalSkipped,
      total: totalImported + totalUpdated + totalSkipped,
      results: results.join('\n')
    });

  } catch (error) {
    console.error('❌ Import failed:', error);
    return NextResponse.json(
      { error: 'Import failed', details: String(error) },
      { status: 500 }
    );
  }
}
