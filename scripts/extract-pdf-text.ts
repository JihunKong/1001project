import { PrismaClient } from '@prisma/client';
import * as pdfParse from 'pdf-parse';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function extractTextFromPDF(bookId: string) {
  try {
    const pdfPath = path.join(process.cwd(), 'public', 'books', bookId, 'main.pdf');
    
    if (!fs.existsSync(pdfPath)) {
      console.log(`PDF not found for ${bookId}`);
      return null;
    }

    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdfParse(dataBuffer);
    
    // Extract text from PDF
    const extractedText = data.text;
    
    if (extractedText && extractedText.length > 100) {
      // Update book content in database
      await prisma.book.update({
        where: { id: bookId },
        data: { 
          content: extractedText,
          pageCount: data.numpages
        }
      });
      
      console.log(`✅ Updated ${bookId}: ${extractedText.length} characters, ${data.numpages} pages`);
      return extractedText;
    }
    
    return null;
  } catch (error) {
    console.error(`Error processing ${bookId}:`, error);
    return null;
  }
}

async function main() {
  try {
    // Get all books that have PDF but no content
    const books = await prisma.book.findMany({
      where: {
        OR: [
          { content: null },
          { content: '' }
        ]
      }
    });

    console.log(`Found ${books.length} books without content`);

    for (const book of books) {
      await extractTextFromPDF(book.id);
    }

    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();