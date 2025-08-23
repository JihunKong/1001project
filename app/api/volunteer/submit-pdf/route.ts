import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'
import { randomBytes } from 'crypto'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

// Configure the API to handle large files (100MB)
export const maxDuration = 300; // 5 minutes
export const runtime = 'nodejs';

/**
 * POST /api/volunteer/submit-pdf
 * 
 * Handle PDF file uploads from volunteers
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== UserRole.VOLUNTEER) {
      return NextResponse.json(
        { error: 'Unauthorized. Volunteer access required.' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('pdf') as File
    const title = formData.get('title') as string
    const authorAlias = formData.get('authorAlias') as string
    const language = formData.get('language') as string
    const ageRange = formData.get('ageRange') as string
    const category = formData.get('category') as string
    const tags = formData.get('tags') as string
    const summary = formData.get('summary') as string
    const targetAudience = formData.get('targetAudience') as string
    const copyrightConfirmed = formData.get('copyrightConfirmed') === 'true'
    const portraitRightsConfirmed = formData.get('portraitRightsConfirmed') === 'true'
    const originalWork = formData.get('originalWork') === 'true'
    const licenseType = formData.get('licenseType') as string

    // Validation
    if (!file || !title || !authorAlias || !summary) {
      return NextResponse.json(
        { error: 'Missing required fields: PDF file, title, author alias, and summary are required.' },
        { status: 400 }
      )
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Only PDF files are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (max 100MB)
    const maxSize = 100 * 1024 * 1024 // 100MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum 100MB allowed.' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop()
    const uniqueFileName = `${randomBytes(16).toString('hex')}.${fileExtension}`
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'volunteer-pdfs')
    try {
      await mkdir(uploadsDir, { recursive: true })
    } catch (err) {
      console.error('Error creating uploads directory:', err)
    }

    // Save file to disk
    const filePath = join(uploadsDir, uniqueFileName)
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filePath, buffer)

    // Create volunteer submission record
    const submission = await prisma.volunteerSubmission.create({
      data: {
        volunteerId: session.user.id,
        type: 'PDF_UPLOAD',
        pdfRef: `/uploads/volunteer-pdfs/${uniqueFileName}`,
        originalName: file.name,
        fileSize: file.size,
        title,
        authorAlias,
        language: language || 'en',
        ageRange,
        category: category ? category.split(',').map(c => c.trim()) : [],
        tags: tags ? tags.split(',').map(t => t.trim()) : [],
        summary,
        targetAudience,
        copyrightConfirmed,
        portraitRightsConfirmed,
        originalWork,
        licenseType,
        status: 'SUBMITTED',
        priority: 'MEDIUM'
      },
      include: {
        volunteer: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      submissionId: submission.id,
      message: 'PDF submitted successfully! It will be reviewed by our team.',
      submission: {
        id: submission.id,
        title: submission.title,
        status: submission.status,
        createdAt: submission.createdAt
      }
    })

  } catch (error) {
    console.error('Error processing PDF submission:', error)
    return NextResponse.json(
      { error: 'Failed to process PDF submission' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/volunteer/submit-pdf
 * 
 * Get volunteer's submission history
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== UserRole.VOLUNTEER) {
      return NextResponse.json(
        { error: 'Unauthorized. Volunteer access required.' },
        { status: 401 }
      )
    }

    const submissions = await prisma.volunteerSubmission.findMany({
      where: {
        volunteerId: session.user.id
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        title: true,
        status: true,
        type: true,
        language: true,
        createdAt: true,
        updatedAt: true,
        reviewNotes: true,
        rejectionReason: true,
        publishDate: true,
        reviewer: {
          select: {
            name: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      submissions
    })

  } catch (error) {
    console.error('Error fetching submissions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    )
  }
}