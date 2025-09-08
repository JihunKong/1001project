#!/usr/bin/env npx tsx

import { pdfParser } from '../lib/services/education/pdf-parser';
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

interface Material {
  id: string;
  title: string;
  author: string;
  content: string;
  level: string;
  category: string;
  topics: string[];
  vocabulary: string[];
  questions: string[];
  source?: string;
}

async function loadBooksToEducation() {
  console.log('📚 Loading books into English Education system...');
  
  // Get all books from database
  const books = await prisma.book.findMany({
    where: { isPublished: true },
    orderBy: { title: 'asc' }
  });
  
  console.log(`Found ${books.length} books in database`);
  
  const materials: Material[] = [];
  let processedCount = 0;
  let errorCount = 0;
  
  for (const book of books) {
    try {
      // Get the PDF path
      const pdfPath = book.pdfKey ? path.join(process.cwd(), 'public', book.pdfKey) : null;
      
      if (!pdfPath) {
        console.log(`⚠️  Skipping ${book.title} - no PDF path`);
        continue;
      }
      
      // Check if PDF exists
      try {
        await fs.access(pdfPath);
      } catch {
        console.log(`⚠️  Skipping ${book.title} - PDF not found at ${pdfPath}`);
        continue;
      }
      
      console.log(`📖 Processing: ${book.title}`);
      
      // Parse the PDF
      let parsedContent;
      try {
        const parsed = await pdfParser.parseFile(pdfPath);
        parsedContent = parsed.content;
      } catch (error) {
        console.log(`  ⚠️  Could not parse PDF, using summary`);
        parsedContent = book.summary || `A story by ${book.authorName}`;
      }
      
      // Extract vocabulary (words longer than 7 characters)
      const vocabulary = parsedContent
        .toLowerCase()
        .replace(/[^a-z\s]/g, '')
        .split(/\s+/)
        .filter((word: string) => word.length > 7)
        .filter((word: string, index: number, self: string[]) => self.indexOf(word) === index)
        .slice(0, 20);
      
      // Generate comprehension questions based on content
      const questions = generateQuestions(book.title, parsedContent, book.category);
      
      // Determine level based on reading level
      const level = book.readingLevel || 'Intermediate';
      
      // Create material object
      const material: Material = {
        id: book.id,
        title: book.title,
        author: book.authorName,
        content: parsedContent.substring(0, 10000), // Limit content for performance
        level,
        category: Array.isArray(book.category) && book.category.length > 0 ? book.category[0] : 'General',
        topics: book.tags || [],
        vocabulary,
        questions,
        source: book.pdfKey?.split('/').slice(-2, -1)[0] // Extract directory name
      };
      
      materials.push(material);
      processedCount++;
      console.log(`  ✅ Added to materials`);
      
    } catch (error) {
      console.error(`❌ Error processing ${book.title}:`, error);
      errorCount++;
    }
  }
  
  // Load existing materials to preserve any custom additions
  const materialsPath = path.join(process.cwd(), 'public/books/english-education/sample-materials.json');
  let existingMaterials: { materials: Material[] } = { materials: [] };
  
  try {
    const existingData = await fs.readFile(materialsPath, 'utf-8');
    existingMaterials = JSON.parse(existingData);
    console.log(`\n📄 Found ${existingMaterials.materials.length} existing materials`);
  } catch {
    console.log('\n📄 No existing materials found, creating new file');
  }
  
  // Merge materials (prefer new ones over existing)
  const materialMap = new Map<string, Material>();
  
  // Add existing materials first
  for (const material of existingMaterials.materials) {
    if (!material.source) { // Keep manually added materials
      materialMap.set(material.id, material);
    }
  }
  
  // Add/update with new materials from books
  for (const material of materials) {
    materialMap.set(material.id, material);
  }
  
  // Convert back to array and sort by title
  const finalMaterials = Array.from(materialMap.values()).sort((a, b) => 
    a.title.localeCompare(b.title)
  );
  
  // Save to file
  await fs.writeFile(
    materialsPath,
    JSON.stringify({ materials: finalMaterials }, null, 2)
  );
  
  console.log('\n📊 Results:');
  console.log(`✅ Processed: ${processedCount} books`);
  console.log(`❌ Errors: ${errorCount} books`);
  console.log(`📚 Total materials: ${finalMaterials.length}`);
  console.log(`📁 Saved to: ${materialsPath}`);
}

function generateQuestions(title: string, content: string, categories: string[]): string[] {
  const questions: string[] = [];
  
  // Basic comprehension questions
  questions.push(`What is the main theme of "${title}"?`);
  questions.push(`Who are the main characters in this story?`);
  
  // Category-specific questions
  if (categories.includes('Fable') || categories.includes('Life Lessons')) {
    questions.push('What moral lesson does this story teach?');
  }
  
  if (categories.includes('Adventure')) {
    questions.push('Describe the main journey or adventure in the story.');
  }
  
  if (categories.includes('Friendship')) {
    questions.push('How does friendship play a role in this story?');
  }
  
  // Content-based questions
  const lowerContent = content.toLowerCase();
  
  if (lowerContent.includes('problem') || lowerContent.includes('challenge')) {
    questions.push('What challenges do the characters face and how do they overcome them?');
  }
  
  if (lowerContent.includes('dream') || lowerContent.includes('hope')) {
    questions.push('What are the hopes and dreams of the characters?');
  }
  
  if (lowerContent.includes('family')) {
    questions.push('How does family influence the story?');
  }
  
  // Ensure we have at least 3 questions
  while (questions.length < 3) {
    if (questions.length === 0) {
      questions.push('Summarize the story in your own words.');
    } else if (questions.length === 1) {
      questions.push('What did you learn from this story?');
    } else {
      questions.push('How would you change the ending of this story?');
    }
  }
  
  return questions.slice(0, 5); // Return max 5 questions
}

// Run the script
loadBooksToEducation()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });