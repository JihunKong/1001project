import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Helper function to normalize title to filename format
function titleToFilename(title: string): string {
  // Convert to uppercase and replace spaces with underscores
  return title.toUpperCase().replace(/\s+/g, '_');
}

async function updateCoverImages() {
  try {
    // Get all JPG files in /public/covers/
    const coversDir = path.join('./public/covers');
    const jpgFiles = fs.readdirSync(coversDir)
      .filter(file => file.endsWith('.jpg'))
      .map(file => file.replace('.jpg', ''));

    console.log(`📊 Found ${jpgFiles.length} JPG cover files`);

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

    console.log(`\n📚 Found ${booksWithoutCovers.length} books without cover images\n`);

    let updated = 0;
    let notFound = 0;

    for (const book of booksWithoutCovers) {
      const normalizedTitle = titleToFilename(book.title);

      // Try exact match first
      let matchedFile = jpgFiles.find(file => file === normalizedTitle);

      // If no exact match, try case-insensitive partial match
      if (!matchedFile) {
        matchedFile = jpgFiles.find(file =>
          file.toUpperCase() === normalizedTitle.toUpperCase() ||
          file.toUpperCase().includes(normalizedTitle.toUpperCase()) ||
          normalizedTitle.toUpperCase().includes(file.toUpperCase())
        );
      }

      if (matchedFile) {
        const coverPath = `/covers/${matchedFile}.jpg`;
        await prisma.book.update({
          where: { id: book.id },
          data: { coverImage: coverPath }
        });
        console.log(`✅ Updated: "${book.title}" → ${coverPath}`);
        updated++;
      } else {
        console.log(`⚠️  No match found for: "${book.title}" (tried: ${normalizedTitle})`);
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
