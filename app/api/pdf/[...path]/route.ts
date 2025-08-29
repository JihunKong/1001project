import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

// Comprehensive access control for PDF files
type AccessResult = {
  access: boolean;
  reason: string;
  details?: string;
};

// Check comprehensive book access based on user, role, and entitlements
async function checkBookAccess(userId: string | undefined, bookId: string, filename: string, userRole?: string): Promise<AccessResult> {
  try {
    // 1. Admin users have full access
    if (userRole === 'ADMIN') {
      return { access: true, reason: 'admin_access' };
    }

    // 2. Hardcoded free books (sample/preview books) - CHECK FIRST for reliability
    // These books should be accessible to EVERYONE, including unauthenticated users
    const freeBooks = ['neema-01', 'neema-02', 'neema-03'];
    if (freeBooks.includes(bookId)) {
      return { access: true, reason: userId ? 'free_book_authenticated' : 'free_book_preview' };
    }

    // 3. Sample PDF access - Allow sample access for premium books without authentication
    if (filename === 'sample.pdf') {
      return { access: true, reason: userId ? 'sample_authenticated' : 'sample_preview' };
    }

    // For non-hardcoded books, we need to check authentication first
    if (!userId) {
      return { access: false, reason: 'authentication_required' };
    }

    // Get book details from database
    const book = await prisma.story.findUnique({
      where: { id: bookId },
      select: {
        id: true,
        title: true,
        isPremium: true,
        price: true
      }
    });

    if (!book) {
      return { access: false, reason: 'book_not_found' };
    }

    // 3. Free books are accessible to all authenticated users
    if (!book.isPremium) {
      return { access: true, reason: 'free_book_authenticated' };
    }

    // 4. Check teacher institutional access
    if (userRole === 'TEACHER') {
      const teacherAccess = await checkTeacherInstitutionalAccess(userId, bookId);
      if (teacherAccess.hasAccess) {
        return { 
          access: true, 
          reason: 'teacher_institutional_access',
          details: teacherAccess.details
        };
      }
    }

    // 5. Check individual entitlements (purchases)
    const entitlement = await prisma.entitlement.findFirst({
      where: {
        userId: userId,
        OR: [
          { bookId: bookId },
          { storyId: bookId } // Legacy support
        ],
        isActive: true,
        AND: [
          {
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } }
            ]
          }
        ]
      },
      select: {
        id: true,
        type: true,
        grantReason: true,
        expiresAt: true
      }
    });

    if (entitlement) {
      // Update access tracking
      await prisma.entitlement.update({
        where: { id: entitlement.id },
        data: {
          lastAccessedAt: new Date(),
          accessCount: { increment: 1 }
        }
      }).catch(() => {}); // Fail silently

      return { 
        access: true, 
        reason: 'individual_entitlement',
        details: `${entitlement.type}: ${entitlement.grantReason}`
      };
    }

    // 6. Check subscription access
    const subscription = await prisma.subscription.findUnique({
      where: { userId: userId },
      select: {
        status: true,
        canAccessPremium: true,
        plan: true
      }
    });

    if (subscription?.canAccessPremium && subscription.status === 'ACTIVE') {
      return { 
        access: true, 
        reason: 'subscription_access',
        details: `${subscription.plan} subscription`
      };
    }

    // 7. No access found
    return { 
      access: false, 
      reason: 'no_access',
      details: book.isPremium ? 'Premium book requires purchase or subscription' : 'Authentication required'
    };

  } catch (error) {
    console.error('Error checking book access:', error);
    return { access: false, reason: 'system_error' };
  }
}

// Check teacher institutional access
async function checkTeacherInstitutionalAccess(userId: string, bookId: string): Promise<{ hasAccess: boolean; details?: string }> {
  try {
    // Get teacher's school information
    const teacher = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        school: {
          select: {
            id: true,
            name: true,
            status: true,
            budgets: {
              where: {
                year: new Date().getFullYear()
              },
              select: {
                totalBudget: true,
                spentBudget: true
              }
            }
          }
        }
      }
    });

    if (!teacher?.school || teacher.school.status !== 'ACTIVE') {
      return { hasAccess: false };
    }

    // Check if the school has institutional access
    // This could be implemented via:
    // 1. Institutional subscriptions in the subscription table
    // 2. School-specific entitlements
    // 3. Budget allocations for digital resources
    
    // For now, check if school has allocated budget for digital resources
    const currentBudget = teacher.school.budgets[0];
    if (currentBudget && currentBudget.totalBudget.toNumber() > 0) {
      // Check for school-wide entitlements or institutional subscriptions
      const institutionalEntitlement = await prisma.entitlement.findFirst({
        where: {
          // This would need to be extended to support school-wide entitlements
          // For now, we'll use a simple heuristic
          userId: userId,
          type: 'LICENSE',
          isActive: true,
          AND: [
            {
              OR: [
                { expiresAt: null },
                { expiresAt: { gt: new Date() } }
              ]
            }
          ]
        }
      });

      if (institutionalEntitlement) {
        return { 
          hasAccess: true, 
          details: `Institutional access via ${teacher.school.name}`
        };
      }
    }

    return { hasAccess: false };
  } catch (error) {
    console.error('Error checking teacher institutional access:', error);
    return { hasAccess: false };
  }
}

// Create entitlement from completed order
async function createEntitlementFromOrder(orderId: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                type: true
              }
            }
          }
        }
      }
    });

    if (!order || order.paymentStatus !== 'PAID') {
      return;
    }

    // Create entitlements for digital book purchases
    for (const item of order.items) {
      if (item.product.type === 'DIGITAL_BOOK') {
        await prisma.entitlement.create({
          data: {
            userId: order.userId!,
            storyId: item.productId, // Assuming productId maps to story ID
            orderId: order.id,
            type: 'PURCHASE',
            scope: 'BOOK',
            grantReason: 'purchase',
            grantedAt: new Date(),
            isActive: true
          }
        });
      }
    }
  } catch (error) {
    console.error('Error creating entitlement from order:', error);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    // Await the params promise
    const resolvedParams = await params;
    
    // Join the path segments
    const filePath = resolvedParams.path.join('/');
    
    // Check if this is a book access request
    const pathSegments = resolvedParams.path;
    if (pathSegments.length >= 2 && pathSegments[0] === 'books') {
      const bookId = pathSegments[1];
      const filename = pathSegments[2] || 'main.pdf';
      
      // Get user session first
      const session = await getServerSession(authOptions);
      
      // Get the book details to check if it's premium
      const book = await prisma.story.findFirst({
        where: {
          id: bookId,
          isPublished: true
        },
        select: {
          id: true,
          title: true,
          isPremium: true
        }
      });
      
      // Special handling for hardcoded free books - allow access even if not in DB
      const hardcodedFreeBooks = ['neema-01', 'neema-02', 'neema-03'];
      const isHardcodedFree = hardcodedFreeBooks.includes(bookId);
      
      if (!book && !isHardcodedFree) {
        return new NextResponse(JSON.stringify({
          error: 'Book not found',
          message: 'The requested book does not exist or is not published.',
          requiresAuth: !session?.user?.id,
          redirectTo: !session?.user?.id ? '/login' : '/library'
        }), { 
          status: 404,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }
      
      // Check comprehensive access control
      const accessResult = await checkBookAccess(session?.user?.id, bookId, filename, session?.user?.role);
      
      if (!accessResult.access) {
        const statusCode = accessResult.reason === 'authentication_required' ? 401 : 403;
        const errorMessage = getAccessErrorMessage(accessResult.reason, bookId, !!session?.user?.id);
        
        return new NextResponse(JSON.stringify({
          error: errorMessage.title,
          message: errorMessage.description,
          bookId: bookId,
          isPremium: book?.isPremium || false, // Use fallback if book not in DB
          accessReason: accessResult.reason,
          details: accessResult.details,
          requiresAuth: !session?.user?.id,
          redirectTo: !session?.user?.id ? '/login' : '/shop',
          purchaseUrl: `/shop/books/${bookId}`,
          subscriptionUrl: '/pricing',
          actions: getAccessActions(accessResult.reason, session?.user?.role)
        }), { 
          status: statusCode,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }
      
      // Log successful access
      if (session?.user?.id) {
        await prisma.activityLog.create({
          data: {
            userId: session.user.id,
            action: 'PDF_ACCESSED',
            entity: 'BOOK',
            entityId: bookId,
            metadata: {
              accessReason: accessResult.reason,
              filename: filename,
              userRole: session.user.role,
              details: accessResult.details
            }
          }
        }).catch(() => {}); // Fail silently for analytics
      }
    }
    
    // Construct the full path to the PDF file
    // Note: filePath already includes 'books' as first segment, so join with 'public' only
    const pdfPath = path.join(process.cwd(), 'public', filePath);
    
    
    // Security check - ensure the path is within the books directory
    const publicPdfDir = path.join(process.cwd(), 'public', 'books');
    const resolvedPath = path.resolve(pdfPath);
    const resolvedPublicDir = path.resolve(publicPdfDir);
    
    if (!resolvedPath.startsWith(resolvedPublicDir)) {
      return new NextResponse('Access denied', { status: 403 });
    }
    
    // Check if file exists
    if (!fs.existsSync(resolvedPath)) {
      return new NextResponse('PDF not found', { status: 404 });
    }
    
    // Read the PDF file
    const fileBuffer = fs.readFileSync(resolvedPath);
    
    // Return the PDF with appropriate headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
    
  } catch (error) {
    console.error('Error serving PDF:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}

// Helper function to generate user-friendly error messages
function getAccessErrorMessage(reason: string, bookId: string, isAuthenticated: boolean) {
  switch (reason) {
    case 'authentication_required':
      return {
        title: 'Sign in required',
        description: 'Please sign in to access this content.'
      };
    case 'book_not_found':
      return {
        title: 'Book not found',
        description: 'The requested book does not exist or is not available.'
      };
    case 'no_access':
      return {
        title: 'Access required',
        description: 'This book requires a subscription, purchase, or institutional access.'
      };
    case 'system_error':
      return {
        title: 'System error',
        description: 'Unable to verify access permissions. Please try again.'
      };
    case 'preview_access_unauthenticated':
      return {
        title: 'Preview access granted',
        description: 'You can view a preview of this book. Sign in for full access.'
      };
    default:
      return {
        title: 'Access denied',
        description: 'You do not have permission to access this content.'
      };
  }
}

// Helper function to suggest appropriate actions based on access reason
function getAccessActions(reason: string, userRole?: string) {
  const actions: string[] = [];
  
  switch (reason) {
    case 'authentication_required':
      actions.push('login');
      break;
    case 'no_access':
      actions.push('purchase', 'subscribe');
      if (userRole === 'TEACHER') {
        actions.push('contact_institution');
      }
      break;
    case 'system_error':
      actions.push('retry', 'contact_support');
      break;
  }
  
  return actions;
}