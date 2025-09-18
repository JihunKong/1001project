#!/usr/bin/env npx tsx

import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import { pdfParser } from '../lib/services/education/pdf-parser';

const prisma = new PrismaClient();

interface BookMetadata {
  dirName: string;
  title: string;
  author: string;
  language: string;
  category: string[];
  tags: string[];
  ageRange: string;
  readingLevel: string;
  summary?: string;
}

// Book metadata based on directory names
const bookMetadata: Record<string, Partial<BookMetadata>> = {
  'a-gril-come-to-stanford': {
    title: 'A Girl Comes to Stanford',
    author: 'Young Author',
    language: 'en',
    category: ['Educational', 'Inspiration'],
    tags: ['education', 'university', 'dreams', 'achievement'],
    ageRange: '12-18',
    readingLevel: 'Intermediate'
  },
  'angel-prayer': {
    title: "Angel's Prayer",
    author: 'Young Girl from Rwanda',
    language: 'en',
    category: ['Inspiration', 'Story'],
    tags: ['hope', 'faith', 'friendship', 'disability'],
    ageRange: '8-14',
    readingLevel: 'Intermediate'
  },
  'appreciation': {
    title: 'Appreciation',
    author: 'Zunila Ally',
    language: 'en',
    category: ['Life Lessons', 'Story'],
    tags: ['gratitude', 'family', 'values'],
    ageRange: '8-14',
    readingLevel: 'Beginner'
  },
  'check-point-eng': {
    title: 'Check Point',
    author: 'Young Author',
    language: 'en',
    category: ['Adventure', 'Story'],
    tags: ['journey', 'challenges', 'growth'],
    ageRange: '10-16',
    readingLevel: 'Intermediate'
  },
  'check-point-span': {
    title: 'Punto de Control',
    author: 'Young Author',
    language: 'es',
    category: ['Adventure', 'Story'],
    tags: ['journey', 'challenges', 'growth'],
    ageRange: '10-16',
    readingLevel: 'Intermediate'
  },
  'fatuma': {
    title: 'Fatuma Story',
    author: 'Fatuma Nayopa',
    language: 'en',
    category: ['Life Story', 'Inspiration'],
    tags: ['determination', 'orphans', 'education'],
    ageRange: '10-16',
    readingLevel: 'Intermediate'
  },
  'girl-with-a-hope-eng': {
    title: 'Girl with a Hope',
    author: 'Young Author',
    language: 'en',
    category: ['Inspiration', 'Story'],
    tags: ['hope', 'dreams', 'perseverance'],
    ageRange: '8-14',
    readingLevel: 'Beginner'
  },
  'greedy-fisherman': {
    title: 'The Greedy Fisherman',
    author: 'Elton John',
    language: 'en',
    category: ['Fable', 'Life Lessons'],
    tags: ['greed', 'consequences', 'morality'],
    ageRange: '8-14',
    readingLevel: 'Intermediate'
  },
  'kakama-01': {
    title: 'Kakama - Part 1',
    author: 'Young Author from Rwanda',
    language: 'en',
    category: ['Story', 'Adventure'],
    tags: ['friendship', 'journey', 'courage'],
    ageRange: '8-14',
    readingLevel: 'Beginner'
  },
  'kakama-02': {
    title: 'Kakama - Part 2',
    author: 'Young Author from Rwanda',
    language: 'en',
    category: ['Story', 'Adventure'],
    tags: ['friendship', 'journey', 'courage'],
    ageRange: '8-14',
    readingLevel: 'Beginner'
  },
  'martha-01': {
    title: 'The Martha Story - Part 1',
    author: 'Martha Emmanuel',
    language: 'en',
    category: ['Life Story', 'Inspiration'],
    tags: ['family', 'hardship', 'resilience'],
    ageRange: '10-16',
    readingLevel: 'Intermediate'
  },
  'martha-02': {
    title: 'The Martha Story - Part 2',
    author: 'Martha Emmanuel',
    language: 'en',
    category: ['Life Story', 'Inspiration'],
    tags: ['family', 'hardship', 'resilience'],
    ageRange: '10-16',
    readingLevel: 'Intermediate'
  },
  'martha-03': {
    title: 'The Martha Story - Part 3',
    author: 'Martha Emmanuel',
    language: 'en',
    category: ['Life Story', 'Inspiration'],
    tags: ['family', 'hardship', 'resilience'],
    ageRange: '10-16',
    readingLevel: 'Intermediate'
  },
  'mirror': {
    title: 'Mirror',
    author: 'Young Author',
    language: 'en',
    category: ['Philosophy', 'Story'],
    tags: ['self-reflection', 'identity', 'growth'],
    ageRange: '12-18',
    readingLevel: 'Advanced'
  },
  'my-life-eng': {
    title: 'My Life',
    author: 'Young Author',
    language: 'en',
    category: ['Autobiography', 'Story'],
    tags: ['personal', 'journey', 'experiences'],
    ageRange: '10-16',
    readingLevel: 'Intermediate'
  },
  'my-life-p-urh-pecha': {
    title: 'Mi Vida',
    author: 'Young Author',
    language: 'es',
    category: ['Autobiography', 'Story'],
    tags: ['personal', 'journey', 'experiences'],
    ageRange: '10-16',
    readingLevel: 'Intermediate'
  },
  'my-life-span': {
    title: 'Mi Vida',
    author: 'Young Author',
    language: 'es',
    category: ['Autobiography', 'Story'],
    tags: ['personal', 'journey', 'experiences'],
    ageRange: '10-16',
    readingLevel: 'Intermediate'
  },
  'neema-01': {
    title: 'The Story of Neema - Part 1',
    author: 'Leilah Ismail Mbwana',
    language: 'en',
    category: ['Story', 'Inspiration'],
    tags: ['orphan', 'education', 'determination'],
    ageRange: '10-16',
    readingLevel: 'Intermediate'
  },
  'neema-02': {
    title: 'The Story of Neema - Part 2',
    author: 'Leilah Ismail Mbwana',
    language: 'en',
    category: ['Story', 'Inspiration'],
    tags: ['orphan', 'education', 'determination'],
    ageRange: '10-16',
    readingLevel: 'Intermediate'
  },
  'neema-03': {
    title: 'The Story of Neema - Part 3',
    author: 'Leilah Ismail Mbwana',
    language: 'en',
    category: ['Story', 'Inspiration'],
    tags: ['orphan', 'education', 'determination'],
    ageRange: '10-16',
    readingLevel: 'Intermediate'
  },
  'never-give-up': {
    title: 'Never Give Up',
    author: 'Thato Sittiole',
    language: 'en',
    category: ['Inspiration', 'Education'],
    tags: ['perseverance', 'learning', 'motivation'],
    ageRange: '10-16',
    readingLevel: 'Advanced'
  },
  'second-chance': {
    title: 'The Second Chance',
    author: 'Issa Juma',
    language: 'en',
    category: ['Story', 'Life Lessons'],
    tags: ['redemption', 'change', 'growth'],
    ageRange: '12-18',
    readingLevel: 'Intermediate'
  },
  'steet-boy-part01-span': {
    title: 'Niño de la Calle - Parte 1',
    author: 'Young Author',
    language: 'es',
    category: ['Life Story', 'Social Issues'],
    tags: ['street life', 'survival', 'hope'],
    ageRange: '12-18',
    readingLevel: 'Intermediate'
  },
  'street-boy-part-01-eng-folder': {
    title: 'Street Boy - Part 1',
    author: 'Young Author',
    language: 'en',
    category: ['Life Story', 'Social Issues'],
    tags: ['street life', 'survival', 'hope'],
    ageRange: '12-18',
    readingLevel: 'Intermediate'
  },
  'street-boy-part-02-span-folder': {
    title: 'Niño de la Calle - Parte 2',
    author: 'Young Author',
    language: 'es',
    category: ['Life Story', 'Social Issues'],
    tags: ['street life', 'survival', 'hope'],
    ageRange: '12-18',
    readingLevel: 'Intermediate'
  },
  'street-boy-part02-eng': {
    title: 'Street Boy - Part 2',
    author: 'Young Author',
    language: 'en',
    category: ['Life Story', 'Social Issues'],
    tags: ['street life', 'survival', 'hope'],
    ageRange: '12-18',
    readingLevel: 'Intermediate'
  },
  'the-eyes-of-the-sun': {
    title: 'The Eyes of the Sun',
    author: 'Young Author',
    language: 'en',
    category: ['Fantasy', 'Adventure'],
    tags: ['fantasy', 'adventure', 'mystery'],
    ageRange: '10-16',
    readingLevel: 'Intermediate'
  },
  'the-indian-boy-s': {
    title: "The Indian Boy's Story",
    author: 'Young Author',
    language: 'en',
    category: ['Cultural', 'Story'],
    tags: ['culture', 'tradition', 'identity'],
    ageRange: '10-16',
    readingLevel: 'Intermediate'
  },
  'the-indian-girl-helping-father': {
    title: 'The Indian Girl Helping Father',
    author: 'Young Author',
    language: 'en',
    category: ['Family', 'Cultural'],
    tags: ['family', 'responsibility', 'culture'],
    ageRange: '8-14',
    readingLevel: 'Beginner'
  },
  'the-story-of-a-thief-eng': {
    title: 'The Story of a Thief',
    author: 'Young Author',
    language: 'en',
    category: ['Life Lessons', 'Story'],
    tags: ['redemption', 'consequences', 'change'],
    ageRange: '12-18',
    readingLevel: 'Intermediate'
  },
  'the-three-boys-eng': {
    title: 'The Three Boys',
    author: 'Young Author',
    language: 'en',
    category: ['Friendship', 'Adventure'],
    tags: ['friendship', 'teamwork', 'adventure'],
    ageRange: '8-14',
    readingLevel: 'Beginner'
  },
  'the-three-boys-span': {
    title: 'Los Tres Niños',
    author: 'Young Author',
    language: 'es',
    category: ['Friendship', 'Adventure'],
    tags: ['friendship', 'teamwork', 'adventure'],
    ageRange: '8-14',
    readingLevel: 'Beginner'
  },
  'who-is-real': {
    title: 'Who is Real Hero',
    author: 'Habimana Nahayo',
    language: 'en',
    category: ['Philosophy', 'Life Lessons'],
    tags: ['heroism', 'kindness', 'values'],
    ageRange: '10-16',
    readingLevel: 'Advanced'
  },
  'test4': {
    title: 'Test Story 4',
    author: 'Test Author',
    language: 'en',
    category: ['Test'],
    tags: ['test'],
    ageRange: '8-14',
    readingLevel: 'Beginner'
  }
};

async function seedProcessedBooks() {
  console.log('🌱 Starting to seed processed books...');
  
  // Get all book directories
  const booksDir = path.join(process.cwd(), 'public/books');
  const bookDirs = await fs.readdir(booksDir);
  
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  
  for (const dirName of bookDirs) {
    // Skip non-book directories
    if (dirName === 'english-education' || dirName.startsWith('.')) {
      continue;
    }
    
    const bookPath = path.join(booksDir, dirName);
    const stat = await fs.stat(bookPath);
    
    if (!stat.isDirectory()) {
      continue;
    }
    
    // Check if main.pdf exists
    const mainPdfPath = path.join(bookPath, 'main.pdf');
    try {
      await fs.access(mainPdfPath);
    } catch {
      console.log(`⚠️  Skipping ${dirName} - no main.pdf found`);
      skipCount++;
      continue;
    }
    
    // Get metadata for this book
    const meta = bookMetadata[dirName] || {};
    
    // Try to extract title and author from PDF if not in metadata
    let extractedTitle = meta.title || dirName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    let extractedAuthor = meta.author || 'Young Author';
    
    try {
      const parsedPdf = await pdfParser.parseFile(mainPdfPath);
      if (!meta.title && parsedPdf.title) {
        extractedTitle = parsedPdf.title;
      }
      if (!meta.author && parsedPdf.author !== 'Unknown Author') {
        extractedAuthor = parsedPdf.author;
      }
    } catch (error) {
      console.log(`  Could not parse PDF for ${dirName}, using defaults`);
    }
    
    // Prepare book data
    const bookData = {
      title: extractedTitle,
      authorName: extractedAuthor,
      language: meta.language || 'en',
      category: meta.category || ['General'],
      tags: meta.tags || [],
      ageRange: meta.ageRange || '8-14',
      readingLevel: meta.readingLevel || 'Intermediate',
      summary: meta.summary || `A wonderful story by ${extractedAuthor}.`,
      
      // PDF paths relative to public directory
      pdfKey: `/books/${dirName}/main.pdf`,
      pdfFrontCover: `/books/${dirName}/front.pdf`,
      pdfBackCover: `/books/${dirName}/back.pdf`,
      coverImage: `/books/${dirName}/front.pdf`, // Use front PDF as cover
      
      // Access settings - all books are free
      isPremium: false,
      isPublished: true,
      publishedAt: new Date(),
      featured: ['neema-01', 'angel-prayer', 'martha-01', 'fatuma'].includes(dirName),
      
      // Reading settings
      previewPages: 10,
      pageLayout: 'single',
      downloadAllowed: false,
      printAllowed: false,
      
      // Stats
      viewCount: Math.floor(Math.random() * 500) + 100,
      downloadCount: 0,
      rating: Math.random() * 2 + 3, // Random rating between 3-5
    };
    
    try {
      // Check if book already exists
      const existing = await prisma.book.findFirst({
        where: { 
          OR: [
            { title: bookData.title },
            { pdfKey: bookData.pdfKey }
          ]
        }
      });
      
      if (existing) {
        console.log(`📚 Updating existing book: ${bookData.title}`);
        await prisma.book.update({
          where: { id: existing.id },
          data: bookData
        });
      } else {
        console.log(`📚 Creating new book: ${bookData.title}`);
        await prisma.book.create({
          data: bookData
        });
      }
      
      successCount++;
    } catch (error) {
      console.error(`❌ Error seeding book ${dirName}:`, error);
      errorCount++;
    }
  }
  
  console.log('\n📊 Seed Results:');
  console.log(`✅ Successfully seeded: ${successCount} books`);
  console.log(`⚠️  Skipped: ${skipCount} directories`);
  console.log(`❌ Errors: ${errorCount} books`);
  
  // Get total count
  const totalBooks = await prisma.book.count();
  console.log(`\n📚 Total books in database: ${totalBooks}`);
}

seedProcessedBooks()
  .catch((error) => {
    console.error('Fatal error during seeding:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });