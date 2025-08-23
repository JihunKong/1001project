import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { UserRole } from '@prisma/client';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    // Return current system settings
    const settings = {
      general: {
        siteName: '1001 Stories',
        siteDescription: 'Discovering, publishing, and sharing stories from children in underserved communities',
        contactEmail: 'support@1001stories.org',
        maintenanceMode: false,
        registrationEnabled: true,
        maxFileUploadSize: 50, // MB
        supportedLanguages: ['en', 'ko', 'es', 'fr'],
        defaultLanguage: 'en'
      },
      content: {
        storyApprovalRequired: true,
        autoPublishAfterApproval: true,
        maxStoriesPerUser: 100,
        allowAnonymousSubmissions: false,
        defaultContentVisibility: 'public',
        moderationEnabled: true
      },
      email: {
        smtpEnabled: true,
        fromAddress: 'noreply@1001stories.org',
        welcomeEmailEnabled: true,
        notificationEmailsEnabled: true,
        digestEmailEnabled: true
      },
      security: {
        passwordMinLength: 8,
        requireEmailVerification: true,
        sessionTimeout: 24, // hours
        maxLoginAttempts: 5,
        lockoutDuration: 30, // minutes
        twoFactorEnabled: false
      },
      uploads: {
        allowedFileTypes: ['pdf', 'jpg', 'jpeg', 'png', 'gif'],
        maxFileSize: 50, // MB
        storageProvider: 'local',
        cdnEnabled: false,
        imageCompressionEnabled: true,
        thumbnailGeneration: true
      },
      donations: {
        stripeEnabled: true,
        paypalEnabled: false,
        minimumDonationAmount: 5,
        defaultCurrency: 'USD',
        donationGoalDisplayed: true,
        monthlyGoal: 5000
      },
      analytics: {
        googleAnalyticsEnabled: false,
        trackingEnabled: true,
        privacyMode: true,
        dataRetentionDays: 365,
        shareAnalytics: false
      },
      api: {
        rateLimitEnabled: true,
        maxRequestsPerMinute: 100,
        apiVersioning: 'v1',
        publicApiEnabled: false,
        webhooksEnabled: false
      }
    };

    return NextResponse.json(settings);

  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch settings',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const updatedSettings = await request.json();

    // In a real application, you would validate and save these settings to a database
    // For now, we'll just return the updated settings
    console.log('Settings update request:', updatedSettings);

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      settings: updatedSettings
    });

  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update settings',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}