import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    });

    if (!user || !['VOLUNTEER', 'ADMIN'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Only volunteers and admins can upload books' },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'content' or 'cover'
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const fileName = file.name.toLowerCase();
    const fileExt = path.extname(fileName).slice(1);
    
    const validContentTypes = ['pdf', 'md', 'html', 'txt'];
    const validImageTypes = ['jpg', 'jpeg', 'png', 'webp'];
    
    if (type === 'content' && !validContentTypes.includes(fileExt)) {
      return NextResponse.json(
        { error: 'Invalid content file type. Must be pdf, md, html, or txt' },
        { status: 400 }
      );
    }
    
    if (type === 'cover' && !validImageTypes.includes(fileExt)) {
      return NextResponse.json(
        { error: 'Invalid image file type. Must be jpg, jpeg, png, or webp' },
        { status: 400 }
      );
    }

    // Generate unique directory for this submission
    const submissionId = crypto.randomBytes(16).toString('hex');
    const submissionDir = path.join(
      process.cwd(),
      'public',
      'books',
      'submissions',
      submissionId
    );
    
    // Create directory
    await fs.mkdir(submissionDir, { recursive: true });

    // Save file
    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = path.join(submissionDir, file.name);
    await fs.writeFile(filePath, buffer);

    // Calculate word count for text files
    let wordCount = null;
    if (['md', 'html', 'txt'].includes(fileExt)) {
      const content = buffer.toString('utf-8');
      wordCount = content.split(/\s+/).filter(Boolean).length;
    }

    // Return file info
    return NextResponse.json({
      success: true,
      submissionId,
      fileName: file.name,
      fileType: fileExt,
      filePath: `${submissionId}/${file.name}`,
      wordCount,
      size: file.size
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}