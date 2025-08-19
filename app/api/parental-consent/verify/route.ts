import { NextRequest, NextResponse } from 'next/server';
import { executeWithRLSBypass } from '@/lib/prisma';
import { validateConsentToken, calculateAge, isMinorUnderCOPPA } from '@/lib/coppa';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { message: 'Consent token is required' },
        { status: 400 }
      );
    }

    // Basic token validation
    if (!validateConsentToken(token)) {
      return NextResponse.json(
        { message: 'Invalid consent token format' },
        { status: 400 }
      );
    }

    // Query database for actual deletion request by token
    const result = await executeWithRLSBypass(async (client) => {
      const deletionRequest = await client.userDeletionRequest.findUnique({
        where: { parentConfirmationToken: token },
        include: { 
          user: { 
            include: { 
              profile: true 
            } 
          } 
        }
      });

      if (!deletionRequest || !deletionRequest.user) {
        return { error: 'Invalid or expired consent link', status: 400 };
      }

      // Check token expiry
      if (deletionRequest.parentConfirmationExpiry && deletionRequest.parentConfirmationExpiry < new Date()) {
        return { error: 'Consent link has expired', status: 400 };
      }

      // Verify this is actually a minor requiring parental consent
      if (!deletionRequest.parentalConsentRequired) {
        return { error: 'Parental consent is not required for this request', status: 400 };
      }

      // Check if consent has already been provided
      if (deletionRequest.parentalConsentVerified) {
        return { error: 'Parental consent has already been provided for this request', status: 400 };
      }

      const profile = deletionRequest.user.profile;
      const childAge = profile?.dateOfBirth ? calculateAge(profile.dateOfBirth) : null;
      
      return {
        childData: {
          childName: deletionRequest.user.name || 'User',
          childEmail: deletionRequest.user.email,
          childAge,
          requestDate: deletionRequest.createdAt,
          expiryDate: deletionRequest.parentConfirmationExpiry,
          isMinor: profile?.dateOfBirth ? isMinorUnderCOPPA(profile.dateOfBirth) : true,
          parentEmail: profile?.parentEmail,
          parentName: profile?.parentName,
          isValid: true
        },
        status: 200
      };
    });

    if (result.error) {
      return NextResponse.json(
        { message: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json(result.childData, { status: 200 });

  } catch (error) {
    console.error('Consent verification error:', error);
    return NextResponse.json(
      { message: 'Failed to verify consent token' },
      { status: 500 }
    );
  }
}