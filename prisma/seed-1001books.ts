import { config } from 'dotenv';
config({ path: '.env.local' });

import { PrismaClient, BookContentType, BookVisibility } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface BookData {
  folder: string;
  slug: string;
  title: string;
  language: string;
  ageRange: string;
  pdfPaths: {
    main: string | null;
    front: string | null;
    back: string | null;
  };
}

const DEFAULT_CATEGORIES = ['Children', 'African Stories', 'Educational'];
const DEFAULT_AUTHOR = 'Seeds of Empowerment';

async function main() {
  console.log('=== 1001books Database Seed Script ===\n');

  const bookDataPath = path.join(process.cwd(), 'scripts', 'book-data.json');

  if (!fs.existsSync(bookDataPath)) {
    console.error('Error: book-data.json not found. Run copy-1001books-pdfs.ts first.');
    process.exit(1);
  }

  const bookData: BookData[] = JSON.parse(fs.readFileSync(bookDataPath, 'utf-8'));
  console.log(`Found ${bookData.length} books to seed\n`);

  let successCount = 0;
  let updateCount = 0;
  let failCount = 0;

  for (const book of bookData) {
    try {
      const existingBook = await prisma.book.findFirst({
        where: {
          OR: [
            { title: book.title },
            { pdfKey: book.pdfPaths.main || undefined },
          ],
        },
      });

      const bookRecord = {
        title: book.title,
        authorName: DEFAULT_AUTHOR,
        language: book.language,
        ageRange: book.ageRange,
        contentType: BookContentType.PDF,
        pdfKey: book.pdfPaths.main,
        pdfFrontCover: book.pdfPaths.front,
        pdfBackCover: book.pdfPaths.back,
        coverImage: book.pdfPaths.front ? book.pdfPaths.front.replace('.pdf', '.png') : null,
        isPublished: true,
        visibility: BookVisibility.PUBLIC,
        category: DEFAULT_CATEGORIES,
        summary: `A story from the 1001 Stories collection: ${book.title}`,
        tags: ['1001stories', book.language === 'es' ? 'spanish' : 'english'],
      };

      if (existingBook) {
        await prisma.book.update({
          where: { id: existingBook.id },
          data: bookRecord,
        });
        console.log(`Updated: ${book.title} (ID: ${existingBook.id})`);
        updateCount++;
      } else {
        const newBook = await prisma.book.create({
          data: bookRecord,
        });
        console.log(`Created: ${book.title} (ID: ${newBook.id})`);
        successCount++;
      }
    } catch (error) {
      console.error(`Failed: ${book.title} - ${error}`);
      failCount++;
    }
  }

  console.log('\n=== Summary ===');
  console.log(`Created: ${successCount}`);
  console.log(`Updated: ${updateCount}`);
  console.log(`Failed: ${failCount}`);
  console.log(`Total: ${bookData.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
