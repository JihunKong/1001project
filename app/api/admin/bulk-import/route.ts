import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole, StorySubmissionStatus } from '@prisma/client';
import { writeFile } from 'fs/promises';
import path from 'path';
import Papa from 'papaparse';
import ExcelJS from 'exceljs';
import { z } from 'zod';

type ImportType = 'STORIES' | 'USERS' | 'MEDIA';
type ImportStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

// Validation schema for story import
const storyImportSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string().min(1),
  summary: z.string().optional(),
  language: z.string().min(2).max(5),
  category: z.string().min(1),
  ageGroup: z.string().min(1),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional().default('MEDIUM'),
  tags: z.string().optional(), // Comma-separated string
  authorName: z.string().min(1),
  authorEmail: z.string().email(),
});

// Helper function to parse CSV
async function parseCSV(buffer: Buffer): Promise<any[]> {
  const csvString = buffer.toString('utf-8');
  return new Promise((resolve, reject) => {
    Papa.parse(csvString, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(new Error(`CSV parsing error: ${results.errors[0].message}`));
        } else {
          resolve(results.data);
        }
      },
      error: (error: any) => reject(error),
    });
  });
}

// Helper function to parse Excel
async function parseExcel(buffer: Buffer): Promise<any[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as any);
  
  const worksheet = workbook.getWorksheet(1); // Use first worksheet
  if (!worksheet) {
    throw new Error('No worksheet found in Excel file');
  }
  
  const rows: any[] = [];
  const headers: string[] = [];
  
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      // Extract headers
      row.eachCell((cell) => {
        headers.push(cell.value?.toString() || '');
      });
    } else {
      // Extract data rows
      const rowData: any = {};
      row.eachCell((cell, colNumber) => {
        const header = headers[colNumber - 1];
        if (header) {
          rowData[header] = cell.value?.toString() || '';
        }
      });
      
      // Only add non-empty rows
      if (Object.values(rowData).some(value => value !== '')) {
        rows.push(rowData);
      }
    }
  });
  
  return rows;
}

// Helper function to process story imports
async function processStoryImport(
  data: any[],
  importId: string,
  userId: string
): Promise<{ successful: number; errors: any[] }> {
  const errors: any[] = [];
  let successful = 0;
  
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    
    try {
      // Validate row data
      const validatedRow = storyImportSchema.parse({
        title: row.title || row.Title,
        content: row.content || row.Content,
        summary: row.summary || row.Summary,
        language: row.language || row.Language || 'en',
        category: row.category || row.Category,
        ageGroup: row.ageGroup || row['Age Group'] || row.age_group,
        priority: row.priority || row.Priority || 'MEDIUM',
        tags: row.tags || row.Tags,
        authorName: row.authorName || row['Author Name'] || row.author_name || row.author,
        authorEmail: row.authorEmail || row['Author Email'] || row.author_email,
      });
      
      // Find or create author
      let author = await prisma.user.findUnique({
        where: { email: validatedRow.authorEmail },
      });
      
      if (!author) {
        author = await prisma.user.create({
          data: {
            email: validatedRow.authorEmail,
            name: validatedRow.authorName,
            role: UserRole.LEARNER,
          },
        });
      }
      
      // Create story submission
      await prisma.storySubmission.create({
        data: {
          title: validatedRow.title,
          content: validatedRow.content,
          summary: validatedRow.summary,
          language: validatedRow.language,
          category: validatedRow.category,
          ageGroup: validatedRow.ageGroup,
          priority: validatedRow.priority as Priority,
          tags: validatedRow.tags ? validatedRow.tags.split(',').map(tag => tag.trim()) : [],
          status: StorySubmissionStatus.SUBMITTED,
          authorId: author.id,
        },
      });
      
      successful++;
    } catch (error) {
      errors.push({
        row: i + 1,
        data: row,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
  
  return { successful, errors };
}

// POST /api/admin/bulk-import - Upload and process bulk import file
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const importType = formData.get('type') as string;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: CSV, XLS, XLSX' },
        { status: 400 }
      );
    }

    // Validate import type
    const validImportTypes: ImportType[] = ['STORIES', 'USERS', 'MEDIA'];
    if (!validImportTypes.includes(importType as ImportType)) {
      return NextResponse.json(
        { error: 'Invalid import type' },
        { status: 400 }
      );
    }

    // Generate unique filename and save file
    const timestamp = Date.now();
    const filename = `import-${timestamp}-${file.name}`;
    const uploadDir = path.join(process.cwd(), 'uploads', 'imports');
    const filePath = path.join(uploadDir, filename);
    
    // Ensure directory exists
    const fs = await import('fs/promises');
    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }
    
    // Save file
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);
    
    // Create import record
    const bulkImport = await prisma.bulkImport.create({
      data: {
        filename,
        originalName: file.name,
        fileUrl: `/uploads/imports/${filename}`,
        type: importType as ImportType,
        status: 'PENDING',
        uploadedById: session.user.id,
      },
    });

    // Parse file data
    let parsedData: any[] = [];
    try {
      if (file.type === 'text/csv') {
        parsedData = await parseCSV(buffer);
      } else {
        parsedData = await parseExcel(buffer);
      }
      
      // Update import with total rows
      await prisma.bulkImport.update({
        where: { id: bulkImport.id },
        data: {
          totalRows: parsedData.length,
          status: 'PROCESSING',
        },
      });
      
      // Process data based on import type
      let result = { successful: 0, errors: [] as any[] };
      
      if (importType === 'STORIES') {
        result = await processStoryImport(parsedData, bulkImport.id, session.user.id);
      }
      
      // Update import with results
      await prisma.bulkImport.update({
        where: { id: bulkImport.id },
        data: {
          status: result.errors.length === 0 ? 'COMPLETED' : 'FAILED',
          processedRows: parsedData.length,
          successfulRows: result.successful,
          errorRows: result.errors.length,
          errors: result.errors,
          summary: {
            totalRows: parsedData.length,
            successful: result.successful,
            failed: result.errors.length,
            importType,
          },
        },
      });
      
      return NextResponse.json({
        importId: bulkImport.id,
        totalRows: parsedData.length,
        successful: result.successful,
        failed: result.errors.length,
        errors: result.errors.slice(0, 10), // Return first 10 errors
      }, { status: 201 });
      
    } catch (parseError) {
      // Update import status to failed
      await prisma.bulkImport.update({
        where: { id: bulkImport.id },
        data: {
          status: 'FAILED',
          errors: [{ error: parseError instanceof Error ? parseError.message : 'Parsing failed' }],
        },
      });
      
      throw parseError;
    }
    
  } catch (error) {
    console.error('Error processing bulk import:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/admin/bulk-import - List import history
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const [imports, totalCount] = await Promise.all([
      prisma.bulkImport.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          uploadedBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.bulkImport.count(),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      imports,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching import history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}