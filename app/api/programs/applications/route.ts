import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { 
  ProgramType, 
  ProgramApplicationStatus, 
  UserRole, 
  AttachmentType 
} from '@prisma/client';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// GET - Retrieve user's applications
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' }, 
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const programType = searchParams.get('programType');

    const where: any = {
      applicantId: session.user.id
    };

    if (status) {
      where.status = status as ProgramApplicationStatus;
    }

    if (programType) {
      where.programType = programType as ProgramType;
    }

    const applications = await prisma.programApplication.findMany({
      where,
      include: {
        attachments: true,
        reviews: {
          include: {
            reviewer: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        statusHistory: {
          include: {
            changedBy: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: {
            changedAt: 'desc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ applications });
    
  } catch (error) {
    console.error('Program applications GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// POST - Submit new application
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' }, 
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const applicationDataStr = formData.get('applicationData') as string;
    
    if (!applicationDataStr) {
      return NextResponse.json(
        { error: 'Application data is required' }, 
        { status: 400 }
      );
    }

    const applicationData = JSON.parse(applicationDataStr);

    // Validate required fields
    if (!applicationData.programType || !applicationData.fullName || !applicationData.email) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      );
    }

    // Validate program type
    if (!Object.values(ProgramType).includes(applicationData.programType)) {
      return NextResponse.json(
        { error: 'Invalid program type' }, 
        { status: 400 }
      );
    }

    // Create application in database transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the application
      const application = await tx.programApplication.create({
        data: {
          applicantId: session.user.id,
          programType: applicationData.programType,
          status: ProgramApplicationStatus.SUBMITTED,
          fullName: applicationData.fullName,
          email: applicationData.email,
          phone: applicationData.phone || null,
          country: applicationData.country,
          city: applicationData.city,
          timezone: applicationData.timezone || null,
          languages: applicationData.languages || [],
          organizationName: applicationData.organizationName || null,
          organizationType: applicationData.organizationType || null,
          jobTitle: applicationData.jobTitle || null,
          experienceYears: applicationData.experienceYears || null,
          weeklyHours: applicationData.weeklyHours || null,
          availableDays: applicationData.availableDays || [],
          timeWindows: applicationData.timeWindows || {},
          interests: applicationData.interests || [],
          skills: applicationData.skills || [],
          languageProficiency: applicationData.languageProficiency || {},
          goals: applicationData.goals || null,
          motivation: applicationData.motivation || null,
          preferredModality: applicationData.preferredModality || null,
          programSpecificData: applicationData.programSpecificData || {},
          dataProcessingConsent: applicationData.dataProcessingConsent || false,
          codeOfConductAccepted: applicationData.codeOfConductAccepted || false,
          backgroundCheckConsent: applicationData.backgroundCheckConsent || false,
          submittedAt: new Date()
        }
      });

      // Create initial status history entry
      await tx.applicationStatusHistory.create({
        data: {
          applicationId: application.id,
          fromStatus: null,
          toStatus: ProgramApplicationStatus.SUBMITTED,
          changedById: session.user.id,
          reason: 'Application submitted',
          automaticChange: false
        }
      });

      return application;
    });

    // Handle file attachments
    const attachments: any[] = [];
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'program-applications', result.id);
    
    // Create upload directory if it doesn't exist
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Process uploaded files
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('attachment_') && value instanceof File) {
        const file = value as File;
        
        // Validate file
        const allowedTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'image/png',
          'image/jpeg'
        ];
        
        if (!allowedTypes.includes(file.type)) {
          continue; // Skip invalid file types
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB limit
          continue; // Skip files that are too large
        }

        // Save file
        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = `${Date.now()}-${file.name}`;
        const filepath = join(uploadDir, filename);
        
        await writeFile(filepath, buffer);

        // Determine attachment type
        let attachmentType = AttachmentType.OTHER_DOCUMENT;
        if (file.name.toLowerCase().includes('cv') || file.name.toLowerCase().includes('resume')) {
          attachmentType = AttachmentType.CV_RESUME;
        } else if (file.name.toLowerCase().includes('portfolio')) {
          attachmentType = AttachmentType.PORTFOLIO;
        } else if (file.name.toLowerCase().includes('teaching')) {
          attachmentType = AttachmentType.TEACHING_SAMPLES;
        } else if (file.name.toLowerCase().includes('cert')) {
          attachmentType = AttachmentType.CERTIFICATES;
        } else if (file.name.toLowerCase().includes('transcript')) {
          attachmentType = AttachmentType.TRANSCRIPTS;
        } else if (file.name.toLowerCase().includes('recommend')) {
          attachmentType = AttachmentType.RECOMMENDATION_LETTER;
        }

        // Save attachment record
        const attachment = await prisma.applicationAttachment.create({
          data: {
            applicationId: result.id,
            filename,
            originalName: file.name,
            filePath: `/uploads/program-applications/${result.id}/${filename}`,
            fileSize: file.size,
            mimeType: file.type,
            attachmentType
          }
        });

        attachments.push(attachment);
      }
    }

    // Send confirmation email (implement later)
    try {
      await sendApplicationConfirmationEmail(result, attachments);
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({ 
      success: true,
      applicationId: result.id,
      message: 'Application submitted successfully' 
    });
    
  } catch (error) {
    console.error('Program applications POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// Email notification function
async function sendApplicationConfirmationEmail(application: any, attachments: any[]) {
  try {
    const { sendProgramApplicationConfirmationEmail } = await import('@/lib/email');
    
    await sendProgramApplicationConfirmationEmail(
      application.email,
      application.fullName,
      application.programType,
      application.id
    );
    
    console.log(`Confirmation email sent for application ${application.id}`);
  } catch (error) {
    console.error(`Failed to send confirmation email for application ${application.id}:`, error);
    throw error;
  }
}