import { NextRequest, NextResponse } from 'next/server';
import { executeWithRLSBypass } from '@/lib/prisma';
import { UserDeletionStatus, ParentalConsentStatus } from '@prisma/client';
import { validateConsentToken } from '@/lib/coppa';
import { processParentalConsent } from '@/lib/gdpr-deletion';
import { createDeletionAuditLog } from '@/lib/gdpr-deletion';
import { monitorAuditLogEntry } from '@/lib/audit-monitoring';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, approved, timestamp, parentInfo } = body;
    
    // Get request context for audit logging
    const headersList = await headers();
    const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';

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

      // Process parental consent with enhanced logging
      await processParentalConsent(token, approved, parentInfo);

      // The consent is already processed by processParentalConsent
      // Fetch the updated request
      const updatedRequest = await client.userDeletionRequest.findUnique({
        where: { id: deletionRequest.id }
      });
      
      if (!updatedRequest) {
        throw new Error('Failed to retrieve updated deletion request');
      }

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

      // Create additional audit log for parental consent response
      try {
        const auditLog = await createDeletionAuditLog({
          deletionRequestId: deletionRequest.id,
          action: approved ? 'PARENTAL_CONSENT_GRANTED' : 'PARENTAL_CONSENT_DENIED',
          performedByType: 'PARENT',
          previousStatus: deletionRequest.status,
          newStatus: updatedRequest.status,
          details: `Parental consent ${approved ? 'granted' : 'denied'} via secure link`,
          metadata: {
            consentToken: token.substring(0, 8) + '...', // Partial token for audit
            parentInfo: parentInfo || {},
            timestamp: timestamp || new Date().toISOString(),
            approved
          },
          context: {
            ipAddress,
            userAgent
          }
        });
        
        // Trigger real-time monitoring
        if (auditLog && auditLog.id) {
          setImmediate(() => {
            monitorAuditLogEntry(auditLog.id).catch(error => 
              console.error('Audit monitoring error:', error)
            );
          });
        }
      } catch (auditError) {
        console.error('Audit logging error:', auditError);
        // Don't fail the consent processing due to audit logging issues
      }

      // Log successful consent processing
      console.log(`PARENTAL_CONSENT: ${approved ? 'GRANTED' : 'DENIED'}`, {
        deletionRequestId: deletionRequest.id,
        userId: deletionRequest.user.id,
        approved,
        ipAddress: ipAddress.substring(0, 8) + '...',
        timestamp: new Date().toISOString()
      });
      
      return {
        data: {
          message: `Parental consent ${approved ? 'granted' : 'denied'} successfully`,
          approved,
          timestamp: timestamp || new Date().toISOString(),
          deletionRequestId: deletionRequest.id,
          userId: deletionRequest.user.id,
          status: updatedRequest.status,
          nextSteps: approved ? 
            ['Account deletion process will begin shortly', 'Data will be anonymized within 7 days'] :
            ['Account deletion request has been cancelled', 'User account remains active']
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
    // Enhanced error logging with context
    console.error('PARENTAL_CONSENT_ERROR:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      requestBody: body ? { ...body, token: body.token?.substring(0, 8) + '...' } : undefined
    });
    
    // Attempt to log the error in audit system if we have enough context
    if (body?.token) {
      try {
        // This is a best-effort attempt to log the error
        const headersList = await headers();
        const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown';
        
        // Try to find the deletion request to log the error
        const errorResult = await executeWithRLSBypass(async (client) => {
          const deletionRequest = await client.userDeletionRequest.findUnique({
            where: { parentConfirmationToken: body.token }
          });
          
          if (deletionRequest) {
            await createDeletionAuditLog({
              deletionRequestId: deletionRequest.id,
              action: 'SYSTEM_ERROR',
              performedByType: 'SYSTEM',
              details: `Error processing parental consent: ${error instanceof Error ? error.message : 'Unknown error'}`,
              metadata: {
                errorType: 'parental_consent_processing',
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
                token: body.token.substring(0, 8) + '...'
              },
              context: { ipAddress }
            });
          }
        });
      } catch (auditError) {
        console.error('Failed to log error in audit system:', auditError);
      }
    }
    
    return NextResponse.json(
      { message: 'Failed to process parental consent' },
      { status: 500 }
    );
  }
}