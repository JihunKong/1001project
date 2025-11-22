import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function importMissingBooks() {
  try {
    console.log('🔍 Scanning /public/covers/ directory...');

    const coversDir = path.join(process.cwd(), 'public', 'covers');
    const files = fs.readdirSync(coversDir);

    const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf'));
    console.log(`📄 Found ${pdfFiles.length} PDF files in /public/covers/`);

    console.log('\n🔍 Checking database for existing books...');
    const existingBooks = await prisma.book.findMany({
      select: { coverImage: true, title: true }
    });

    const existingCoverPaths = new Set(
      existingBooks.map(book => book.coverImage?.replace('/covers/', ''))
    );

    console.log(`📚 Found ${existingBooks.length} existing books in database`);

    const missingFiles = pdfFiles.filter(file => !existingCoverPaths.has(file));
    console.log(`\n✨ ${missingFiles.length} books need to be imported\n`);

    if (missingFiles.length === 0) {
      console.log('✅ No missing books to import!');
      return;
    }

    let imported = 0;
    let skipped = 0;

    for (const filename of missingFiles) {
      try {
        const title = filename
          .replace('.pdf', '')
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (char) => char.toUpperCase());

        const book = await prisma.book.create({
          data: {
            title,
            authorName: 'Unknown Author',
            language: 'en',
            coverImage: `/covers/${filename}`,
            contentType: 'PDF',
            isPublished: true,
            category: ['IMPORTED'],
            ageRange: 'ALL',
            summary: `Imported from ${filename}`,
          }
        });

        console.log(`✅ Imported: ${title} (ID: ${book.id})`);
        imported++;
      } catch (error) {
        console.error(`❌ Failed to import ${filename}:`, error);
        skipped++;
      }
    }

    console.log(`\n📊 Import Summary:`);
    console.log(`   ✅ Successfully imported: ${imported}`);
    console.log(`   ❌ Skipped (errors): ${skipped}`);
    console.log(`   📚 Total books in database: ${existingBooks.length + imported}`);

  } catch (error) {
    console.error('❌ Import failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

importMissingBooks()
  .then(() => {
    console.log('\n✅ Import completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Import failed:', error);
    process.exit(1);
  });
