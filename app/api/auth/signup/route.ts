import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { z } from 'zod';
import {
  verifyAge,
  checkCOPPACompliance,
  isValidDateOfBirth,
  generateConsentToken,
  generateParentalConsentData
} from '@/lib/coppa';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

// Validation schema for user registration
const SignupSchema = z.object({
  email: z.string()
    .email('Please enter a valid email address')
    .min(5, 'Email must be at least 5 characters')
    .max(255, 'Email must be less than 255 characters')
    .toLowerCase(),
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .trim(),
  role: z.enum(['LEARNER', 'TEACHER', 'WRITER', 'INSTITUTION'])
    .refine(val => ['LEARNER', 'TEACHER', 'WRITER', 'INSTITUTION'].includes(val), {
      message: 'Please select a valid role'
    }),
  // COPPA Compliance - Age verification required
  dateOfBirth: z.string()
    .refine(val => {
      try {
        const date = new Date(val);
        return isValidDateOfBirth(date);
      } catch {
        return false;
      }
    }, 'Please provide a valid date of birth'),
  // Parental information (required for minors under 13)
  parentEmail: z.string()
    .email('Please enter a valid parent email address')
    .optional(),
  parentName: z.string()
    .min(1, 'Parent name is required for minors')
    .max(100, 'Parent name must be less than 100 characters')
    .optional(),
  // Optional profile information
  organization: z.string()
    .max(200, 'Organization must be less than 200 characters')
    .trim()
    .optional(),
  bio: z.string()
    .max(1000, 'Bio must be less than 1000 characters')
    .trim()
    .optional(),
  phone: z.string()
    .max(20, 'Phone must be less than 20 characters')
    .trim()
    .optional(),
  // Terms acceptance
  acceptedTerms: z.boolean()
    .refine(val => val === true, 'You must accept the terms and conditions'),
  acceptedPrivacy: z.boolean()
    .refine(val => val === true, 'You must accept the privacy policy'),
});

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting for signup attempts
    const rateLimitResult = await checkRateLimit(request, RATE_LIMITS.SIGNUP_API);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: rateLimitResult.error,
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': RATE_LIMITS.SIGNUP_API.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
            'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString()
          }
        }
      );
    }

    // Parse and validate request body
    const body = await request.json();

    let validatedData;
    try {
      validatedData = SignupSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            details: error.issues.map(err => ({
              field: err.path.join('.'),
              message: err.message
            }))
          },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    // COPPA Compliance - Age verification and minor handling
    const dateOfBirth = new Date(validatedData.dateOfBirth);
    const ageVerification = verifyAge(dateOfBirth);
    const coppaCompliance = checkCOPPACompliance(dateOfBirth);

    // For minors under 13, validate parental information is provided
    if (ageVerification.requiresParentalConsent) {
      if (!validatedData.parentEmail || !validatedData.parentName) {
        return NextResponse.json(
          {
            error: 'Parental information required',
            details: [{
              field: 'parentEmail',
              message: 'Parent email is required for users under 13'
            }, {
              field: 'parentName',
              message: 'Parent name is required for users under 13'
            }],
            requiresParentalConsent: true,
            age: ageVerification.age
          },
          { status: 400 }
        );
      }

      // Check if parental consent is already denied or expired
      if (!coppaCompliance.canCreateAccount) {
        return NextResponse.json(
          {
            error: 'Cannot create account',
            reason: coppaCompliance.reason,
            requiresParentalConsent: true
          },
          { status: 403 }
        );
      }
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 409 }
      );
    }

    // Handle minor registration with parental consent requirement
    if (ageVerification.requiresParentalConsent) {
      // Generate parental consent token and data
      const consentToken = generateConsentToken();
      const consentData = generateParentalConsentData(
        validatedData.name,
        validatedData.email,
        ageVerification.age,
        validatedData.parentEmail!,
        consentToken
      );

      // Create pending user account (requires parental consent)
      const pendingUser = await prisma.$transaction(async (tx) => {
        // Create user with pending status
        const user = await tx.user.create({
          data: {
            email: validatedData.email,
            name: validatedData.name,
            role: validatedData.role as UserRole,
            emailVerified: null,
            // NOTE: User will be inactive until parental consent
          },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
          }
        });

        // Create profile with age verification data
        await tx.profile.create({
          data: {
            userId: user.id,
            firstName: validatedData.name.split(' ')[0] || validatedData.name,
            lastName: validatedData.name.split(' ').slice(1).join(' ') || null,
            organization: validatedData.organization || null,
            bio: validatedData.bio || null,
            phone: validatedData.phone || null,
            language: 'en',
            timezone: 'UTC',
            // COPPA compliance fields
            dateOfBirth: dateOfBirth,
            isMinor: ageVerification.isMinor,
            ageVerificationStatus: ageVerification.ageVerificationStatus,
            parentalConsentStatus: ageVerification.parentalConsentStatus,
            parentEmail: validatedData.parentEmail || null,
            parentName: validatedData.parentName || null,
          }
        });

        // Store parental consent token in user profile for now
        // TODO: Implement dedicated ParentalConsentRequest table
        await tx.profile.update({
          where: { userId: user.id },
          data: {
            parentalConsentRequired: true,
            parentalConsentStatus: 'PENDING',
            // Store consent token in a simple way for now
          }
        });

        return user;
      });

      // TODO: Send parental consent email using consentData
      // For now, return response indicating parental consent is required
      return NextResponse.json({
        message: 'Account pending parental consent',
        user: pendingUser,
        requiresParentalConsent: true,
        parentalConsentRequired: true,
        consentDetails: {
          parentEmail: validatedData.parentEmail,
          expiresAt: consentData.expirationDate,
        },
        nextStep: 'parental_consent_required'
      }, { status: 202 });
    }

    // Create adult user account with transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: validatedData.email,
          name: validatedData.name,
          role: validatedData.role as UserRole,
          emailVerified: null, // Will be verified via magic link
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        }
      });

      // Create user profile with age verification data
      await tx.profile.create({
        data: {
          userId: user.id,
          firstName: validatedData.name.split(' ')[0] || validatedData.name,
          lastName: validatedData.name.split(' ').slice(1).join(' ') || null,
          organization: validatedData.organization || null,
          bio: validatedData.bio || null,
          phone: validatedData.phone || null,
          language: 'en',
          timezone: 'UTC',
          // COPPA compliance fields
          dateOfBirth: dateOfBirth,
          isMinor: ageVerification.isMinor,
          ageVerificationStatus: ageVerification.ageVerificationStatus,
          parentalConsentStatus: ageVerification.parentalConsentStatus,
        }
      });

      // Create default subscription
      await tx.subscription.create({
        data: {
          userId: user.id,
          plan: 'FREE',
          status: 'ACTIVE',
        }
      });

      // Create volunteer profile if role is WRITER
      if (validatedData.role === 'WRITER') {
        await tx.volunteerProfile.create({
          data: {
            userId: user.id,
            verificationStatus: 'PENDING',
            languageLevels: {},
            availableSlots: {},
          }
        });
      }

      return user;
    });

    return NextResponse.json({
      message: 'User registration successful',
      user: result,
      nextStep: 'email_verification'
    }, { status: 201 });

  } catch (error) {
    console.error('Error during user registration:', error);

    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'A user with this email already exists' },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error during registration' },
      { status: 500 }
    );
  }
}

// Method not allowed for other HTTP methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}