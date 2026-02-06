import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

const BOOKS_DIR = path.join(process.cwd(), 'public', 'books');

async function main() {
  console.log('🚀 Starting: Register cover.png files to database\n');

  if (!fs.existsSync(BOOKS_DIR)) {
    console.error(`❌ Books directory not found: ${BOOKS_DIR}`);
    process.exit(1);
  }

  const bookFolders = fs.readdirSync(BOOKS_DIR);
  let updatedCount = 0;
  let skippedCount = 0;
  let notFoundCount = 0;
  let noCoverCount = 0;

  console.log(`📂 Found ${bookFolders.length} folders in ${BOOKS_DIR}\n`);

  for (const folder of bookFolders) {
    const folderPath = path.join(BOOKS_DIR, folder);

    if (!fs.statSync(folderPath).isDirectory()) {
      continue;
    }

    const coverPath = path.join(folderPath, 'cover.png');
    const coverExists = fs.existsSync(coverPath);

    if (!coverExists) {
      noCoverCount++;
      continue;
    }

    const coverImagePath = `/books/${folder}/cover.png`;

    const book = await prisma.book.findFirst({
      where: {
        OR: [
          { pdfKey: { contains: folder } },
          { pdfKey: { contains: `/${folder}/` } },
          { pdfStorageKey: { contains: folder } }
        ]
      }
    });

    if (!book) {
      console.log(`⚠️  No book found in DB for folder: ${folder}`);
      notFoundCount++;
      continue;
    }

    if (book.coverImage) {
      console.log(`⏭️  Skipping "${book.title}" - already has cover: ${book.coverImage}`);
      skippedCount++;
      continue;
    }

    await prisma.book.update({
      where: { id: book.id },
      data: { coverImage: coverImagePath }
    });

    console.log(`✅ Updated "${book.title}" with cover: ${coverImagePath}`);
    updatedCount++;
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Summary');
  console.log('='.repeat(60));
  console.log(`📂 Total folders: ${bookFolders.length}`);
  console.log(`✅ Updated: ${updatedCount}`);
  console.log(`⏭️  Skipped (already has cover): ${skippedCount}`);
  console.log(`📚 No cover.png in folder: ${noCoverCount}`);
  console.log(`⚠️  Folder not matched to DB: ${notFoundCount}`);
  console.log('='.repeat(60) + '\n');
}

main()
  .catch((e) => {
    console.error('Script failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
