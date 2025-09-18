import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function updateRealBooks() {
  try {
    // First, delete all dummy books
    console.log('🗑️  Deleting dummy books...');
    await prisma.book.deleteMany({
      where: {
        OR: [
          { id: { startsWith: 'book-' } },
          { id: { startsWith: 'sample-book-' } },
        ]
      }
    });

    // Get all book directories from public/books
    const booksDir = path.join(process.cwd(), 'public', 'books');
    const bookDirs = fs.readdirSync(booksDir).filter(dir => {
      const fullPath = path.join(booksDir, dir);
      return fs.statSync(fullPath).isDirectory() && !dir.startsWith('.');
    });

    console.log(`📚 Found ${bookDirs.length} real books in public/books`);

    // Create book records for each real book
    for (const bookDir of bookDirs) {
      const bookPath = path.join(booksDir, bookDir);
      const mainPdfPath = path.join(bookPath, 'main.pdf');
      
      // Check if main.pdf exists
      if (!fs.existsSync(mainPdfPath)) {
        console.log(`⚠️  Skipping ${bookDir} - no main.pdf found`);
        continue;
      }

      // Create a human-readable title from directory name
      const title = bookDir
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      // Determine category based on directory name
      let category = 'Story';
      if (bookDir.includes('eng') || bookDir.includes('english')) {
        category = 'Educational';
      } else if (bookDir.includes('span')) {
        category = 'Spanish';
      }

      console.log(`📖 Creating/Updating book: ${title}`);

      await prisma.book.upsert({
        where: { id: bookDir },
        update: {
          title: title,
          authorName: 'Seeds of Empowerment Student',
          authorLocation: 'Global',
          summary: `A wonderful story from the Seeds of Empowerment collection.`,
          content: `/books/${bookDir}/main.pdf`,
          coverImage: fs.existsSync(path.join(bookPath, 'front.pdf')) 
            ? `/books/${bookDir}/front.pdf`
            : `/books/${bookDir}/main.pdf`,
          language: bookDir.includes('span') ? 'es' : 'en',
          category: [category],
          tags: ['story', 'education', 'empowerment'],
          readingLevel: 'intermediate',
          pageCount: 10, // Default, can be updated later
          isPremium: false,
          isPublished: true,
          featured: Math.random() > 0.7, // Randomly feature 30% of books
          updatedAt: new Date(),
        },
        create: {
          id: bookDir,
          title: title,
          authorName: 'Seeds of Empowerment Student',
          authorLocation: 'Global',
          summary: `A wonderful story from the Seeds of Empowerment collection.`,
          content: `/books/${bookDir}/main.pdf`,
          coverImage: fs.existsSync(path.join(bookPath, 'front.pdf')) 
            ? `/books/${bookDir}/front.pdf`
            : `/books/${bookDir}/main.pdf`,
          language: bookDir.includes('span') ? 'es' : 'en',
          category: [category],
          tags: ['story', 'education', 'empowerment'],
          readingLevel: 'intermediate',
          pageCount: 10, // Default, can be updated later
          isPremium: false,
          isPublished: true,
          featured: Math.random() > 0.7, // Randomly feature 30% of books
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      });
    }

    console.log('✅ Successfully updated all real books!');
    
    // Show summary
    const totalBooks = await prisma.book.count();
    console.log(`📊 Total books in database: ${totalBooks}`);

  } catch (error) {
    console.error('❌ Error updating books:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

updateRealBooks()
  .catch(console.error)
  .finally(() => process.exit(0));