#!/usr/bin/env npx tsx

import { pdfParser } from '../lib/services/education/pdf-parser';
import fs from 'fs/promises';
import path from 'path';

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

async function loadPDFsToEducation() {
  console.log('Loading PDFs into English Education system...');
  
  // Books to load with their metadata
  const booksToLoad = [
    { dir: 'neema-01', level: 'Beginner', category: 'Story', topics: ['adventure', 'friendship'] },
    { dir: 'angel-prayer', level: 'Intermediate', category: 'Story', topics: ['inspiration', 'hope'] },
    { dir: 'martha-01', level: 'Beginner', category: 'Story', topics: ['family', 'daily life'] },
    { dir: 'second-chance', level: 'Intermediate', category: 'Story', topics: ['redemption', 'growth'] },
    { dir: 'fatuma', level: 'Beginner', category: 'Story', topics: ['culture', 'tradition'] },
    { dir: 'greedy-fisherman', level: 'Intermediate', category: 'Fable', topics: ['morality', 'consequences'] },
    { dir: 'never-give-up', level: 'Advanced', category: 'Inspiration', topics: ['perseverance', 'motivation'] },
    { dir: 'appreciation', level: 'Intermediate', category: 'Story', topics: ['gratitude', 'values'] },
    { dir: 'who-is-real', level: 'Advanced', category: 'Philosophy', topics: ['identity', 'reality'] }
  ];
  
  // Load existing materials
  const materialsPath = path.join(process.cwd(), 'public/books/english-education/sample-materials.json');
  let materials: { materials: Material[] };
  
  try {
    const existingData = await fs.readFile(materialsPath, 'utf-8');
    materials = JSON.parse(existingData);
  } catch {
    materials = { materials: [] };
  }
  
  // Keep existing materials, find the highest ID
  let nextId = materials.materials.length + 1;
  const newMaterials: Material[] = [];
  
  for (const book of booksToLoad) {
    const pdfPath = path.join(process.cwd(), 'public/books', book.dir, 'main.pdf');
    
    try {
      console.log(`Processing ${book.dir}...`);
      await fs.access(pdfPath);
      
      const parsedPDF = await pdfParser.parseFile(pdfPath);
      
      // Extract vocabulary (words longer than 6 characters)
      const vocabulary = parsedPDF.content
        .toLowerCase()
        .replace(/[^a-z\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 6)
        .filter((word, index, self) => self.indexOf(word) === index)
        .slice(0, 15);
      
      // Generate comprehension questions based on content
      const questions = generateQuestions(parsedPDF.title, parsedPDF.content);
      
      const material: Material = {
        id: String(nextId++),
        title: parsedPDF.title,
        author: parsedPDF.author,
        content: parsedPDF.content.substring(0, 5000), // Limit content length
        level: book.level,
        category: book.category,
        topics: book.topics,
        vocabulary,
        questions,
        source: book.dir
      };
      
      newMaterials.push(material);
      console.log(`✓ Added: ${parsedPDF.title}`);
    } catch (error) {
      console.error(`Error processing ${book.dir}:`, error);
    }
  }
  
  // Add new materials to existing ones
  materials.materials.push(...newMaterials);
  
  // Save updated materials
  await fs.writeFile(materialsPath, JSON.stringify(materials, null, 2));
  
  console.log(`\n✓ Successfully loaded ${newMaterials.length} PDFs into the English Education system`);
  console.log(`✓ Total materials available: ${materials.materials.length}`);
}

function generateQuestions(title: string, content: string): string[] {
  // Generate basic comprehension questions
  const questions = [
    `What is the main theme of "${title}"?`,
    `Who are the main characters in this story?`,
    `What lesson can we learn from this story?`
  ];
  
  // Add content-specific questions based on keywords
  if (content.toLowerCase().includes('friend')) {
    questions.push('How does friendship play a role in this story?');
  }
  if (content.toLowerCase().includes('journey') || content.toLowerCase().includes('adventure')) {
    questions.push('Describe the journey or adventure in the story.');
  }
  if (content.toLowerCase().includes('problem') || content.toLowerCase().includes('challenge')) {
    questions.push('What challenges do the characters face?');
  }
  
  return questions.slice(0, 4);
}

// Run the script
loadPDFsToEducation().catch(console.error);