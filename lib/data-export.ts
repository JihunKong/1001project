import { prisma } from '@/lib/prisma';
import { ExportStatus } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import archiver from 'archiver';

const EXPORT_DIR = path.join(process.cwd(), 'private', 'exports');
const EXPORT_EXPIRY_DAYS = 7;

export interface ExportCategory {
  name: string;
  filename: string;
  getData: (userId: string) => Promise<Record<string, unknown>>;
}

export class DataExportService {
  private categories: ExportCategory[] = [
    {
      name: 'Personal Information',
      filename: '1-personal-info.json',
      getData: this.getPersonalInfo.bind(this),
    },
    {
      name: 'Reading History',
      filename: '2-reading-history.json',
      getData: this.getReadingHistory.bind(this),
    },
    {
      name: 'Education',
      filename: '3-education.json',
      getData: this.getEducationData.bind(this),
    },
    {
      name: 'Content Created',
      filename: '4-content-created.json',
      getData: this.getContentCreated.bind(this),
    },
    {
      name: 'Volunteer',
      filename: '5-volunteer.json',
      getData: this.getVolunteerData.bind(this),
    },
    {
      name: 'Financial',
      filename: '6-financial.json',
      getData: this.getFinancialData.bind(this),
    },
    {
      name: 'System',
      filename: '7-system.json',
      getData: this.getSystemData.bind(this),
    },
  ];

  async createExportRequest(userId: string): Promise<string> {
    const existingPending = await prisma.dataExportRequest.findFirst({
      where: {
        userId,
        status: { in: ['PENDING', 'PROCESSING'] },
      },
    });

    if (existingPending) {
      throw new Error('An export request is already in progress');
    }

    const request = await prisma.dataExportRequest.create({
      data: {
        userId,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + EXPORT_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
      },
    });

    return request.id;
  }

  async processExport(requestId: string): Promise<void> {
    const request = await prisma.dataExportRequest.findUnique({
      where: { id: requestId },
      include: { user: true },
    });

    if (!request) {
      throw new Error('Export request not found');
    }

    await prisma.dataExportRequest.update({
      where: { id: requestId },
      data: { status: 'PROCESSING', startedAt: new Date() },
    });

    try {
      if (!fs.existsSync(EXPORT_DIR)) {
        fs.mkdirSync(EXPORT_DIR, { recursive: true });
      }

      const exportData: Record<string, unknown> = {};
      for (const category of this.categories) {
        exportData[category.name] = await category.getData(request.userId);
      }

      const filename = `user-data-export-${request.userId}-${Date.now()}`;
      const zipPath = path.join(EXPORT_DIR, `${filename}.zip`);

      await this.createZipArchive(zipPath, exportData, request.user?.name || 'User');

      const stats = fs.statSync(zipPath);

      await prisma.dataExportRequest.update({
        where: { id: requestId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          filePath: zipPath,
          fileSize: stats.size,
        },
      });
    } catch (error) {
      await prisma.dataExportRequest.update({
        where: { id: requestId },
        data: {
          status: 'FAILED',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      });
      throw error;
    }
  }

  private async createZipArchive(
    zipPath: string,
    data: Record<string, unknown>,
    userName: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => resolve());
      archive.on('error', (err) => reject(err));

      archive.pipe(output);

      for (const category of this.categories) {
        const categoryData = data[category.name] || {};
        archive.append(JSON.stringify(categoryData, null, 2), { name: category.filename });
      }

      const readme = this.generateReadme(userName);
      archive.append(readme, { name: 'README.txt' });

      archive.finalize();
    });
  }

  private generateReadme(userName: string): string {
    const date = new Date().toISOString();
    return `1001 Stories - Data Export
========================

Export Date: ${date}
User: ${userName}

This archive contains all personal data associated with your 1001 Stories account.

Files Included:
- 1-personal-info.json: Account and profile information
- 2-reading-history.json: Reading progress, bookmarks, and reading lists
- 3-education.json: Class enrollments, submissions, and lesson progress
- 4-content-created.json: Stories, submissions, comments, and AI reviews
- 5-volunteer.json: Volunteer profile, applications, and hours
- 6-financial.json: Orders, subscriptions, and donations
- 7-system.json: Notifications, activity logs, and achievements

Data Format: JSON (UTF-8 encoded)

For questions about your data, contact: privacy@1001stories.org

This export was generated in compliance with:
- GDPR (General Data Protection Regulation)
- PIPA (Personal Information Protection Act - Korea)
- FERPA (Family Educational Rights and Privacy Act - USA)
- COPPA (Children's Online Privacy Protection Act - USA)
`;
  }

  private async getPersonalInfo(userId: string): Promise<Record<string, unknown>> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: {
        firstName: true,
        lastName: true,
        bio: true,
        organization: true,
        location: true,
        phone: true,
        dateOfBirth: true,
        language: true,
        timezone: true,
        isMinor: true,
        ageVerificationStatus: true,
        parentalConsentStatus: true,
        aiServiceConsent: true,
        aiServiceConsentDate: true,
        dataTransferConsent: true,
        dataTransferConsentDate: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return { user, profile };
  }

  private async getReadingHistory(userId: string): Promise<Record<string, unknown>> {
    const readingProgress = await prisma.readingProgress.findMany({
      where: { userId },
      select: {
        bookId: true,
        currentChapter: true,
        currentPage: true,
        percentComplete: true,
        totalReadingTime: true,
        startedAt: true,
        completedAt: true,
        notes: true,
        book: { select: { title: true, authorName: true } },
      },
    });

    const bookmarks = await prisma.bookmark.findMany({
      where: { userId },
      select: {
        bookId: true,
        chapterId: true,
        position: true,
        note: true,
        color: true,
        createdAt: true,
        book: { select: { title: true } },
      },
    });

    const readingLists = await prisma.readingList.findMany({
      where: { userId },
      select: {
        name: true,
        description: true,
        isPublic: true,
        bookIds: true,
        createdAt: true,
      },
    });

    const bookFavorites = await prisma.bookFavorite.findMany({
      where: { userId },
      select: {
        bookId: true,
        createdAt: true,
        book: { select: { title: true, authorName: true } },
      },
    });

    const reviews = await prisma.review.findMany({
      where: { userId },
      select: {
        rating: true,
        title: true,
        comment: true,
        contentType: true,
        contentId: true,
        createdAt: true,
      },
    });

    return { readingProgress, bookmarks, readingLists, bookFavorites, reviews };
  }

  private async getEducationData(userId: string): Promise<Record<string, unknown>> {
    const enrollments = await prisma.classEnrollment.findMany({
      where: { studentId: userId },
      select: {
        status: true,
        grade: true,
        attendance: true,
        progress: true,
        enrolledAt: true,
        class: { select: { name: true, subject: true } },
      },
    });

    const submissions = await prisma.submission.findMany({
      where: { studentId: userId },
      select: {
        content: true,
        status: true,
        grade: true,
        feedback: true,
        submittedAt: true,
        attachments: true,
        assignment: { select: { title: true } },
      },
    });

    const lessonProgress = await prisma.lessonProgress.findMany({
      where: { studentId: userId },
      select: {
        timeSpent: true,
        score: true,
        startedAt: true,
        completedAt: true,
        lesson: { select: { title: true } },
      },
    });

    const teachingClasses = await prisma.class.findMany({
      where: { teacherId: userId },
      select: {
        name: true,
        subject: true,
        gradeLevel: true,
        schedule: true,
        createdAt: true,
        maxStudents: true,
      },
    });

    return { enrollments, submissions, lessonProgress, teachingClasses };
  }

  private async getContentCreated(userId: string): Promise<Record<string, unknown>> {
    const textSubmissions = await prisma.textSubmission.findMany({
      where: { authorId: userId },
      select: {
        title: true,
        content: true,
        summary: true,
        status: true,
        ageRange: true,
        category: true,
        tags: true,
        wordCount: true,
        createdAt: true,
        submittedAt: true,
        publishedAt: true,
      },
    });

    const volunteerSubmissions = await prisma.volunteerSubmission.findMany({
      where: { volunteerId: userId },
      select: {
        title: true,
        type: true,
        textContent: true,
        summary: true,
        status: true,
        createdAt: true,
      },
    });

    const comments = await prisma.comment.findMany({
      where: { authorId: userId },
      select: {
        content: true,
        status: true,
        createdAt: true,
        textSubmission: { select: { title: true } },
      },
    });

    const aiReviews = await prisma.aIReview.findMany({
      where: { submission: { authorId: userId } },
      select: {
        reviewType: true,
        status: true,
        feedback: true,
        score: true,
        createdAt: true,
      },
    });

    return { textSubmissions, volunteerSubmissions, comments, aiReviews };
  }

  private async getVolunteerData(userId: string): Promise<Record<string, unknown>> {
    const volunteerProfile = await prisma.volunteerProfile.findUnique({
      where: { userId },
      select: {
        skills: true,
        languages: true,
        availableSlots: true,
        experience: true,
        portfolio: true,
        totalHours: true,
        rating: true,
        reliability: true,
        verificationStatus: true,
        createdAt: true,
      },
    });

    const applications = await prisma.volunteerApplication.findMany({
      where: { volunteerUserId: userId },
      select: {
        motivation: true,
        experience: true,
        status: true,
        createdAt: true,
        reviewedAt: true,
        project: { select: { title: true } },
      },
    });

    const hours = await prisma.volunteerHours.findMany({
      where: { volunteerId: userId },
      select: {
        hours: true,
        activity: true,
        impact: true,
        verified: true,
        createdAt: true,
        verifiedAt: true,
        project: { select: { title: true } },
      },
    });

    const certificates = await prisma.volunteerCertificate.findMany({
      where: { volunteerId: userId },
      select: {
        type: true,
        title: true,
        description: true,
        hoursContributed: true,
        projectCount: true,
        issuedDate: true,
      },
    });

    return { volunteerProfile, applications, hours, certificates };
  }

  private async getFinancialData(userId: string): Promise<Record<string, unknown>> {
    const orders = await prisma.order.findMany({
      where: { userId },
      select: {
        orderNumber: true,
        status: true,
        paymentStatus: true,
        subtotal: true,
        tax: true,
        total: true,
        createdAt: true,
        items: {
          select: {
            quantity: true,
            price: true,
            product: { select: { title: true } },
          },
        },
      },
    });

    const subscription = await prisma.subscription.findUnique({
      where: { userId },
      select: {
        plan: true,
        status: true,
        startDate: true,
        endDate: true,
        cancelledAt: true,
      },
    });

    const donations = await prisma.donation.findMany({
      where: { donorId: userId },
      select: {
        amount: true,
        currency: true,
        type: true,
        status: true,
        message: true,
        createdAt: true,
      },
    });

    const recurringDonations = await prisma.recurringDonation.findMany({
      where: { donorId: userId },
      select: {
        amount: true,
        currency: true,
        frequency: true,
        status: true,
        totalContributed: true,
        startDate: true,
        pausedAt: true,
        cancelledAt: true,
      },
    });

    return { orders, subscription, donations, recurringDonations };
  }

  private async getSystemData(userId: string): Promise<Record<string, unknown>> {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      select: {
        type: true,
        title: true,
        message: true,
        read: true,
        createdAt: true,
        readAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });

    const activityLogs = await prisma.activityLog.findMany({
      where: { userId },
      select: {
        action: true,
        entity: true,
        entityId: true,
        metadata: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });

    const achievements = await prisma.userAchievement.findMany({
      where: { userId },
      select: {
        earnedAt: true,
        progress: true,
        achievement: { select: { key: true, nameKey: true, descKey: true, category: true } },
      },
    });

    const notificationPreferences = await prisma.notificationPreferences.findUnique({
      where: { userId },
      select: {
        emailNotifications: true,
        pushNotifications: true,
        digestFrequency: true,
      },
    });

    return { notifications, activityLogs, achievements, notificationPreferences };
  }

  async getExportStatus(requestId: string, userId: string): Promise<{
    status: ExportStatus;
    downloadUrl?: string;
    expiresAt?: Date;
    fileSize?: number;
    errorMessage?: string;
  }> {
    const request = await prisma.dataExportRequest.findFirst({
      where: { id: requestId, userId },
    });

    if (!request) {
      throw new Error('Export request not found');
    }

    return {
      status: request.status,
      downloadUrl: request.status === 'COMPLETED' ? `/api/user/export/${requestId}/download` : undefined,
      expiresAt: request.expiresAt || undefined,
      fileSize: request.fileSize || undefined,
      errorMessage: request.errorMessage || undefined,
    };
  }

  async getExportFile(requestId: string, userId: string): Promise<{ filePath: string; filename: string }> {
    const request = await prisma.dataExportRequest.findFirst({
      where: { id: requestId, userId, status: 'COMPLETED' },
    });

    if (!request || !request.filePath) {
      throw new Error('Export file not found or not ready');
    }

    // Security: Path traversal protection
    // Resolve the full path and ensure it's within the EXPORT_DIR
    const resolvedPath = path.resolve(request.filePath);
    const resolvedExportDir = path.resolve(EXPORT_DIR);

    if (!resolvedPath.startsWith(resolvedExportDir + path.sep)) {
      console.error('Security: Path traversal attempt detected', {
        requestId,
        userId,
        attemptedPath: request.filePath,
      });
      throw new Error('Invalid file path');
    }

    // Additional security: Ensure filename doesn't contain suspicious patterns
    const filename = path.basename(request.filePath);
    if (filename.includes('..') || filename.startsWith('.') || /[<>:"|?*]/.test(filename)) {
      console.error('Security: Invalid filename detected', {
        requestId,
        userId,
        filename,
      });
      throw new Error('Invalid file path');
    }

    if (request.expiresAt && new Date() > request.expiresAt) {
      await prisma.dataExportRequest.update({
        where: { id: requestId },
        data: { status: 'EXPIRED' },
      });
      throw new Error('Export has expired');
    }

    if (!fs.existsSync(resolvedPath)) {
      throw new Error('Export file no longer exists');
    }

    await prisma.dataExportRequest.update({
      where: { id: requestId },
      data: { status: 'DOWNLOADED' },
    });

    return { filePath: resolvedPath, filename };
  }

  async cleanupExpiredExports(): Promise<number> {
    const expired = await prisma.dataExportRequest.findMany({
      where: {
        status: 'COMPLETED',
        expiresAt: { lt: new Date() },
      },
    });

    let cleanedCount = 0;

    for (const request of expired) {
      if (request.filePath && fs.existsSync(request.filePath)) {
        fs.unlinkSync(request.filePath);
      }

      await prisma.dataExportRequest.update({
        where: { id: request.id },
        data: { status: 'EXPIRED' },
      });

      cleanedCount++;
    }

    return cleanedCount;
  }

  async getUserExportHistory(userId: string): Promise<Array<{
    id: string;
    status: ExportStatus;
    requestedAt: Date;
    completedAt: Date | null;
    expiresAt: Date | null;
    fileSize: number | null;
  }>> {
    return prisma.dataExportRequest.findMany({
      where: { userId },
      select: {
        id: true,
        status: true,
        requestedAt: true,
        completedAt: true,
        expiresAt: true,
        fileSize: true,
      },
      orderBy: { requestedAt: 'desc' },
      take: 10,
    });
  }
}
