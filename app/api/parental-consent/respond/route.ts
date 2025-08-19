import { NextRequest, NextResponse } from 'next/server';
import { executeWithRLSBypass } from '@/lib/prisma';
import { UserDeletionStatus, ParentalConsentStatus } from '@prisma/client';
import { validateConsentToken } from '@/lib/coppa';
import { processParentalConsent, proceedWithDeletion } from '@/lib/gdpr-deletion';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, approved, timestamp } = body;

    if (!token || typeof approved !== 'boolean') {
      return NextResponse.json(
        { message: 'Token and approval decision are required' },
        { status: 400 }
      );
    }

    // Validate token format
    if (!validateConsentToken(token)) {
      return NextResponse.json(
        { message: 'Invalid consent token' },
        { status: 400 }
      );
    }

    const result = await executeWithRLSBypass(async (client) => {
      // Find deletion request by token
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

      // Check if consent has already been provided
      if (deletionRequest.parentalConsentVerified) {
        return { error: 'Parental consent has already been provided for this request', status: 400 };
      }

      // Process parental consent using existing GDPR deletion utility
      const consentResult = await processParentalConsent(deletionRequest.id, approved);

      // Update deletion request with parental consent decision
      const updatedRequest = await client.userDeletionRequest.update({
        where: { id: deletionRequest.id },
        data: {
          parentalConsentVerified: true,
          parentalConsentGrantedAt: approved ? new Date() : null,
          status: approved ? UserDeletionStatus.CONFIRMED : UserDeletionStatus.CANCELLED,
          updatedAt: new Date()
        }
      });

      // Update user profile parental consent status if approved
      if (approved && deletionRequest.user.profile) {
        await client.profile.update({
          where: { userId: deletionRequest.user.id },
          data: {
            parentalConsentStatus: ParentalConsentStatus.GRANTED,
            parentalConsentDate: new Date(),
            coppaCompliant: true
          }
        });
      }

      // If approved, proceed with deletion after parental consent
      if (approved) {
        try {
          await proceedWithDeletion(deletionRequest.user.id);
        } catch (deletionError) {
          console.error('Deletion processing error:', deletionError);
          // Log error but don't fail the consent response
        }
      }

      return {
        data: {
          message: `Parental consent ${approved ? 'granted' : 'denied'} successfully`,
          approved,
          timestamp: timestamp || new Date().toISOString(),
          deletionRequestId: deletionRequest.id,
          userId: deletionRequest.user.id,
          status: updatedRequest.status
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

    return NextResponse.json(result.data, { status: 200 });

  } catch (error) {
    console.error('Consent response error:', error);
    return NextResponse.json(
      { message: 'Failed to process parental consent' },
      { status: 500 }
    );
  }
}