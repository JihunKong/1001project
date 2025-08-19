import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { executeWithRLSBypass } from "@/lib/prisma"
import { UserRole } from "@prisma/client"

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(userId: string): { allowed: boolean; resetTime?: number } {
  const now = Date.now()
  const windowMs = 60 * 60 * 1000 // 1 hour
  const maxRequests = 3 // Maximum 3 requests per hour
  
  const userLimit = rateLimitStore.get(userId)
  
  if (!userLimit || now > userLimit.resetTime) {
    // Reset or create new rate limit entry
    rateLimitStore.set(userId, { count: 1, resetTime: now + windowMs })
    return { allowed: true }
  }
  
  if (userLimit.count >= maxRequests) {
    return { allowed: false, resetTime: userLimit.resetTime }
  }
  
  // Increment count
  rateLimitStore.set(userId, { ...userLimit, count: userLimit.count + 1 })
  return { allowed: true }
}

async function logDataExportRequest(userId: string, format: string, ipAddress?: string, userAgent?: string) {
  await executeWithRLSBypass(async (client) => {
    await client.activityLog.create({
      data: {
        userId,
        action: "DATA_EXPORT_REQUEST",
        entity: "USER_DATA",
        entityId: userId,
        metadata: {
          format,
          timestamp: new Date().toISOString(),
          gdprCompliance: true,
          requestSource: "self_service_portal"
        },
        ipAddress,
        userAgent,
      }
    })
  })
}

async function collectUserData(userId: string) {
  return await executeWithRLSBypass(async (client) => {
    // Basic user information
    const user = await client.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        subscription: true,
        accounts: {
          select: {
            provider: true,
          }
        },
        sessions: {
          select: {
            sessionToken: true, // We'll mask this
            expires: true,
          }
        }
      }
    })

    if (!user) {
      throw new Error("User not found")
    }

    // Educational data
    const educationalData = await client.classEnrollment.findMany({
      where: { studentId: userId },
      include: {
        class: {
          select: {
            name: true,
            subject: true,
            gradeLevel: true,
            startDate: true,
            endDate: true,
          }
        }
      }
    })

    const submissions = await client.submission.findMany({
      where: { studentId: userId },
      include: {
        assignment: {
          select: {
            title: true,
            type: true,
            dueDate: true,
          }
        }
      }
    })

    const lessonProgress = await client.lessonProgress.findMany({
      where: { studentId: userId },
      include: {
        lesson: {
          select: {
            title: true,
            lessonNumber: true,
          }
        }
      }
    })

    // Reading data
    const readingProgress = await client.readingProgress.findMany({
      where: { userId },
      include: {
        story: {
          select: {
            title: true,
            language: true,
            category: true,
          }
        }
      }
    })

    const bookmarks = await client.bookmark.findMany({
      where: { userId },
      include: {
        story: {
          select: {
            title: true,
          }
        }
      }
    })

    const readingLists = await client.readingList.findMany({
      where: { userId },
    })

    // E-commerce data
    const orders = await client.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                title: true,
                sku: true,
              }
            }
          }
        }
      }
    })

    const cart = await client.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                title: true,
                sku: true,
              }
            }
          }
        }
      }
    })

    const reviews = await client.review.findMany({
      where: { userId },
    })

    // Donation data
    const donations = await client.donation.findMany({
      where: { donorId: userId },
    })

    const recurringDonations = await client.recurringDonation.findMany({
      where: { donorId: userId },
    })

    // Content creation data
    const stories = await client.story.findMany({
      where: { authorId: userId },
    })

    const storySubmissions = await client.storySubmission.findMany({
      where: { authorId: userId },
    })

    const translations = await client.translation.findMany({
      where: { translatorId: userId },
    })

    const illustrations = await client.illustration.findMany({
      where: { artistId: userId },
    })

    // Volunteer data (if applicable)
    let volunteerData = null
    if (user.role === UserRole.VOLUNTEER) {
      volunteerData = {
        profile: await client.volunteerProfile.findUnique({
          where: { userId },
        }),
        applications: await client.volunteerApplication.findMany({
          where: { volunteerUserId: userId },
          include: {
            project: {
              select: {
                title: true,
                type: true,
              }
            },
            quest: {
              select: {
                title: true,
                type: true,
              }
            }
          }
        }),
        hours: await client.volunteerHours.findMany({
          where: { volunteerId: userId },
          include: {
            project: {
              select: {
                title: true,
              }
            }
          }
        }),
        certificates: await client.volunteerCertificate.findMany({
          where: { volunteerId: userId },
        }),
      }
    }

    // System data
    const notifications = await client.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100, // Limit to recent 100 notifications
    })

    const activityLogs = await client.activityLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 500, // Limit to recent 500 activities
    })

    // Onboarding data
    const onboardingProgress = await client.onboardingProgress.findUnique({
      where: { userId },
      include: {
        activities: true,
      }
    })

    const sampleContentAccess = await client.sampleContentAccess.findMany({
      where: { userId },
      include: {
        story: {
          select: {
            title: true,
          }
        }
      }
    })

    return {
      // Personal Information
      personalInformation: {
        userId: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },

      // Profile Information
      profileInformation: user.profile ? {
        firstName: user.profile.firstName,
        lastName: user.profile.lastName,
        organization: user.profile.organization,
        bio: user.profile.bio,
        location: user.profile.location,
        phone: user.profile.phone,
        dateOfBirth: user.profile.dateOfBirth,
        language: user.profile.language,
        timezone: user.profile.timezone,
        
        // COPPA compliance data
        isMinor: user.profile.isMinor,
        ageVerificationStatus: user.profile.ageVerificationStatus,
        parentalConsentRequired: user.profile.parentalConsentRequired,
        parentalConsentStatus: user.profile.parentalConsentStatus,
        parentalConsentDate: user.profile.parentalConsentDate,
        parentEmail: user.profile.parentEmail,
        parentName: user.profile.parentName,
        coppaCompliant: user.profile.coppaCompliant,
        
        // Teacher/Institution fields
        teachingLevel: user.profile.teachingLevel,
        subjects: user.profile.subjects,
        studentCount: user.profile.studentCount,
        
        // Volunteer fields
        skills: user.profile.skills,
        availability: user.profile.availability,
        experience: user.profile.experience,
        
        // Preferences
        emailNotifications: user.profile.emailNotifications,
        pushNotifications: user.profile.pushNotifications,
        newsletter: user.profile.newsletter,
        
        createdAt: user.profile.createdAt,
        updatedAt: user.profile.updatedAt,
      } : null,

      // Subscription Information
      subscriptionInformation: user.subscription ? {
        plan: user.subscription.plan,
        status: user.subscription.status,
        startDate: user.subscription.startDate,
        endDate: user.subscription.endDate,
        cancelledAt: user.subscription.cancelledAt,
        maxStudents: user.subscription.maxStudents,
        maxDownloads: user.subscription.maxDownloads,
        canAccessPremium: user.subscription.canAccessPremium,
        canDownloadPDF: user.subscription.canDownloadPDF,
        canCreateClasses: user.subscription.canCreateClasses,
        unlimitedReading: user.subscription.unlimitedReading,
        createdAt: user.subscription.createdAt,
        updatedAt: user.subscription.updatedAt,
      } : null,

      // Authentication Data
      authenticationData: {
        accounts: user.accounts.map((acc: any) => ({
          provider: acc.provider,
        })),
        sessions: user.sessions.map((session: any) => ({
          sessionToken: "***MASKED***", // Mask for security
          expires: session.expires,
        })),
      },

      // Educational Data
      educationalData: {
        classEnrollments: educationalData.map(enrollment => ({
          className: enrollment.class.name,
          subject: enrollment.class.subject,
          gradeLevel: enrollment.class.gradeLevel,
          enrolledAt: enrollment.enrolledAt,
          status: enrollment.status,
          grade: enrollment.grade,
          attendance: enrollment.attendance,
          progress: enrollment.progress,
          classStartDate: enrollment.class.startDate,
          classEndDate: enrollment.class.endDate,
        })),
        submissions: submissions.map(sub => ({
          assignmentTitle: sub.assignment.title,
          assignmentType: sub.assignment.type,
          assignmentDueDate: sub.assignment.dueDate,
          submittedAt: sub.submittedAt,
          grade: sub.grade,
          feedback: sub.feedback,
          status: sub.status,
        })),
        lessonProgress: lessonProgress.map(progress => ({
          lessonTitle: progress.lesson.title,
          lessonNumber: progress.lesson.lessonNumber,
          startedAt: progress.startedAt,
          completedAt: progress.completedAt,
          timeSpent: progress.timeSpent,
          score: progress.score,
        })),
      },

      // Reading Data
      readingData: {
        readingProgress: readingProgress.map(progress => ({
          storyTitle: progress.story.title,
          storyLanguage: progress.story.language,
          storyCategory: progress.story.category,
          currentChapter: progress.currentChapter,
          currentPage: progress.currentPage,
          percentComplete: progress.percentComplete,
          totalReadingTime: progress.totalReadingTime,
          lastReadAt: progress.lastReadAt,
          startedAt: progress.startedAt,
          completedAt: progress.completedAt,
          notes: progress.notes,
        })),
        bookmarks: bookmarks.map(bookmark => ({
          storyTitle: bookmark.story.title,
          chapterId: bookmark.chapterId,
          position: bookmark.position,
          note: bookmark.note,
          color: bookmark.color,
          createdAt: bookmark.createdAt,
        })),
        readingLists: readingLists.map(list => ({
          name: list.name,
          description: list.description,
          isPublic: list.isPublic,
          storyIds: list.storyIds,
          createdAt: list.createdAt,
          updatedAt: list.updatedAt,
        })),
      },

      // E-commerce Data
      ecommerceData: {
        orders: orders.map(order => ({
          orderNumber: order.orderNumber,
          email: order.email,
          phone: order.phone,
          subtotal: order.subtotal,
          tax: order.tax,
          shipping: order.shipping,
          discount: order.discount,
          total: order.total,
          currency: order.currency,
          status: order.status,
          paymentStatus: order.paymentStatus,
          fulfillmentStatus: order.fulfillmentStatus,
          paymentMethod: order.paymentMethod,
          shippingAddress: order.shippingAddress,
          billingAddress: order.billingAddress,
          shippingMethod: order.shippingMethod,
          trackingNumber: order.trackingNumber,
          notes: order.notes,
          tags: order.tags,
          items: order.items.map(item => ({
            productTitle: item.product.title,
            productSku: item.product.sku,
            variantTitle: item.variantTitle,
            quantity: item.quantity,
            price: item.price,
            total: item.total,
          })),
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
        })),
        currentCart: cart ? {
          items: cart.items.map(item => ({
            productTitle: item.product.title,
            productSku: item.product.sku,
            quantity: item.quantity,
            price: item.price,
          })),
          createdAt: cart.createdAt,
          updatedAt: cart.updatedAt,
          expiresAt: cart.expiresAt,
        } : null,
        reviews: reviews.map(review => ({
          contentType: review.contentType,
          contentId: review.contentId,
          rating: review.rating,
          title: review.title,
          comment: review.comment,
          helpful: review.helpful,
          verified: review.verified,
          createdAt: review.createdAt,
        })),
      },

      // Donation Data
      donationData: {
        donations: donations.map(donation => ({
          amount: donation.amount,
          currency: donation.currency,
          type: donation.type,
          paymentMethod: donation.paymentMethod,
          anonymous: donation.anonymous,
          donorName: donation.donorName,
          donorEmail: donation.donorEmail,
          message: donation.message,
          taxDeductible: donation.taxDeductible,
          status: donation.status,
          createdAt: donation.createdAt,
        })),
        recurringDonations: recurringDonations.map(recurring => ({
          amount: recurring.amount,
          currency: recurring.currency,
          frequency: recurring.frequency,
          dayOfMonth: recurring.dayOfMonth,
          status: recurring.status,
          startDate: recurring.startDate,
          pausedAt: recurring.pausedAt,
          cancelledAt: recurring.cancelledAt,
          totalContributed: recurring.totalContributed,
          lastPaymentDate: recurring.lastPaymentDate,
          nextPaymentDate: recurring.nextPaymentDate,
          createdAt: recurring.createdAt,
          updatedAt: recurring.updatedAt,
        })),
      },

      // Content Creation Data
      contentCreationData: {
        publishedStories: stories.map(story => ({
          title: story.title,
          subtitle: story.subtitle,
          summary: story.summary,
          authorName: story.authorName,
          coAuthors: story.coAuthors,
          authorAge: story.authorAge,
          authorLocation: story.authorLocation,
          publishedDate: story.publishedDate,
          publisher: story.publisher,
          language: story.language,
          pageCount: story.pageCount,
          readingLevel: story.readingLevel,
          readingTime: story.readingTime,
          category: story.category,
          genres: story.genres,
          subjects: story.subjects,
          tags: story.tags,
          isPremium: story.isPremium,
          isPublished: story.isPublished,
          featured: story.featured,
          price: story.price,
          viewCount: story.viewCount,
          likeCount: story.likeCount,
          rating: story.rating,
          createdAt: story.createdAt,
          updatedAt: story.updatedAt,
        })),
        storySubmissions: storySubmissions.map(submission => ({
          title: submission.title,
          summary: submission.summary,
          language: submission.language,
          category: submission.category,
          ageGroup: submission.ageGroup,
          status: submission.status,
          priority: submission.priority,
          reviewNotes: submission.reviewNotes,
          editorialNotes: submission.editorialNotes,
          publishDate: submission.publishDate,
          compensation: submission.compensation,
          tags: submission.tags,
          createdAt: submission.createdAt,
          updatedAt: submission.updatedAt,
        })),
        translations: translations.map(translation => ({
          fromLanguage: translation.fromLanguage,
          toLanguage: translation.toLanguage,
          title: translation.title,
          status: translation.status,
          qualityScore: translation.qualityScore,
          reviewNotes: translation.reviewNotes,
          createdAt: translation.createdAt,
          updatedAt: translation.updatedAt,
        })),
        illustrations: illustrations.map(illustration => ({
          title: illustration.title,
          description: illustration.description,
          position: illustration.position,
          status: illustration.status,
          compensation: illustration.compensation,
          license: illustration.license,
          createdAt: illustration.createdAt,
          updatedAt: illustration.updatedAt,
        })),
      },

      // Volunteer Data (if applicable)
      volunteerData,

      // System Data
      systemData: {
        notifications: notifications.map(notif => ({
          type: notif.type,
          title: notif.title,
          message: notif.message,
          read: notif.read,
          readAt: notif.readAt,
          createdAt: notif.createdAt,
        })),
        activityLogs: activityLogs.map(log => ({
          action: log.action,
          entity: log.entity,
          entityId: log.entityId,
          metadata: log.metadata,
          createdAt: log.createdAt,
        })),
      },

      // Onboarding Data
      onboardingData: {
        progress: onboardingProgress ? {
          currentStep: onboardingProgress.currentStep,
          completionRate: onboardingProgress.completionRate,
          samplesViewed: onboardingProgress.samplesViewed,
          tutorialCompleted: onboardingProgress.tutorialCompleted,
          lastActivity: onboardingProgress.lastActivity,
          isCompleted: onboardingProgress.isCompleted,
          createdAt: onboardingProgress.createdAt,
          updatedAt: onboardingProgress.updatedAt,
        } : null,
        activities: onboardingProgress?.activities.map(activity => ({
          activityType: activity.activityType,
          contentId: activity.contentId,
          timeSpent: activity.timeSpent,
          isCompleted: activity.isCompleted,
          interactionData: activity.interactionData,
          createdAt: activity.createdAt,
        })) || [],
        sampleContentAccess: sampleContentAccess.map(access => ({
          storyTitle: access.story.title,
          viewCount: access.viewCount,
          totalTimeSpent: access.totalTimeSpent,
          lastAccessed: access.lastAccessed,
        })),
      },

      // Export Metadata
      exportMetadata: {
        exportedAt: new Date().toISOString(),
        exportedBy: userId,
        dataVersion: "1.0",
        gdprCompliant: true,
        dataRetentionPolicy: "Please refer to our Privacy Policy for data retention details",
        contactInfo: "For questions about this data export, contact privacy@1001stories.org",
      },
    }
  })
}

function convertToCSV(data: any): string {
  const flatten = (obj: any, prefix = ''): any => {
    const flattened: any = {}
    
    for (const key in obj) {
      if (obj[key] === null || obj[key] === undefined) {
        flattened[prefix + key] = ''
      } else if (Array.isArray(obj[key])) {
        flattened[prefix + key] = JSON.stringify(obj[key])
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        Object.assign(flattened, flatten(obj[key], prefix + key + '_'))
      } else {
        flattened[prefix + key] = obj[key]
      }
    }
    
    return flattened
  }

  const flatData = flatten(data)
  const headers = Object.keys(flatData)
  const values = Object.values(flatData)

  const csvRows = [
    headers.join(','),
    values.map(value => 
      typeof value === 'string' && value.includes(',') 
        ? `"${value.replace(/"/g, '""')}"` 
        : value
    ).join(',')
  ]

  return csvRows.join('\n')
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to access your data." },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const searchParams = request.nextUrl.searchParams
    const format = searchParams.get('format') || 'json'
    
    // Validate format
    if (!['json', 'csv'].includes(format)) {
      return NextResponse.json(
        { error: "Invalid format. Supported formats: json, csv" },
        { status: 400 }
      )
    }

    // Check rate limiting
    const rateLimit = checkRateLimit(userId)
    if (!rateLimit.allowed) {
      const resetTime = new Date(rateLimit.resetTime!).toISOString()
      return NextResponse.json(
        { 
          error: "Rate limit exceeded. You can request your data export up to 3 times per hour.",
          resetTime: resetTime
        },
        { status: 429 }
      )
    }

    // Get IP and User Agent for audit logging
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Log the data export request
    await logDataExportRequest(userId, format, ipAddress, userAgent)

    // Collect all user data
    const userData = await collectUserData(userId)

    // Return data in requested format
    if (format === 'csv') {
      const csvData = convertToCSV(userData)
      
      return new Response(csvData, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="1001stories-data-export-${userId}-${new Date().toISOString().split('T')[0]}.csv"`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      })
    } else {
      // JSON format
      return NextResponse.json(userData, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="1001stories-data-export-${userId}-${new Date().toISOString().split('T')[0]}.json"`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      })
    }

  } catch (error) {
    console.error('Data export error:', error)
    
    return NextResponse.json(
      { 
        error: "Internal server error. Please try again later or contact support.",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// Prevent POST, PUT, DELETE methods
export async function POST() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}

export async function PUT() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}

export async function DELETE() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}