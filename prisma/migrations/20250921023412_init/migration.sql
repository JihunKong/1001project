-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('LEARNER', 'TEACHER', 'INSTITUTION', 'VOLUNTEER', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."SubscriptionPlan" AS ENUM ('FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "public"."SubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELLED', 'EXPIRED', 'PAST_DUE', 'TRIALING');

-- CreateEnum
CREATE TYPE "public"."ProductType" AS ENUM ('PHYSICAL_BOOK', 'DIGITAL_BOOK', 'MERCHANDISE', 'ARTWORK', 'DONATION_ITEM');

-- CreateEnum
CREATE TYPE "public"."ProductStatus" AS ENUM ('ACTIVE', 'DRAFT', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."OrderStatus" AS ENUM ('PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED');

-- CreateEnum
CREATE TYPE "public"."FulfillmentStatus" AS ENUM ('UNFULFILLED', 'PARTIALLY_FULFILLED', 'FULFILLED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."EnrollmentStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'DROPPED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "public"."AssignmentType" AS ENUM ('READING', 'WRITING', 'PROJECT', 'QUIZ', 'PRESENTATION', 'GROUP_WORK');

-- CreateEnum
CREATE TYPE "public"."SubmissionStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'GRADED', 'RETURNED', 'LATE');

-- CreateEnum
CREATE TYPE "public"."ResourceType" AS ENUM ('DOCUMENT', 'VIDEO', 'AUDIO', 'IMAGE', 'LINK', 'PRESENTATION');

-- CreateEnum
CREATE TYPE "public"."AnnouncementPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "public"."VolunteerType" AS ENUM ('TRANSLATION', 'ILLUSTRATION', 'TEACHING', 'CONTENT_CREATION', 'TECHNICAL', 'ADMINISTRATIVE', 'FUNDRAISING', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."ProjectStatus" AS ENUM ('DRAFT', 'OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."ApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "public"."CertificateType" AS ENUM ('PARTICIPATION', 'ACHIEVEMENT', 'MILESTONE', 'EXCELLENCE', 'LEADERSHIP');

-- CreateEnum
CREATE TYPE "public"."DonationType" AS ENUM ('ONE_TIME', 'RECURRING', 'PLEDGE');

-- CreateEnum
CREATE TYPE "public"."DonationStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."CampaignStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'PAUSED');

-- CreateEnum
CREATE TYPE "public"."DonationFrequency" AS ENUM ('WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY');

-- CreateEnum
CREATE TYPE "public"."RecurringStatus" AS ENUM ('ACTIVE', 'PAUSED', 'CANCELLED', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."TranslationStatus" AS ENUM ('IN_PROGRESS', 'REVIEW', 'APPROVED', 'PUBLISHED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."IllustrationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'PUBLISHED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."ContentType" AS ENUM ('BOOK', 'PRODUCT', 'COURSE');

-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('SYSTEM', 'ORDER', 'ASSIGNMENT', 'CLASS', 'DONATION', 'VOLUNTEER', 'ACHIEVEMENT');

-- CreateEnum
CREATE TYPE "public"."Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "public"."ImportType" AS ENUM ('STORIES', 'TRANSLATIONS', 'USERS', 'MEDIA');

-- CreateEnum
CREATE TYPE "public"."ImportStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."OnboardingStep" AS ENUM ('WELCOME', 'TUTORIAL', 'SAMPLE_STORIES', 'PREPARATION', 'COMMUNITY', 'COMPLETED');

-- CreateEnum
CREATE TYPE "public"."ActivityType" AS ENUM ('STORY_VIEW', 'TUTORIAL_STEP', 'COMMUNITY_POST', 'PREPARATION_TASK', 'BADGE_EARNED');

-- CreateEnum
CREATE TYPE "public"."WelcomeType" AS ENUM ('BRIEF', 'FRIENDLY', 'FORMAL', 'APPROVAL_PENDING', 'APPROVAL_APPROVED', 'APPROVAL_REJECTED', 'RESUBMISSION_REQUIRED');

-- CreateEnum
CREATE TYPE "public"."VerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "public"."AgeVerificationStatus" AS ENUM ('PENDING', 'VERIFIED_ADULT', 'VERIFIED_MINOR', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."ParentalConsentStatus" AS ENUM ('NOT_REQUIRED', 'PENDING', 'GRANTED', 'DENIED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "public"."DeletionStatus" AS ENUM ('PENDING', 'PARENTAL_CONSENT_REQUIRED', 'PARENTAL_CONSENT_PENDING', 'REVIEW_REQUIRED', 'CONFIRMED', 'SOFT_DELETED', 'HARD_DELETED', 'CANCELLED', 'RECOVERED', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."DeletionAction" AS ENUM ('REQUEST_CREATED', 'PARENTAL_CONSENT_SENT', 'PARENTAL_CONSENT_GRANTED', 'PARENTAL_CONSENT_DENIED', 'REVIEW_ASSIGNED', 'REVIEW_APPROVED', 'REVIEW_REJECTED', 'FINAL_CONFIRMATION_SENT', 'FINAL_CONFIRMATION_RECEIVED', 'SOFT_DELETE_EXECUTED', 'HARD_DELETE_EXECUTED', 'DATA_ANONYMIZED', 'DATA_BACKED_UP', 'ACCOUNT_RECOVERED', 'REQUEST_CANCELLED', 'SYSTEM_ERROR', 'CLEANUP_COMPLETED');

-- CreateEnum
CREATE TYPE "public"."ActorType" AS ENUM ('USER', 'PARENT', 'ADMIN', 'SYSTEM', 'AUTOMATED');

-- CreateEnum
CREATE TYPE "public"."BookVisibility" AS ENUM ('PUBLIC', 'RESTRICTED', 'CLASSROOM', 'PRIVATE');

-- CreateEnum
CREATE TYPE "public"."BookContentType" AS ENUM ('TEXT', 'PDF', 'EPUB', 'AUDIO', 'MULTIMEDIA', 'INTERACTIVE');

-- CreateEnum
CREATE TYPE "public"."VolunteerSubmissionType" AS ENUM ('TEXT_STORY', 'PDF_UPLOAD', 'TEXT_ASSISTANCE', 'TRANSLATION', 'ILLUSTRATION');

-- CreateEnum
CREATE TYPE "public"."ContentVisibility" AS ENUM ('PUBLIC', 'RESTRICTED', 'CLASSROOM', 'PRIVATE');

-- CreateEnum
CREATE TYPE "public"."VolunteerSubmissionStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'IN_REVIEW', 'NEEDS_CHANGES', 'APPROVED', 'REJECTED', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "public"."EntitlementType" AS ENUM ('PURCHASE', 'SUBSCRIPTION', 'LICENSE', 'PROMOTIONAL', 'FREE_ACCESS', 'TRIAL');

-- CreateEnum
CREATE TYPE "public"."EntitlementScope" AS ENUM ('BOOK', 'CATEGORY', 'UNLIMITED', 'BUNDLE');

-- CreateEnum
CREATE TYPE "public"."PublicationStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "public"."UnlockPolicy" AS ENUM ('FREE', 'PURCHASE', 'SUBSCRIPTION', 'CLASSROOM_LICENSE', 'INSTITUTIONAL');

-- CreateEnum
CREATE TYPE "public"."ShopProductType" AS ENUM ('DIGITAL_BOOK', 'BOOK_BUNDLE', 'SUBSCRIPTION', 'CLASSROOM_LICENSE', 'DONATION_ITEM', 'MERCHANDISE');

-- CreateEnum
CREATE TYPE "public"."ShopProductStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED', 'OUT_OF_STOCK');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "name" TEXT,
    "image" TEXT,
    "password" TEXT,
    "role" "public"."UserRole" NOT NULL DEFAULT 'LEARNER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "deletionRequestId" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "organization" TEXT,
    "bio" TEXT,
    "location" TEXT,
    "phone" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "language" TEXT NOT NULL DEFAULT 'en',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "isMinor" BOOLEAN NOT NULL DEFAULT false,
    "ageVerificationStatus" "public"."AgeVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "parentalConsentRequired" BOOLEAN NOT NULL DEFAULT false,
    "parentalConsentStatus" "public"."ParentalConsentStatus" NOT NULL DEFAULT 'NOT_REQUIRED',
    "parentalConsentDate" TIMESTAMP(3),
    "parentEmail" TEXT,
    "parentName" TEXT,
    "coppaCompliant" BOOLEAN NOT NULL DEFAULT false,
    "teachingLevel" TEXT,
    "subjects" TEXT[],
    "studentCount" INTEGER,
    "skills" TEXT[],
    "availability" TEXT,
    "experience" TEXT,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "pushNotifications" BOOLEAN NOT NULL DEFAULT true,
    "newsletter" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "public"."subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" "public"."SubscriptionPlan" NOT NULL DEFAULT 'FREE',
    "status" "public"."SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "stripePriceId" TEXT,
    "maxStudents" INTEGER NOT NULL DEFAULT 30,
    "maxDownloads" INTEGER NOT NULL DEFAULT 10,
    "canAccessPremium" BOOLEAN NOT NULL DEFAULT false,
    "canDownloadPDF" BOOLEAN NOT NULL DEFAULT false,
    "canCreateClasses" BOOLEAN NOT NULL DEFAULT false,
    "unlimitedReading" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "parentId" TEXT,
    "image" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."products" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "type" "public"."ProductType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "compareAtPrice" DECIMAL(10,2),
    "cost" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "weight" DOUBLE PRECISION,
    "status" "public"."ProductStatus" NOT NULL DEFAULT 'DRAFT',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "creatorId" TEXT,
    "creatorName" TEXT,
    "creatorAge" INTEGER,
    "creatorLocation" TEXT,
    "creatorStory" TEXT,
    "categoryId" TEXT NOT NULL,
    "tags" TEXT[],
    "impactMetric" TEXT,
    "impactValue" TEXT,
    "digitalFileUrl" TEXT,
    "downloadLimit" INTEGER,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."product_variants" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "compareAtPrice" DECIMAL(10,2),
    "inventoryQuantity" INTEGER NOT NULL DEFAULT 0,
    "weight" DOUBLE PRECISION,
    "attributes" JSONB NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."product_images" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."inventory" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "reserved" INTEGER NOT NULL DEFAULT 0,
    "location" TEXT NOT NULL DEFAULT 'main',
    "reorderPoint" INTEGER NOT NULL DEFAULT 10,
    "reorderQuantity" INTEGER NOT NULL DEFAULT 50,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."orders" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "tax" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "shipping" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "public"."OrderStatus" NOT NULL DEFAULT 'PENDING',
    "paymentStatus" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "fulfillmentStatus" "public"."FulfillmentStatus" NOT NULL DEFAULT 'UNFULFILLED',
    "paymentMethod" TEXT,
    "stripePaymentId" TEXT,
    "shippingAddress" JSONB,
    "billingAddress" JSONB,
    "shippingMethod" TEXT,
    "trackingNumber" TEXT,
    "notes" TEXT,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."order_items" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "title" TEXT NOT NULL,
    "variantTitle" TEXT,
    "quantity" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "fulfillmentStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."books" (
    "id" TEXT NOT NULL,
    "isbn" TEXT,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "summary" TEXT,
    "content" TEXT,
    "contentType" "public"."BookContentType" NOT NULL DEFAULT 'TEXT',
    "authorId" TEXT,
    "authorName" TEXT NOT NULL,
    "authorAlias" TEXT,
    "coAuthors" TEXT[],
    "authorAge" INTEGER,
    "authorLocation" TEXT,
    "illustratorId" TEXT,
    "publishedDate" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "publisher" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "ageRange" TEXT,
    "readingLevel" TEXT,
    "readingTime" INTEGER,
    "category" TEXT[],
    "genres" TEXT[],
    "subjects" TEXT[],
    "tags" TEXT[],
    "coverImage" TEXT,
    "illustrations" TEXT[],
    "pdfKey" TEXT,
    "pdfStorageKey" TEXT,
    "pdfFrontCover" TEXT,
    "pdfBackCover" TEXT,
    "pageLayout" TEXT NOT NULL DEFAULT 'single',
    "pageCount" INTEGER,
    "previewPages" INTEGER NOT NULL DEFAULT 10,
    "samplePdf" TEXT,
    "fullPdf" TEXT,
    "epubFile" TEXT,
    "audioFile" TEXT,
    "drm" JSONB,
    "downloadAllowed" BOOLEAN NOT NULL DEFAULT false,
    "printAllowed" BOOLEAN NOT NULL DEFAULT false,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "visibility" "public"."BookVisibility" NOT NULL DEFAULT 'PUBLIC',
    "price" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "rating" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "books_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."chapters" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "chapterNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "audioUrl" TEXT,
    "illustrations" TEXT[],
    "readingTime" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chapters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."reading_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "currentChapter" INTEGER NOT NULL DEFAULT 1,
    "currentPage" INTEGER,
    "totalPages" INTEGER,
    "currentPosition" TEXT,
    "percentComplete" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalReadingTime" INTEGER NOT NULL DEFAULT 0,
    "lastReadAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT[],

    CONSTRAINT "reading_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."bookmarks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "chapterId" INTEGER,
    "position" TEXT,
    "note" TEXT,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookmarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."reading_lists" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "bookIds" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reading_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."classes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "teacherId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "gradeLevel" TEXT NOT NULL,
    "schedule" JSONB NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "maxStudents" INTEGER NOT NULL DEFAULT 30,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "settings" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."class_enrollments" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "public"."EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "grade" TEXT,
    "attendance" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "class_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."assignments" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "public"."AssignmentType" NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 100,
    "resources" TEXT[],
    "requirements" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."submissions" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "content" TEXT,
    "attachments" TEXT[],
    "grade" DOUBLE PRECISION,
    "feedback" TEXT,
    "status" "public"."SubmissionStatus" NOT NULL DEFAULT 'DRAFT',

    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."lessons" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "lessonNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "objectives" TEXT[],
    "content" TEXT NOT NULL,
    "resources" JSONB NOT NULL,
    "duration" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."lesson_progress" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "timeSpent" INTEGER NOT NULL DEFAULT 0,
    "score" DOUBLE PRECISION,

    CONSTRAINT "lesson_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."class_resources" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "public"."ResourceType" NOT NULL,
    "url" TEXT NOT NULL,
    "size" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "class_resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."class_announcements" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "priority" "public"."AnnouncementPriority" NOT NULL DEFAULT 'NORMAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "class_announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."volunteer_projects" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "public"."VolunteerType" NOT NULL,
    "skills" TEXT[],
    "location" TEXT NOT NULL,
    "timeCommitment" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "maxVolunteers" INTEGER NOT NULL,
    "currentVolunteers" INTEGER NOT NULL DEFAULT 0,
    "status" "public"."ProjectStatus" NOT NULL DEFAULT 'OPEN',
    "impact" TEXT NOT NULL,
    "coordinatorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "volunteer_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."volunteer_applications" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "volunteerId" TEXT NOT NULL,
    "volunteerUserId" TEXT NOT NULL,
    "motivation" TEXT NOT NULL,
    "experience" TEXT NOT NULL,
    "availability" TEXT NOT NULL,
    "coverLetter" TEXT,
    "status" "public"."ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "notes" TEXT,
    "rejectionReason" TEXT,
    "matchScore" DOUBLE PRECISION,
    "isRecommended" BOOLEAN NOT NULL DEFAULT false,
    "selectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "volunteer_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."volunteer_hours" (
    "id" TEXT NOT NULL,
    "volunteerId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "hours" DOUBLE PRECISION NOT NULL,
    "activity" TEXT NOT NULL,
    "impact" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "volunteer_hours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."volunteer_certificates" (
    "id" TEXT NOT NULL,
    "volunteerId" TEXT NOT NULL,
    "type" "public"."CertificateType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "hoursContributed" DOUBLE PRECISION NOT NULL,
    "projectCount" INTEGER NOT NULL,
    "issuedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "certificateUrl" TEXT,

    CONSTRAINT "volunteer_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."donations" (
    "id" TEXT NOT NULL,
    "donorId" TEXT,
    "campaignId" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "type" "public"."DonationType" NOT NULL DEFAULT 'ONE_TIME',
    "paymentMethod" TEXT,
    "stripePaymentId" TEXT,
    "anonymous" BOOLEAN NOT NULL DEFAULT false,
    "donorName" TEXT,
    "donorEmail" TEXT NOT NULL,
    "message" TEXT,
    "taxDeductible" BOOLEAN NOT NULL DEFAULT true,
    "receiptUrl" TEXT,
    "status" "public"."DonationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "donations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."donation_campaigns" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "goal" DECIMAL(10,2) NOT NULL,
    "raised" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "category" TEXT NOT NULL,
    "beneficiary" TEXT NOT NULL,
    "impactStatement" TEXT NOT NULL,
    "images" TEXT[],
    "videoUrl" TEXT,
    "status" "public"."CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "donation_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."campaign_updates" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "images" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_updates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."recurring_donations" (
    "id" TEXT NOT NULL,
    "donorId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "frequency" "public"."DonationFrequency" NOT NULL DEFAULT 'MONTHLY',
    "dayOfMonth" INTEGER,
    "stripeSubscriptionId" TEXT,
    "status" "public"."RecurringStatus" NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pausedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "totalContributed" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "lastPaymentDate" TIMESTAMP(3),
    "nextPaymentDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recurring_donations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."translations" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "translatorId" TEXT NOT NULL,
    "fromLanguage" TEXT NOT NULL,
    "toLanguage" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" "public"."TranslationStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "qualityScore" DOUBLE PRECISION,
    "reviewerId" TEXT,
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."illustrations" (
    "id" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "position" INTEGER,
    "status" "public"."IllustrationStatus" NOT NULL DEFAULT 'DRAFT',
    "compensation" DECIMAL(10,2),
    "license" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "illustrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."reviews" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contentType" "public"."ContentType" NOT NULL,
    "contentId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "comment" TEXT,
    "helpful" INTEGER NOT NULL DEFAULT 0,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "public"."NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."activity_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."media_files" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "altText" TEXT,
    "description" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "format" TEXT,
    "folder" TEXT NOT NULL DEFAULT '/',
    "tags" TEXT[],
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."workflow_history" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "fromStatus" "public"."VolunteerSubmissionStatus",
    "toStatus" "public"."VolunteerSubmissionStatus" NOT NULL,
    "comment" TEXT,
    "performedById" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."bulk_imports" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "type" "public"."ImportType" NOT NULL,
    "status" "public"."ImportStatus" NOT NULL DEFAULT 'PENDING',
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "processedRows" INTEGER NOT NULL DEFAULT 0,
    "successfulRows" INTEGER NOT NULL DEFAULT 0,
    "errorRows" INTEGER NOT NULL DEFAULT 0,
    "errors" JSONB,
    "summary" JSONB,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bulk_imports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."onboarding_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentStep" "public"."OnboardingStep" NOT NULL DEFAULT 'WELCOME',
    "completionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "samplesViewed" INTEGER NOT NULL DEFAULT 0,
    "tutorialCompleted" BOOLEAN NOT NULL DEFAULT false,
    "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "onboarding_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."onboarding_activities" (
    "id" TEXT NOT NULL,
    "progressId" TEXT NOT NULL,
    "activityType" "public"."ActivityType" NOT NULL,
    "contentId" TEXT,
    "timeSpent" INTEGER NOT NULL DEFAULT 0,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "interactionData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "onboarding_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sample_content_access" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "totalTimeSpent" INTEGER NOT NULL DEFAULT 0,
    "lastAccessed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sample_content_access_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."welcome_messages" (
    "id" TEXT NOT NULL,
    "messageType" "public"."WelcomeType" NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'ko',
    "content" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "welcome_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."volunteer_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "languages" TEXT[],
    "languageLevels" JSONB NOT NULL,
    "skills" TEXT[],
    "qualifications" TEXT[],
    "experience" TEXT,
    "portfolio" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "availableSlots" JSONB NOT NULL,
    "maxHoursPerWeek" INTEGER NOT NULL DEFAULT 10,
    "remoteOnly" BOOLEAN NOT NULL DEFAULT true,
    "preferredTypes" "public"."VolunteerType"[],
    "verificationStatus" "public"."VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "backgroundCheck" BOOLEAN NOT NULL DEFAULT false,
    "documentUrl" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "verifiedById" TEXT,
    "totalHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "reliability" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "volunteer_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_deletion_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "public"."DeletionStatus" NOT NULL DEFAULT 'PENDING',
    "deletionReason" TEXT,
    "parentalConsentRequired" BOOLEAN NOT NULL DEFAULT false,
    "parentalConsentVerified" BOOLEAN NOT NULL DEFAULT false,
    "parentConfirmationToken" TEXT,
    "parentConfirmationSentAt" TIMESTAMP(3),
    "parentConfirmationExpiry" TIMESTAMP(3),
    "softDeletedAt" TIMESTAMP(3),
    "hardDeletedAt" TIMESTAMP(3),
    "recoveryDeadline" TIMESTAMP(3),
    "requestSource" TEXT NOT NULL DEFAULT 'self_service',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "additionalContext" JSONB,
    "reviewRequired" BOOLEAN NOT NULL DEFAULT false,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "finalConfirmationToken" TEXT,
    "finalConfirmationSentAt" TIMESTAMP(3),
    "finalConfirmationExpiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_deletion_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."deletion_audit_logs" (
    "id" TEXT NOT NULL,
    "deletionRequestId" TEXT NOT NULL,
    "action" "public"."DeletionAction" NOT NULL,
    "performedBy" TEXT,
    "performedByRole" "public"."UserRole",
    "performedByType" "public"."ActorType" NOT NULL DEFAULT 'SYSTEM',
    "tableName" TEXT,
    "recordId" TEXT,
    "recordCount" INTEGER,
    "previousStatus" "public"."DeletionStatus",
    "newStatus" "public"."DeletionStatus",
    "actionDetails" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "sessionId" TEXT,
    "dataAnonymized" BOOLEAN NOT NULL DEFAULT false,
    "anonymizedFields" TEXT[],
    "dataBackedUp" BOOLEAN NOT NULL DEFAULT false,
    "backupLocation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deletion_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."anonymization_logs" (
    "id" TEXT NOT NULL,
    "tableName" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "anonymizedFields" JSONB NOT NULL,
    "retainedFields" JSONB,
    "anonymizationMethod" TEXT NOT NULL,
    "retentionReason" TEXT,
    "retentionPeriod" TEXT,
    "legalBasis" TEXT,
    "processedBy" TEXT,
    "processingJobId" TEXT,
    "verificationHash" TEXT,
    "reversible" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anonymization_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."volunteer_submissions" (
    "id" TEXT NOT NULL,
    "volunteerId" TEXT NOT NULL,
    "projectId" TEXT,
    "type" "public"."VolunteerSubmissionType" NOT NULL DEFAULT 'TEXT_STORY',
    "textContent" TEXT,
    "pdfRef" TEXT,
    "originalName" TEXT,
    "fileSize" INTEGER,
    "editorialNotes" TEXT,
    "attachments" TEXT[],
    "title" TEXT NOT NULL,
    "authorAlias" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "ageRange" TEXT,
    "category" TEXT[],
    "tags" TEXT[],
    "summary" TEXT NOT NULL,
    "visibility" "public"."ContentVisibility" NOT NULL DEFAULT 'PUBLIC',
    "targetAudience" TEXT,
    "copyrightConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "portraitRightsConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "originalWork" BOOLEAN NOT NULL DEFAULT true,
    "licenseType" TEXT,
    "status" "public"."VolunteerSubmissionStatus" NOT NULL DEFAULT 'SUBMITTED',
    "priority" "public"."Priority" NOT NULL DEFAULT 'MEDIUM',
    "reviewerId" TEXT,
    "assigneeId" TEXT,
    "dueDate" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "rejectionReason" TEXT,
    "publishDate" TIMESTAMP(3),
    "compensation" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "volunteer_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."entitlements" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT,
    "bookId" TEXT,
    "orderId" TEXT,
    "subscriptionId" TEXT,
    "licenseId" TEXT,
    "grantReason" TEXT,
    "type" "public"."EntitlementType" NOT NULL DEFAULT 'PURCHASE',
    "scope" "public"."EntitlementScope" NOT NULL DEFAULT 'BOOK',
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "activatedAt" TIMESTAMP(3),
    "lastAccessedAt" TIMESTAMP(3),
    "accessCount" INTEGER NOT NULL DEFAULT 0,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "maxDownloads" INTEGER,
    "ipRestrictions" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entitlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."publications" (
    "id" TEXT NOT NULL,
    "bookId" TEXT,
    "submissionId" TEXT,
    "visibility" "public"."ContentVisibility" NOT NULL DEFAULT 'PUBLIC',
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "unlockPolicy" "public"."UnlockPolicy" NOT NULL DEFAULT 'PURCHASE',
    "price" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "version" INTEGER NOT NULL DEFAULT 1,
    "changelog" TEXT,
    "status" "public"."PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "publishedBy" TEXT NOT NULL,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "category" TEXT[],
    "tags" TEXT[],
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "publications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."shop_products" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "type" "public"."ShopProductType" NOT NULL DEFAULT 'DIGITAL_BOOK',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "shortDescription" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "compareAtPrice" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "bookId" TEXT,
    "downloadLimit" INTEGER,
    "accessDuration" INTEGER,
    "bundleItems" TEXT[],
    "bundleDiscount" DECIMAL(5,2),
    "category" TEXT[],
    "tags" TEXT[],
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "images" TEXT[],
    "thumbnailUrl" TEXT,
    "demoUrl" TEXT,
    "creatorName" TEXT,
    "creatorAge" INTEGER,
    "creatorLocation" TEXT,
    "creatorStory" TEXT,
    "impactMetric" TEXT,
    "impactValue" TEXT,
    "status" "public"."ShopProductStatus" NOT NULL DEFAULT 'ACTIVE',
    "availableFrom" TIMESTAMP(3),
    "availableUntil" TIMESTAMP(3),
    "maxQuantity" INTEGER,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "marketingTags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shop_products_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "public"."users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_userId_key" ON "public"."profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "public"."accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "public"."sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "public"."verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "public"."verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_userId_key" ON "public"."subscriptions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_stripeCustomerId_key" ON "public"."subscriptions"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_stripeSubscriptionId_key" ON "public"."subscriptions"("stripeSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "public"."categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_key" ON "public"."products"("sku");

-- CreateIndex
CREATE INDEX "products_status_idx" ON "public"."products"("status");

-- CreateIndex
CREATE INDEX "products_type_idx" ON "public"."products"("type");

-- CreateIndex
CREATE INDEX "products_featured_idx" ON "public"."products"("featured");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_sku_key" ON "public"."product_variants"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_productId_variantId_location_key" ON "public"."inventory"("productId", "variantId", "location");

-- CreateIndex
CREATE UNIQUE INDEX "orders_orderNumber_key" ON "public"."orders"("orderNumber");

-- CreateIndex
CREATE INDEX "orders_userId_idx" ON "public"."orders"("userId");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "public"."orders"("status");

-- CreateIndex
CREATE INDEX "orders_orderNumber_idx" ON "public"."orders"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "books_isbn_key" ON "public"."books"("isbn");

-- CreateIndex
CREATE INDEX "books_isPublished_idx" ON "public"."books"("isPublished");

-- CreateIndex
CREATE INDEX "books_isPremium_idx" ON "public"."books"("isPremium");

-- CreateIndex
CREATE INDEX "books_language_idx" ON "public"."books"("language");

-- CreateIndex
CREATE INDEX "books_visibility_idx" ON "public"."books"("visibility");

-- CreateIndex
CREATE INDEX "books_contentType_idx" ON "public"."books"("contentType");

-- CreateIndex
CREATE INDEX "books_authorId_idx" ON "public"."books"("authorId");

-- CreateIndex
CREATE UNIQUE INDEX "chapters_bookId_chapterNumber_key" ON "public"."chapters"("bookId", "chapterNumber");

-- CreateIndex
CREATE INDEX "reading_progress_userId_idx" ON "public"."reading_progress"("userId");

-- CreateIndex
CREATE INDEX "reading_progress_lastReadAt_idx" ON "public"."reading_progress"("lastReadAt");

-- CreateIndex
CREATE UNIQUE INDEX "reading_progress_userId_bookId_key" ON "public"."reading_progress"("userId", "bookId");

-- CreateIndex
CREATE INDEX "bookmarks_userId_idx" ON "public"."bookmarks"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "bookmarks_userId_bookId_key" ON "public"."bookmarks"("userId", "bookId");

-- CreateIndex
CREATE INDEX "reading_lists_userId_idx" ON "public"."reading_lists"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "classes_code_key" ON "public"."classes"("code");

-- CreateIndex
CREATE INDEX "classes_teacherId_idx" ON "public"."classes"("teacherId");

-- CreateIndex
CREATE INDEX "class_enrollments_studentId_idx" ON "public"."class_enrollments"("studentId");

-- CreateIndex
CREATE INDEX "class_enrollments_classId_idx" ON "public"."class_enrollments"("classId");

-- CreateIndex
CREATE UNIQUE INDEX "class_enrollments_classId_studentId_key" ON "public"."class_enrollments"("classId", "studentId");

-- CreateIndex
CREATE INDEX "assignments_classId_idx" ON "public"."assignments"("classId");

-- CreateIndex
CREATE INDEX "assignments_dueDate_idx" ON "public"."assignments"("dueDate");

-- CreateIndex
CREATE INDEX "submissions_studentId_idx" ON "public"."submissions"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "submissions_assignmentId_studentId_key" ON "public"."submissions"("assignmentId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "lessons_classId_lessonNumber_key" ON "public"."lessons"("classId", "lessonNumber");

-- CreateIndex
CREATE INDEX "lesson_progress_studentId_idx" ON "public"."lesson_progress"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_progress_lessonId_studentId_key" ON "public"."lesson_progress"("lessonId", "studentId");

-- CreateIndex
CREATE INDEX "volunteer_projects_status_idx" ON "public"."volunteer_projects"("status");

-- CreateIndex
CREATE UNIQUE INDEX "volunteer_applications_projectId_volunteerId_key" ON "public"."volunteer_applications"("projectId", "volunteerId");

-- CreateIndex
CREATE INDEX "volunteer_hours_volunteerId_idx" ON "public"."volunteer_hours"("volunteerId");

-- CreateIndex
CREATE INDEX "volunteer_hours_projectId_idx" ON "public"."volunteer_hours"("projectId");

-- CreateIndex
CREATE INDEX "donations_donorId_idx" ON "public"."donations"("donorId");

-- CreateIndex
CREATE INDEX "donations_campaignId_idx" ON "public"."donations"("campaignId");

-- CreateIndex
CREATE INDEX "donations_status_idx" ON "public"."donations"("status");

-- CreateIndex
CREATE INDEX "donation_campaigns_status_idx" ON "public"."donation_campaigns"("status");

-- CreateIndex
CREATE INDEX "donation_campaigns_featured_idx" ON "public"."donation_campaigns"("featured");

-- CreateIndex
CREATE UNIQUE INDEX "recurring_donations_stripeSubscriptionId_key" ON "public"."recurring_donations"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "recurring_donations_donorId_idx" ON "public"."recurring_donations"("donorId");

-- CreateIndex
CREATE INDEX "recurring_donations_status_idx" ON "public"."recurring_donations"("status");

-- CreateIndex
CREATE INDEX "translations_status_idx" ON "public"."translations"("status");

-- CreateIndex
CREATE UNIQUE INDEX "translations_bookId_toLanguage_key" ON "public"."translations"("bookId", "toLanguage");

-- CreateIndex
CREATE INDEX "reviews_userId_idx" ON "public"."reviews"("userId");

-- CreateIndex
CREATE INDEX "reviews_contentType_contentId_idx" ON "public"."reviews"("contentType", "contentId");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_userId_contentType_contentId_key" ON "public"."reviews"("userId", "contentType", "contentId");

-- CreateIndex
CREATE INDEX "notifications_userId_read_idx" ON "public"."notifications"("userId", "read");

-- CreateIndex
CREATE INDEX "activity_logs_userId_idx" ON "public"."activity_logs"("userId");

-- CreateIndex
CREATE INDEX "activity_logs_entity_entityId_idx" ON "public"."activity_logs"("entity", "entityId");

-- CreateIndex
CREATE INDEX "media_files_uploadedById_idx" ON "public"."media_files"("uploadedById");

-- CreateIndex
CREATE INDEX "media_files_mimeType_idx" ON "public"."media_files"("mimeType");

-- CreateIndex
CREATE INDEX "media_files_folder_idx" ON "public"."media_files"("folder");

-- CreateIndex
CREATE INDEX "workflow_history_submissionId_idx" ON "public"."workflow_history"("submissionId");

-- CreateIndex
CREATE INDEX "workflow_history_performedById_idx" ON "public"."workflow_history"("performedById");

-- CreateIndex
CREATE INDEX "bulk_imports_uploadedById_idx" ON "public"."bulk_imports"("uploadedById");

-- CreateIndex
CREATE INDEX "bulk_imports_status_idx" ON "public"."bulk_imports"("status");

-- CreateIndex
CREATE UNIQUE INDEX "onboarding_progress_userId_key" ON "public"."onboarding_progress"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "sample_content_access_userId_bookId_key" ON "public"."sample_content_access"("userId", "bookId");

-- CreateIndex
CREATE UNIQUE INDEX "volunteer_profiles_userId_key" ON "public"."volunteer_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_deletion_requests_userId_key" ON "public"."user_deletion_requests"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_deletion_requests_parentConfirmationToken_key" ON "public"."user_deletion_requests"("parentConfirmationToken");

-- CreateIndex
CREATE UNIQUE INDEX "user_deletion_requests_finalConfirmationToken_key" ON "public"."user_deletion_requests"("finalConfirmationToken");

-- CreateIndex
CREATE INDEX "user_deletion_requests_status_idx" ON "public"."user_deletion_requests"("status");

-- CreateIndex
CREATE INDEX "user_deletion_requests_softDeletedAt_idx" ON "public"."user_deletion_requests"("softDeletedAt");

-- CreateIndex
CREATE INDEX "user_deletion_requests_recoveryDeadline_idx" ON "public"."user_deletion_requests"("recoveryDeadline");

-- CreateIndex
CREATE INDEX "deletion_audit_logs_deletionRequestId_idx" ON "public"."deletion_audit_logs"("deletionRequestId");

-- CreateIndex
CREATE INDEX "deletion_audit_logs_action_idx" ON "public"."deletion_audit_logs"("action");

-- CreateIndex
CREATE INDEX "deletion_audit_logs_tableName_recordId_idx" ON "public"."deletion_audit_logs"("tableName", "recordId");

-- CreateIndex
CREATE INDEX "anonymization_logs_tableName_idx" ON "public"."anonymization_logs"("tableName");

-- CreateIndex
CREATE INDEX "anonymization_logs_createdAt_idx" ON "public"."anonymization_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "anonymization_logs_tableName_recordId_key" ON "public"."anonymization_logs"("tableName", "recordId");

-- CreateIndex
CREATE INDEX "volunteer_submissions_status_idx" ON "public"."volunteer_submissions"("status");

-- CreateIndex
CREATE INDEX "volunteer_submissions_volunteerId_idx" ON "public"."volunteer_submissions"("volunteerId");

-- CreateIndex
CREATE INDEX "volunteer_submissions_reviewerId_idx" ON "public"."volunteer_submissions"("reviewerId");

-- CreateIndex
CREATE INDEX "volunteer_submissions_priority_idx" ON "public"."volunteer_submissions"("priority");

-- CreateIndex
CREATE INDEX "entitlements_userId_idx" ON "public"."entitlements"("userId");

-- CreateIndex
CREATE INDEX "entitlements_email_idx" ON "public"."entitlements"("email");

-- CreateIndex
CREATE INDEX "entitlements_bookId_idx" ON "public"."entitlements"("bookId");

-- CreateIndex
CREATE INDEX "entitlements_isActive_idx" ON "public"."entitlements"("isActive");

-- CreateIndex
CREATE INDEX "entitlements_expiresAt_idx" ON "public"."entitlements"("expiresAt");

-- CreateIndex
CREATE INDEX "publications_status_idx" ON "public"."publications"("status");

-- CreateIndex
CREATE INDEX "publications_publishedAt_idx" ON "public"."publications"("publishedAt");

-- CreateIndex
CREATE INDEX "publications_featured_idx" ON "public"."publications"("featured");

-- CreateIndex
CREATE INDEX "publications_isPremium_idx" ON "public"."publications"("isPremium");

-- CreateIndex
CREATE UNIQUE INDEX "shop_products_sku_key" ON "public"."shop_products"("sku");

-- CreateIndex
CREATE INDEX "shop_products_status_idx" ON "public"."shop_products"("status");

-- CreateIndex
CREATE INDEX "shop_products_type_idx" ON "public"."shop_products"("type");

-- CreateIndex
CREATE INDEX "shop_products_featured_idx" ON "public"."shop_products"("featured");

-- CreateIndex
CREATE INDEX "shop_products_bookId_idx" ON "public"."shop_products"("bookId");

-- AddForeignKey
ALTER TABLE "public"."profiles" ADD CONSTRAINT "profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."categories" ADD CONSTRAINT "categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."products" ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."product_variants" ADD CONSTRAINT "product_variants_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."product_images" ADD CONSTRAINT "product_images_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."inventory" ADD CONSTRAINT "inventory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."inventory" ADD CONSTRAINT "inventory_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "public"."product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_items" ADD CONSTRAINT "order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_items" ADD CONSTRAINT "order_items_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "public"."product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."books" ADD CONSTRAINT "books_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chapters" ADD CONSTRAINT "chapters_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "public"."books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reading_progress" ADD CONSTRAINT "reading_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reading_progress" ADD CONSTRAINT "reading_progress_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "public"."books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bookmarks" ADD CONSTRAINT "bookmarks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bookmarks" ADD CONSTRAINT "bookmarks_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "public"."books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reading_lists" ADD CONSTRAINT "reading_lists_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."classes" ADD CONSTRAINT "classes_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."class_enrollments" ADD CONSTRAINT "class_enrollments_classId_fkey" FOREIGN KEY ("classId") REFERENCES "public"."classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."class_enrollments" ADD CONSTRAINT "class_enrollments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."assignments" ADD CONSTRAINT "assignments_classId_fkey" FOREIGN KEY ("classId") REFERENCES "public"."classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."submissions" ADD CONSTRAINT "submissions_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "public"."assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."submissions" ADD CONSTRAINT "submissions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."lessons" ADD CONSTRAINT "lessons_classId_fkey" FOREIGN KEY ("classId") REFERENCES "public"."classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."lesson_progress" ADD CONSTRAINT "lesson_progress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "public"."lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."lesson_progress" ADD CONSTRAINT "lesson_progress_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."class_resources" ADD CONSTRAINT "class_resources_classId_fkey" FOREIGN KEY ("classId") REFERENCES "public"."classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."class_announcements" ADD CONSTRAINT "class_announcements_classId_fkey" FOREIGN KEY ("classId") REFERENCES "public"."classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."volunteer_projects" ADD CONSTRAINT "volunteer_projects_coordinatorId_fkey" FOREIGN KEY ("coordinatorId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."volunteer_applications" ADD CONSTRAINT "volunteer_applications_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."volunteer_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."volunteer_applications" ADD CONSTRAINT "volunteer_applications_volunteerUserId_fkey" FOREIGN KEY ("volunteerUserId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."volunteer_applications" ADD CONSTRAINT "volunteer_applications_volunteerId_fkey" FOREIGN KEY ("volunteerId") REFERENCES "public"."volunteer_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."volunteer_hours" ADD CONSTRAINT "volunteer_hours_volunteerId_fkey" FOREIGN KEY ("volunteerId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."volunteer_hours" ADD CONSTRAINT "volunteer_hours_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."volunteer_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."volunteer_certificates" ADD CONSTRAINT "volunteer_certificates_volunteerId_fkey" FOREIGN KEY ("volunteerId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."donations" ADD CONSTRAINT "donations_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."donations" ADD CONSTRAINT "donations_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "public"."donation_campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."campaign_updates" ADD CONSTRAINT "campaign_updates_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "public"."donation_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."recurring_donations" ADD CONSTRAINT "recurring_donations_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."translations" ADD CONSTRAINT "translations_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "public"."books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."translations" ADD CONSTRAINT "translations_translatorId_fkey" FOREIGN KEY ("translatorId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."illustrations" ADD CONSTRAINT "illustrations_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_product_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_book_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "public"."books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."activity_logs" ADD CONSTRAINT "activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."media_files" ADD CONSTRAINT "media_files_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workflow_history" ADD CONSTRAINT "workflow_history_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "public"."volunteer_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workflow_history" ADD CONSTRAINT "workflow_history_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bulk_imports" ADD CONSTRAINT "bulk_imports_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."onboarding_progress" ADD CONSTRAINT "onboarding_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."onboarding_activities" ADD CONSTRAINT "onboarding_activities_progressId_fkey" FOREIGN KEY ("progressId") REFERENCES "public"."onboarding_progress"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sample_content_access" ADD CONSTRAINT "sample_content_access_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sample_content_access" ADD CONSTRAINT "sample_content_access_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "public"."books"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."volunteer_profiles" ADD CONSTRAINT "volunteer_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_deletion_requests" ADD CONSTRAINT "user_deletion_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."deletion_audit_logs" ADD CONSTRAINT "deletion_audit_logs_deletionRequestId_fkey" FOREIGN KEY ("deletionRequestId") REFERENCES "public"."user_deletion_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."volunteer_submissions" ADD CONSTRAINT "volunteer_submissions_volunteerId_fkey" FOREIGN KEY ("volunteerId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."volunteer_submissions" ADD CONSTRAINT "volunteer_submissions_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."volunteer_submissions" ADD CONSTRAINT "volunteer_submissions_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."entitlements" ADD CONSTRAINT "entitlements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."entitlements" ADD CONSTRAINT "entitlements_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "public"."books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."entitlements" ADD CONSTRAINT "entitlements_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."entitlements" ADD CONSTRAINT "entitlements_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "public"."subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."publications" ADD CONSTRAINT "publications_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "public"."books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."publications" ADD CONSTRAINT "publications_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "public"."volunteer_submissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."publications" ADD CONSTRAINT "publications_publishedBy_fkey" FOREIGN KEY ("publishedBy") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."shop_products" ADD CONSTRAINT "shop_products_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "public"."books"("id") ON DELETE SET NULL ON UPDATE CASCADE;
