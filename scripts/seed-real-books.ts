import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const BOOKS_DIR = path.join(process.cwd(), 'public', 'books');

interface BookInfo {
  id: string;
  title: string;
  authorName: string;
  summary: string;
  content: string;
  pdfKey: string;
  thumbnail?: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  gradeLevel: string;
  language: string;
  category: string;
}

function formatTitle(dirName: string): string {
  // Special case handling for known titles
  const titleMap: Record<string, string> = {
    'a-gril-come-to-stanford': 'A Girl Comes to Stanford',
    'angel-prayer': 'Angel Prayer',
    'appreciation': 'Appreciation',
    'check-point-eng': 'Check Point',
    'check-point-span': 'Check Point (Spanish)',
    'english-education': 'English Education',
    'fatuma': 'Fatuma',
    'girl-with-a-hope-eng': 'Girl with a Hope',
    'greedy-fisherman': 'The Greedy Fisherman',
    'kakama-01': 'Kakama - Part 1',
    'kakama-02': 'Kakama - Part 2',
    'martha-01': 'Martha - Part 1',
    'mirror': 'The Mirror',
    'my-life-eng': 'My Life',
    'my-life-p': 'My Life (P\'urhépecha)',
    'my-life-span': 'My Life (Spanish)',
    'neema-01': 'Neema - Part 1',
    'neema-02': 'Neema - Part 2',
    'never-give-up': 'Never Give Up',
    'one-indian-boy': 'One Indian Boy',
    'one-indian-girl': 'One Indian Girl',
    'second-chance': 'Second Chance',
    'story-of-thief': 'Story of a Thief',
    'street-boy-01-eng': 'Street Boy - Part 1',
    'street-boy-01-span': 'Street Boy - Part 1 (Spanish)',
    'the-game': 'The Game',
    'the-three-boys-eng': 'The Three Boys',
    'the-three-boys-span': 'The Three Boys (Spanish)',
    'the-village-beauty': 'The Village Beauty',
    'young-author': 'Young Author',
  };

  return titleMap[dirName] || dirName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getDifficulty(title: string): 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' {
  if (title.toLowerCase().includes('part 1') || title.toLowerCase().includes('01')) {
    return 'BEGINNER';
  }
  if (title.toLowerCase().includes('part 2') || title.toLowerCase().includes('02')) {
    return 'INTERMEDIATE';
  }
  if (title.toLowerCase().includes('education') || title.toLowerCase().includes('stanford')) {
    return 'ADVANCED';
  }
  return 'INTERMEDIATE';
}

function getGradeLevel(difficulty: string): string {
  switch(difficulty) {
    case 'BEGINNER': return 'K-2';
    case 'INTERMEDIATE': return '3-5';
    case 'ADVANCED': return '6-8';
    default: return '3-5';
  }
}

function getLanguage(dirName: string): string {
  if (dirName.includes('span')) return 'Spanish';
  if (dirName.includes('-p')) return 'P\'urhépecha';
  return 'English';
}

function getCategory(dirName: string): string {
  if (dirName.includes('01') || dirName.includes('02')) return 'SERIES';
  if (dirName.includes('indian') || dirName.includes('village')) return 'CULTURE';
  if (dirName.includes('greedy') || dirName.includes('thief')) return 'FABLE';
  if (dirName.includes('my-life')) return 'BIOGRAPHY';
  if (dirName.includes('stanford') || dirName.includes('education')) return 'EDUCATION';
  return 'STORY';
}

function getSummary(title: string, dirName: string): string {
  const summaries: Record<string, string> = {
    'a-gril-come-to-stanford': 'An inspiring journey of a young girl pursuing education at Stanford University',
    'angel-prayer': 'A heartfelt story about faith, hope, and the power of prayer',
    'appreciation': 'Learning the value of gratitude and appreciating what we have',
    'check-point-eng': 'Navigating life\'s checkpoints and making important decisions',
    'fatuma': 'The story of Fatuma and her adventures in her community',
    'girl-with-a-hope-eng': 'A young girl\'s hopeful journey towards achieving her dreams',
    'greedy-fisherman': 'A moral tale about greed and contentment',
    'kakama-01': 'The beginning of Kakama\'s exciting adventures',
    'kakama-02': 'Kakama\'s journey continues with new challenges',
    'martha-01': 'Martha\'s story of courage and determination',
    'mirror': 'Reflections on self-discovery and personal growth',
    'my-life-eng': 'An autobiographical account of a young author\'s experiences',
    'neema-01': 'Meet Neema and begin her incredible journey',
    'neema-02': 'Neema faces new adventures and learns valuable lessons',
    'never-give-up': 'A motivational story about perseverance and resilience',
    'one-indian-boy': 'A young Indian boy\'s daily life and cultural experiences',
    'one-indian-girl': 'Discovering the world through the eyes of an Indian girl',
    'second-chance': 'The power of redemption and new beginnings',
    'story-of-thief': 'A transformative tale of a thief who changes his ways',
    'street-boy-01-eng': 'The challenging yet hopeful life of a street child',
    'the-game': 'Life lessons learned through the metaphor of games',
    'the-three-boys-eng': 'Three boys embark on an unforgettable adventure',
    'the-village-beauty': 'Beauty, tradition, and life in a village setting',
    'young-author': 'The journey of becoming a young writer',
  };

  return summaries[dirName] || `${title} - A story from the 1001 Stories collection`;
}

async function seedRealBooks() {
  console.log('🌱 Seeding real books from public/books directory...');

  try {
    // Find all directories with main.pdf
    const bookDirs = fs.readdirSync(BOOKS_DIR)
      .filter(item => {
        const itemPath = path.join(BOOKS_DIR, item);
        return fs.statSync(itemPath).isDirectory() && 
               fs.existsSync(path.join(itemPath, 'main.pdf'));
      });

    console.log(`Found ${bookDirs.length} books with PDFs`);

    const books: BookInfo[] = bookDirs.map(dirName => {
      const title = formatTitle(dirName);
      const difficulty = getDifficulty(title);
      const language = getLanguage(dirName);
      const category = getCategory(dirName);
      
      return {
        id: dirName,
        title: title,
        authorName: language === 'Spanish' ? 'Autor Joven' : 
                     language === 'P\'urhépecha' ? 'Joven Autor' : 'Young Author',
        summary: getSummary(title, dirName),
        content: `Full content available in PDF format`,
        pdfKey: `/books/${dirName}/main.pdf`,
        thumbnail: fs.existsSync(path.join(BOOKS_DIR, dirName, 'cover.jpg')) 
          ? `/books/${dirName}/cover.jpg` 
          : undefined,
        difficulty,
        gradeLevel: getGradeLevel(difficulty),
        language,
        category
      };
    });

    // Delete existing books
    await prisma.book.deleteMany();
    console.log('✅ Cleared existing books');

    // Create real books
    for (let i = 0; i < books.length; i++) {
      const book = books[i];
      await prisma.book.create({
        data: {
          id: book.id,
          title: book.title,
          authorName: book.authorName,
          summary: book.summary,
          content: book.content,
          pdfKey: book.pdfKey,
          coverImage: book.thumbnail || '/images/book-placeholder.png',
          isPublished: true,
          featured: i < 6, // Feature first 6 books
          isPremium: false, // All books are free for educational purposes
          pageCount: Math.floor(Math.random() * 30) + 20,
          publishedAt: new Date(),
          tags: [
            'real-story', 
            'seeds-of-empowerment', 
            book.language.toLowerCase(),
            book.category.toLowerCase()
          ],
          category: [book.category],
          language: book.language,
          ageRange: book.gradeLevel,
          readingLevel: book.difficulty,
        }
      });
      console.log(`✅ Created: ${book.title} (${book.language})`);
    }

    console.log(`\n🎉 Successfully seeded ${books.length} real books!`);
    
    // Show statistics
    const stats = await prisma.book.groupBy({
      by: ['language'],
      _count: true,
      where: { isPublished: true }
    });
    
    console.log(`\n📊 Books by Language:`);
    stats.forEach(stat => {
      console.log(`   ${stat.language}: ${stat._count} books`);
    });

    const totalBooks = await prisma.book.count({
      where: { isPublished: true }
    });
    
    console.log(`\n📚 Total published books: ${totalBooks}`);
    
  } catch (error) {
    console.error('❌ Error seeding books:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedRealBooks()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });