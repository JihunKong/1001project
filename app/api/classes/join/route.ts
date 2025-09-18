import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parseClassCode, isValidClassCode } from '@/lib/classCode';
import { userHasPermission } from '@/lib/auth-utils';
import { PERMISSIONS } from '@/lib/permissions';
import { z } from 'zod';
import { checkExponentialBackoff, RateLimiters, recordSecurityEvent } from '@/lib/distributed-rate-limiter';
import { logAuditEvent } from '@/lib/security/headers';

// Input validation schema
const joinClassSchema = z.object({
  code: z.string().min(6).max(7), // 6 chars or with dash
});

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const userAgent = request.headers.get('user-agent') || '';
  let session;
  let classJoinAttemptFailed = false;

  try {
    // Check authentication first
    session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // CRITICAL SECURITY: Apply rate limiting for class join attempts
    // Use both IP and user ID for comprehensive protection
    const identifier = `${ip}:${session.user.id}`;
    const rateLimitConfig = RateLimiters.classJoin(identifier);
    
    // Check exponential backoff (will also check normal rate limits)
    const rateLimitResult = await checkExponentialBackoff(
      request,
      identifier,
      rateLimitConfig.exponentialBackoff,
      false // This is not a failure yet
    );

    if (!rateLimitResult.success) {
      // Log security event for rate limiting
      await logAuditEvent({
        timestamp: new Date(),
        userId: session.user.id,
        action: 'CLASS_JOIN_RATE_LIMITED',
        resource: '/api/classes/join',
        ip,
        userAgent,
        success: false,
        metadata: {
          rateLimitReason: rateLimitResult.message || 'Rate limit exceeded',
          retryAfter: rateLimitResult.retryAfter || 60,
          remaining: rateLimitResult.remaining
        }
      });

      // Record security event
      await recordSecurityEvent(
        identifier,
        'CLASS_JOIN_RATE_LIMITED',
        'high',
        {
          userId: session.user.id,
          endpoint: '/api/classes/join',
          retryAfter: rateLimitResult.retryAfter || 60
        }
      );

      return NextResponse.json(
        { 
          error: rateLimitResult.message || 'Too many attempts. Please try again later.',
          retryAfter: rateLimitResult.retryAfter
        },
        { 
          status: 429,
          headers: {
            'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
            'X-RateLimit-Limit': rateLimitConfig.exponentialBackoff.maxRequests.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString()
          }
        }
      );
    }

    // Check permission
    if (!userHasPermission(session, PERMISSIONS.CLASS_JOIN)) {
      return NextResponse.json(
        { error: 'You do not have permission to join classes' },
        { status: 403 }
      );
    }

    // Parse and validate input
    const body = await request.json();
    const validatedData = joinClassSchema.parse(body);
    
    // Parse the class code (remove dash if present)
    const code = parseClassCode(validatedData.code);
    
    // Validate code format
    if (!isValidClassCode(code)) {
      return NextResponse.json(
        { error: 'Invalid class code format' },
        { status: 400 }
      );
    }

    // Find class by code
    const classRecord = await prisma.class.findUnique({
      where: { code },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        enrollments: {
          select: {
            studentId: true,
          }
        },
        _count: {
          select: {
            enrollments: true,
          }
        }
      }
    });

    if (!classRecord) {
      classJoinAttemptFailed = true;
      
      // Log failed class lookup attempt
      await logAuditEvent({
        timestamp: new Date(),
        userId: session.user.id,
        action: 'CLASS_JOIN_FAILED_INVALID_CODE',
        resource: '/api/classes/join',
        ip,
        userAgent,
        success: false,
        metadata: {
          attemptedCode: code,
          reason: 'class_not_found'
        }
      });

      // Record security event for failed attempt
      await recordSecurityEvent(
        identifier,
        'CLASS_JOIN_INVALID_CODE',
        'medium',
        {
          userId: session.user.id,
          attemptedCode: code,
          endpoint: '/api/classes/join'
        }
      );

      // Apply exponential backoff for failed attempt
      await checkExponentialBackoff(
        request,
        identifier,
        rateLimitConfig.exponentialBackoff,
        true // This is a failure
      );

      return NextResponse.json(
        { error: 'Class not found. Please check the code and try again.' },
        { status: 404 }
      );
    }

    // Check if class is active
    if (!classRecord.isActive) {
      return NextResponse.json(
        { error: 'This class is no longer accepting new students' },
        { status: 400 }
      );
    }

    // Check if class has ended
    if (new Date() > classRecord.endDate) {
      return NextResponse.json(
        { error: 'This class has ended' },
        { status: 400 }
      );
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.classEnrollment.findUnique({
      where: {
        classId_studentId: {
          classId: classRecord.id,
          studentId: session.user.id,
        }
      }
    });

    if (existingEnrollment) {
      return NextResponse.json(
        { error: 'You are already enrolled in this class' },
        { status: 400 }
      );
    }

    // Check capacity
    if (classRecord._count.enrollments >= classRecord.maxStudents) {
      return NextResponse.json(
        { error: 'This class is full' },
        { status: 400 }
      );
    }

    // Create enrollment
    const enrollment = await prisma.classEnrollment.create({
      data: {
        classId: classRecord.id,
        studentId: session.user.id,
        status: 'ACTIVE',
        progress: 0,
        attendance: 100,
      },
      include: {
        class: {
          include: {
            teacher: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        }
      }
    });

    // Create notification for teacher
    await prisma.notification.create({
      data: {
        userId: classRecord.teacherId,
        type: 'SYSTEM' as const,
        title: 'New Student Enrolled',
        message: `${session.user.name || session.user.email} has joined your class "${classRecord.name}"`,
        data: {
          classId: classRecord.id,
          studentId: session.user.id,
          studentName: session.user.name || session.user.email,
        },
      }
    });

    // Log the action
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'CLASS_JOINED',
        entity: 'CLASS',
        entityId: classRecord.id,
        metadata: {
          className: classRecord.name,
          teacherName: classRecord.teacher.name,
        },
      }
    });

    // Log successful class join for security audit
    await logAuditEvent({
      timestamp: new Date(),
      userId: session.user.id,
      action: 'CLASS_JOIN_SUCCESS',
      resource: '/api/classes/join',
      ip,
      userAgent,
      success: true,
      metadata: {
        classId: classRecord.id,
        className: classRecord.name,
        teacherId: classRecord.teacherId,
        classCode: code
      }
    });

    // Reset exponential backoff on successful join
    await checkExponentialBackoff(
      request,
      identifier,
      rateLimitConfig.exponentialBackoff,
      false // Success resets the backoff
    );

    return NextResponse.json({
      success: true,
      message: `Successfully joined "${classRecord.name}"`,
      enrollment: {
        id: enrollment.id,
        class: {
          id: classRecord.id,
          name: classRecord.name,
          subject: classRecord.subject,
          gradeLevel: classRecord.gradeLevel,
          teacher: classRecord.teacher,
          startDate: classRecord.startDate,
          endDate: classRecord.endDate,
        }
      }
    });

  } catch (error) {
    console.error('Error joining class:', error);
    
    // Log error for security audit if we have session info
    if (session?.user) {
      await logAuditEvent({
        timestamp: new Date(),
        userId: session.user.id,
        action: 'CLASS_JOIN_ERROR',
        resource: '/api/classes/join',
        ip,
        userAgent,
        success: false,
        metadata: {
          errorType: error instanceof z.ZodError ? 'validation_error' : 'server_error',
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        }
      });

      // Apply exponential backoff for errors (potential attack attempts)
      if (!classJoinAttemptFailed) {
        const identifier = `${ip}:${session.user.id}`;
        const rateLimitConfig = RateLimiters.classJoin(identifier);
        await checkExponentialBackoff(
          request,
          identifier,
          rateLimitConfig.exponentialBackoff,
          true // Count errors as failures
        );
      }
    }
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to join class' },
      { status: 500 }
    );
  }
}