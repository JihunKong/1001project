import { NextRequest, NextResponse } from 'next/server';
import { executeWithRLSBypass } from '@/lib/prisma';
import { UserRole, AgeVerificationStatus, ParentalConsentStatus } from '@prisma/client';
import { sendWelcomeEmail } from '@/lib/email';
import { 
  verifyAge, 
  checkCOPPACompliance, 
  generateConsentToken,
  generateParentalConsentData 
} from '@/lib/coppa';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      email, 
      name, 
      role, 
      organization, 
      subscribeNewsletter,
      dateOfBirth,
      parentEmail,
      parentName,
      ageVerification
    } = body;

    // Validate required fields
    if (!dateOfBirth) {
      return NextResponse.json(
        { message: 'Date of birth is required' },
        { status: 400 }
      );
    }

    // Perform age verification and COPPA compliance check
    const birthDate = new Date(dateOfBirth);
    const ageVerificationResult = verifyAge(birthDate);
    const complianceCheck = checkCOPPACompliance(birthDate);

    // For minors, validate parent information
    if (ageVerificationResult.isMinor) {
      if (!parentEmail || !parentName) {
        return NextResponse.json(
          { message: 'Parent email and name are required for users under 13' },
          { status: 400 }
        );
      }
    }

    // Generate consent token for minors
    let consentToken = null;
    if (ageVerificationResult.isMinor) {
      consentToken = generateConsentToken();
    }

    const { user } = await executeWithRLSBypass(async (client) => {
      // Check if user already exists
      const existingUser = await client.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Check if parent email already exists for another minor
      if (parentEmail) {
        const existingParentEmail = await client.profile.findFirst({
          where: { parentEmail },
        });
        
        if (existingParentEmail) {
          console.warn(`Parent email ${parentEmail} already used for another minor account`);
        }
      }

      // Validate role
      const validRoles = Object.values(UserRole);
      const userRole = validRoles.includes(role as UserRole) ? (role as UserRole) : UserRole.LEARNER;

      // Create new user with COPPA compliance data
      const user = await client.user.create({
        data: {
          email,
          name,
          role: userRole,
          profile: {
            create: {
              organization,
              language: 'en',
              dateOfBirth: birthDate,
              
              // COPPA compliance fields
              isMinor: ageVerificationResult.isMinor,
              ageVerificationStatus: ageVerificationResult.ageVerificationStatus,
              parentalConsentRequired: ageVerificationResult.requiresParentalConsent,
              parentalConsentStatus: ageVerificationResult.parentalConsentStatus,
              parentEmail: ageVerificationResult.isMinor ? parentEmail : null,
              parentName: ageVerificationResult.isMinor ? parentName : null,
              coppaCompliant: !ageVerificationResult.isMinor, // Adults are immediately compliant
              
              // Adjust newsletter subscription for minors (COPPA requirement)
              newsletter: ageVerificationResult.isMinor ? false : subscribeNewsletter,
            },
          },
          subscription: {
            create: {
              plan: 'FREE',
              status: 'ACTIVE',
              maxStudents: 30,
              maxDownloads: 10,
              canAccessPremium: false,
              canDownloadPDF: false,
              canCreateClasses: userRole === UserRole.TEACHER || userRole === UserRole.INSTITUTION,
            },
          },
        },
        include: {
          profile: true,
          subscription: true,
        },
      });

      return { user, consentToken };
    });

    // Handle email notifications based on age
    if (ageVerificationResult.isMinor && consentToken) {
      // Send parental consent email
      try {
        const consentData = generateParentalConsentData(
          name,
          email,
          ageVerificationResult.age,
          parentEmail,
          consentToken
        );
        
        // TODO: Implement sendParentalConsentEmail function
        // await sendParentalConsentEmail(consentData);
        console.log('Parental consent email would be sent to:', parentEmail);
        console.log('Consent token:', consentToken);
      } catch (error) {
        console.error('Failed to send parental consent email:', error);
      }
    } else {
      // Send regular welcome email for adults
      sendWelcomeEmail(email, name, user.role).catch(console.error);
    }

    return NextResponse.json(
      { 
        message: ageVerificationResult.isMinor 
          ? 'Account created successfully. Parental consent email sent.'
          : 'User created successfully',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isMinor: ageVerificationResult.isMinor,
          requiresParentalConsent: ageVerificationResult.requiresParentalConsent,
        },
        consentToken: ageVerificationResult.isMinor ? consentToken : undefined,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { message: 'Failed to create user account' },
      { status: 500 }
    );
  }
}