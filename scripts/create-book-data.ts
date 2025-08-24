// Script to create book data from local 1001books folder
// This generates the data structure needed for seeding the database

import * as fs from 'fs';
import * as path from 'path';

interface BookMetadata {
  id: string;
  title: string;
  subtitle?: string;
  summary: string;
  authorName: string;
  authorAlias: string;
  authorAge?: number;
  authorLocation: string;
  language: string;
  ageRange: string;
  category: string[];
  genres: string[];
  subjects: string[];
  tags: string[];
  isPremium: boolean;
  pageCount: number;
  mainPdfFile: string;
  frontCoverFile?: string | null;
  backCoverFile?: string | null;
  originalFolder: string;
}

// Function to normalize book folder name
function normalizeBookFolderName(originalName: string): string {
  return originalName
    .toLowerCase()
    .replace(/^\d+_?\s*/, '') // Remove leading numbers and underscores
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .replace(/-+/g, '-'); // Replace multiple hyphens with single
}

// Function to identify main PDF file in a folder
function identifyMainPdf(folderPath: string): string | null {
  const files = fs.readdirSync(folderPath);
  
  // Look for files with "inside" in name first
  let mainFile = files.find(f => f.includes('inside') && f.endsWith('.pdf'));
  
  if (!mainFile) {
    // Look for files with "Edit" in name (Neema series pattern)
    mainFile = files.find(f => f.includes('Edit') && f.endsWith('.pdf'));
  }
  
  if (!mainFile) {
    // Find the largest PDF file that's not front/back cover
    const pdfFiles = files
      .filter(f => f.endsWith('.pdf'))
      .filter(f => !f.toLowerCase().includes('front'))
      .filter(f => !f.toLowerCase().includes('back'))
      .filter(f => !f.toLowerCase().includes('black'));
    
    if (pdfFiles.length > 0) {
      // Get file sizes and pick the largest
      const fileStats = pdfFiles.map(f => ({
        name: f,
        size: fs.statSync(path.join(folderPath, f)).size
      }));
      fileStats.sort((a, b) => b.size - a.size);
      mainFile = fileStats[0].name;
    }
  }
  
  return mainFile || null;
}

// Function to identify front cover PDF
function identifyFrontPdf(folderPath: string): string | null {
  const files = fs.readdirSync(folderPath);
  return files.find(f => f.toLowerCase().includes('front') && f.endsWith('.pdf')) || null;
}

// Function to identify back cover PDF
function identifyBackPdf(folderPath: string): string | null {
  const files = fs.readdirSync(folderPath);
  return files.find(f => f.toLowerCase().includes('back') && f.endsWith('.pdf')) || null;
}

// Function to generate book metadata from folder
function generateBookMetadata(folderPath: string): BookMetadata | null {
  const folderName = path.basename(folderPath);
  const bookId = normalizeBookFolderName(folderName);
  
  const mainPdf = identifyMainPdf(folderPath);
  if (!mainPdf) {
    console.warn(`No main PDF found for ${folderName}`);
    return null;
  }
  
  // Parse title and series info
  const parsedInfo = parseBookTitle(folderName);
  
  return {
    id: bookId,
    title: parsedInfo.title,
    subtitle: parsedInfo.subtitle,
    summary: generateSummary(parsedInfo.title, parsedInfo.series),
    authorName: parsedInfo.authorName,
    authorAlias: parsedInfo.authorAlias,
    authorAge: parsedInfo.authorAge,
    authorLocation: parsedInfo.location,
    language: 'en',
    ageRange: '6-12',
    category: parsedInfo.category,
    genres: parsedInfo.genres,
    subjects: parsedInfo.subjects,
    tags: parsedInfo.tags,
    isPremium: determineIfPremium(bookId),
    pageCount: estimatePageCount(folderName),
    mainPdfFile: mainPdf,
    frontCoverFile: identifyFrontPdf(folderPath),
    backCoverFile: identifyBackPdf(folderPath),
    originalFolder: folderName
  };
}

// Function to parse book title and extract metadata
function parseBookTitle(folderName: string): any {
  const name = folderName.replace(/^\d+_?\s*/, '');
  
  // Known patterns
  if (name.includes('Neema')) {
    const part = folderName.includes('_01') ? 'Part 1' : folderName.includes('_02') ? 'Part 2' : 'Part 3';
    return {
      title: `Neema ${part}`,
      subtitle: 'A Journey of Hope',
      series: 'Neema',
      authorName: 'Emma Grace',
      authorAlias: 'Young Storyteller',
      authorAge: 12,
      location: 'Uganda',
      category: ['Drama', 'Inspiration'],
      genres: ['Fiction', 'Drama'],
      subjects: ['Hope', 'Resilience', 'Family'],
      tags: ['neema', 'hope', 'family', 'uganda']
    };
  }
  
  if (name.includes('Second chance')) {
    return {
      title: 'The Second Chance',
      subtitle: 'A Story of Redemption',
      authorName: 'David Hope',
      authorAlias: 'Hope Writer',
      authorAge: 14,
      location: 'Kenya',
      category: ['Drama', 'Inspiration'],
      genres: ['Fiction', 'Drama'],
      subjects: ['Redemption', 'Second chances', 'Growth'],
      tags: ['second-chance', 'redemption', 'hope']
    };
  }
  
  if (name.includes('Angel prayer')) {
    return {
      title: 'Angel\'s Prayer',
      subtitle: 'Faith and Hope',
      authorName: 'Grace Angel',
      authorAlias: 'Little Angel',
      authorAge: 10,
      location: 'Ethiopia',
      category: ['Spiritual', 'Inspiration'],
      genres: ['Fiction', 'Spiritual'],
      subjects: ['Faith', 'Prayer', 'Hope'],
      tags: ['angel', 'prayer', 'faith', 'spiritual']
    };
  }
  
  if (name.includes('Martha')) {
    const part = folderName.includes('_01') ? 'Part 1' : folderName.includes('_02') ? 'Part 2' : 'Part 3';
    return {
      title: `Martha ${part}`,
      subtitle: 'The Helper\'s Heart',
      series: 'Martha',
      authorName: 'Sarah Helper',
      authorAlias: 'Caring Writer',
      authorAge: 13,
      location: 'Tanzania',
      category: ['Family', 'Community'],
      genres: ['Fiction', 'Family'],
      subjects: ['Helping others', 'Community', 'Kindness'],
      tags: ['martha', 'helper', 'kindness', 'community']
    };
  }
  
  if (name.includes('Never give up')) {
    return {
      title: 'Never Give Up',
      subtitle: 'The Power of Perseverance',
      authorName: 'Victory Strong',
      authorAlias: 'Determined Writer',
      authorAge: 11,
      location: 'Rwanda',
      category: ['Motivation', 'Inspiration'],
      genres: ['Fiction', 'Motivational'],
      subjects: ['Perseverance', 'Determination', 'Success'],
      tags: ['never-give-up', 'perseverance', 'determination']
    };
  }
  
  // Add more patterns for other books...
  // For now, use a generic pattern
  return {
    title: formatTitle(name),
    authorName: 'Young Author',
    authorAlias: 'Creative Writer',
    authorAge: 12,
    location: 'Africa',
    category: ['Adventure', 'Inspiration'],
    genres: ['Fiction'],
    subjects: ['Adventure', 'Growth'],
    tags: [normalizeBookFolderName(name)]
  };
}

function formatTitle(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .trim();
}

function generateSummary(title: string, series?: string): string {
  const baseSummaries: Record<string, string> = {
    'Neema': 'A powerful story of hope and resilience following a young girl\'s journey through challenges and triumph.',
    'Martha': 'The heartwarming tale of a young girl who discovers the joy of helping others in her community.',
    'Angel\'s Prayer': 'A touching story about faith, hope, and the power of prayer in difficult times.',
    'The Second Chance': 'An inspiring story about redemption and the opportunity to start anew.',
    'Never Give Up': 'A motivational tale about perseverance and the strength to overcome obstacles.'
  };
  
  return baseSummaries[series || title] || `An inspiring story about ${title.toLowerCase()}, written by a young author to share hope and wisdom.`;
}

function determineIfPremium(bookId: string): boolean {
  // Books 1-3 (Neema series) are free, rest are premium
  const freeBooks = ['neema-01', 'neema-02', 'neema-03'];
  return !freeBooks.includes(bookId);
}

function estimatePageCount(folderName: string): number {
  // Estimate based on series - can be refined later
  if (folderName.includes('Neema')) return 24;
  if (folderName.includes('Martha')) return 22;
  return 20; // Default
}

// Main execution
function main() {
  const LOCAL_BOOKS_DIR = '/Users/jihunkong/1001project/1001books';
  
  if (!fs.existsSync(LOCAL_BOOKS_DIR)) {
    console.error(`Books directory not found: ${LOCAL_BOOKS_DIR}`);
    return;
  }
  
  const bookMetadata: BookMetadata[] = [];
  const folders = fs.readdirSync(LOCAL_BOOKS_DIR)
    .map(f => path.join(LOCAL_BOOKS_DIR, f))
    .filter(f => fs.statSync(f).isDirectory());
  
  console.log(`Found ${folders.length} book folders`);
  
  for (const folder of folders) {
    const metadata = generateBookMetadata(folder);
    if (metadata) {
      bookMetadata.push(metadata);
      console.log(`✅ ${metadata.title} (${metadata.id})`);
    }
  }
  
  // Save to JSON file
  const outputPath = path.join(__dirname, '..', 'prisma', 'book-metadata.json');
  fs.writeFileSync(outputPath, JSON.stringify(bookMetadata, null, 2));
  
  console.log(`\n📝 Generated metadata for ${bookMetadata.length} books`);
  console.log(`📄 Saved to: ${outputPath}`);
  
  // Also generate TypeScript seed data
  generateSeedFile(bookMetadata);
}

function generateSeedFile(bookMetadata: BookMetadata[]) {
  const seedContent = `// Auto-generated book seed data
import { BookMetadata } from '../scripts/create-book-data';

export const booksData: BookMetadata[] = ${JSON.stringify(bookMetadata, null, 2)};
`;
  
  const seedPath = path.join(__dirname, '..', 'prisma', 'books-data.ts');
  fs.writeFileSync(seedPath, seedContent);
  
  console.log(`📄 Generated seed file: ${seedPath}`);
}

if (require.main === module) {
  main();
}

export { BookMetadata, generateBookMetadata, normalizeBookFolderName };