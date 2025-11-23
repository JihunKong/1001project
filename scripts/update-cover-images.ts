import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface StoryData {
  title: string;
  writer?: string;
  written_by?: string;
  cover_image?: string;
}

async function updateCoverImages() {
  try {
    const jsonFiles = [
      './scripts/data/stories_sample_part01.json',
      './scripts/data/stories_sample_part02.json',
      './scripts/data/stories_sample_part03.json',
      './scripts/data/stories_sample_part04.json',
    ];

    // Build a map of title -> cover image path
    const coverMap = new Map<string, string>();

    for (const filePath of jsonFiles) {
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  File not found: ${filePath}`);
        continue;
      }

      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const stories: StoryData[] = JSON.parse(fileContent);

      for (const story of stories) {
        if (story.cover_image) {
          // Convert PDF path to JPG path
          // Example: "images/covers/Angels_Prayer.pdf" → "/covers/Angels_Prayer.jpg"
          let coverPath = story.cover_image
            .replace('images/covers/', '/covers/')
            .replace('.pdf', '.jpg');

          const lowerTitle = story.title.toLowerCase();
          coverMap.set(lowerTitle, coverPath);
        }
      }
    }

    console.log(`📊 Found ${coverMap.size} cover images in JSON files`);

    // Get books without cover images
    const booksWithoutCovers = await prisma.book.findMany({
      where: {
        contentType: 'TEXT',
        OR: [
          { coverImage: null },
          { coverImage: '' }
        ]
      },
      select: {
        id: true,
        title: true,
        authorName: true
      }
    });

    console.log(`\n📚 Found ${booksWithoutCovers.length} books without cover images`);

    let updated = 0;
    let notFound = 0;

    for (const book of booksWithoutCovers) {
      const lowerTitle = book.title.toLowerCase();
      const coverPath = coverMap.get(lowerTitle);

      if (coverPath) {
        // Verify the JPG file exists on the server
        const localPath = path.join('./public', coverPath);
        if (fs.existsSync(localPath)) {
          await prisma.book.update({
            where: { id: book.id },
            data: { coverImage: coverPath }
          });
          console.log(`✅ Updated: ${book.title} → ${coverPath}`);
          updated++;
        } else {
          console.log(`⚠️  File not found: ${localPath} for "${book.title}"`);
          notFound++;
        }
      } else {
        console.log(`⚠️  No cover image in JSON for: ${book.title}`);
        notFound++;
      }
    }

    console.log(`\n📊 Update Summary:`);
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ⚠️  Not found: ${notFound}`);

  } catch (error) {
    console.error('❌ Update failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

updateCoverImages()
  .then(() => {
    console.log('\n✅ Update completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Update failed:', error);
    process.exit(1);
  });
