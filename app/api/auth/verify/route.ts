import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for email verification
const VerifySchema = z.object({
  token: z.string()
    .min(1, 'Verification token is required')
    .max(500, 'Invalid token format'),
  email: z.string()
    .email('Please enter a valid email address')
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();

    let validatedData;
    try {
      validatedData = VerifySchema.parse(body);
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

    // Check if verification token exists and is valid
    const verificationToken = await prisma.verificationToken.findUnique({
      where: {
        token: validatedData.token
      }
    });

    if (!verificationToken) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      );
    }

    // Check if token has expired
    if (verificationToken.expires < new Date()) {
      // Clean up expired token
      await prisma.verificationToken.delete({
        where: {
          token: validatedData.token
        }
      });

      return NextResponse.json(
        { error: 'Verification token has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Find user by email from the token
    const user = await prisma.user.findUnique({
      where: {
        email: verificationToken.identifier
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if email is already verified
    if (user.emailVerified) {
      // Clean up token since verification is already complete
      await prisma.verificationToken.delete({
        where: {
          token: validatedData.token
        }
      });

      return NextResponse.json({
        verified: true,
        message: 'Email is already verified',
        user: {
          email: user.email,
          name: user.name,
          role: user.role,
        }
      });
    }

    // Perform verification in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update user email verification status
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          emailVerified: new Date(),
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          emailVerified: true,
        }
      });

      // Delete the used verification token
      await tx.verificationToken.delete({
        where: {
          token: validatedData.token
        }
      });

      return updatedUser;
    });

    return NextResponse.json({
      verified: true,
      message: 'Email verified successfully',
      user: {
        email: result.email,
        name: result.name,
        role: result.role,
        emailVerified: result.emailVerified,
      }
    });

  } catch (error) {
    console.error('Error during email verification:', error);

    return NextResponse.json(
      { error: 'Internal server error during verification' },
      { status: 500 }
    );
  }
}

// GET method for token verification (alternative approach)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    // Check if verification token exists and is valid
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token }
    });

    if (!verificationToken) {
      return NextResponse.json({
        verified: false,
        error: 'Invalid or expired verification token'
      }, { status: 400 });
    }

    // Check if token has expired
    if (verificationToken.expires < new Date()) {
      return NextResponse.json({
        verified: false,
        error: 'Verification token has expired'
      }, { status: 400 });
    }

    // Find user by email from the token
    const user = await prisma.user.findUnique({
      where: {
        email: verificationToken.identifier
      },
      select: {
        email: true,
        name: true,
        role: true,
        emailVerified: true,
      }
    });

    if (!user) {
      return NextResponse.json({
        verified: false,
        error: 'User not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      verified: !!user.emailVerified,
      user: {
        email: user.email,
        name: user.name,
        role: user.role,
      },
      tokenValid: true
    });

  } catch (error) {
    console.error('Error checking verification status:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}