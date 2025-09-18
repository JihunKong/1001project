--
-- PostgreSQL database dump
--

\restrict KHwxXoAHvbMrSTictjBL43X0XedvkPKaqNjKAE0zk2Ymlmuy06SrTZynuz1Vcp2

-- Dumped from database version 15.14
-- Dumped by pg_dump version 15.14

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: ActivityType; Type: TYPE; Schema: public; Owner: stories_user
--

CREATE TYPE public."ActivityType" AS ENUM (
    'STORY_VIEW',
    'TUTORIAL_STEP',
    'COMMUNITY_POST',
    'PREPARATION_TASK',
    'BADGE_EARNED'
);


ALTER TYPE public."ActivityType" OWNER TO stories_user;

--
-- Name: ActorType; Type: TYPE; Schema: public; Owner: stories_user
--

CREATE TYPE public."ActorType" AS ENUM (
    'USER',
    'PARENT',
    'ADMIN',
    'SYSTEM',
    'AUTOMATED'
);


ALTER TYPE public."ActorType" OWNER TO stories_user;

--
-- Name: AgeVerificationStatus; Type: TYPE; Schema: public; Owner: stories_user
--

CREATE TYPE public."AgeVerificationStatus" AS ENUM (
    'PENDING',
    'VERIFIED_ADULT',
    'VERIFIED_MINOR',
    'FAILED'
);


ALTER TYPE public."AgeVerificationStatus" OWNER TO stories_user;

--
-- Name: AnnouncementPriority; Type: TYPE; Schema: public; Owner: stories_user
--

CREATE TYPE public."AnnouncementPriority" AS ENUM (
    'LOW',
    'NORMAL',
    'HIGH',
    'URGENT'
);


ALTER TYPE public."AnnouncementPriority" OWNER TO stories_user;

--
-- Name: ApplicationStatus; Type: TYPE; Schema: public; Owner: stories_user
--

CREATE TYPE public."ApplicationStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED',
    'WITHDRAWN'
);


ALTER TYPE public."ApplicationStatus" OWNER TO stories_user;

--
-- Name: AssignmentStatus; Type: TYPE; Schema: public; Owner: stories_user
--

CREATE TYPE public."AssignmentStatus" AS ENUM (
    'ASSIGNED',
    'STARTED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED',
    'FAILED'
);


ALTER TYPE public."AssignmentStatus" OWNER TO stories_user;

--
-- Name: AssignmentType; Type: TYPE; Schema: public; Owner: stories_user
--

CREATE TYPE public."AssignmentType" AS ENUM (
    'READING',
    'WRITING',
    'PROJECT',
    'QUIZ',
    'PRESENTATION',
    'GROUP_WORK'
);


ALTER TYPE public."AssignmentType" OWNER TO stories_user;

--
-- Name: BookVisibility; Type: TYPE; Schema: public; Owner: stories_user
--

CREATE TYPE public."BookVisibility" AS ENUM (
    'PUBLIC',
    'RESTRICTED',
    'CLASSROOM',
    'PRIVATE'
);


ALTER TYPE public."BookVisibility" OWNER TO stories_user;

--
-- Name: CampaignStatus; Type: TYPE; Schema: public; Owner: stories_user
--

CREATE TYPE public."CampaignStatus" AS ENUM (
    'DRAFT',
    'ACTIVE',
    'COMPLETED',
    'CANCELLED',
    'PAUSED'
);


ALTER TYPE public."CampaignStatus" OWNER TO stories_user;

--
-- Name: CertificateType; Type: TYPE; Schema: public; Owner: stories_user
--

CREATE TYPE public."CertificateType" AS ENUM (
    'PARTICIPATION',
    'ACHIEVEMENT',
    'MILESTONE',
    'EXCELLENCE',
    'LEADERSHIP'
);


ALTER TYPE public."CertificateType" OWNER TO stories_user;

--
-- Name: ContentType; Type: TYPE; Schema: public; Owner: stories_user
--

CREATE TYPE public."ContentType" AS ENUM (
    'BOOK',
    'PRODUCT',
    'STORY',
    'COURSE'
);


ALTER TYPE public."ContentType" OWNER TO stories_user;

--
-- Name: ContentVisibility; Type: TYPE; Schema: public; Owner: stories_user
--

CREATE TYPE public."ContentVisibility" AS ENUM (
    'PUBLIC',
    'RESTRICTED',
    'CLASSROOM',
    'PRIVATE'
);


ALTER TYPE public."ContentVisibility" OWNER TO stories_user;

--
-- Name: DeletionAction; Type: TYPE; Schema: public; Owner: stories_user
--

CREATE TYPE public."DeletionAction" AS ENUM (
    'REQUEST_CREATED',
    'PARENTAL_CONSENT_SENT',
    'PARENTAL_CONSENT_GRANTED',
    'PARENTAL_CONSENT_DENIED',
    'REVIEW_ASSIGNED',
    'REVIEW_APPROVED',
    'REVIEW_REJECTED',
    'FINAL_CONFIRMATION_SENT',
    'FINAL_CONFIRMATION_RECEIVED',
    'SOFT_DELETE_EXECUTED',
    'HARD_DELETE_EXECUTED',
    'DATA_ANONYMIZED',
    'DATA_BACKED_UP',
    'ACCOUNT_RECOVERED',
    'REQUEST_CANCELLED',
    'SYSTEM_ERROR',
    'CLEANUP_COMPLETED'
);


ALTER TYPE public."DeletionAction" OWNER TO stories_user;

--
-- Name: DeletionStatus; Type: TYPE; Schema: public; Owner: stories_user
--

CREATE TYPE public."DeletionStatus" AS ENUM (
    'PENDING',
    'PARENTAL_CONSENT_REQUIRED',
    'PARENTAL_CONSENT_PENDING',
    'REVIEW_REQUIRED',
    'CONFIRMED',
    'SOFT_DELETED',
    'HARD_DELETED',
    'CANCELLED',
    'RECOVERED',
    'FAILED'
);


ALTER TYPE public."DeletionStatus" OWNER TO stories_user;

--
-- Name: DifficultyLevel; Type: TYPE; Schema: public; Owner: stories_user
--

CREATE TYPE public."DifficultyLevel" AS ENUM (
    'BEGINNER',
    'INTERMEDIATE',
    'ADVANCED',
    'EXPERT'
);


ALTER TYPE public."DifficultyLevel" OWNER TO stories_user;

--
-- Name: DonationFrequency; Type: TYPE; Schema: public; Owner: stories_user
--

CREATE TYPE public."DonationFrequency" AS ENUM (
    'WEEKLY',
    'MONTHLY',
    'QUARTERLY',
    'ANNUALLY'
);


ALTER TYPE public."DonationFrequency" OWNER TO stories_user;

--
-- Name: DonationStatus; Type: TYPE; Schema: public; Owner: stories_user
--

CREATE TYPE public."DonationStatus" AS ENUM (
    'PENDING',
    'COMPLETED',
    'FAILED',
    'REFUNDED',
    'CANCELLED'
);


ALTER TYPE public."DonationStatus" OWNER TO stories_user;

--
-- Name: DonationType; Type: TYPE; Schema: public; Owner: stories_user
--

CREATE TYPE public."DonationType" AS ENUM (
    'ONE_TIME',
    'RECURRING',
    'PLEDGE'
);


ALTER TYPE public."DonationType" OWNER TO stories_user;

--
-- Name: EnrollmentStatus; Type: TYPE; Schema: public; Owner: stories_user
--

CREATE TYPE public."EnrollmentStatus" AS ENUM (
    'ACTIVE',
    'COMPLETED',
    'DROPPED',
    'SUSPENDED'
);


ALTER TYPE public."EnrollmentStatus" OWNER TO stories_user;

--
-- Name: EntitlementScope; Type: TYPE; Schema: public; Owner: stories_user
--

CREATE TYPE public."EntitlementScope" AS ENUM (
    'BOOK',
    'CATEGORY',
    'UNLIMITED',
    'BUNDLE'
);


ALTER TYPE public."EntitlementScope" OWNER TO stories_user;

--
-- Name: EntitlementType; Type: TYPE; Schema: public; Owner: stories_user
--

CREATE TYPE public."EntitlementType" AS ENUM (
    'PURCHASE',
    'SUBSCRIPTION',
    'LICENSE',
    'PROMOTIONAL',
    'FREE_ACCESS',
    'TRIAL'
);


ALTER TYPE public."EntitlementType" OWNER TO stories_user;

--
-- Name: EvidenceStatus; Type: TYPE; Schema: public; Owner: stories_user
--

CREATE TYPE public."EvidenceStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED',
    'NEEDS_REVISION'
);


ALTER TYPE public."EvidenceStatus" OWNER TO stories_user;

--
-- Name: EvidenceType; Type: TYPE; Schema: public; Owner: stories_user
--

CREATE TYPE public."EvidenceType" AS ENUM (
    'TIME_LOG',
    'PHOTO',
    'VIDEO',
    'DOCUMENT',
    'LINK',
    'SCREENSHOT',
    'RECORDING',
    'OTHER'
);


ALTER TYPE public."EvidenceType" OWNER TO stories_user;

--
-- Name: FeedbackCategory; Type: TYPE; Schema: public; Owner: stories_user
--

CREATE TYPE public."FeedbackCategory" AS ENUM (
    'UX_FEEDBACK',
    'TECHNICAL_ISSUE',
    'CONTENT_FEEDBACK',
    'NAVIGATION_ISSUE',
    'ACCESSIBILITY_ISSUE',
    'MOBILE_EXPERIENCE',
    'DESKTOP_EXPERIENCE'
);


ALTER TYPE public."FeedbackCategory" OWNER TO stories_user;

--
-- Name: FeedbackSeverity; Type: TYPE; Schema: public; Owner: stories_user
--

CREATE TYPE public."FeedbackSeverity" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'CRITICAL'
);


ALTER TYPE public."FeedbackSeverity" OWNER TO stories_user;

--
-- Name: FeedbackType; Type: TYPE; Schema: public; Owner: stories_user
--

CREATE TYPE public."FeedbackType" AS ENUM (
    'GENERAL',
    'BUG_REPORT',
    'FEATURE_REQUEST',
    'ROLE_MIGRATION',
    'ONBOARDING',
    'UI_UX_ISSUE',
    'PERFORMANCE_ISSUE'
);


ALTER TYPE public."FeedbackType" OWNER TO stories_user;

--
-- Name: FulfillmentStatus; Type: TYPE; Schema: public; Owner: stories_user
--

CREATE TYPE public."FulfillmentStatus" AS ENUM (
    'UNFULFILLED',
    'PARTIALLY_FULFILLED',
    'FULFILLED',
    'CANCELLED'
);


ALTER TYPE public."FulfillmentStatus" OWNER TO stories_user;

--
-- Name: IllustrationStatus; Type: TYPE; Schema: public; Owner: stories_user
--

CREATE TYPE public."IllustrationStatus" AS ENUM (
    'DRAFT',
    'SUBMITTED',
    'APPROVED',
    'PUBLISHED',
    'REJECTED'
);


ALTER TYPE public."IllustrationStatus" OWNER TO stories_user;

--
-- Name: ImportStatus; Type: TYPE; Schema: public; Owner: stories_user
--

CREATE TYPE public."ImportStatus" AS ENUM (
    'PENDING',
    'PROCESSING',
    'COMPLETED',
    'FAILED',
    'CANCELLED'
);


ALTER TYPE public."ImportStatus" OWNER TO stories_user;

--
-- Name: ImportType; Type: TYPE; Schema: public; Owner: stories_user
--

CREATE TYPE public."ImportType" AS ENUM (
    'STORIES',
    'TRANSLATIONS',
    'USERS',
    'MEDIA'
);


ALTER TYPE public."ImportType" OWNER TO stories_user;

--
-- Name: MentorLevel; Type: TYPE; Schema: public; Owner: stories_user
--

CREATE TYPE public."MentorLevel" AS ENUM (
    'JUNIOR_MENTOR',
    'SENIOR_MENTOR',
    'LEAD_MENTOR',
    'MASTER_MENTOR'
);


ALTER TYPE public."MentorLevel" OWNER TO stories_user;

--
-- Name: MentorshipStatus; Type: TYPE; Schema: public; Owner: stories_user
--

CREATE TYPE public."MentorshipStatus" AS ENUM (
    'REQUESTED',
    'ACTIVE',
    'PAUSED',
    'COMPLETED',
    'CANCELLED'
);


ALTER TYPE public."MentorshipStatus" OWNER TO stories_user;

--
-- Name: MigrationStatus; Type: TYPE; Schema: public; Owner: stories_user
--

CREATE TYPE public."MigrationStatus" AS ENUM (
    'IN_PROGRESS',
    'COMPLETED',
    'FAILED',
    'CANCELLED',
    'REVERSED'
);


ALTER TYPE public."MigrationStatus" OWNER TO stories_user;

--
-- Name: MigrationType; Type: TYPE; Schema: public; Owner: stories_user
--

CREATE TYPE public."MigrationType" AS ENUM (
    'SYSTEM_MIGRATION',
    'USER_REQUESTED',
    'ADMIN_ASSIGNED',
    'AUTOMATIC_UPGRADE'
);


ALTER TYPE public."MigrationType" OWNER TO stories_user;

--
-- Name: NotificationType; Type: TYPE; Schema: public; Owner: stories_user
--

CREATE TYPE public."NotificationType" AS ENUM (
    'SYSTEM',
    'ORDER',
    'ASSIGNMENT',
    'CLASS',
    'DONATION',
    'VOLUNTEER',
    'ACHIEVEMENT'
);


ALTER TYPE public."NotificationType" OWNER TO stories_user;

--
-- Name: OnboardingStep; Type: TYPE; Schema: public; Owner: stories_user
--

CREATE TYPE public."OnboardingStep" AS ENUM (
    'WELCOME',
    'TUTORIAL',
    'SAMPLE_STORIES',
    'PREPARATION',
    'COMMUNITY',
    'COMPLETED'
);


ALTER TYPE public."OnboardingStep" OWNER TO stories_user;

--
-- Name: OrderStatus; Type: TYPE; Schema: public; Owner: stories_user
--

CREATE TYPE public."OrderStatus" AS ENUM (
    'PENDING',
    'PROCESSING',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
    'REFUNDED'
);


ALTER TYPE public."OrderStatus" OWNER TO stories_user;

--
-- Name: ParentalConsentStatus; Type: TYPE; Schema: public; Owner: stories_user
--

CREATE TYPE public."ParentalConsentStatus" AS ENUM (
    'NOT_REQUIRED',
    'PENDING',
    'GRANTED',
    'DENIED',
    'EXPIRED'
);


ALTER TYPE public."ParentalConsentStatus" OWNER TO stories_user;

--
-- Name: PaymentStatus; Type: TYPE; Schema: public; Owner: stories_user
--

CREATE TYPE public."PaymentStatus" AS ENUM (
    'PENDING',
    'PAID',
    'FAILED',
    'REFUNDED',
    'PARTIALLY_REFUNDED'
);


ALTER TYPE public."PaymentStatus" OWNER TO stories_user;

--
-- Name: PointTransactionType; Type: TYPE; Schema: public; Owner: stories_user
--

CREATE TYPE public."PointTransactionType" AS ENUM (
    'EARNED_QUEST',
    'EARNED_BONUS',
    'EARNED_REFERRAL',
    'SPENT_REWARD',
    'PENALTY',
    'ADJUSTMENT',
    'REFUND'
);


ALTER TYPE public."PointTransactionType" OWNER TO stories_user;

--
-- Name: Priority; Type: TYPE; Schema: public; Owner: stories_user
--

CREATE TYPE public."Priority" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'URGENT'
);


ALTER TYPE public."Priority" OWNER TO stories_user;

--
-- Name: ProductStatus; Type: TYPE; Schema: public; Owner: stories_user
--

CREATE TYPE public."ProductStatus" AS ENUM (
    'ACTIVE',
    'DRAFT',
    'ARCHIVED'
);


ALTER TYPE public."ProductStatus" OWNER TO stories_user;

--
-- Name: ProductType; Type: TYPE; Schema: public; Owner: stories_user
--

CREATE TYPE public."ProductType" AS ENUM (
    'PHYSICAL_BOOK',
    'DIGITAL_BOOK',
    'MERCHANDISE',
    'ARTWORK',
    'DONATION_ITEM'
);


ALTER TYPE public."ProductType" OWNER TO stories_user;

--
-- Name: ProjectStatus; Type: TYPE; Schema: public; Owner: stories_user
--

CREATE TYPE public."ProjectStatus" AS ENUM (
    'DRAFT',
    'OPEN',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED'
);


ALTER TYPE public."ProjectStatus" OWNER TO stories_user;

--
-- Name: PublicationStatus; Type: TYPE; Schema: public; Owner: stories_user
--

CREATE TYPE public."PublicationStatus" AS ENUM (
    'DRAFT',
    'SCHEDULED',
    'PUBLISHED',
    'ARCHIVED',
    'WITHDRAWN'
);


ALTER TYPE public."PublicationStatus" OWNER TO stories_user;

--
-- Name: QuestCategory; Type: TYPE; Schema: public; Owner: stories_user
--

CREATE TYPE public."QuestCategory" AS ENUM (
    'EDUCATION',
    'TRANSLATION',
    'CONTENT_CREATION',
    'COMMUNITY',
    'TECHNICAL',
    'ADMINISTRATIVE',
    'SPECIAL_EVENTS'
);


ALTER TYPE public."QuestCategory" OWNER TO stories_user;

--
-- Name: QuestStatus; Type: TYPE; Schema: public; Owner: stories_user
--

CREATE TYPE public."QuestStatus" AS ENUM (
    'DRAFT',
    'OPEN',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED',
    'PAUSED'
);


ALTER TYPE public."QuestStatus" OWNER TO stories_user;

--
-- Name: RecurringStatus; Type: TYPE; Schema: public; Owner: stories_user
--

CREATE TYPE public."RecurringStatus" AS ENUM (
    'ACTIVE',
    'PAUSED',
    'CANCELLED',
    'FAILED'
);


ALTER TYPE public."RecurringStatus" OWNER TO stories_user;

--
-- Name: RedemptionStatus; Type: TYPE; Schema: public; Owner: stories_user
--

CREATE TYPE public."RedemptionStatus" AS ENUM (
    'PENDING',
    'PROCESSING',
    'FULFILLED',
    'CANCELLED',
    'FAILED'
);


ALTER TYPE public."RedemptionStatus" OWNER TO stories_user;

--
-- Name: ResourceType; Type: TYPE; Schema: public; Owner: stories_user
--

CREATE TYPE public."ResourceType" AS ENUM (
    'DOCUMENT',
    'VIDEO',
    'AUDIO',
    'IMAGE',
    'LINK',
    'PRESENTATION'
);


ALTER TYPE public."ResourceType" OWNER TO stories_user;

--
-- Name: RewardCategory; Type: TYPE; Schema: public; Owner: stories_user
--

CREATE TYPE public."RewardCategory" AS ENUM (
    'DIGITAL',
    'PHYSICAL',
    'EXPERIENCE',
    'EDUCATION',
    'RECOGNITION'
);


ALTER TYPE public."RewardCategory" OWNER TO stories_user;

--
-- Name: RewardType; Type: TYPE; Schema: public; Owner: stories_user
--

CREATE TYPE public."RewardType" AS ENUM (
    'DIGITAL_GOOD',
    'PHYSICAL_GOOD',
    'EXPERIENCE',
    'RECOGNITION',
    'ACCESS_PRIVILEGE',
    'DONATION',
    'CREDIT'
);


ALTER TYPE public."RewardType" OWNER TO stories_user;

--
-- Name: SchoolResourceType; Type: TYPE; Schema: public; Owner: stories_user
--

CREATE TYPE public."SchoolResourceType" AS ENUM (
    'BOOK',
    'COMPUTER',
    'TABLET',
    'SUPPLIES',
    'EQUIPMENT',
    'FURNITURE',
    'SOFTWARE'
);


ALTER TYPE public."SchoolResourceType" OWNER TO stories_user;

--
-- Name: SchoolStatus; Type: TYPE; Schema: public; Owner: stories_user
--

CREATE TYPE public."SchoolStatus" AS ENUM (
    'ACTIVE',
    'PENDING',
    'INACTIVE',
    'SUSPENDED'
);


ALTER TYPE public."SchoolStatus" OWNER TO stories_user;

--
-- Name: SchoolType; Type: TYPE; Schema: public; Owner: stories_user
--

CREATE TYPE public."SchoolType" AS ENUM (
    'PRIMARY',
    'SECONDARY',
    'HIGH_SCHOOL',
    'UNIVERSITY',
    'VOCATIONAL',
    'SPECIAL_EDUCATION'
);


ALTER TYPE public."SchoolType" OWNER TO stories_user;

--
-- Name: SentimentType; Type: TYPE; Schema: public; Owner: stories_user
--

CREATE TYPE public."SentimentType" AS ENUM (
    'VERY_NEGATIVE',
    'NEGATIVE',
    'NEUTRAL',
    'POSITIVE',
    'VERY_POSITIVE'
);


ALTER TYPE public."SentimentType" OWNER TO stories_user;

--
-- Name: ShopProductStatus; Type: TYPE; Schema: public; Owner: stories_user
--

CREATE TYPE public."ShopProductStatus" AS ENUM (
    'DRAFT',
    'ACTIVE',
    'INACTIVE',
    'ARCHIVED',
    'OUT_OF_STOCK'
);


ALTER TYPE public."ShopProductStatus" OWNER TO stories_user;

--
-- Name: ShopProductType; Type: TYPE; Schema: public; Owner: stories_user
--

CREATE TYPE public."ShopProductType" AS ENUM (
    'DIGITAL_BOOK',
    'BOOK_BUNDLE',
    'SUBSCRIPTION',
    'CLASSROOM_LICENSE',
    'DONATION_ITEM',
    'MERCHANDISE'
);


ALTER TYPE public."ShopProductType" OWNER TO stories_user;

--
-- Name: StorySubmissionStatus; Type: TYPE; Schema: public; Owner: stories_user
--

CREATE TYPE public."StorySubmissionStatus" AS ENUM (
    'DRAFT',
    'SUBMITTED',
    'IN_REVIEW',
    'APPROVED',
    'PUBLISHED',
    'REJECTED'
);


ALTER TYPE public."StorySubmissionStatus" OWNER TO stories_user;

--
-- Name: SubmissionStatus; Type: TYPE; Schema: public; Owner: stories_user
--

CREATE TYPE public."SubmissionStatus" AS ENUM (
    'DRAFT',
    'SUBMITTED',
    'GRADED',
    'RETURNED',
    'LATE'
);


ALTER TYPE public."SubmissionStatus" OWNER TO stories_user;

--
-- Name: SubscriptionPlan; Type: TYPE; Schema: public; Owner: stories_user
--

CREATE TYPE public."SubscriptionPlan" AS ENUM (
    'FREE',
    'BASIC',
    'PREMIUM',
    'ENTERPRISE'
);


ALTER TYPE public."SubscriptionPlan" OWNER TO stories_user;

--
-- Name: SubscriptionStatus; Type: TYPE; Schema: public; Owner: stories_user
--

CREATE TYPE public."SubscriptionStatus" AS ENUM (
    'ACTIVE',
    'CANCELLED',
    'EXPIRED',
    'PAST_DUE',
    'TRIALING'
);


ALTER TYPE public."SubscriptionStatus" OWNER TO stories_user;

--
-- Name: SurveyDisplayType; Type: TYPE; Schema: public; Owner: stories_user
--

CREATE TYPE public."SurveyDisplayType" AS ENUM (
    'MODAL',
    'SLIDE_IN',
    'BANNER',
    'EMBED',
    'FLOATING_BUTTON'
);


ALTER TYPE public."SurveyDisplayType" OWNER TO stories_user;

--
-- Name: SurveyFrequency; Type: TYPE; Schema: public; Owner: stories_user
--

CREATE TYPE public."SurveyFrequency" AS ENUM (
    'ONCE',
    'DAILY',
    'WEEKLY',
    'PER_SESSION',
    'ALWAYS'
);


ALTER TYPE public."SurveyFrequency" OWNER TO stories_user;

--
-- Name: SurveyTrigger; Type: TYPE; Schema: public; Owner: stories_user
--

CREATE TYPE public."SurveyTrigger" AS ENUM (
    'PAGE_LOAD',
    'TIME_DELAY',
    'SCROLL_DEPTH',
    'EXIT_INTENT',
    'FEATURE_USE',
    'MANUAL_TRIGGER'
);


ALTER TYPE public."SurveyTrigger" OWNER TO stories_user;

--
-- Name: TranslationStatus; Type: TYPE; Schema: public; Owner: stories_user
--

CREATE TYPE public."TranslationStatus" AS ENUM (
    'IN_PROGRESS',
    'REVIEW',
    'APPROVED',
    'PUBLISHED',
    'REJECTED'
);


ALTER TYPE public."TranslationStatus" OWNER TO stories_user;

--
-- Name: UnlockPolicy; Type: TYPE; Schema: public; Owner: stories_user
--

CREATE TYPE public."UnlockPolicy" AS ENUM (
    'FREE',
    'PURCHASE',
    'SUBSCRIPTION',
    'CLASSROOM_LICENSE',
    'INSTITUTIONAL'
);


ALTER TYPE public."UnlockPolicy" OWNER TO stories_user;

--
-- Name: UrgencyLevel; Type: TYPE; Schema: public; Owner: stories_user
--

CREATE TYPE public."UrgencyLevel" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'URGENT'
);


ALTER TYPE public."UrgencyLevel" OWNER TO stories_user;

--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: stories_user
--

CREATE TYPE public."UserRole" AS ENUM (
    'LEARNER',
    'TEACHER',
    'INSTITUTION',
    'VOLUNTEER',
    'ADMIN',
    'CUSTOMER'
);


ALTER TYPE public."UserRole" OWNER TO stories_user;

--
-- Name: VerificationStatus; Type: TYPE; Schema: public; Owner: stories_user
--

CREATE TYPE public."VerificationStatus" AS ENUM (
    'PENDING',
    'VERIFIED',
    'REJECTED',
    'EXPIRED'
);


ALTER TYPE public."VerificationStatus" OWNER TO stories_user;

--
-- Name: VolunteerLevel; Type: TYPE; Schema: public; Owner: stories_user
--

CREATE TYPE public."VolunteerLevel" AS ENUM (
    'BRONZE',
    'SILVER',
    'GOLD',
    'PLATINUM',
    'DIAMOND'
);


ALTER TYPE public."VolunteerLevel" OWNER TO stories_user;

--
-- Name: VolunteerSubmissionStatus; Type: TYPE; Schema: public; Owner: stories_user
--

CREATE TYPE public."VolunteerSubmissionStatus" AS ENUM (
    'DRAFT',
    'SUBMITTED',
    'IN_REVIEW',
    'NEEDS_CHANGES',
    'APPROVED',
    'REJECTED',
    'PUBLISHED'
);


ALTER TYPE public."VolunteerSubmissionStatus" OWNER TO stories_user;

--
-- Name: VolunteerSubmissionType; Type: TYPE; Schema: public; Owner: stories_user
--

CREATE TYPE public."VolunteerSubmissionType" AS ENUM (
    'PDF_UPLOAD',
    'TEXT_ASSISTANCE',
    'TRANSLATION',
    'ILLUSTRATION'
);


ALTER TYPE public."VolunteerSubmissionType" OWNER TO stories_user;

--
-- Name: VolunteerType; Type: TYPE; Schema: public; Owner: stories_user
--

CREATE TYPE public."VolunteerType" AS ENUM (
    'TRANSLATION',
    'ILLUSTRATION',
    'TEACHING',
    'CONTENT_CREATION',
    'TECHNICAL',
    'ADMINISTRATIVE',
    'FUNDRAISING',
    'OTHER'
);


ALTER TYPE public."VolunteerType" OWNER TO stories_user;

--
-- Name: WelcomeType; Type: TYPE; Schema: public; Owner: stories_user
--

CREATE TYPE public."WelcomeType" AS ENUM (
    'BRIEF',
    'FRIENDLY',
    'FORMAL',
    'APPROVAL_PENDING',
    'APPROVAL_APPROVED',
    'APPROVAL_REJECTED',
    'RESUBMISSION_REQUIRED'
);


ALTER TYPE public."WelcomeType" OWNER TO stories_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: stories_user
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO stories_user;

--
-- Name: ab_test_participants; Type: TABLE; Schema: public; Owner: stories_user
--

CREATE TABLE public.ab_test_participants (
    id text NOT NULL,
    "userId" text,
    "sessionId" text NOT NULL,
    "testName" text NOT NULL,
    variant text NOT NULL,
    "userRole" public."UserRole",
    "assignedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "primaryGoal" text,
    "goalAchieved" boolean DEFAULT false NOT NULL,
    "goalAchievedAt" timestamp(3) without time zone,
    "conversionValue" double precision,
    "secondaryGoals" jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.ab_test_participants OWNER TO stories_user;

--
-- Name: accounts; Type: TABLE; Schema: public; Owner: stories_user
--

CREATE TABLE public.accounts (
    id text NOT NULL,
    "userId" text NOT NULL,
    type text NOT NULL,
    provider text NOT NULL,
    "providerAccountId" text NOT NULL,
    refresh_token text,
    access_token text,
    expires_at integer,
    token_type text,
    scope text,
    id_token text,
    session_state text
);


ALTER TABLE public.accounts OWNER TO stories_user;

--
-- Name: activity_logs; Type: TABLE; Schema: public; Owner: stories_user
--

CREATE TABLE public.activity_logs (
    id text NOT NULL,
    "userId" text NOT NULL,
    action text NOT NULL,
    entity text NOT NULL,
    "entityId" text NOT NULL,
    metadata jsonb,
    "ipAddress" text,
    "userAgent" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.activity_logs OWNER TO stories_user;

--
-- Name: anonymization_logs; Type: TABLE; Schema: public; Owner: stories_user
--

CREATE TABLE public.anonymization_logs (
    id text NOT NULL,
    "tableName" text NOT NULL,
    "recordId" text NOT NULL,
    "anonymizedFields" jsonb NOT NULL,
    "retainedFields" jsonb,
    "anonymizationMethod" text NOT NULL,
    "retentionReason" text,
    "retentionPeriod" text,
    "legalBasis" text,
    "processedBy" text,
    "processingJobId" text,
    "verificationHash" text,
    reversible boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.anonymization_logs OWNER TO stories_user;

--
-- Name: assignments; Type: TABLE; Schema: public; Owner: stories_user
--

CREATE TABLE public.assignments (
    id text NOT NULL,
    "classId" text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    type public."AssignmentType" NOT NULL,
    "dueDate" timestamp(3) without time zone NOT NULL,
    points integer DEFAULT 100 NOT NULL,
    resources text[],
    requirements jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.assignments OWNER TO stories_user;

--
-- Name: bookmarks; Type: TABLE; Schema: public; Owner: stories_user
--

CREATE TABLE public.bookmarks (
    id text NOT NULL,
    "userId" text NOT NULL,
    "storyId" text NOT NULL,
    "chapterId" integer,
    "position" text,
    note text,
    color text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.bookmarks OWNER TO stories_user;

--
-- Name: books; Type: TABLE; Schema: public; Owner: stories_user
--

CREATE TABLE public.books (
    id text NOT NULL,
    title text NOT NULL,
    subtitle text,
    summary text,
    "authorName" text NOT NULL,
    "authorAlias" text,
    "authorAge" integer,
    "authorLocation" text,
    "coAuthors" text[],
    language text DEFAULT 'en'::text NOT NULL,
    "ageRange" text,
    "readingLevel" text,
    category text[],
    genres text[],
    subjects text[],
    tags text[],
    "coverImage" text,
    "pdfKey" text,
    "pdfFrontCover" text,
    "pdfBackCover" text,
    "pageLayout" text DEFAULT 'single'::text NOT NULL,
    "pageCount" integer,
    "previewPages" integer DEFAULT 10 NOT NULL,
    drm jsonb,
    "downloadAllowed" boolean DEFAULT false NOT NULL,
    "printAllowed" boolean DEFAULT false NOT NULL,
    "isPublished" boolean DEFAULT false NOT NULL,
    "publishedAt" timestamp(3) without time zone,
    featured boolean DEFAULT false NOT NULL,
    "isPremium" boolean DEFAULT false NOT NULL,
    price numeric(10,2),
    currency text DEFAULT 'USD'::text NOT NULL,
    visibility public."BookVisibility" DEFAULT 'PUBLIC'::public."BookVisibility" NOT NULL,
    "viewCount" integer DEFAULT 0 NOT NULL,
    "downloadCount" integer DEFAULT 0 NOT NULL,
    rating double precision,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    thumbnails jsonb,
    "thumbnailConfig" jsonb,
    "thumbnailGeneratedAt" timestamp(3) without time zone
);


ALTER TABLE public.books OWNER TO stories_user;

--
-- Name: budget_items; Type: TABLE; Schema: public; Owner: stories_user
--

CREATE TABLE public.budget_items (
    id text NOT NULL,
    "budgetId" text NOT NULL,
    category text NOT NULL,
    description text NOT NULL,
    amount numeric(10,2) NOT NULL,
    spent numeric(10,2) DEFAULT 0 NOT NULL,
    vendor text,
    "approvedBy" text,
    "approvedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.budget_items OWNER TO stories_user;

--
-- Name: budgets; Type: TABLE; Schema: public; Owner: stories_user
--

CREATE TABLE public.budgets (
    id text NOT NULL,
    "schoolId" text NOT NULL,
    year integer NOT NULL,
    "totalBudget" numeric(12,2) NOT NULL,
    "allocatedBudget" numeric(12,2) DEFAULT 0 NOT NULL,
    "spentBudget" numeric(12,2) DEFAULT 0 NOT NULL,
    categories jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.budgets OWNER TO stories_user;

--
-- Name: bulk_imports; Type: TABLE; Schema: public; Owner: stories_user
--

CREATE TABLE public.bulk_imports (
    id text NOT NULL,
    filename text NOT NULL,
    "originalName" text NOT NULL,
    "fileUrl" text NOT NULL,
    type public."ImportType" NOT NULL,
    status public."ImportStatus" DEFAULT 'PENDING'::public."ImportStatus" NOT NULL,
    "totalRows" integer DEFAULT 0 NOT NULL,
    "processedRows" integer DEFAULT 0 NOT NULL,
    "successfulRows" integer DEFAULT 0 NOT NULL,
    "errorRows" integer DEFAULT 0 NOT NULL,
    errors jsonb,
    summary jsonb,
    "uploadedById" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.bulk_imports OWNER TO stories_user;

--
-- Name: campaign_updates; Type: TABLE; Schema: public; Owner: stories_user
--

CREATE TABLE public.campaign_updates (
    id text NOT NULL,
    "campaignId" text NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    images text[],
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.campaign_updates OWNER TO stories_user;

--
-- Name: cart_items; Type: TABLE; Schema: public; Owner: stories_user
--

CREATE TABLE public.cart_items (
    id text NOT NULL,
    "cartId" text NOT NULL,
    "productId" text NOT NULL,
    "variantId" text,
    quantity integer DEFAULT 1 NOT NULL,
    price numeric(10,2) NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.cart_items OWNER TO stories_user;

--
-- Name: carts; Type: TABLE; Schema: public; Owner: stories_user
--

CREATE TABLE public.carts (
    id text NOT NULL,
    "userId" text,
    "sessionId" text,
    "expiresAt" timestamp(3) without time zone DEFAULT (now() + '7 days'::interval) NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.carts OWNER TO stories_user;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: stories_user
--

CREATE TABLE public.categories (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    "parentId" text,
    image text,
    "order" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.categories OWNER TO stories_user;

--
-- Name: chapters; Type: TABLE; Schema: public; Owner: stories_user
--

CREATE TABLE public.chapters (
    id text NOT NULL,
    "storyId" text NOT NULL,
    "chapterNumber" integer NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    "audioUrl" text,
    illustrations text[],
    "readingTime" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.chapters OWNER TO stories_user;

--
-- Name: class_announcements; Type: TABLE; Schema: public; Owner: stories_user
--

CREATE TABLE public.class_announcements (
    id text NOT NULL,
    "classId" text NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    priority public."AnnouncementPriority" DEFAULT 'NORMAL'::public."AnnouncementPriority" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.class_announcements OWNER TO stories_user;

--
-- Name: class_enrollments; Type: TABLE; Schema: public; Owner: stories_user
--

CREATE TABLE public.class_enrollments (
    id text NOT NULL,
    "classId" text NOT NULL,
    "studentId" text NOT NULL,
    "enrolledAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status public."EnrollmentStatus" DEFAULT 'ACTIVE'::public."EnrollmentStatus" NOT NULL,
    grade text,
    attendance double precision DEFAULT 100 NOT NULL,
    progress double precision DEFAULT 0 NOT NULL
);


ALTER TABLE public.class_enrollments OWNER TO stories_user;

--
-- Name: class_resources; Type: TABLE; Schema: public; Owner: stories_user
--

CREATE TABLE public.class_resources (
    id text NOT NULL,
    "classId" text NOT NULL,
    title text NOT NULL,
    description text,
    type public."ResourceType" NOT NULL,
    url text NOT NULL,
    size integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.class_resources OWNER TO stories_user;

--
-- Name: classes; Type: TABLE; Schema: public; Owner: stories_user
--

CREATE TABLE public.classes (
    id text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    description text,
    "teacherId" text NOT NULL,
    "schoolId" text,
    subject text NOT NULL,
    "gradeLevel" text NOT NULL,
    schedule jsonb NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL,
    "maxStudents" integer DEFAULT 30 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    settings jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.classes OWNER TO stories_user;

--
-- Name: deletion_audit_logs; Type: TABLE; Schema: public; Owner: stories_user
--

CREATE TABLE public.deletion_audit_logs (
    id text NOT NULL,
    "deletionRequestId" text NOT NULL,
    action public."DeletionAction" NOT NULL,
    "performedBy" text,
    "performedByRole" public."UserRole",
    "performedByType" public."ActorType" DEFAULT 'SYSTEM'::public."ActorType" NOT NULL,
    "tableName" text,
    "recordId" text,
    "recordCount" integer,
    "previousStatus" public."DeletionStatus",
    "newStatus" public."DeletionStatus",
    "actionDetails" text,
    metadata jsonb,
    "ipAddress" text,
    "userAgent" text,
    "sessionId" text,
    "dataAnonymized" boolean DEFAULT false NOT NULL,
    "anonymizedFields" text[],
    "dataBackedUp" boolean DEFAULT false NOT NULL,
    "backupLocation" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.deletion_audit_logs OWNER TO stories_user;

--
-- Name: donation_campaigns; Type: TABLE; Schema: public; Owner: stories_user
--

CREATE TABLE public.donation_campaigns (
    id text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    goal numeric(10,2) NOT NULL,
    raised numeric(10,2) DEFAULT 0 NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL,
    category text NOT NULL,
    beneficiary text NOT NULL,
    "impactStatement" text NOT NULL,
    images text[],
    "videoUrl" text,
    status public."CampaignStatus" DEFAULT 'DRAFT'::public."CampaignStatus" NOT NULL,
    featured boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.donation_campaigns OWNER TO stories_user;

--
-- Name: donations; Type: TABLE; Schema: public; Owner: stories_user
--

CREATE TABLE public.donations (
    id text NOT NULL,
    "donorId" text,
    "campaignId" text,
    amount numeric(10,2) NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    type public."DonationType" DEFAULT 'ONE_TIME'::public."DonationType" NOT NULL,
    "paymentMethod" text,
    "stripePaymentId" text,
    anonymous boolean DEFAULT false NOT NULL,
    "donorName" text,
    "donorEmail" text NOT NULL,
    message text,
    "taxDeductible" boolean DEFAULT true NOT NULL,
    "receiptUrl" text,
    status public."DonationStatus" DEFAULT 'PENDING'::public."DonationStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.donations OWNER TO stories_user;

--
-- Name: entitlements; Type: TABLE; Schema: public; Owner: stories_user
--

CREATE TABLE public.entitlements (
    id text NOT NULL,
    "userId" text,
    email text,
    "bookId" text,
    "storyId" text,
    "orderId" text,
    "subscriptionId" text,
    "licenseId" text,
    "grantReason" text,
    type public."EntitlementType" DEFAULT 'PURCHASE'::public."EntitlementType" NOT NULL,
    scope public."EntitlementScope" DEFAULT 'BOOK'::public."EntitlementScope" NOT NULL,
    "grantedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "expiresAt" timestamp(3) without time zone,
    "isActive" boolean DEFAULT true NOT NULL,
    "activatedAt" timestamp(3) without time zone,
    "lastAccessedAt" timestamp(3) without time zone,
    "accessCount" integer DEFAULT 0 NOT NULL,
    "downloadCount" integer DEFAULT 0 NOT NULL,
    "maxDownloads" integer,
    "ipRestrictions" text[],
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.entitlements OWNER TO stories_user;

--
-- Name: feature_usage; Type: TABLE; Schema: public; Owner: stories_user
--

CREATE TABLE public.feature_usage (
    id text NOT NULL,
    "userId" text,
    "sessionId" text,
    "featureName" text NOT NULL,
    "featureCategory" text,
    "accessCount" integer DEFAULT 1 NOT NULL,
    "totalTimeSpent" integer DEFAULT 0 NOT NULL,
    "avgTimePerAccess" double precision DEFAULT 0 NOT NULL,
    "lastAccessed" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "userRole" public."UserRole",
    "deviceType" text,
    "taskCompleted" boolean DEFAULT false NOT NULL,
    "errorEncountered" boolean DEFAULT false NOT NULL,
    "helpSought" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.feature_usage OWNER TO stories_user;

--
-- Name: illustrations; Type: TABLE; Schema: public; Owner: stories_user
--

CREATE TABLE public.illustrations (
    id text NOT NULL,
    "storyId" text NOT NULL,
    "artistId" text NOT NULL,
    title text NOT NULL,
    description text,
    "fileUrl" text NOT NULL,
    "thumbnailUrl" text,
    "position" integer,
    status public."IllustrationStatus" DEFAULT 'DRAFT'::public."IllustrationStatus" NOT NULL,
    compensation numeric(10,2),
    license text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.illustrations OWNER TO stories_user;

--
-- Name: inventory; Type: TABLE; Schema: public; Owner: stories_user
--

CREATE TABLE public.inventory (
    id text NOT NULL,
    "productId" text NOT NULL,
    "variantId" text,
    quantity integer DEFAULT 0 NOT NULL,
    reserved integer DEFAULT 0 NOT NULL,
    location text DEFAULT 'main'::text NOT NULL,
    "reorderPoint" integer DEFAULT 10 NOT NULL,
    "reorderQuantity" integer DEFAULT 50 NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.inventory OWNER TO stories_user;

--
-- Name: lesson_progress; Type: TABLE; Schema: public; Owner: stories_user
--

CREATE TABLE public.lesson_progress (
    id text NOT NULL,
    "lessonId" text NOT NULL,
    "studentId" text NOT NULL,
    "startedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "completedAt" timestamp(3) without time zone,
    "timeSpent" integer DEFAULT 0 NOT NULL,
    score double precision
);


ALTER TABLE public.lesson_progress OWNER TO stories_user;

--
-- Name: lessons; Type: TABLE; Schema: public; Owner: stories_user
--

CREATE TABLE public.lessons (
    id text NOT NULL,
    "classId" text NOT NULL,
    "lessonNumber" integer NOT NULL,
    title text NOT NULL,
    objectives text[],
    content text NOT NULL,
    resources jsonb NOT NULL,
    duration integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.lessons OWNER TO stories_user;

--
-- Name: media_files; Type: TABLE; Schema: public; Owner: stories_user
--

CREATE TABLE public.media_files (
    id text NOT NULL,
    filename text NOT NULL,
    "originalName" text NOT NULL,
    "mimeType" text NOT NULL,
    size integer NOT NULL,
    url text NOT NULL,
    "thumbnailUrl" text,
    "altText" text,
    description text,
    width integer,
    height integer,
    format text,
    folder text DEFAULT '/'::text NOT NULL,
    tags text[],
    "uploadedById" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.media_files OWNER TO stories_user;

--
-- Name: mentor_relations; Type: TABLE; Schema: public; Owner: stories_user
--

CREATE TABLE public.mentor_relations (
    id text NOT NULL,
    "mentorId" text NOT NULL,
    "menteeId" text NOT NULL,
    status public."MentorshipStatus" DEFAULT 'ACTIVE'::public."MentorshipStatus" NOT NULL,
    "startDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "endDate" timestamp(3) without time zone,
    goals text[],
    progress jsonb,
    "meetingSchedule" text,
    "lastMeeting" timestamp(3) without time zone,
    "nextMeeting" timestamp(3) without time zone,
    "mentorNotes" text,
    "menteeNotes" text,
    "adminNotes" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.mentor_relations OWNER TO stories_user;

--
-- Name: micro_surveys; Type: TABLE; Schema: public; Owner: stories_user
--

CREATE TABLE public.micro_surveys (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    trigger public."SurveyTrigger" DEFAULT 'PAGE_LOAD'::public."SurveyTrigger" NOT NULL,
    "targetPage" text,
    "targetRole" public."UserRole"[],
    frequency public."SurveyFrequency" DEFAULT 'ONCE'::public."SurveyFrequency" NOT NULL,
    "displayType" public."SurveyDisplayType" DEFAULT 'MODAL'::public."SurveyDisplayType" NOT NULL,
    "position" text DEFAULT 'bottom-right'::text NOT NULL,
    delay integer DEFAULT 5000 NOT NULL,
    questions jsonb NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone,
    "isActive" boolean DEFAULT true NOT NULL,
    impressions integer DEFAULT 0 NOT NULL,
    "responseCount" integer DEFAULT 0 NOT NULL,
    "completionRate" double precision DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.micro_surveys OWNER TO stories_user;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: stories_user
--

CREATE TABLE public.notifications (
    id text NOT NULL,
    "userId" text NOT NULL,
    type public."NotificationType" NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    data jsonb,
    read boolean DEFAULT false NOT NULL,
    "readAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.notifications OWNER TO stories_user;

--
-- Name: onboarding_activities; Type: TABLE; Schema: public; Owner: stories_user
--

CREATE TABLE public.onboarding_activities (
    id text NOT NULL,
    "progressId" text NOT NULL,
    "activityType" public."ActivityType" NOT NULL,
    "contentId" text,
    "timeSpent" integer DEFAULT 0 NOT NULL,
    "isCompleted" boolean DEFAULT false NOT NULL,
    "interactionData" jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.onboarding_activities OWNER TO stories_user;

--
-- Name: onboarding_progress; Type: TABLE; Schema: public; Owner: stories_user
--

CREATE TABLE public.onboarding_progress (
    id text NOT NULL,
    "userId" text NOT NULL,
    "currentStep" public."OnboardingStep" DEFAULT 'WELCOME'::public."OnboardingStep" NOT NULL,
    "completionRate" double precision DEFAULT 0 NOT NULL,
    "samplesViewed" integer DEFAULT 0 NOT NULL,
    "tutorialCompleted" boolean DEFAULT false NOT NULL,
    "lastActivity" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "isCompleted" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.onboarding_progress OWNER TO stories_user;

--
-- Name: order_items; Type: TABLE; Schema: public; Owner: stories_user
--

CREATE TABLE public.order_items (
    id text NOT NULL,
    "orderId" text NOT NULL,
    "productId" text NOT NULL,
    "variantId" text,
    title text NOT NULL,
    "variantTitle" text,
    quantity integer NOT NULL,
    price numeric(10,2) NOT NULL,
    total numeric(10,2) NOT NULL,
    "fulfillmentStatus" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.order_items OWNER TO stories_user;

--
-- Name: orders; Type: TABLE; Schema: public; Owner: stories_user
--

CREATE TABLE public.orders (
    id text NOT NULL,
    "orderNumber" text NOT NULL,
    "userId" text,
    email text NOT NULL,
    phone text,
    subtotal numeric(10,2) NOT NULL,
    tax numeric(10,2) DEFAULT 0 NOT NULL,
    shipping numeric(10,2) DEFAULT 0 NOT NULL,
    discount numeric(10,2) DEFAULT 0 NOT NULL,
    total numeric(10,2) NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    status public."OrderStatus" DEFAULT 'PENDING'::public."OrderStatus" NOT NULL,
    "paymentStatus" public."PaymentStatus" DEFAULT 'PENDING'::public."PaymentStatus" NOT NULL,
    "fulfillmentStatus" public."FulfillmentStatus" DEFAULT 'UNFULFILLED'::public."FulfillmentStatus" NOT NULL,
    "paymentMethod" text,
    "stripePaymentId" text,
    "shippingAddress" jsonb,
    "billingAddress" jsonb,
    "shippingMethod" text,
    "trackingNumber" text,
    notes text,
    tags text[],
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.orders OWNER TO stories_user;

--
-- Name: product_images; Type: TABLE; Schema: public; Owner: stories_user
--

CREATE TABLE public.product_images (
    id text NOT NULL,
    "productId" text NOT NULL,
    url text NOT NULL,
    alt text,
    "position" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.product_images OWNER TO stories_user;

--
-- Name: product_variants; Type: TABLE; Schema: public; Owner: stories_user
--

CREATE TABLE public.product_variants (
    id text NOT NULL,
    "productId" text NOT NULL,
    title text NOT NULL,
    sku text NOT NULL,
    price numeric(10,2) NOT NULL,
    "compareAtPrice" numeric(10,2),
    "inventoryQuantity" integer DEFAULT 0 NOT NULL,
    weight double precision,
    attributes jsonb NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.product_variants OWNER TO stories_user;

--
-- Name: products; Type: TABLE; Schema: public; Owner: stories_user
--

CREATE TABLE public.products (
    id text NOT NULL,
    sku text NOT NULL,
    type public."ProductType" NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    price numeric(10,2) NOT NULL,
    "compareAtPrice" numeric(10,2),
    cost numeric(10,2),
    currency text DEFAULT 'USD'::text NOT NULL,
    weight double precision,
    status public."ProductStatus" DEFAULT 'DRAFT'::public."ProductStatus" NOT NULL,
    featured boolean DEFAULT false NOT NULL,
    "creatorId" text,
    "creatorName" text,
    "creatorAge" integer,
    "creatorLocation" text,
    "creatorStory" text,
    "categoryId" text NOT NULL,
    tags text[],
    "impactMetric" text,
    "impactValue" text,
    "digitalFileUrl" text,
    "downloadLimit" integer,
    "metaTitle" text,
    "metaDescription" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.products OWNER TO stories_user;

--
-- Name: profiles; Type: TABLE; Schema: public; Owner: stories_user
--

CREATE TABLE public.profiles (
    id text NOT NULL,
    "userId" text NOT NULL,
    "firstName" text,
    "lastName" text,
    organization text,
    bio text,
    location text,
    phone text,
    "dateOfBirth" timestamp(3) without time zone,
    language text DEFAULT 'en'::text NOT NULL,
    timezone text DEFAULT 'UTC'::text NOT NULL,
    "teachingLevel" text,
    subjects text[],
    "studentCount" integer,
    skills text[],
    availability text,
    experience text,
    "emailNotifications" boolean DEFAULT true NOT NULL,
    "pushNotifications" boolean DEFAULT true NOT NULL,
    newsletter boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "ageVerificationStatus" public."AgeVerificationStatus" DEFAULT 'PENDING'::public."AgeVerificationStatus" NOT NULL,
    "coppaCompliant" boolean DEFAULT false NOT NULL,
    "isMinor" boolean DEFAULT false NOT NULL,
    "parentEmail" text,
    "parentName" text,
    "parentalConsentDate" timestamp(3) without time zone,
    "parentalConsentRequired" boolean DEFAULT false NOT NULL,
    "parentalConsentStatus" public."ParentalConsentStatus" DEFAULT 'NOT_REQUIRED'::public."ParentalConsentStatus" NOT NULL
);


ALTER TABLE public.profiles OWNER TO stories_user;

--
-- Name: publications; Type: TABLE; Schema: public; Owner: stories_user
--

CREATE TABLE public.publications (
    id text NOT NULL,
    "bookId" text,
    "storyId" text,
    "submissionId" text,
    visibility public."ContentVisibility" DEFAULT 'PUBLIC'::public."ContentVisibility" NOT NULL,
    "isPremium" boolean DEFAULT false NOT NULL,
    "unlockPolicy" public."UnlockPolicy" DEFAULT 'PURCHASE'::public."UnlockPolicy" NOT NULL,
    price numeric(10,2),
    currency text DEFAULT 'USD'::text NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    changelog text,
    status public."PublicationStatus" DEFAULT 'DRAFT'::public."PublicationStatus" NOT NULL,
    "publishedAt" timestamp(3) without time zone,
    "publishedBy" text NOT NULL,
    featured boolean DEFAULT false NOT NULL,
    category text[],
    tags text[],
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.publications OWNER TO stories_user;

--
-- Name: quest_assignments; Type: TABLE; Schema: public; Owner: stories_user
--

CREATE TABLE public.quest_assignments (
    id text NOT NULL,
    "questId" text NOT NULL,
    "volunteerId" text NOT NULL,
    "assignedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "startedAt" timestamp(3) without time zone,
    "completedAt" timestamp(3) without time zone,
    status public."AssignmentStatus" DEFAULT 'ASSIGNED'::public."AssignmentStatus" NOT NULL,
    "hoursLogged" double precision DEFAULT 0 NOT NULL,
    "progressPercent" integer DEFAULT 0 NOT NULL,
    "qualityScore" double precision,
    "volunteerNotes" text,
    "supervisorNotes" text,
    "finalFeedback" text,
    rating integer
);


ALTER TABLE public.quest_assignments OWNER TO stories_user;

--
-- Name: quest_reviews; Type: TABLE; Schema: public; Owner: stories_user
--

CREATE TABLE public.quest_reviews (
    id text NOT NULL,
    "questId" text NOT NULL,
    "reviewerId" text NOT NULL,
    "reviewerRole" public."UserRole" NOT NULL,
    rating integer NOT NULL,
    title text,
    content text NOT NULL,
    "difficultyRating" integer,
    "clarityRating" integer,
    "supportRating" integer,
    "wouldRecommend" boolean DEFAULT true NOT NULL,
    "improvementSuggestions" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.quest_reviews OWNER TO stories_user;

--
-- Name: quests; Type: TABLE; Schema: public; Owner: stories_user
--

CREATE TABLE public.quests (
    id text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    type public."VolunteerType" NOT NULL,
    category public."QuestCategory" DEFAULT 'EDUCATION'::public."QuestCategory" NOT NULL,
    difficulty public."DifficultyLevel" DEFAULT 'BEGINNER'::public."DifficultyLevel" NOT NULL,
    "requiredSkills" text[],
    "requiredLanguages" text[],
    "minimumLevel" public."VolunteerLevel" DEFAULT 'BRONZE'::public."VolunteerLevel" NOT NULL,
    "experienceRequired" boolean DEFAULT false NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone,
    duration integer NOT NULL,
    "isRecurring" boolean DEFAULT false NOT NULL,
    "recurringPattern" text,
    timezone text DEFAULT 'UTC'::text NOT NULL,
    "timeSlots" jsonb NOT NULL,
    "maxVolunteers" integer DEFAULT 1 NOT NULL,
    "currentVolunteers" integer DEFAULT 0 NOT NULL,
    urgency public."UrgencyLevel" DEFAULT 'MEDIUM'::public."UrgencyLevel" NOT NULL,
    priority integer DEFAULT 1 NOT NULL,
    "pointsReward" integer DEFAULT 10 NOT NULL,
    "additionalRewards" text[],
    location text DEFAULT 'Remote'::text NOT NULL,
    materials text[],
    "targetAudience" text,
    "expectedImpact" text,
    "creatorId" text NOT NULL,
    "createdByRole" public."UserRole" DEFAULT 'ADMIN'::public."UserRole" NOT NULL,
    "approvalRequired" boolean DEFAULT false NOT NULL,
    "isApproved" boolean DEFAULT true NOT NULL,
    "approvedById" text,
    "approvedAt" timestamp(3) without time zone,
    status public."QuestStatus" DEFAULT 'OPEN'::public."QuestStatus" NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "isFeatured" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.quests OWNER TO stories_user;

--
-- Name: reading_lists; Type: TABLE; Schema: public; Owner: stories_user
--

CREATE TABLE public.reading_lists (
    id text NOT NULL,
    "userId" text NOT NULL,
    name text NOT NULL,
    description text,
    "isPublic" boolean DEFAULT false NOT NULL,
    "storyIds" text[],
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.reading_lists OWNER TO stories_user;

--
-- Name: reading_progress; Type: TABLE; Schema: public; Owner: stories_user
--

CREATE TABLE public.reading_progress (
    id text NOT NULL,
    "userId" text NOT NULL,
    "storyId" text NOT NULL,
    "currentChapter" integer DEFAULT 1 NOT NULL,
    "currentPage" integer,
    "currentPosition" text,
    "percentComplete" double precision DEFAULT 0 NOT NULL,
    "totalReadingTime" integer DEFAULT 0 NOT NULL,
    "lastReadAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "startedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "completedAt" timestamp(3) without time zone,
    notes text[],
    "isCompleted" boolean DEFAULT false NOT NULL,
    "totalPages" integer
);


ALTER TABLE public.reading_progress OWNER TO stories_user;

--
-- Name: recurring_donations; Type: TABLE; Schema: public; Owner: stories_user
--

CREATE TABLE public.recurring_donations (
    id text NOT NULL,
    "donorId" text NOT NULL,
    amount numeric(10,2) NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    frequency public."DonationFrequency" DEFAULT 'MONTHLY'::public."DonationFrequency" NOT NULL,
    "dayOfMonth" integer,
    "stripeSubscriptionId" text,
    status public."RecurringStatus" DEFAULT 'ACTIVE'::public."RecurringStatus" NOT NULL,
    "startDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "pausedAt" timestamp(3) without time zone,
    "cancelledAt" timestamp(3) without time zone,
    "totalContributed" numeric(10,2) DEFAULT 0 NOT NULL,
    "lastPaymentDate" timestamp(3) without time zone,
    "nextPaymentDate" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.recurring_donations OWNER TO stories_user;

--
-- Name: reviews; Type: TABLE; Schema: public; Owner: stories_user
--

CREATE TABLE public.reviews (
    id text NOT NULL,
    "userId" text NOT NULL,
    "contentType" public."ContentType" NOT NULL,
    "contentId" text NOT NULL,
    rating integer NOT NULL,
    title text,
    comment text,
    helpful integer DEFAULT 0 NOT NULL,
    verified boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.reviews OWNER TO stories_user;

--
-- Name: role_migrations; Type: TABLE; Schema: public; Owner: stories_user
--

CREATE TABLE public.role_migrations (
    id text NOT NULL,
    "userId" text NOT NULL,
    "fromRole" public."UserRole" NOT NULL,
    "toRole" public."UserRole" NOT NULL,
    "migrationType" public."MigrationType" DEFAULT 'SYSTEM_MIGRATION'::public."MigrationType" NOT NULL,
    "migrationReason" text,
    "initiatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "completedAt" timestamp(3) without time zone,
    status public."MigrationStatus" DEFAULT 'IN_PROGRESS'::public."MigrationStatus" NOT NULL,
    "notificationSent" boolean DEFAULT false NOT NULL,
    "userAcknowledged" boolean DEFAULT false NOT NULL,
    "helpDocViewed" boolean DEFAULT false NOT NULL,
    "supportContacted" boolean DEFAULT false NOT NULL,
    "satisfactionRating" integer,
    "feedbackProvided" boolean DEFAULT false NOT NULL,
    "issuesReported" text[],
    "preFeatureUsage" jsonb,
    "postFeatureUsage" jsonb,
    "adaptationPeriod" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.role_migrations OWNER TO stories_user;

--
-- Name: sample_content_access; Type: TABLE; Schema: public; Owner: stories_user
--

CREATE TABLE public.sample_content_access (
    id text NOT NULL,
    "userId" text NOT NULL,
    "storyId" text NOT NULL,
    "viewCount" integer DEFAULT 0 NOT NULL,
    "totalTimeSpent" integer DEFAULT 0 NOT NULL,
    "lastAccessed" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.sample_content_access OWNER TO stories_user;

--
-- Name: school_resources; Type: TABLE; Schema: public; Owner: stories_user
--

CREATE TABLE public.school_resources (
    id text NOT NULL,
    "schoolId" text NOT NULL,
    type public."SchoolResourceType" NOT NULL,
    name text NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    condition text,
    location text,
    "purchaseDate" timestamp(3) without time zone,
    value numeric(10,2),
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.school_resources OWNER TO stories_user;

--
-- Name: school_volunteers; Type: TABLE; Schema: public; Owner: stories_user
--

CREATE TABLE public.school_volunteers (
    id text NOT NULL,
    "schoolId" text NOT NULL,
    "volunteerId" text NOT NULL,
    role text NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.school_volunteers OWNER TO stories_user;

--
-- Name: schools; Type: TABLE; Schema: public; Owner: stories_user
--

CREATE TABLE public.schools (
    id text NOT NULL,
    name text NOT NULL,
    type public."SchoolType" NOT NULL,
    address jsonb NOT NULL,
    country text NOT NULL,
    phone text,
    email text,
    website text,
    "principalName" text,
    "studentCount" integer DEFAULT 0 NOT NULL,
    "teacherCount" integer DEFAULT 0 NOT NULL,
    "establishedYear" integer,
    accreditation text[],
    "partneredAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status public."SchoolStatus" DEFAULT 'PENDING'::public."SchoolStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.schools OWNER TO stories_user;

--
-- Name: sessions; Type: TABLE; Schema: public; Owner: stories_user
--

CREATE TABLE public.sessions (
    id text NOT NULL,
    "sessionToken" text NOT NULL,
    "userId" text NOT NULL,
    expires timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.sessions OWNER TO stories_user;

--
-- Name: shop_products; Type: TABLE; Schema: public; Owner: stories_user
--

CREATE TABLE public.shop_products (
    id text NOT NULL,
    sku text NOT NULL,
    type public."ShopProductType" DEFAULT 'DIGITAL_BOOK'::public."ShopProductType" NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    "shortDescription" text,
    price numeric(10,2) NOT NULL,
    "compareAtPrice" numeric(10,2),
    currency text DEFAULT 'USD'::text NOT NULL,
    "bookId" text,
    "storyId" text,
    "downloadLimit" integer,
    "accessDuration" integer,
    "bundleItems" text[],
    "bundleDiscount" numeric(5,2),
    category text[],
    tags text[],
    featured boolean DEFAULT false NOT NULL,
    images text[],
    "thumbnailUrl" text,
    "demoUrl" text,
    "creatorName" text,
    "creatorAge" integer,
    "creatorLocation" text,
    "creatorStory" text,
    "impactMetric" text,
    "impactValue" text,
    status public."ShopProductStatus" DEFAULT 'ACTIVE'::public."ShopProductStatus" NOT NULL,
    "availableFrom" timestamp(3) without time zone,
    "availableUntil" timestamp(3) without time zone,
    "maxQuantity" integer,
    "metaTitle" text,
    "metaDescription" text,
    "marketingTags" text[],
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.shop_products OWNER TO stories_user;

--
-- Name: stories; Type: TABLE; Schema: public; Owner: stories_user
--

CREATE TABLE public.stories (
    id text NOT NULL,
    isbn text,
    title text NOT NULL,
    subtitle text,
    content text NOT NULL,
    summary text,
    "authorId" text NOT NULL,
    "authorName" text NOT NULL,
    "coAuthors" text[],
    "authorAge" integer,
    "authorLocation" text,
    "illustratorId" text,
    "publishedDate" timestamp(3) without time zone,
    publisher text,
    language text DEFAULT 'en'::text NOT NULL,
    "pageCount" integer,
    "readingLevel" text,
    "readingTime" integer,
    category text[],
    genres text[],
    subjects text[],
    tags text[],
    "coverImage" text,
    illustrations text[],
    "samplePdf" text,
    "fullPdf" text,
    "epubFile" text,
    "audioFile" text,
    "isPremium" boolean DEFAULT false NOT NULL,
    "isPublished" boolean DEFAULT false NOT NULL,
    featured boolean DEFAULT false NOT NULL,
    price numeric(10,2),
    "viewCount" integer DEFAULT 0 NOT NULL,
    "likeCount" integer DEFAULT 0 NOT NULL,
    rating double precision,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.stories OWNER TO stories_user;

--
-- Name: story_submissions; Type: TABLE; Schema: public; Owner: stories_user
--

CREATE TABLE public.story_submissions (
    id text NOT NULL,
    "authorId" text NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    language text NOT NULL,
    category text NOT NULL,
    "ageGroup" text NOT NULL,
    status public."StorySubmissionStatus" DEFAULT 'DRAFT'::public."StorySubmissionStatus" NOT NULL,
    "reviewerId" text,
    "reviewNotes" text,
    "editorialNotes" text,
    "publishDate" timestamp(3) without time zone,
    compensation numeric(10,2),
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "assigneeId" text,
    attachments text[],
    "coverImageId" text,
    "dueDate" timestamp(3) without time zone,
    priority public."Priority" DEFAULT 'MEDIUM'::public."Priority" NOT NULL,
    summary text,
    tags text[]
);


ALTER TABLE public.story_submissions OWNER TO stories_user;

--
-- Name: submissions; Type: TABLE; Schema: public; Owner: stories_user
--

CREATE TABLE public.submissions (
    id text NOT NULL,
    "assignmentId" text NOT NULL,
    "studentId" text NOT NULL,
    "submittedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    content text,
    attachments text[],
    grade double precision,
    feedback text,
    status public."SubmissionStatus" DEFAULT 'DRAFT'::public."SubmissionStatus" NOT NULL
);


ALTER TABLE public.submissions OWNER TO stories_user;

--
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: stories_user
--

CREATE TABLE public.subscriptions (
    id text NOT NULL,
    "userId" text NOT NULL,
    plan public."SubscriptionPlan" DEFAULT 'FREE'::public."SubscriptionPlan" NOT NULL,
    status public."SubscriptionStatus" DEFAULT 'ACTIVE'::public."SubscriptionStatus" NOT NULL,
    "startDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "endDate" timestamp(3) without time zone,
    "cancelledAt" timestamp(3) without time zone,
    "stripeCustomerId" text,
    "stripeSubscriptionId" text,
    "stripePriceId" text,
    "maxStudents" integer DEFAULT 30 NOT NULL,
    "maxDownloads" integer DEFAULT 10 NOT NULL,
    "canAccessPremium" boolean DEFAULT false NOT NULL,
    "canDownloadPDF" boolean DEFAULT false NOT NULL,
    "canCreateClasses" boolean DEFAULT false NOT NULL,
    "unlimitedReading" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.subscriptions OWNER TO stories_user;

--
-- Name: survey_responses; Type: TABLE; Schema: public; Owner: stories_user
--

CREATE TABLE public.survey_responses (
    id text NOT NULL,
    "surveyId" text NOT NULL,
    "userId" text,
    "sessionId" text,
    answers jsonb NOT NULL,
    "completionTime" integer NOT NULL,
    "isComplete" boolean DEFAULT true NOT NULL,
    "userRole" public."UserRole",
    page text,
    "userAgent" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.survey_responses OWNER TO stories_user;

--
-- Name: translations; Type: TABLE; Schema: public; Owner: stories_user
--

CREATE TABLE public.translations (
    id text NOT NULL,
    "storyId" text NOT NULL,
    "translatorId" text NOT NULL,
    "fromLanguage" text NOT NULL,
    "toLanguage" text NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    status public."TranslationStatus" DEFAULT 'IN_PROGRESS'::public."TranslationStatus" NOT NULL,
    "qualityScore" double precision,
    "reviewerId" text,
    "reviewNotes" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.translations OWNER TO stories_user;

--
-- Name: user_analytics; Type: TABLE; Schema: public; Owner: stories_user
--

CREATE TABLE public.user_analytics (
    id text NOT NULL,
    "userId" text,
    "sessionId" text NOT NULL,
    "userRole" public."UserRole",
    "isNewUser" boolean DEFAULT false NOT NULL,
    "migrationDate" timestamp(3) without time zone,
    "sessionStart" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "sessionEnd" timestamp(3) without time zone,
    "totalDuration" integer DEFAULT 0 NOT NULL,
    "pageViews" integer DEFAULT 0 NOT NULL,
    "clickCount" integer DEFAULT 0 NOT NULL,
    "scrollDepth" double precision DEFAULT 0 NOT NULL,
    "landingPage" text,
    "exitPage" text,
    "pageSequence" jsonb,
    "featuresUsed" text[],
    "actionsPerformed" jsonb,
    "errorsEncountered" text[],
    "userAgent" text,
    "deviceType" text,
    "browserName" text,
    "operatingSystem" text,
    "screenResolution" text,
    "engagementScore" double precision DEFAULT 0 NOT NULL,
    "bounceRate" boolean DEFAULT false NOT NULL,
    "returnVisitor" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.user_analytics OWNER TO stories_user;

--
-- Name: user_deletion_requests; Type: TABLE; Schema: public; Owner: stories_user
--

CREATE TABLE public.user_deletion_requests (
    id text NOT NULL,
    "userId" text NOT NULL,
    status public."DeletionStatus" DEFAULT 'PENDING'::public."DeletionStatus" NOT NULL,
    "deletionReason" text,
    "parentalConsentRequired" boolean DEFAULT false NOT NULL,
    "parentalConsentVerified" boolean DEFAULT false NOT NULL,
    "parentConfirmationToken" text,
    "parentConfirmationSentAt" timestamp(3) without time zone,
    "parentConfirmationExpiry" timestamp(3) without time zone,
    "softDeletedAt" timestamp(3) without time zone,
    "hardDeletedAt" timestamp(3) without time zone,
    "recoveryDeadline" timestamp(3) without time zone,
    "requestSource" text DEFAULT 'self_service'::text NOT NULL,
    "ipAddress" text,
    "userAgent" text,
    "additionalContext" jsonb,
    "reviewRequired" boolean DEFAULT false NOT NULL,
    "reviewedBy" text,
    "reviewedAt" timestamp(3) without time zone,
    "reviewNotes" text,
    "finalConfirmationToken" text,
    "finalConfirmationSentAt" timestamp(3) without time zone,
    "finalConfirmationExpiry" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.user_deletion_requests OWNER TO stories_user;

--
-- Name: user_feedback; Type: TABLE; Schema: public; Owner: stories_user
--

CREATE TABLE public.user_feedback (
    id text NOT NULL,
    "userId" text,
    "sessionId" text,
    email text,
    "feedbackType" public."FeedbackType" DEFAULT 'GENERAL'::public."FeedbackType" NOT NULL,
    category public."FeedbackCategory" DEFAULT 'UX_FEEDBACK'::public."FeedbackCategory" NOT NULL,
    page text,
    "userAgent" text,
    viewport text,
    rating integer,
    title text,
    message text NOT NULL,
    sentiment public."SentimentType",
    "userRole" public."UserRole",
    "previousRole" public."UserRole",
    "migrationDate" timestamp(3) without time zone,
    "sessionDuration" integer,
    "clickPath" jsonb,
    "scrollBehavior" jsonb,
    "timeOnPage" integer,
    "exitIntent" boolean DEFAULT false NOT NULL,
    "bugReport" boolean DEFAULT false NOT NULL,
    reproducible boolean,
    severity public."FeedbackSeverity" DEFAULT 'LOW'::public."FeedbackSeverity" NOT NULL,
    "screenshotUrl" text,
    "isResolved" boolean DEFAULT false NOT NULL,
    "responseDate" timestamp(3) without time zone,
    "respondedBy" text,
    resolution text,
    tags text[],
    priority public."Priority" DEFAULT 'LOW'::public."Priority" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.user_feedback OWNER TO stories_user;

--
-- Name: users; Type: TABLE; Schema: public; Owner: stories_user
--

CREATE TABLE public.users (
    id text NOT NULL,
    email text NOT NULL,
    "emailVerified" timestamp(3) without time zone,
    name text,
    image text,
    role public."UserRole" DEFAULT 'CUSTOMER'::public."UserRole" NOT NULL,
    "schoolId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    "deletionRequestId" text,
    password text,
    "tokenVersion" integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.users OWNER TO stories_user;

--
-- Name: verification_tokens; Type: TABLE; Schema: public; Owner: stories_user
--

CREATE TABLE public.verification_tokens (
    identifier text NOT NULL,
    token text NOT NULL,
    expires timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.verification_tokens OWNER TO stories_user;

--
-- Name: volunteer_applications; Type: TABLE; Schema: public; Owner: stories_user
--

CREATE TABLE public.volunteer_applications (
    id text NOT NULL,
    "projectId" text,
    "volunteerId" text NOT NULL,
    motivation text NOT NULL,
    experience text NOT NULL,
    availability text NOT NULL,
    status public."ApplicationStatus" DEFAULT 'PENDING'::public."ApplicationStatus" NOT NULL,
    "reviewedBy" text,
    "reviewedAt" timestamp(3) without time zone,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "coverLetter" text,
    "isRecommended" boolean DEFAULT false NOT NULL,
    "matchScore" double precision,
    "questId" text,
    "rejectionReason" text,
    "selectionReason" text,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "volunteerUserId" text NOT NULL
);


ALTER TABLE public.volunteer_applications OWNER TO stories_user;

--
-- Name: volunteer_certificates; Type: TABLE; Schema: public; Owner: stories_user
--

CREATE TABLE public.volunteer_certificates (
    id text NOT NULL,
    "volunteerId" text NOT NULL,
    type public."CertificateType" NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    "hoursContributed" double precision NOT NULL,
    "projectCount" integer NOT NULL,
    "issuedDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "certificateUrl" text
);


ALTER TABLE public.volunteer_certificates OWNER TO stories_user;

--
-- Name: volunteer_evidence; Type: TABLE; Schema: public; Owner: stories_user
--

CREATE TABLE public.volunteer_evidence (
    id text NOT NULL,
    "assignmentId" text NOT NULL,
    "volunteerId" text NOT NULL,
    "questId" text NOT NULL,
    type public."EvidenceType" NOT NULL,
    title text NOT NULL,
    description text,
    "fileUrls" text[],
    metadata jsonb,
    status public."EvidenceStatus" DEFAULT 'PENDING'::public."EvidenceStatus" NOT NULL,
    "submittedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "reviewedAt" timestamp(3) without time zone,
    "reviewerId" text,
    "reviewNotes" text,
    "hoursSubmitted" double precision NOT NULL,
    "hoursApproved" double precision DEFAULT 0 NOT NULL,
    "pointsAwarded" integer DEFAULT 0 NOT NULL,
    "autoVerified" boolean DEFAULT false NOT NULL,
    "verificationScore" double precision,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.volunteer_evidence OWNER TO stories_user;

--
-- Name: volunteer_hours; Type: TABLE; Schema: public; Owner: stories_user
--

CREATE TABLE public.volunteer_hours (
    id text NOT NULL,
    "volunteerId" text NOT NULL,
    "projectId" text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    hours double precision NOT NULL,
    activity text NOT NULL,
    impact text,
    verified boolean DEFAULT false NOT NULL,
    "verifiedBy" text,
    "verifiedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.volunteer_hours OWNER TO stories_user;

--
-- Name: volunteer_matches; Type: TABLE; Schema: public; Owner: stories_user
--

CREATE TABLE public.volunteer_matches (
    id text NOT NULL,
    "volunteerId" text NOT NULL,
    "questId" text NOT NULL,
    "overallScore" double precision NOT NULL,
    "languageScore" double precision DEFAULT 0 NOT NULL,
    "skillScore" double precision DEFAULT 0 NOT NULL,
    "availabilityScore" double precision DEFAULT 0 NOT NULL,
    "experienceScore" double precision DEFAULT 0 NOT NULL,
    "locationScore" double precision DEFAULT 0 NOT NULL,
    reasons text[],
    concerns text[],
    confidence double precision DEFAULT 0 NOT NULL,
    "isRecommended" boolean DEFAULT false NOT NULL,
    "wasSelected" boolean DEFAULT false NOT NULL,
    "selectionReason" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.volunteer_matches OWNER TO stories_user;

--
-- Name: volunteer_points; Type: TABLE; Schema: public; Owner: stories_user
--

CREATE TABLE public.volunteer_points (
    id text NOT NULL,
    "volunteerId" text NOT NULL,
    type public."PointTransactionType" NOT NULL,
    amount integer NOT NULL,
    reason text NOT NULL,
    description text,
    "referenceId" text,
    "referenceType" text,
    "balanceAfter" integer NOT NULL,
    metadata jsonb,
    "issuedById" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.volunteer_points OWNER TO stories_user;

--
-- Name: volunteer_profiles; Type: TABLE; Schema: public; Owner: stories_user
--

CREATE TABLE public.volunteer_profiles (
    id text NOT NULL,
    "userId" text NOT NULL,
    languages text[],
    "languageLevels" jsonb NOT NULL,
    skills text[],
    qualifications text[],
    experience text,
    portfolio text,
    timezone text DEFAULT 'UTC'::text NOT NULL,
    "availableSlots" jsonb NOT NULL,
    "maxHoursPerWeek" integer DEFAULT 10 NOT NULL,
    "remoteOnly" boolean DEFAULT true NOT NULL,
    "preferredTypes" public."VolunteerType"[],
    "verificationStatus" public."VerificationStatus" DEFAULT 'PENDING'::public."VerificationStatus" NOT NULL,
    "backgroundCheck" boolean DEFAULT false NOT NULL,
    "documentUrl" text,
    "verifiedAt" timestamp(3) without time zone,
    "verifiedById" text,
    "totalHours" double precision DEFAULT 0 NOT NULL,
    "totalPoints" integer DEFAULT 0 NOT NULL,
    "currentLevel" public."VolunteerLevel" DEFAULT 'BRONZE'::public."VolunteerLevel" NOT NULL,
    rating double precision DEFAULT 5.0 NOT NULL,
    reliability double precision DEFAULT 100.0 NOT NULL,
    "isMentor" boolean DEFAULT false NOT NULL,
    "mentorLevel" public."MentorLevel",
    "canAcceptMentees" boolean DEFAULT false NOT NULL,
    "maxMentees" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.volunteer_profiles OWNER TO stories_user;

--
-- Name: volunteer_projects; Type: TABLE; Schema: public; Owner: stories_user
--

CREATE TABLE public.volunteer_projects (
    id text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    type public."VolunteerType" NOT NULL,
    skills text[],
    location text NOT NULL,
    "timeCommitment" text NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone,
    "maxVolunteers" integer NOT NULL,
    "currentVolunteers" integer DEFAULT 0 NOT NULL,
    status public."ProjectStatus" DEFAULT 'OPEN'::public."ProjectStatus" NOT NULL,
    impact text NOT NULL,
    "coordinatorId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.volunteer_projects OWNER TO stories_user;

--
-- Name: volunteer_redemptions; Type: TABLE; Schema: public; Owner: stories_user
--

CREATE TABLE public.volunteer_redemptions (
    id text NOT NULL,
    "volunteerId" text NOT NULL,
    "rewardId" text NOT NULL,
    "pointsUsed" integer NOT NULL,
    status public."RedemptionStatus" DEFAULT 'PENDING'::public."RedemptionStatus" NOT NULL,
    "fulfilledAt" timestamp(3) without time zone,
    "fulfilledById" text,
    "fulfillmentNotes" text,
    "trackingInfo" text,
    "deliveryMethod" text,
    "recipientEmail" text,
    "shippingAddress" jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.volunteer_redemptions OWNER TO stories_user;

--
-- Name: volunteer_rewards; Type: TABLE; Schema: public; Owner: stories_user
--

CREATE TABLE public.volunteer_rewards (
    id text NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    type public."RewardType" NOT NULL,
    category public."RewardCategory" DEFAULT 'DIGITAL'::public."RewardCategory" NOT NULL,
    "pointsCost" integer NOT NULL,
    "levelRequired" public."VolunteerLevel" DEFAULT 'BRONZE'::public."VolunteerLevel" NOT NULL,
    "maxRedemptions" integer,
    "currentRedemptions" integer DEFAULT 0 NOT NULL,
    value text,
    "imageUrl" text,
    terms text,
    "isActive" boolean DEFAULT true NOT NULL,
    "validFrom" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "validUntil" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.volunteer_rewards OWNER TO stories_user;

--
-- Name: volunteer_submissions; Type: TABLE; Schema: public; Owner: stories_user
--

CREATE TABLE public.volunteer_submissions (
    id text NOT NULL,
    "volunteerId" text NOT NULL,
    "projectId" text,
    type public."VolunteerSubmissionType" DEFAULT 'PDF_UPLOAD'::public."VolunteerSubmissionType" NOT NULL,
    "pdfRef" text,
    "originalName" text,
    "fileSize" integer,
    title text NOT NULL,
    "authorAlias" text NOT NULL,
    language text DEFAULT 'en'::text NOT NULL,
    "ageRange" text,
    category text[],
    tags text[],
    summary text NOT NULL,
    visibility public."ContentVisibility" DEFAULT 'PUBLIC'::public."ContentVisibility" NOT NULL,
    "targetAudience" text,
    "copyrightConfirmed" boolean DEFAULT false NOT NULL,
    "portraitRightsConfirmed" boolean DEFAULT false NOT NULL,
    "originalWork" boolean DEFAULT true NOT NULL,
    "licenseType" text,
    status public."VolunteerSubmissionStatus" DEFAULT 'SUBMITTED'::public."VolunteerSubmissionStatus" NOT NULL,
    priority public."Priority" DEFAULT 'MEDIUM'::public."Priority" NOT NULL,
    "reviewerId" text,
    "assigneeId" text,
    "dueDate" timestamp(3) without time zone,
    "reviewNotes" text,
    "rejectionReason" text,
    "publishDate" timestamp(3) without time zone,
    compensation numeric(10,2),
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.volunteer_submissions OWNER TO stories_user;

--
-- Name: welcome_messages; Type: TABLE; Schema: public; Owner: stories_user
--

CREATE TABLE public.welcome_messages (
    id text NOT NULL,
    "messageType" public."WelcomeType" NOT NULL,
    language text DEFAULT 'ko'::text NOT NULL,
    content text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    priority integer DEFAULT 1 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.welcome_messages OWNER TO stories_user;

--
-- Name: workflow_history; Type: TABLE; Schema: public; Owner: stories_user
--

CREATE TABLE public.workflow_history (
    id text NOT NULL,
    "storySubmissionId" text NOT NULL,
    "fromStatus" public."StorySubmissionStatus",
    "toStatus" public."StorySubmissionStatus" NOT NULL,
    comment text,
    "performedById" text NOT NULL,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.workflow_history OWNER TO stories_user;

--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
2929769e-0ac4-4354-8042-c3a089996d12	7384b69226f503b7970402b855e32aebc3d76cd453f2512608a7196cf0c79f2e	2025-08-22 05:43:09.53183+00	20250813143110_comprehensive_schema	\N	\N	2025-08-22 05:43:08.757545+00	1
ef71c83d-07f1-45ea-9c24-ee7ac30e9ea6	a0c95d482d06f210986ed12d91b0d8e7aeb71213e4038f8026b8e78f574a0788	2025-09-01 00:35:23.250467+00	20250831000001_add_book_thumbnails	\N	\N	2025-09-01 00:35:23.200743+00	1
f64ee4c5-64b8-4432-b454-63ebcb91d8b4	0bb14c8fb60421b8cec4a805edde09268446fad0aa87ef5c6769ec6942b0b733	2025-09-01 07:03:48.942867+00	20250901135500_add_user_token_version		\N	2025-09-01 07:03:48.942867+00	0
\.


--
-- Data for Name: ab_test_participants; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.ab_test_participants (id, "userId", "sessionId", "testName", variant, "userRole", "assignedAt", "primaryGoal", "goalAchieved", "goalAchievedAt", "conversionValue", "secondaryGoals", "createdAt") FROM stdin;
\.


--
-- Data for Name: accounts; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.accounts (id, "userId", type, provider, "providerAccountId", refresh_token, access_token, expires_at, token_type, scope, id_token, session_state) FROM stdin;
\.


--
-- Data for Name: activity_logs; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.activity_logs (id, "userId", action, entity, "entityId", metadata, "ipAddress", "userAgent", "createdAt") FROM stdin;
cmf37ku5t001iqz01slmig548	cmf35gyji000oqz012qoyhjou	BOOK_VIEWED	BOOK	a-gril-come-to-stanford	{"userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "accessLevel": "preview", "hasSubscription": true}	\N	\N	2025-09-02 23:57:53.201
cmf37l909001oqz01d5arvqxz	cmf35gyji000oqz012qoyhjou	BOOK_VIEWED	BOOK	a-gril-come-to-stanford	{"userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "accessLevel": "preview", "hasSubscription": true}	\N	\N	2025-09-02 23:58:12.441
cmf37n0rb001uqz01bw92dv6d	cmf35gyji000oqz012qoyhjou	BOOK_VIEWED	BOOK	check-point-eng	{"userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "accessLevel": "preview", "hasSubscription": true}	\N	\N	2025-09-02 23:59:35.063
cmf37nevt0020qz019s19424r	cmf35gyji000oqz012qoyhjou	BOOK_VIEWED	BOOK	a-gril-come-to-stanford	{"userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "accessLevel": "preview", "hasSubscription": true}	\N	\N	2025-09-02 23:59:53.369
cmf37nfyv0024qz018yahajof	cmf35gyji000oqz012qoyhjou	BOOK_VIEWED	BOOK	a-gril-come-to-stanford	{"userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "accessLevel": "preview", "hasSubscription": true}	\N	\N	2025-09-02 23:59:54.776
cmf37ngla0026qz015rqbxzzz	cmf35gyji000oqz012qoyhjou	PDF_ACCESSED	BOOK	a-gril-come-to-stanford	{"filename": "sample.pdf", "userRole": "CUSTOMER", "accessReason": "sample_authenticated"}	\N	\N	2025-09-02 23:59:55.582
cmf37ngry0028qz01awq3yyzz	cmf35gyji000oqz012qoyhjou	PDF_ACCESSED	BOOK	a-gril-come-to-stanford	{"filename": "sample.pdf", "userRole": "CUSTOMER", "accessReason": "sample_authenticated"}	\N	\N	2025-09-02 23:59:55.823
cmf37nofl002eqz01klk7vebn	cmf35gyji000oqz012qoyhjou	BOOK_VIEWED	BOOK	a-gril-come-to-stanford	{"userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "accessLevel": "preview", "hasSubscription": true}	\N	\N	2025-09-03 00:00:05.746
cmf37nqqk002iqz01au9m8au1	cmf35gyji000oqz012qoyhjou	BOOK_VIEWED	BOOK	a-gril-come-to-stanford	{"userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "accessLevel": "preview", "hasSubscription": true}	\N	\N	2025-09-03 00:00:08.732
cmf37nqsl002kqz015ygn7phs	cmf35gyji000oqz012qoyhjou	PDF_ACCESSED	BOOK	a-gril-come-to-stanford	{"filename": "sample.pdf", "userRole": "CUSTOMER", "accessReason": "sample_authenticated"}	\N	\N	2025-09-03 00:00:08.805
cmf37nqxa002mqz01z3mevb5h	cmf35gyji000oqz012qoyhjou	PDF_ACCESSED	BOOK	a-gril-come-to-stanford	{"filename": "sample.pdf", "userRole": "CUSTOMER", "accessReason": "sample_authenticated"}	\N	\N	2025-09-03 00:00:08.974
cmf37q3fc002qqz01f7q4fbh7	cmf35gyji000oqz012qoyhjou	BOOK_VIEWED	BOOK	a-gril-come-to-stanford	{"userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "accessLevel": "preview", "hasSubscription": true}	\N	\N	2025-09-03 00:01:58.489
cmf37s2k0002uqz01dpc45evm	cmf35gyji000oqz012qoyhjou	BOOK_VIEWED	BOOK	a-gril-come-to-stanford	{"userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "accessLevel": "preview", "hasSubscription": true}	\N	\N	2025-09-03 00:03:30.672
cmf37z3ue0030qz01xnk03e30	cmf35gyji000oqz012qoyhjou	BOOK_VIEWED	BOOK	check-point-eng	{"userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "accessLevel": "preview", "hasSubscription": true}	\N	\N	2025-09-03 00:08:58.935
cmf37z4nh0034qz01a2dhq5mb	cmf35gyji000oqz012qoyhjou	BOOK_VIEWED	BOOK	check-point-eng	{"userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "accessLevel": "preview", "hasSubscription": true}	\N	\N	2025-09-03 00:08:59.982
cmf37z56a0036qz015tn3ujlu	cmf35gyji000oqz012qoyhjou	PDF_ACCESSED	BOOK	check-point-eng	{"filename": "sample.pdf", "userRole": "CUSTOMER", "accessReason": "sample_authenticated"}	\N	\N	2025-09-03 00:09:00.659
cmf37z59k0038qz01mypc50a7	cmf35gyji000oqz012qoyhjou	PDF_ACCESSED	BOOK	check-point-eng	{"filename": "sample.pdf", "userRole": "CUSTOMER", "accessReason": "sample_authenticated"}	\N	\N	2025-09-03 00:09:00.777
cmf37zbds003eqz0120hbg137	cmf35gyji000oqz012qoyhjou	BOOK_VIEWED	BOOK	girl-with-a-hope-eng	{"userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "accessLevel": "preview", "hasSubscription": true}	\N	\N	2025-09-03 00:09:08.704
cmf37zc8p003iqz01exsivjdw	cmf35gyji000oqz012qoyhjou	BOOK_VIEWED	BOOK	girl-with-a-hope-eng	{"userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "accessLevel": "preview", "hasSubscription": true}	\N	\N	2025-09-03 00:09:09.817
cmf37zcak003kqz017l9un839	cmf35gyji000oqz012qoyhjou	PDF_ACCESSED	BOOK	girl-with-a-hope-eng	{"filename": "sample.pdf", "userRole": "CUSTOMER", "accessReason": "sample_authenticated"}	\N	\N	2025-09-03 00:09:09.884
cmf37zchb003mqz01gici8q5r	cmf35gyji000oqz012qoyhjou	PDF_ACCESSED	BOOK	girl-with-a-hope-eng	{"filename": "sample.pdf", "userRole": "CUSTOMER", "accessReason": "sample_authenticated"}	\N	\N	2025-09-03 00:09:10.127
cmf37zgoa003sqz018bfxo9hc	cmf35gyji000oqz012qoyhjou	BOOK_VIEWED	BOOK	kakama-01	{"userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "accessLevel": "preview", "hasSubscription": true}	\N	\N	2025-09-03 00:09:15.562
cmf37zhfn003wqz01vhexumtc	cmf35gyji000oqz012qoyhjou	BOOK_VIEWED	BOOK	kakama-01	{"userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "accessLevel": "preview", "hasSubscription": true}	\N	\N	2025-09-03 00:09:16.547
cmf37zhhk003yqz01mx9uh0nq	cmf35gyji000oqz012qoyhjou	PDF_ACCESSED	BOOK	kakama-01	{"filename": "sample.pdf", "userRole": "CUSTOMER", "accessReason": "sample_authenticated"}	\N	\N	2025-09-03 00:09:16.616
cmf37zhmr0040qz01aga3wpcm	cmf35gyji000oqz012qoyhjou	PDF_ACCESSED	BOOK	kakama-01	{"filename": "sample.pdf", "userRole": "CUSTOMER", "accessReason": "sample_authenticated"}	\N	\N	2025-09-03 00:09:16.804
cmf37zjyt0046qz01qdrbts3a	cmf35gyji000oqz012qoyhjou	BOOK_VIEWED	BOOK	check-point-eng	{"userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "accessLevel": "preview", "hasSubscription": true}	\N	\N	2025-09-03 00:09:19.829
cmf37zyte004aqz01cgx9olds	cmf35gyji000oqz012qoyhjou	BOOK_VIEWED	BOOK	check-point-eng	{"userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "accessLevel": "preview", "hasSubscription": true}	\N	\N	2025-09-03 00:09:39.074
cmf380wft004gqz0176dxr6fl	cmf35gyji000oqz012qoyhjou	BOOK_VIEWED	BOOK	girl-with-a-hope-eng	{"userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "accessLevel": "preview", "hasSubscription": true}	\N	\N	2025-09-03 00:10:22.649
cmf380x6e004kqz01hnnppor2	cmf35gyji000oqz012qoyhjou	BOOK_VIEWED	BOOK	girl-with-a-hope-eng	{"userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "accessLevel": "preview", "hasSubscription": true}	\N	\N	2025-09-03 00:10:23.607
cmf380x86004mqz01vug2s7yf	cmf35gyji000oqz012qoyhjou	PDF_ACCESSED	BOOK	girl-with-a-hope-eng	{"filename": "sample.pdf", "userRole": "CUSTOMER", "accessReason": "sample_authenticated"}	\N	\N	2025-09-03 00:10:23.67
cmf380xbd004oqz01r2mwfy21	cmf35gyji000oqz012qoyhjou	PDF_ACCESSED	BOOK	girl-with-a-hope-eng	{"filename": "sample.pdf", "userRole": "CUSTOMER", "accessReason": "sample_authenticated"}	\N	\N	2025-09-03 00:10:23.785
cmf3810jv004yqz01xhhhcx8v	cmf35gyji000oqz012qoyhjou	BOOK_VIEWED	BOOK	kakama-01	{"userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "accessLevel": "preview", "hasSubscription": true}	\N	\N	2025-09-03 00:10:27.979
cmf380zl9004uqz01899k77sr	cmf35gyji000oqz012qoyhjou	BOOK_VIEWED	BOOK	kakama-01	{"userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "accessLevel": "preview", "hasSubscription": true}	\N	\N	2025-09-03 00:10:26.733
cmf3810m30050qz015lcf3zpp	cmf35gyji000oqz012qoyhjou	PDF_ACCESSED	BOOK	kakama-01	{"filename": "sample.pdf", "userRole": "CUSTOMER", "accessReason": "sample_authenticated"}	\N	\N	2025-09-03 00:10:28.059
cmf3810r20052qz019oss3q1m	cmf35gyji000oqz012qoyhjou	PDF_ACCESSED	BOOK	kakama-01	{"filename": "sample.pdf", "userRole": "CUSTOMER", "accessReason": "sample_authenticated"}	\N	\N	2025-09-03 00:10:28.238
cmf382l0k0058qz01o8xvr12j	cmf35gyji000oqz012qoyhjou	BOOK_VIEWED	BOOK	a-gril-come-to-stanford	{"userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "accessLevel": "preview", "hasSubscription": true}	\N	\N	2025-09-03 00:11:41.156
cmf385apg005cqz01050vbxu6	cmf35gyji000oqz012qoyhjou	BOOK_VIEWED	BOOK	a-gril-come-to-stanford	{"userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "accessLevel": "preview", "hasSubscription": true}	\N	\N	2025-09-03 00:13:47.765
cmf4l5bx8006iqz017xmh3nj3	cmf35gyji000oqz012qoyhjou	BOOK_VIEWED	BOOK	a-gril-come-to-stanford	{"userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "accessLevel": "preview", "hasSubscription": true}	\N	\N	2025-09-03 23:05:30.525
cmf4l678f006mqz016o81ivtf	cmf35gyji000oqz012qoyhjou	BOOK_VIEWED	BOOK	a-gril-come-to-stanford	{"userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "accessLevel": "preview", "hasSubscription": true}	\N	\N	2025-09-03 23:06:11.104
cmf4l67r6006oqz011cujul5n	cmf35gyji000oqz012qoyhjou	PDF_ACCESSED	BOOK	a-gril-come-to-stanford	{"filename": "sample.pdf", "userRole": "CUSTOMER", "accessReason": "sample_authenticated"}	\N	\N	2025-09-03 23:06:11.778
cmf4l67uw006qqz01mimknsvi	cmf35gyji000oqz012qoyhjou	PDF_ACCESSED	BOOK	a-gril-come-to-stanford	{"filename": "sample.pdf", "userRole": "CUSTOMER", "accessReason": "sample_authenticated"}	\N	\N	2025-09-03 23:06:11.912
cmf4l6npo006uqz01bfyybr6o	cmf35gyji000oqz012qoyhjou	BOOK_VIEWED	BOOK	a-gril-come-to-stanford	{"userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "accessLevel": "preview", "hasSubscription": true}	\N	\N	2025-09-03 23:06:32.461
cmf4l9c9p0072qz01sp2skz9f	cmf35gyji000oqz012qoyhjou	BOOK_VIEWED	BOOK	a-gril-come-to-stanford	{"userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "accessLevel": "preview", "hasSubscription": true}	\N	\N	2025-09-03 23:08:37.598
cmf4lacjt0076qz018uy0i68w	cmf35gyji000oqz012qoyhjou	BOOK_VIEWED	BOOK	a-gril-come-to-stanford	{"userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "accessLevel": "preview", "hasSubscription": true}	\N	\N	2025-09-03 23:09:24.617
cmf4ywd9c009sqz01d6k1oivi	cmemf40cp0000nwezg7b57ke0	BOOK_VIEWED	BOOK	check-point-eng	{"userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", "accessLevel": "preview", "hasSubscription": true}	\N	\N	2025-09-04 05:30:26.976
\.


--
-- Data for Name: anonymization_logs; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.anonymization_logs (id, "tableName", "recordId", "anonymizedFields", "retainedFields", "anonymizationMethod", "retentionReason", "retentionPeriod", "legalBasis", "processedBy", "processingJobId", "verificationHash", reversible, "createdAt") FROM stdin;
\.


--
-- Data for Name: assignments; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.assignments (id, "classId", title, description, type, "dueDate", points, resources, requirements, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: bookmarks; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.bookmarks (id, "userId", "storyId", "chapterId", "position", note, color, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: books; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.books (id, title, subtitle, summary, "authorName", "authorAlias", "authorAge", "authorLocation", "coAuthors", language, "ageRange", "readingLevel", category, genres, subjects, tags, "coverImage", "pdfKey", "pdfFrontCover", "pdfBackCover", "pageLayout", "pageCount", "previewPages", drm, "downloadAllowed", "printAllowed", "isPublished", "publishedAt", featured, "isPremium", price, currency, visibility, "viewCount", "downloadCount", rating, "createdAt", "updatedAt", thumbnails, "thumbnailConfig", "thumbnailGeneratedAt") FROM stdin;
a-gril-come-to-stanford	A Girl Comes to Stanford	\N	A young girl journey to Stanford University, pursuing her dreams of education and making a difference in the world.	Young Author	\N	\N	\N	\N	en	\N	\N	\N	\N	\N	\N	/books/a-gril-come-to-stanford/cover.png	/books/a-gril-come-to-stanford/main.pdf	/books/a-gril-come-to-stanford/front.pdf	/books/a-gril-come-to-stanford/back.pdf	single	50	10	\N	f	f	t	\N	f	t	\N	USD	PUBLIC	0	0	\N	2025-09-01 00:42:05.133	2025-09-01 00:42:05.133	{"page_1": "/books/a-gril-come-to-stanford/thumbnails/page_1.jpg", "page_2": "/books/a-gril-come-to-stanford/thumbnails/page_2.jpg"}	\N	\N
check-point-eng	Check Point	\N	A story about overcoming life challenges and reaching important milestones in personal growth.	Community Author	\N	\N	\N	\N	en	\N	\N	\N	\N	\N	\N	/books/check-point-eng/cover.png	/books/check-point-eng/main.pdf	/books/check-point-eng/front.pdf	/books/check-point-eng/back.pdf	single	45	10	\N	f	f	t	\N	f	t	\N	USD	PUBLIC	0	0	\N	2025-09-01 00:42:05.133	2025-09-01 00:42:05.133	{"page_1": "/books/check-point-eng/thumbnails/page_1.jpg", "page_2": "/books/check-point-eng/thumbnails/page_2.jpg"}	\N	\N
girl-with-a-hope-eng	Girl with a Hope	\N	An inspiring story of a young girl who never gives up on her dreams despite facing numerous challenges.	Seeds of Empowerment	\N	\N	\N	\N	en	\N	\N	\N	\N	\N	\N	/books/girl-with-a-hope-eng/cover.png	/books/girl-with-a-hope-eng/main.pdf	/books/girl-with-a-hope-eng/front.pdf	/books/girl-with-a-hope-eng/back.pdf	single	60	10	\N	f	f	t	\N	f	t	\N	USD	PUBLIC	0	0	\N	2025-09-01 00:42:05.133	2025-09-01 00:42:05.133	{"page_1": "/books/girl-with-a-hope-eng/thumbnails/page_1.jpg", "page_2": "/books/girl-with-a-hope-eng/thumbnails/page_2.jpg"}	\N	\N
kakama-01	Kakama Story - Part 1	\N	The beginning of Kakama adventures, a tale of courage and friendship in an African village.	Village Storyteller	\N	\N	\N	\N	en	\N	\N	\N	\N	\N	\N	/books/kakama-01/cover.png	/books/kakama-01/main.pdf	/books/kakama-01/front.pdf	/books/kakama-01/back.pdf	single	40	10	\N	f	f	t	\N	f	t	\N	USD	PUBLIC	0	0	\N	2025-09-01 00:42:05.133	2025-09-01 00:42:05.133	{"page_1": "/books/kakama-01/thumbnails/page_1.jpg", "page_2": "/books/kakama-01/thumbnails/page_2.jpg"}	\N	\N
\.


--
-- Data for Name: budget_items; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.budget_items (id, "budgetId", category, description, amount, spent, vendor, "approvedBy", "approvedAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: budgets; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.budgets (id, "schoolId", year, "totalBudget", "allocatedBudget", "spentBudget", categories, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: bulk_imports; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.bulk_imports (id, filename, "originalName", "fileUrl", type, status, "totalRows", "processedRows", "successfulRows", "errorRows", errors, summary, "uploadedById", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: campaign_updates; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.campaign_updates (id, "campaignId", title, content, images, "createdAt") FROM stdin;
\.


--
-- Data for Name: cart_items; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.cart_items (id, "cartId", "productId", "variantId", quantity, price, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: carts; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.carts (id, "userId", "sessionId", "expiresAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.categories (id, name, slug, description, "parentId", image, "order", "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: chapters; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.chapters (id, "storyId", "chapterNumber", title, content, "audioUrl", illustrations, "readingTime", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: class_announcements; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.class_announcements (id, "classId", title, content, priority, "createdAt") FROM stdin;
\.


--
-- Data for Name: class_enrollments; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.class_enrollments (id, "classId", "studentId", "enrolledAt", status, grade, attendance, progress) FROM stdin;
\.


--
-- Data for Name: class_resources; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.class_resources (id, "classId", title, description, type, url, size, "createdAt") FROM stdin;
\.


--
-- Data for Name: classes; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.classes (id, code, name, description, "teacherId", "schoolId", subject, "gradeLevel", schedule, "startDate", "endDate", "maxStudents", "isActive", settings, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: deletion_audit_logs; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.deletion_audit_logs (id, "deletionRequestId", action, "performedBy", "performedByRole", "performedByType", "tableName", "recordId", "recordCount", "previousStatus", "newStatus", "actionDetails", metadata, "ipAddress", "userAgent", "sessionId", "dataAnonymized", "anonymizedFields", "dataBackedUp", "backupLocation", "createdAt") FROM stdin;
\.


--
-- Data for Name: donation_campaigns; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.donation_campaigns (id, title, description, goal, raised, currency, "startDate", "endDate", category, beneficiary, "impactStatement", images, "videoUrl", status, featured, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: donations; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.donations (id, "donorId", "campaignId", amount, currency, type, "paymentMethod", "stripePaymentId", anonymous, "donorName", "donorEmail", message, "taxDeductible", "receiptUrl", status, "createdAt") FROM stdin;
cmenjw7600004k191926bl1x2	cmenjw74b0000k19182zkycdb	\N	50.00	USD	ONE_TIME	\N	\N	f	Anonymous Donor	donor@example.com	Keep up the great work!	t	\N	COMPLETED	2025-08-23 00:58:19.848
\.


--
-- Data for Name: entitlements; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.entitlements (id, "userId", email, "bookId", "storyId", "orderId", "subscriptionId", "licenseId", "grantReason", type, scope, "grantedAt", "expiresAt", "isActive", "activatedAt", "lastAccessedAt", "accessCount", "downloadCount", "maxDownloads", "ipRestrictions", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: feature_usage; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.feature_usage (id, "userId", "sessionId", "featureName", "featureCategory", "accessCount", "totalTimeSpent", "avgTimePerAccess", "lastAccessed", "userRole", "deviceType", "taskCompleted", "errorEncountered", "helpSought", "createdAt", "updatedAt") FROM stdin;
cmf37z2p3002wqz01td8e04o9	cmf35gyji000oqz012qoyhjou	pmzkqtz0l5buc14y4hhau9mf367npb	library_access	content	23	0	0	2025-09-03 00:16:53.92	CUSTOMER	desktop	f	f	f	2025-09-03 00:08:57.441	2025-09-03 00:16:53.922
cmf3daigg005sqz01bavjyhxj	cmemeo50u0000nw66n5s79pkr	xa54wzhgx9hjm8kjsz183dmf3da3tw	admin_access	admin	2	0	0	2025-09-03 02:38:08.963	ADMIN	desktop	f	f	f	2025-09-03 02:37:49.164	2025-09-03 02:38:08.964
cmf1rv8h80001qz01n1xy6tr6	cmemeo50u0000nw66n5s79pkr	v4c32tnkaxue87bkkifjgmf1rv3z2	admin_access	admin	11	0	0	2025-09-02 00:39:23.989	ADMIN	desktop	f	f	f	2025-09-01 23:50:18.271	2025-09-02 00:39:23.992
cmf36yi06000yqz01d5gp7j1n	cmf35gyji000oqz012qoyhjou	ft6d2ak70esq7j1yudkksfmf36w5wx	library_access	content	22	0	0	2025-09-03 00:03:30.652	CUSTOMER	desktop	f	f	f	2025-09-02 23:40:30.994	2025-09-03 00:03:30.653
cmf4l42f30066qz01a8jq9whj	cmf35gyji000oqz012qoyhjou	5qxihaybwluvals1io7pqmf4l2qdv	library_access	content	19	0	0	2025-09-03 23:32:54.971	CUSTOMER	desktop	f	f	f	2025-09-03 23:04:31.551	2025-09-03 23:32:54.974
cmf4lwo5t0078qz01o6693ost	cmf35gyji000oqz012qoyhjou	5qxihaybwluvals1io7pqmf4l2qdv	dashboard_access	navigation	21	0	0	2025-09-03 23:35:58.338	CUSTOMER	desktop	f	f	f	2025-09-03 23:26:46.097	2025-09-03 23:35:58.339
cmf4ocpe00092qz011m7inyz7	cmemeo50u0000nw66n5s79pkr	khv3rqu2cubnlbp7807qbmf4ocncb	admin_access	admin	1	0	0	2025-09-04 00:35:13.383	ADMIN	desktop	f	f	f	2025-09-04 00:35:13.392	2025-09-04 00:35:13.392
cmf4xtxrb009kqz017vtyyx81	cmemf40cp0000nwezg7b57ke0	khv3rqu2cubnlbp7807qbmf4ocncb	dashboard_access	navigation	2	0	0	2025-09-04 05:16:02.544	LEARNER	desktop	f	f	f	2025-09-04 05:00:33.959	2025-09-04 05:16:02.545
cmf4ydwlb009oqz01qt2v7v2n	cmemf40cp0000nwezg7b57ke0	khv3rqu2cubnlbp7807qbmf4ocncb	library_access	content	2	0	0	2025-09-04 05:30:26.951	LEARNER	desktop	f	f	f	2025-09-04 05:16:05.567	2025-09-04 05:30:26.952
cmf66wj2c009uqz01maqctlz1	cmemf40cp0000nwezg7b57ke0	mix2otkki1ool0gn1r8ot9mf66wdjr	dashboard_access	navigation	3	0	0	2025-09-05 02:02:24.623	LEARNER	desktop	f	f	f	2025-09-05 02:02:17.604	2025-09-05 02:02:24.625
\.


--
-- Data for Name: illustrations; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.illustrations (id, "storyId", "artistId", title, description, "fileUrl", "thumbnailUrl", "position", status, compensation, license, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: inventory; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.inventory (id, "productId", "variantId", quantity, reserved, location, "reorderPoint", "reorderQuantity", "updatedAt") FROM stdin;
\.


--
-- Data for Name: lesson_progress; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.lesson_progress (id, "lessonId", "studentId", "startedAt", "completedAt", "timeSpent", score) FROM stdin;
\.


--
-- Data for Name: lessons; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.lessons (id, "classId", "lessonNumber", title, objectives, content, resources, duration, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: media_files; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.media_files (id, filename, "originalName", "mimeType", size, url, "thumbnailUrl", "altText", description, width, height, format, folder, tags, "uploadedById", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: mentor_relations; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.mentor_relations (id, "mentorId", "menteeId", status, "startDate", "endDate", goals, progress, "meetingSchedule", "lastMeeting", "nextMeeting", "mentorNotes", "menteeNotes", "adminNotes", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: micro_surveys; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.micro_surveys (id, name, description, trigger, "targetPage", "targetRole", frequency, "displayType", "position", delay, questions, "startDate", "endDate", "isActive", impressions, "responseCount", "completionRate", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.notifications (id, "userId", type, title, message, data, read, "readAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: onboarding_activities; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.onboarding_activities (id, "progressId", "activityType", "contentId", "timeSpent", "isCompleted", "interactionData", "createdAt") FROM stdin;
\.


--
-- Data for Name: onboarding_progress; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.onboarding_progress (id, "userId", "currentStep", "completionRate", "samplesViewed", "tutorialCompleted", "lastActivity", "isCompleted", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.order_items (id, "orderId", "productId", "variantId", title, "variantTitle", quantity, price, total, "fulfillmentStatus", "createdAt") FROM stdin;
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.orders (id, "orderNumber", "userId", email, phone, subtotal, tax, shipping, discount, total, currency, status, "paymentStatus", "fulfillmentStatus", "paymentMethod", "stripePaymentId", "shippingAddress", "billingAddress", "shippingMethod", "trackingNumber", notes, tags, "createdAt", "updatedAt") FROM stdin;
cmenjw7650006k191hanqiei0	DEMO-ORDER-001	cmenjw74b0000k19182zkycdb	demo.author@1001stories.org	\N	25.00	2.50	0.00	0.00	27.50	USD	DELIVERED	PAID	FULFILLED	\N	\N	\N	\N	\N	\N	\N	\N	2025-08-23 00:58:19.853	2025-08-23 00:58:19.853
\.


--
-- Data for Name: product_images; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.product_images (id, "productId", url, alt, "position", "createdAt") FROM stdin;
\.


--
-- Data for Name: product_variants; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.product_variants (id, "productId", title, sku, price, "compareAtPrice", "inventoryQuantity", weight, attributes, "position", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.products (id, sku, type, title, description, price, "compareAtPrice", cost, currency, weight, status, featured, "creatorId", "creatorName", "creatorAge", "creatorLocation", "creatorStory", "categoryId", tags, "impactMetric", "impactValue", "digitalFileUrl", "downloadLimit", "metaTitle", "metaDescription", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.profiles (id, "userId", "firstName", "lastName", organization, bio, location, phone, "dateOfBirth", language, timezone, "teachingLevel", subjects, "studentCount", skills, availability, experience, "emailNotifications", "pushNotifications", newsletter, "createdAt", "updatedAt", "ageVerificationStatus", "coppaCompliant", "isMinor", "parentEmail", "parentName", "parentalConsentDate", "parentalConsentRequired", "parentalConsentStatus") FROM stdin;
cmemf40cq0001nwezbaec416g	cmemf40cp0000nwezg7b57ke0	\N	\N	\N	Demo account for learner role	\N	\N	\N	en	UTC	\N	\N	\N	\N	\N	\N	t	t	t	2025-08-22 05:56:40.01	2025-08-22 05:56:40.01	PENDING	f	f	\N	\N	\N	f	NOT_REQUIRED
cmemf40d60004nwez5635i4vu	cmemf40d60003nwezdy1jwqjg	\N	\N	\N	Demo account for teacher role	\N	\N	\N	en	UTC	\N	\N	\N	\N	\N	\N	t	t	t	2025-08-22 05:56:40.026	2025-08-22 05:56:40.026	PENDING	f	f	\N	\N	\N	f	NOT_REQUIRED
cmemf40dg0007nwez6s289z03	cmemf40dg0006nwez4hwp20qw	\N	\N	\N	Demo account for volunteer role	\N	\N	\N	en	UTC	\N	\N	\N	\N	\N	\N	t	t	t	2025-08-22 05:56:40.036	2025-08-22 05:56:40.036	PENDING	f	f	\N	\N	\N	f	NOT_REQUIRED
cmemf40dq000anwezlcy0slai	cmemf40dq0009nwezakrerszo	\N	\N	Demo School	Demo account for institution role	\N	\N	\N	en	UTC	\N	\N	\N	\N	\N	\N	t	t	t	2025-08-22 05:56:40.046	2025-08-22 05:56:40.046	PENDING	f	f	\N	\N	\N	f	NOT_REQUIRED
cmf35gyji000pqz01deio0zdf	cmf35gyji000oqz012qoyhjou	\N	\N		\N	\N	\N	1997-04-01 00:00:00	en	UTC	\N	\N	\N	\N	\N	\N	t	t	f	2025-09-02 22:58:53.022	2025-09-02 22:58:53.022	VERIFIED_ADULT	t	f	\N	\N	\N	f	NOT_REQUIRED
\.


--
-- Data for Name: publications; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.publications (id, "bookId", "storyId", "submissionId", visibility, "isPremium", "unlockPolicy", price, currency, version, changelog, status, "publishedAt", "publishedBy", featured, category, tags, "sortOrder", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: quest_assignments; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.quest_assignments (id, "questId", "volunteerId", "assignedAt", "startedAt", "completedAt", status, "hoursLogged", "progressPercent", "qualityScore", "volunteerNotes", "supervisorNotes", "finalFeedback", rating) FROM stdin;
\.


--
-- Data for Name: quest_reviews; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.quest_reviews (id, "questId", "reviewerId", "reviewerRole", rating, title, content, "difficultyRating", "clarityRating", "supportRating", "wouldRecommend", "improvementSuggestions", "createdAt") FROM stdin;
\.


--
-- Data for Name: quests; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.quests (id, title, description, type, category, difficulty, "requiredSkills", "requiredLanguages", "minimumLevel", "experienceRequired", "startDate", "endDate", duration, "isRecurring", "recurringPattern", timezone, "timeSlots", "maxVolunteers", "currentVolunteers", urgency, priority, "pointsReward", "additionalRewards", location, materials, "targetAudience", "expectedImpact", "creatorId", "createdByRole", "approvalRequired", "isApproved", "approvedById", "approvedAt", status, "isActive", "isFeatured", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: reading_lists; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.reading_lists (id, "userId", name, description, "isPublic", "storyIds", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: reading_progress; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.reading_progress (id, "userId", "storyId", "currentChapter", "currentPage", "currentPosition", "percentComplete", "totalReadingTime", "lastReadAt", "startedAt", "completedAt", notes, "isCompleted", "totalPages") FROM stdin;
\.


--
-- Data for Name: recurring_donations; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.recurring_donations (id, "donorId", amount, currency, frequency, "dayOfMonth", "stripeSubscriptionId", status, "startDate", "pausedAt", "cancelledAt", "totalContributed", "lastPaymentDate", "nextPaymentDate", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.reviews (id, "userId", "contentType", "contentId", rating, title, comment, helpful, verified, "createdAt") FROM stdin;
\.


--
-- Data for Name: role_migrations; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.role_migrations (id, "userId", "fromRole", "toRole", "migrationType", "migrationReason", "initiatedAt", "completedAt", status, "notificationSent", "userAcknowledged", "helpDocViewed", "supportContacted", "satisfactionRating", "feedbackProvided", "issuesReported", "preFeatureUsage", "postFeatureUsage", "adaptationPeriod", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: sample_content_access; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.sample_content_access (id, "userId", "storyId", "viewCount", "totalTimeSpent", "lastAccessed") FROM stdin;
\.


--
-- Data for Name: school_resources; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.school_resources (id, "schoolId", type, name, quantity, condition, location, "purchaseDate", value, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: school_volunteers; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.school_volunteers (id, "schoolId", "volunteerId", role, "startDate", "endDate", "isActive", "createdAt") FROM stdin;
\.


--
-- Data for Name: schools; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.schools (id, name, type, address, country, phone, email, website, "principalName", "studentCount", "teacherCount", "establishedYear", accreditation, "partneredAt", status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.sessions (id, "sessionToken", "userId", expires) FROM stdin;
\.


--
-- Data for Name: shop_products; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.shop_products (id, sku, type, title, description, "shortDescription", price, "compareAtPrice", currency, "bookId", "storyId", "downloadLimit", "accessDuration", "bundleItems", "bundleDiscount", category, tags, featured, images, "thumbnailUrl", "demoUrl", "creatorName", "creatorAge", "creatorLocation", "creatorStory", "impactMetric", "impactValue", status, "availableFrom", "availableUntil", "maxQuantity", "metaTitle", "metaDescription", "marketingTags", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: stories; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.stories (id, isbn, title, subtitle, content, summary, "authorId", "authorName", "coAuthors", "authorAge", "authorLocation", "illustratorId", "publishedDate", publisher, language, "pageCount", "readingLevel", "readingTime", category, genres, subjects, tags, "coverImage", illustrations, "samplePdf", "fullPdf", "epubFile", "audioFile", "isPremium", "isPublished", featured, price, "viewCount", "likeCount", rating, "createdAt", "updatedAt") FROM stdin;
a-gril-come-to-stanford	\N	A Girl Comes to Stanford	\N	A story about a young girl journey to Stanford University.	A young girl journey to Stanford University, pursuing her dreams of education and making a difference in the world.	cmenjw74b0000k19182zkycdb	Young Author	\N	\N	\N	\N	\N	\N	en	50	\N	\N	\N	\N	\N	\N	/books/a-gril-come-to-stanford/cover.png	\N	/books/a-gril-come-to-stanford/front.pdf	/books/a-gril-come-to-stanford/main.pdf	\N	\N	t	t	f	\N	29	0	\N	2025-09-01 00:49:20.795	2025-09-03 23:09:24.613
check-point-eng	\N	Check Point	\N	A story about overcoming challenges and reaching milestones.	A story about overcoming life challenges and reaching important milestones in personal growth.	cmenjw74b0000k19182zkycdb	Community Author	\N	\N	\N	\N	\N	\N	en	45	\N	\N	\N	\N	\N	\N	/books/check-point-eng/cover.png	\N	/books/check-point-eng/sample.pdf	/books/check-point-eng/main.pdf	\N	\N	t	t	f	\N	11	0	\N	2025-09-01 00:49:20.795	2025-09-04 05:30:26.972
girl-with-a-hope-eng	\N	Girl with a Hope	\N	An inspiring story of hope and perseverance.	An inspiring story of a young girl who never gives up on her dreams despite facing numerous challenges.	cmenjw74b0000k19182zkycdb	Seeds of Empowerment	\N	\N	\N	\N	\N	\N	en	60	\N	\N	\N	\N	\N	\N	/books/girl-with-a-hope-eng/cover.png	\N	/books/girl-with-a-hope-eng/sample.pdf	/books/girl-with-a-hope-eng/main.pdf	\N	\N	t	t	f	\N	6	0	\N	2025-09-01 00:49:20.795	2025-09-03 00:10:23.603
kakama-01	\N	Kakama Story - Part 1	\N	The adventures of Kakama in an African village.	The beginning of Kakama adventures, a tale of courage and friendship in an African village.	cmenjw74b0000k19182zkycdb	Village Storyteller	\N	\N	\N	\N	\N	\N	en	40	\N	\N	\N	\N	\N	\N	/books/kakama-01/cover.png	\N	/books/kakama-01/front.pdf	/books/kakama-01/main.pdf	\N	\N	t	t	f	\N	5	0	\N	2025-09-01 00:49:20.795	2025-09-03 00:10:27.964
\.


--
-- Data for Name: story_submissions; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.story_submissions (id, "authorId", title, content, language, category, "ageGroup", status, "reviewerId", "reviewNotes", "editorialNotes", "publishDate", compensation, "createdAt", "updatedAt", "assigneeId", attachments, "coverImageId", "dueDate", priority, summary, tags) FROM stdin;
\.


--
-- Data for Name: submissions; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.submissions (id, "assignmentId", "studentId", "submittedAt", content, attachments, grade, feedback, status) FROM stdin;
\.


--
-- Data for Name: subscriptions; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.subscriptions (id, "userId", plan, status, "startDate", "endDate", "cancelledAt", "stripeCustomerId", "stripeSubscriptionId", "stripePriceId", "maxStudents", "maxDownloads", "canAccessPremium", "canDownloadPDF", "canCreateClasses", "unlimitedReading", "createdAt", "updatedAt") FROM stdin;
cmemf40cq0002nwezd1x7k1om	cmemf40cp0000nwezg7b57ke0	FREE	ACTIVE	2025-08-22 05:56:40.008	2026-08-22 05:56:40.008	\N	\N	\N	\N	30	10	f	f	f	f	2025-08-22 05:56:40.01	2025-08-22 05:56:40.01
cmemf40d60005nwez1e6gj2iu	cmemf40d60003nwezdy1jwqjg	PREMIUM	ACTIVE	2025-08-22 05:56:40.025	2026-08-22 05:56:40.025	\N	\N	\N	\N	100	999	t	t	t	f	2025-08-22 05:56:40.026	2025-08-22 05:56:40.026
cmemf40dg0008nwez0xry1zd8	cmemf40dg0006nwez4hwp20qw	FREE	ACTIVE	2025-08-22 05:56:40.035	2026-08-22 05:56:40.035	\N	\N	\N	\N	30	10	t	t	f	f	2025-08-22 05:56:40.036	2025-08-22 05:56:40.036
cmemf40dq000bnwezw5wyof5x	cmemf40dq0009nwezakrerszo	PREMIUM	ACTIVE	2025-08-22 05:56:40.045	2026-08-22 05:56:40.045	\N	\N	\N	\N	30	10	t	t	t	f	2025-08-22 05:56:40.046	2025-08-22 05:56:40.046
cmf35gyji000qqz016dzbjt45	cmf35gyji000oqz012qoyhjou	FREE	ACTIVE	2025-09-02 22:58:53.022	\N	\N	\N	\N	\N	30	10	f	f	f	f	2025-09-02 22:58:53.022	2025-09-02 22:58:53.022
\.


--
-- Data for Name: survey_responses; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.survey_responses (id, "surveyId", "userId", "sessionId", answers, "completionTime", "isComplete", "userRole", page, "userAgent", "createdAt") FROM stdin;
\.


--
-- Data for Name: translations; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.translations (id, "storyId", "translatorId", "fromLanguage", "toLanguage", title, content, status, "qualityScore", "reviewerId", "reviewNotes", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: user_analytics; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.user_analytics (id, "userId", "sessionId", "userRole", "isNewUser", "migrationDate", "sessionStart", "sessionEnd", "totalDuration", "pageViews", "clickCount", "scrollDepth", "landingPage", "exitPage", "pageSequence", "featuresUsed", "actionsPerformed", "errorsEncountered", "userAgent", "deviceType", "browserName", "operatingSystem", "screenResolution", "engagementScore", "bounceRate", "returnVisitor", "createdAt", "updatedAt") FROM stdin;
cmf1ttp8r000nqz01u9yycq7e	cmemeo50u0000nw66n5s79pkr	v4c32tnkaxue87bkkifjgmf1rv3z2	ADMIN	f	\N	2025-09-01 23:50:12.445	2025-09-02 00:45:05.943	3293	14	27	100	/dashboard	/	[{"page": "/dashboard", "timeSpent": 14, "timestamp": 1756770612446}, {"page": "/dashboard", "timeSpent": 5775, "timestamp": 1756770612460}, {"page": "/admin", "timeSpent": 6478, "timestamp": 1756770618235}, {"page": "/admin/stories", "timeSpent": 31278, "timestamp": 1756770624713}, {"page": "/admin/stories/new", "timeSpent": 1491, "timestamp": 1756773510771}, {"page": "/admin/stories/bulk-import", "timeSpent": 871, "timestamp": 1756773512262}, {"page": "/admin/stories/new", "timeSpent": 3852, "timestamp": 1756773513133}, {"page": "/admin/stories/bulk-import", "timeSpent": 1967, "timestamp": 1756773516985}, {"page": "/admin/users", "timeSpent": 27009, "timestamp": 1756773518952}, {"page": "/admin/analytics", "timeSpent": 5351, "timestamp": 1756773545961}, {"page": "/admin/media", "timeSpent": 1665, "timestamp": 1756773551312}, {"page": "/admin/settings", "timeSpent": 11017, "timestamp": 1756773552977}, {"page": "/admin", "timeSpent": 1119, "timestamp": 1756773563994}, {"page": "/", "timeSpent": 14452, "timestamp": 1756773565113}]	{dashboard_access,admin_access}	[{"data": {"page": "/dashboard"}, "page": "/dashboard", "action": "page_view", "timestamp": 1756770612446}, {"data": {"page": "/dashboard"}, "page": "/dashboard", "action": "page_view", "timestamp": 1756770612460}, {"data": {"feature": "dashboard_access", "category": "navigation"}, "page": "/dashboard", "action": "feature_used", "timestamp": 1756770612460}, {"data": {"page": "/admin"}, "page": "/admin", "action": "page_view", "timestamp": 1756770618235}, {"data": {"feature": "admin_access", "category": "admin"}, "page": "/admin", "action": "feature_used", "timestamp": 1756770618235}, {"data": {"page": "/admin/stories"}, "page": "/admin/stories", "action": "page_view", "timestamp": 1756770624713}, {"data": {"feature": "admin_access", "category": "admin"}, "page": "/admin/stories", "action": "feature_used", "timestamp": 1756770624713}, {"data": {"page": "/admin/stories/new"}, "page": "/admin/stories/new", "action": "page_view", "timestamp": 1756773510771}, {"data": {"feature": "admin_access", "category": "admin"}, "page": "/admin/stories/new", "action": "feature_used", "timestamp": 1756773510771}, {"data": {"page": "/admin/stories/bulk-import"}, "page": "/admin/stories/bulk-import", "action": "page_view", "timestamp": 1756773512262}, {"data": {"feature": "admin_access", "category": "admin"}, "page": "/admin/stories/bulk-import", "action": "feature_used", "timestamp": 1756773512262}, {"data": {"page": "/admin/stories/new"}, "page": "/admin/stories/new", "action": "page_view", "timestamp": 1756773513133}, {"data": {"feature": "admin_access", "category": "admin"}, "page": "/admin/stories/new", "action": "feature_used", "timestamp": 1756773513133}, {"data": {"page": "/admin/stories/bulk-import"}, "page": "/admin/stories/bulk-import", "action": "page_view", "timestamp": 1756773516985}, {"data": {"feature": "admin_access", "category": "admin"}, "page": "/admin/stories/bulk-import", "action": "feature_used", "timestamp": 1756773516985}, {"data": {"page": "/admin/users"}, "page": "/admin/users", "action": "page_view", "timestamp": 1756773518952}, {"data": {"feature": "admin_access", "category": "admin"}, "page": "/admin/users", "action": "feature_used", "timestamp": 1756773518952}, {"data": {"error": "t.className.split is not a function"}, "page": "/admin/users", "action": "error_encountered", "timestamp": 1756773524653}, {"data": {"page": "/admin/analytics"}, "page": "/admin/analytics", "action": "page_view", "timestamp": 1756773545961}, {"data": {"feature": "admin_access", "category": "admin"}, "page": "/admin/analytics", "action": "feature_used", "timestamp": 1756773545961}, {"data": {"page": "/admin/media"}, "page": "/admin/media", "action": "page_view", "timestamp": 1756773551312}, {"data": {"feature": "admin_access", "category": "admin"}, "page": "/admin/media", "action": "feature_used", "timestamp": 1756773551312}, {"data": {"page": "/admin/settings"}, "page": "/admin/settings", "action": "page_view", "timestamp": 1756773552977}, {"data": {"feature": "admin_access", "category": "admin"}, "page": "/admin/settings", "action": "feature_used", "timestamp": 1756773552977}, {"data": {"page": "/admin"}, "page": "/admin", "action": "page_view", "timestamp": 1756773563994}, {"data": {"feature": "admin_access", "category": "admin"}, "page": "/admin", "action": "feature_used", "timestamp": 1756773563994}, {"data": {"page": "/"}, "page": "/", "action": "page_view", "timestamp": 1756773565113}]	{"t.className.split is not a function"}	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	desktop	Chrome	macOS	1470x956	78	f	t	2025-09-02 00:45:05.931	2025-09-02 00:45:05.931
cmf36racf000sqz01fkob4ic3	cmf35gyji000oqz012qoyhjou	pmzkqtz0l5buc14y4hhau9mf367npb	CUSTOMER	f	\N	2025-09-02 23:19:38.686	2025-09-02 23:35:12.427	17	2	0	0	/demo	/demo/institution	[{"page": "/demo/institution", "timeSpent": 73, "timestamp": 1756856094560}, {"page": "/demo/institution", "timeSpent": 17794, "timestamp": 1756856094633}]	{}	[{"data": {"page": "/demo/institution"}, "page": "/demo/institution", "action": "page_view", "timestamp": 1756856094560}, {"data": {"page": "/demo/institution"}, "page": "/demo/institution", "action": "page_view", "timestamp": 1756856094633}]	{}	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	desktop	Chrome	macOS	1920x1080	6	t	t	2025-09-02 23:34:54.495	2025-09-02 23:35:12.736
cmf36w6st000wqz01nrcqiand	cmf35gyji000oqz012qoyhjou	wlrdyu6robpnh3kuyytainmf367zvp	CUSTOMER	f	\N	2025-09-02 23:19:54.469	2025-09-02 23:38:43.002	1128	2	24	100	/demo/learner	/demo/learner	[{"page": "/demo/learner", "timeSpent": 105, "timestamp": 1756855194483}, {"page": "/demo/learner", "timeSpent": 883, "timestamp": 1756855194588}]	{}	[{"data": {"page": "/demo/learner"}, "page": "/demo/learner", "action": "page_view", "timestamp": 1756855194483}, {"data": {"page": "/demo/learner"}, "page": "/demo/learner", "action": "page_view", "timestamp": 1756855194588}]	{}	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	desktop	Chrome	macOS	1440x932	33	t	t	2025-09-02 23:38:43.181	2025-09-02 23:38:43.181
cmf3dbsuu005wqz01pzi8gmp5	cmemeo50u0000nw66n5s79pkr	xa54wzhgx9hjm8kjsz183dmf3da3tw	ADMIN	f	\N	2025-09-03 02:37:30.212	2025-09-03 02:38:55.801	5	2	2	72.45370370370371	/dashboard	/admin/users	[{"page": "/admin/users", "timeSpent": 13, "timestamp": 1756867129848}, {"page": "/admin/users", "timeSpent": 5940, "timestamp": 1756867129861}]	{admin_access}	[{"data": {"page": "/admin/users"}, "page": "/admin/users", "action": "page_view", "timestamp": 1756867129848}, {"data": {"page": "/admin/users"}, "page": "/admin/users", "action": "page_view", "timestamp": 1756867129861}, {"data": {"feature": "admin_access", "category": "admin"}, "page": "/admin/users", "action": "feature_used", "timestamp": 1756867129861}, {"data": {"error": "t.className.split is not a function"}, "page": "/admin/users", "action": "error_encountered", "timestamp": 1756867133350}]	{"t.className.split is not a function"}	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	desktop	Chrome	macOS	1470x956	21	t	t	2025-09-03 02:38:49.302	2025-09-03 02:38:55.677
cmf3ew63g0060qz01g3kam09b	cmf35gyji000oqz012qoyhjou	ft6d2ak70esq7j1yudkksfmf36w5wx	CUSTOMER	f	\N	2025-09-02 23:38:42.032	2025-09-03 03:22:39.097	13437	30	191	100	/signup	/shop/checkout	[{"page": "/signup", "timeSpent": 29, "timestamp": 1756856322033}, {"page": "/signup", "timeSpent": 62480, "timestamp": 1756856322062}, {"page": "/", "timeSpent": 45220, "timestamp": 1756856385507}, {"page": "/library", "timeSpent": 29228, "timestamp": 1756856430727}, {"page": "/library/orders", "timeSpent": 1872, "timestamp": 1756856459955}, {"page": "/library", "timeSpent": 522850, "timestamp": 1756856461827}, {"page": "/library/orders", "timeSpent": 76699, "timestamp": 1756856984677}, {"page": "/library", "timeSpent": 2449, "timestamp": 1756857061376}, {"page": "/library/orders", "timeSpent": 12548, "timestamp": 1756857063825}, {"page": "/shop", "timeSpent": 7276, "timestamp": 1756857076373}, {"page": "/library/orders", "timeSpent": 40817, "timestamp": 1756857083649}, {"page": "/shop", "timeSpent": 7433, "timestamp": 1756857124466}, {"page": "/library/orders", "timeSpent": 130035, "timestamp": 1756857131899}, {"page": "/library", "timeSpent": 210895, "timestamp": 1756857261934}, {"page": "/library/books/a-gril-come-to-stanford", "timeSpent": 18019, "timestamp": 1756857472829}, {"page": "/library", "timeSpent": 1387, "timestamp": 1756857490848}, {"page": "/library/books/a-gril-come-to-stanford", "timeSpent": 80186, "timestamp": 1756857492235}, {"page": "/library", "timeSpent": 2428, "timestamp": 1756857572421}, {"page": "/library/books/check-point-eng", "timeSpent": 1563, "timestamp": 1756857574849}, {"page": "/library", "timeSpent": 16685, "timestamp": 1756857576412}, {"page": "/library/books/a-gril-come-to-stanford", "timeSpent": 1500, "timestamp": 1756857593097}, {"page": "/library/stories/a-gril-come-to-stanford", "timeSpent": 8977, "timestamp": 1756857594597}, {"page": "/library", "timeSpent": 1950, "timestamp": 1756857603574}, {"page": "/library/books/a-gril-come-to-stanford", "timeSpent": 3009, "timestamp": 1756857605524}, {"page": "/library/stories/a-gril-come-to-stanford", "timeSpent": 9016, "timestamp": 1756857608533}, {"page": "/library/books/a-gril-come-to-stanford", "timeSpent": 88238, "timestamp": 1756857718175}, {"page": "/shop/cart", "timeSpent": 3889, "timestamp": 1756857806413}, {"page": "/library/books/a-gril-come-to-stanford", "timeSpent": 2162, "timestamp": 1756857810302}, {"page": "/shop/cart", "timeSpent": 170970, "timestamp": 1756857812464}, {"page": "/shop/checkout", "timeSpent": 168871, "timestamp": 1756857983434}]	{library_access}	[{"data": {"page": "/signup"}, "page": "/signup", "action": "page_view", "timestamp": 1756856322033}, {"data": {"page": "/signup"}, "page": "/signup", "action": "page_view", "timestamp": 1756856322062}, {"data": {"page": "/"}, "page": "/", "action": "page_view", "timestamp": 1756856385507}, {"data": {"page": "/library"}, "page": "/library", "action": "page_view", "timestamp": 1756856430727}, {"data": {"feature": "library_access", "category": "content"}, "page": "/library", "action": "feature_used", "timestamp": 1756856430727}, {"data": {"error": "t.className.split is not a function"}, "page": "/library", "action": "error_encountered", "timestamp": 1756856459749}, {"data": {"page": "/library/orders"}, "page": "/library/orders", "action": "page_view", "timestamp": 1756856459955}, {"data": {"feature": "library_access", "category": "content"}, "page": "/library/orders", "action": "feature_used", "timestamp": 1756856459955}, {"data": {"page": "/library"}, "page": "/library", "action": "page_view", "timestamp": 1756856461827}, {"data": {"feature": "library_access", "category": "content"}, "page": "/library", "action": "feature_used", "timestamp": 1756856461827}, {"data": {"page": "/library/orders"}, "page": "/library/orders", "action": "page_view", "timestamp": 1756856984677}, {"data": {"feature": "library_access", "category": "content"}, "page": "/library/orders", "action": "feature_used", "timestamp": 1756856984677}, {"data": {"page": "/library"}, "page": "/library", "action": "page_view", "timestamp": 1756857061376}, {"data": {"feature": "library_access", "category": "content"}, "page": "/library", "action": "feature_used", "timestamp": 1756857061376}, {"data": {"page": "/library/orders"}, "page": "/library/orders", "action": "page_view", "timestamp": 1756857063826}, {"data": {"feature": "library_access", "category": "content"}, "page": "/library/orders", "action": "feature_used", "timestamp": 1756857063826}, {"data": {"page": "/shop"}, "page": "/shop", "action": "page_view", "timestamp": 1756857076373}, {"data": {"page": "/library/orders"}, "page": "/library/orders", "action": "page_view", "timestamp": 1756857083649}, {"data": {"feature": "library_access", "category": "content"}, "page": "/library/orders", "action": "feature_used", "timestamp": 1756857083649}, {"data": {"page": "/shop"}, "page": "/shop", "action": "page_view", "timestamp": 1756857124466}, {"data": {"page": "/library/orders"}, "page": "/library/orders", "action": "page_view", "timestamp": 1756857131899}, {"data": {"feature": "library_access", "category": "content"}, "page": "/library/orders", "action": "feature_used", "timestamp": 1756857131899}, {"data": {"page": "/library"}, "page": "/library", "action": "page_view", "timestamp": 1756857261934}, {"data": {"feature": "library_access", "category": "content"}, "page": "/library", "action": "feature_used", "timestamp": 1756857261934}, {"data": {"error": "t.className.split is not a function"}, "page": "/library", "action": "error_encountered", "timestamp": 1756857268420}, {"data": {"error": "t.className.split is not a function"}, "page": "/library", "action": "error_encountered", "timestamp": 1756857281164}, {"data": {"page": "/library/books/a-gril-come-to-stanford"}, "page": "/library/books/a-gril-come-to-stanford", "action": "page_view", "timestamp": 1756857472829}, {"data": {"feature": "library_access", "category": "content"}, "page": "/library/books/a-gril-come-to-stanford", "action": "feature_used", "timestamp": 1756857472829}, {"data": {"page": "/library"}, "page": "/library", "action": "page_view", "timestamp": 1756857490848}, {"data": {"feature": "library_access", "category": "content"}, "page": "/library", "action": "feature_used", "timestamp": 1756857490848}, {"data": {"page": "/library/books/a-gril-come-to-stanford"}, "page": "/library/books/a-gril-come-to-stanford", "action": "page_view", "timestamp": 1756857492235}, {"data": {"feature": "library_access", "category": "content"}, "page": "/library/books/a-gril-come-to-stanford", "action": "feature_used", "timestamp": 1756857492235}, {"data": {"error": "t.className.split is not a function"}, "page": "/library/books/a-gril-come-to-stanford", "action": "error_encountered", "timestamp": 1756857553428}, {"data": {"error": "t.className.split is not a function"}, "page": "/library/books/a-gril-come-to-stanford", "action": "error_encountered", "timestamp": 1756857553682}, {"data": {"error": "t.className.split is not a function"}, "page": "/library/books/a-gril-come-to-stanford", "action": "error_encountered", "timestamp": 1756857553891}, {"data": {"error": "t.className.split is not a function"}, "page": "/library/books/a-gril-come-to-stanford", "action": "error_encountered", "timestamp": 1756857554073}, {"data": {"error": "t.className.split is not a function"}, "page": "/library/books/a-gril-come-to-stanford", "action": "error_encountered", "timestamp": 1756857554465}, {"data": {"error": "t.className.split is not a function"}, "page": "/library/books/a-gril-come-to-stanford", "action": "error_encountered", "timestamp": 1756857554620}, {"data": {"error": "t.className.split is not a function"}, "page": "/library/books/a-gril-come-to-stanford", "action": "error_encountered", "timestamp": 1756857554903}, {"data": {"page": "/library"}, "page": "/library", "action": "page_view", "timestamp": 1756857572421}, {"data": {"feature": "library_access", "category": "content"}, "page": "/library", "action": "feature_used", "timestamp": 1756857572421}, {"data": {"page": "/library/books/check-point-eng"}, "page": "/library/books/check-point-eng", "action": "page_view", "timestamp": 1756857574849}, {"data": {"feature": "library_access", "category": "content"}, "page": "/library/books/check-point-eng", "action": "feature_used", "timestamp": 1756857574849}, {"data": {"page": "/library"}, "page": "/library", "action": "page_view", "timestamp": 1756857576412}, {"data": {"feature": "library_access", "category": "content"}, "page": "/library", "action": "feature_used", "timestamp": 1756857576412}, {"data": {"page": "/library/books/a-gril-come-to-stanford"}, "page": "/library/books/a-gril-come-to-stanford", "action": "page_view", "timestamp": 1756857593097}, {"data": {"feature": "library_access", "category": "content"}, "page": "/library/books/a-gril-come-to-stanford", "action": "feature_used", "timestamp": 1756857593097}, {"data": {"error": "t.className.split is not a function"}, "page": "/library/books/a-gril-come-to-stanford", "action": "error_encountered", "timestamp": 1756857594495}, {"data": {"page": "/library/stories/a-gril-come-to-stanford"}, "page": "/library/stories/a-gril-come-to-stanford", "action": "page_view", "timestamp": 1756857594597}, {"data": {"feature": "library_access", "category": "content"}, "page": "/library/stories/a-gril-come-to-stanford", "action": "feature_used", "timestamp": 1756857594597}, {"data": {"error": "t.className.split is not a function"}, "page": "/library/stories/a-gril-come-to-stanford", "action": "error_encountered", "timestamp": 1756857603414}, {"data": {"page": "/library"}, "page": "/library", "action": "page_view", "timestamp": 1756857603574}, {"data": {"feature": "library_access", "category": "content"}, "page": "/library", "action": "feature_used", "timestamp": 1756857603574}, {"data": {"page": "/library/books/a-gril-come-to-stanford"}, "page": "/library/books/a-gril-come-to-stanford", "action": "page_view", "timestamp": 1756857605524}, {"data": {"feature": "library_access", "category": "content"}, "page": "/library/books/a-gril-come-to-stanford", "action": "feature_used", "timestamp": 1756857605524}, {"data": {"page": "/library/stories/a-gril-come-to-stanford"}, "page": "/library/stories/a-gril-come-to-stanford", "action": "page_view", "timestamp": 1756857608533}, {"data": {"feature": "library_access", "category": "content"}, "page": "/library/stories/a-gril-come-to-stanford", "action": "feature_used", "timestamp": 1756857608533}, {"data": {"page": "/library/books/a-gril-come-to-stanford"}, "page": "/library/books/a-gril-come-to-stanford", "action": "page_view", "timestamp": 1756857718175}, {"data": {"feature": "library_access", "category": "content"}, "page": "/library/books/a-gril-come-to-stanford", "action": "feature_used", "timestamp": 1756857718175}, {"data": {"error": "t.className.split is not a function"}, "page": "/library/books/a-gril-come-to-stanford", "action": "error_encountered", "timestamp": 1756857723251}, {"data": {"page": "/shop/cart"}, "page": "/shop/cart", "action": "page_view", "timestamp": 1756857806413}, {"data": {"page": "/library/books/a-gril-come-to-stanford"}, "page": "/library/books/a-gril-come-to-stanford", "action": "page_view", "timestamp": 1756857810302}, {"data": {"feature": "library_access", "category": "content"}, "page": "/library/books/a-gril-come-to-stanford", "action": "feature_used", "timestamp": 1756857810302}, {"data": {"page": "/shop/cart"}, "page": "/shop/cart", "action": "page_view", "timestamp": 1756857812464}, {"data": {"error": "t.className.split is not a function"}, "page": "/shop/cart", "action": "error_encountered", "timestamp": 1756857821981}, {"data": {"page": "/shop/checkout"}, "page": "/shop/checkout", "action": "page_view", "timestamp": 1756857983434}]	{"t.className.split is not a function"}	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	desktop	Chrome	macOS	1920x1080	80	f	t	2025-09-03 03:22:39.195	2025-09-03 03:22:39.195
cmf3ew9le0062qz013kr8cpuq	cmf35gyji000oqz012qoyhjou	d2jz2e1szjky3hfeujflemf35him4	CUSTOMER	f	\N	2025-09-02 22:59:19.036	2025-09-03 03:22:43.65	15804	5	7	100	/dashboard	/	[{"page": "/dashboard", "timeSpent": 69, "timestamp": 1756853959036}, {"page": "/dashboard", "timeSpent": 33786, "timestamp": 1756853959105}, {"page": "/", "timeSpent": 5056, "timestamp": 1756853992891}, {"page": "/signup", "timeSpent": 38569, "timestamp": 1756854835081}, {"page": "/", "timeSpent": 441, "timestamp": 1756854873650}]	{dashboard_access}	[{"data": {"page": "/dashboard"}, "page": "/dashboard", "action": "page_view", "timestamp": 1756853959036}, {"data": {"page": "/dashboard"}, "page": "/dashboard", "action": "page_view", "timestamp": 1756853959105}, {"data": {"feature": "dashboard_access", "category": "navigation"}, "page": "/dashboard", "action": "feature_used", "timestamp": 1756853959105}, {"data": {"page": "/"}, "page": "/", "action": "page_view", "timestamp": 1756853992891}, {"data": {"page": "/signup"}, "page": "/signup", "action": "page_view", "timestamp": 1756854835081}, {"data": {"page": "/"}, "page": "/", "action": "page_view", "timestamp": 1756854873650}]	{}	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	desktop	Chrome	macOS	1920x1080	47	f	t	2025-09-03 03:22:43.73	2025-09-03 03:22:43.73
cmf4qywbh0098qz01vqgafsyy	cmf35gyji000oqz012qoyhjou	hpxok1bmqzh7k8c5uupjl9mf4mp2n4	CUSTOMER	f	\N	2025-09-03 23:48:51.231	2025-09-04 01:48:27.803	7176	2	0	0	/programs/mentorship	/programs/mentorship	[{"page": "/programs/mentorship", "timeSpent": 134, "timestamp": 1756943331248}, {"page": "/programs/mentorship", "timeSpent": 7176421, "timestamp": 1756943331382}]	{}	[{"data": {"page": "/programs/mentorship"}, "page": "/programs/mentorship", "action": "page_view", "timestamp": 1756943331248}, {"data": {"page": "/programs/mentorship"}, "page": "/programs/mentorship", "action": "page_view", "timestamp": 1756943331382}]	{}	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	desktop	Chrome	macOS	1920x1080	21	t	t	2025-09-04 01:48:28.06	2025-09-04 01:48:28.06
cmf4qywcs009cqz016fe0uzql	cmf35gyji000oqz012qoyhjou	i559r96fxrlzf2hq57v10emf4mp2g4	CUSTOMER	f	\N	2025-09-03 23:48:50.98	2025-09-04 01:48:27.81	7176	8	12	100	/programs/esl	/programs/esl	[{"page": "/programs/esl", "timeSpent": 114, "timestamp": 1756943331028}, {"page": "/programs/esl", "timeSpent": 8514, "timestamp": 1756943331142}, {"page": "/signup", "timeSpent": 1639, "timestamp": 1756943343248}, {"page": "/programs/esl", "timeSpent": 4791, "timestamp": 1756943344887}, {"page": "/signup", "timeSpent": 1430, "timestamp": 1756943349678}, {"page": "/programs/esl", "timeSpent": 62707, "timestamp": 1756943351108}, {"page": "/programs/mentorship", "timeSpent": 5101, "timestamp": 1756943413815}, {"page": "/programs/esl", "timeSpent": 10078, "timestamp": 1756943418916}]	{}	[{"data": {"page": "/programs/esl"}, "page": "/programs/esl", "action": "page_view", "timestamp": 1756943331028}, {"data": {"page": "/programs/esl"}, "page": "/programs/esl", "action": "page_view", "timestamp": 1756943331142}, {"data": {"page": "/signup"}, "page": "/signup", "action": "page_view", "timestamp": 1756943343248}, {"data": {"page": "/programs/esl"}, "page": "/programs/esl", "action": "page_view", "timestamp": 1756943344887}, {"data": {"page": "/signup"}, "page": "/signup", "action": "page_view", "timestamp": 1756943349678}, {"data": {"page": "/programs/esl"}, "page": "/programs/esl", "action": "page_view", "timestamp": 1756943351108}, {"data": {"page": "/programs/mentorship"}, "page": "/programs/mentorship", "action": "page_view", "timestamp": 1756943413815}, {"data": {"page": "/programs/esl"}, "page": "/programs/esl", "action": "page_view", "timestamp": 1756943418916}]	{}	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	desktop	Chrome	macOS	1920x1080	50	f	t	2025-09-04 01:48:28.106	2025-09-04 01:48:28.106
cmf4l3e4g0064qz014u8znb37	cmf35gyji000oqz012qoyhjou	5qxihaybwluvals1io7pqmf4l2qdv	CUSTOMER	f	\N	2025-09-03 23:03:29.298	2025-09-04 01:48:27.795	9867	59	110	100	/	/about	[{"page": "/", "timeSpent": 41, "timestamp": 1756940640100}, {"page": "/", "timeSpent": 31241, "timestamp": 1756940640141}, {"page": "/library", "timeSpent": 6592, "timestamp": 1756940671382}, {"page": "/library/orders", "timeSpent": 25878, "timestamp": 1756940677974}, {"page": "/library", "timeSpent": 12405, "timestamp": 1756940703852}, {"page": "/library/orders", "timeSpent": 1329, "timestamp": 1756940716257}, {"page": "/shop", "timeSpent": 10580, "timestamp": 1756940717586}, {"page": "/library", "timeSpent": 2218, "timestamp": 1756940728166}, {"page": "/library/books/a-gril-come-to-stanford", "timeSpent": 40555, "timestamp": 1756940730384}, {"page": "/library/stories/a-gril-come-to-stanford", "timeSpent": 21272, "timestamp": 1756940770939}, {"page": "/library/books/a-gril-come-to-stanford", "timeSpent": 2334, "timestamp": 1756940792211}, {"page": "/shop/cart", "timeSpent": 14215, "timestamp": 1756940794545}, {"page": "/shop/checkout", "timeSpent": 68216, "timestamp": 1756940808760}, {"page": "/library", "timeSpent": 6679, "timestamp": 1756940876976}, {"page": "/signup", "timeSpent": 4105, "timestamp": 1756940883655}, {"page": "/library", "timeSpent": 29660, "timestamp": 1756940887760}, {"page": "/library/books/a-gril-come-to-stanford", "timeSpent": 4529, "timestamp": 1756940917420}, {"page": "/pricing", "timeSpent": 18225, "timestamp": 1756940921949}, {"page": "/library/books/a-gril-come-to-stanford", "timeSpent": 39446, "timestamp": 1756940964452}, {"page": "/", "timeSpent": 34705, "timestamp": 1756941003898}, {"page": "/shop", "timeSpent": 325881, "timestamp": 1756941038603}, {"page": "/dashboard", "timeSpent": 15665, "timestamp": 1756942005926}, {"page": "/library", "timeSpent": 1507, "timestamp": 1756942021591}, {"page": "/dashboard", "timeSpent": 19785, "timestamp": 1756942023098}, {"page": "/library", "timeSpent": 1271, "timestamp": 1756942042883}, {"page": "/dashboard", "timeSpent": 983, "timestamp": 1756942044154}, {"page": "/shop", "timeSpent": 1140, "timestamp": 1756942045137}, {"page": "/dashboard", "timeSpent": 951, "timestamp": 1756942046277}, {"page": "/about", "timeSpent": 2905, "timestamp": 1756942047228}, {"page": "/dashboard", "timeSpent": 1220, "timestamp": 1756942050133}, {"page": "/contact", "timeSpent": 1305, "timestamp": 1756942051353}, {"page": "/dashboard", "timeSpent": 12962, "timestamp": 1756942052658}, {"page": "/about", "timeSpent": 1726, "timestamp": 1756942065620}, {"page": "/dashboard", "timeSpent": 1582, "timestamp": 1756942067346}, {"page": "/donate", "timeSpent": 3229, "timestamp": 1756942068928}, {"page": "/dashboard", "timeSpent": 53446, "timestamp": 1756942072157}, {"page": "/library", "timeSpent": 3496, "timestamp": 1756942125603}, {"page": "/dashboard", "timeSpent": 1218, "timestamp": 1756942129099}, {"page": "/library", "timeSpent": 1947, "timestamp": 1756942130317}, {"page": "/dashboard", "timeSpent": 8468, "timestamp": 1756942132264}, {"page": "/library", "timeSpent": 9176, "timestamp": 1756942140732}, {"page": "/dashboard", "timeSpent": 13753, "timestamp": 1756942149908}, {"page": "/shop", "timeSpent": 1037, "timestamp": 1756942163661}, {"page": "/dashboard", "timeSpent": 905, "timestamp": 1756942164698}, {"page": "/shop", "timeSpent": 49772, "timestamp": 1756942165603}, {"page": "/dashboard", "timeSpent": 2167, "timestamp": 1756942215375}, {"page": "/donate", "timeSpent": 71916, "timestamp": 1756942217542}, {"page": "/dashboard", "timeSpent": 68733, "timestamp": 1756942289458}, {"page": "/library", "timeSpent": 1195, "timestamp": 1756942358191}, {"page": "/dashboard", "timeSpent": 1133, "timestamp": 1756942359386}, {"page": "/shop", "timeSpent": 1652, "timestamp": 1756942360519}, {"page": "/dashboard", "timeSpent": 1062, "timestamp": 1756942362171}, {"page": "/about", "timeSpent": 1168, "timestamp": 1756942363233}, {"page": "/dashboard", "timeSpent": 1163, "timestamp": 1756942364401}, {"page": "/contact", "timeSpent": 2536, "timestamp": 1756942365564}, {"page": "/dashboard", "timeSpent": 6700, "timestamp": 1756942368100}, {"page": "/library", "timeSpent": 1619, "timestamp": 1756942374800}, {"page": "/dashboard", "timeSpent": 22731, "timestamp": 1756942376419}, {"page": "/about", "timeSpent": 8108645, "timestamp": 1756942399150}]	{library_access,dashboard_access}	[{"data": {"page": "/"}, "page": "/", "action": "page_view", "timestamp": 1756940640100}, {"data": {"page": "/"}, "page": "/", "action": "page_view", "timestamp": 1756940640141}, {"data": {"page": "/library"}, "page": "/library", "action": "page_view", "timestamp": 1756940671382}, {"data": {"feature": "library_access", "category": "content"}, "page": "/library", "action": "feature_used", "timestamp": 1756940671382}, {"data": {"page": "/library/orders"}, "page": "/library/orders", "action": "page_view", "timestamp": 1756940677974}, {"data": {"feature": "library_access", "category": "content"}, "page": "/library/orders", "action": "feature_used", "timestamp": 1756940677974}, {"data": {"page": "/library"}, "page": "/library", "action": "page_view", "timestamp": 1756940703852}, {"data": {"feature": "library_access", "category": "content"}, "page": "/library", "action": "feature_used", "timestamp": 1756940703852}, {"data": {"page": "/library/orders"}, "page": "/library/orders", "action": "page_view", "timestamp": 1756940716257}, {"data": {"feature": "library_access", "category": "content"}, "page": "/library/orders", "action": "feature_used", "timestamp": 1756940716257}, {"data": {"page": "/shop"}, "page": "/shop", "action": "page_view", "timestamp": 1756940717586}, {"data": {"page": "/library"}, "page": "/library", "action": "page_view", "timestamp": 1756940728166}, {"data": {"feature": "library_access", "category": "content"}, "page": "/library", "action": "feature_used", "timestamp": 1756940728166}, {"data": {"page": "/library/books/a-gril-come-to-stanford"}, "page": "/library/books/a-gril-come-to-stanford", "action": "page_view", "timestamp": 1756940730384}, {"data": {"feature": "library_access", "category": "content"}, "page": "/library/books/a-gril-come-to-stanford", "action": "feature_used", "timestamp": 1756940730384}, {"data": {"page": "/library/stories/a-gril-come-to-stanford"}, "page": "/library/stories/a-gril-come-to-stanford", "action": "page_view", "timestamp": 1756940770939}, {"data": {"feature": "library_access", "category": "content"}, "page": "/library/stories/a-gril-come-to-stanford", "action": "feature_used", "timestamp": 1756940770939}, {"data": {"page": "/library/books/a-gril-come-to-stanford"}, "page": "/library/books/a-gril-come-to-stanford", "action": "page_view", "timestamp": 1756940792211}, {"data": {"feature": "library_access", "category": "content"}, "page": "/library/books/a-gril-come-to-stanford", "action": "feature_used", "timestamp": 1756940792211}, {"data": {"page": "/shop/cart"}, "page": "/shop/cart", "action": "page_view", "timestamp": 1756940794545}, {"data": {"page": "/shop/checkout"}, "page": "/shop/checkout", "action": "page_view", "timestamp": 1756940808760}, {"data": {"page": "/library"}, "page": "/library", "action": "page_view", "timestamp": 1756940876976}, {"data": {"feature": "library_access", "category": "content"}, "page": "/library", "action": "feature_used", "timestamp": 1756940876977}, {"data": {"page": "/signup"}, "page": "/signup", "action": "page_view", "timestamp": 1756940883655}, {"data": {"page": "/library"}, "page": "/library", "action": "page_view", "timestamp": 1756940887760}, {"data": {"feature": "library_access", "category": "content"}, "page": "/library", "action": "feature_used", "timestamp": 1756940887760}, {"data": {"page": "/library/books/a-gril-come-to-stanford"}, "page": "/library/books/a-gril-come-to-stanford", "action": "page_view", "timestamp": 1756940917420}, {"data": {"feature": "library_access", "category": "content"}, "page": "/library/books/a-gril-come-to-stanford", "action": "feature_used", "timestamp": 1756940917420}, {"data": {"page": "/pricing"}, "page": "/pricing", "action": "page_view", "timestamp": 1756940921949}, {"data": {"page": "/library/books/a-gril-come-to-stanford"}, "page": "/library/books/a-gril-come-to-stanford", "action": "page_view", "timestamp": 1756940964452}, {"data": {"feature": "library_access", "category": "content"}, "page": "/library/books/a-gril-come-to-stanford", "action": "feature_used", "timestamp": 1756940964452}, {"data": {"page": "/"}, "page": "/", "action": "page_view", "timestamp": 1756941003898}, {"data": {"page": "/shop"}, "page": "/shop", "action": "page_view", "timestamp": 1756941038603}, {"data": {"error": "t.className.split is not a function"}, "page": "/shop", "action": "error_encountered", "timestamp": 1756941968854}, {"data": {"error": "t.className.split is not a function"}, "page": "/shop", "action": "error_encountered", "timestamp": 1756941969313}, {"data": {"page": "/dashboard"}, "page": "/dashboard", "action": "page_view", "timestamp": 1756942005926}, {"data": {"feature": "dashboard_access", "category": "navigation"}, "page": "/dashboard", "action": "feature_used", "timestamp": 1756942005926}, {"data": {"page": "/library"}, "page": "/library", "action": "page_view", "timestamp": 1756942021591}, {"data": {"feature": "library_access", "category": "content"}, "page": "/library", "action": "feature_used", "timestamp": 1756942021591}, {"data": {"page": "/dashboard"}, "page": "/dashboard", "action": "page_view", "timestamp": 1756942023098}, {"data": {"feature": "dashboard_access", "category": "navigation"}, "page": "/dashboard", "action": "feature_used", "timestamp": 1756942023098}, {"data": {"error": "t.className.split is not a function"}, "page": "/dashboard", "action": "error_encountered", "timestamp": 1756942042808}, {"data": {"page": "/library"}, "page": "/library", "action": "page_view", "timestamp": 1756942042883}, {"data": {"feature": "library_access", "category": "content"}, "page": "/library", "action": "feature_used", "timestamp": 1756942042883}, {"data": {"page": "/dashboard"}, "page": "/dashboard", "action": "page_view", "timestamp": 1756942044154}, {"data": {"feature": "dashboard_access", "category": "navigation"}, "page": "/dashboard", "action": "feature_used", "timestamp": 1756942044154}, {"data": {"page": "/shop"}, "page": "/shop", "action": "page_view", "timestamp": 1756942045137}, {"data": {"page": "/dashboard"}, "page": "/dashboard", "action": "page_view", "timestamp": 1756942046277}, {"data": {"feature": "dashboard_access", "category": "navigation"}, "page": "/dashboard", "action": "feature_used", "timestamp": 1756942046277}, {"data": {"page": "/about"}, "page": "/about", "action": "page_view", "timestamp": 1756942047228}, {"data": {"page": "/dashboard"}, "page": "/dashboard", "action": "page_view", "timestamp": 1756942050133}, {"data": {"feature": "dashboard_access", "category": "navigation"}, "page": "/dashboard", "action": "feature_used", "timestamp": 1756942050133}, {"data": {"error": "t.className.split is not a function"}, "page": "/dashboard", "action": "error_encountered", "timestamp": 1756942051247}, {"data": {"page": "/contact"}, "page": "/contact", "action": "page_view", "timestamp": 1756942051353}, {"data": {"page": "/dashboard"}, "page": "/dashboard", "action": "page_view", "timestamp": 1756942052658}, {"data": {"feature": "dashboard_access", "category": "navigation"}, "page": "/dashboard", "action": "feature_used", "timestamp": 1756942052658}, {"data": {"error": "t.className.split is not a function"}, "page": "/dashboard", "action": "error_encountered", "timestamp": 1756942065552}, {"data": {"page": "/about"}, "page": "/about", "action": "page_view", "timestamp": 1756942065620}, {"data": {"page": "/dashboard"}, "page": "/dashboard", "action": "page_view", "timestamp": 1756942067346}, {"data": {"feature": "dashboard_access", "category": "navigation"}, "page": "/dashboard", "action": "feature_used", "timestamp": 1756942067346}, {"data": {"page": "/donate"}, "page": "/donate", "action": "page_view", "timestamp": 1756942068928}, {"data": {"page": "/dashboard"}, "page": "/dashboard", "action": "page_view", "timestamp": 1756942072157}, {"data": {"feature": "dashboard_access", "category": "navigation"}, "page": "/dashboard", "action": "feature_used", "timestamp": 1756942072157}, {"data": {"page": "/library"}, "page": "/library", "action": "page_view", "timestamp": 1756942125603}, {"data": {"feature": "library_access", "category": "content"}, "page": "/library", "action": "feature_used", "timestamp": 1756942125603}, {"data": {"page": "/dashboard"}, "page": "/dashboard", "action": "page_view", "timestamp": 1756942129099}, {"data": {"feature": "dashboard_access", "category": "navigation"}, "page": "/dashboard", "action": "feature_used", "timestamp": 1756942129099}, {"data": {"page": "/library"}, "page": "/library", "action": "page_view", "timestamp": 1756942130317}, {"data": {"feature": "library_access", "category": "content"}, "page": "/library", "action": "feature_used", "timestamp": 1756942130317}, {"data": {"page": "/dashboard"}, "page": "/dashboard", "action": "page_view", "timestamp": 1756942132264}, {"data": {"feature": "dashboard_access", "category": "navigation"}, "page": "/dashboard", "action": "feature_used", "timestamp": 1756942132264}, {"data": {"page": "/library"}, "page": "/library", "action": "page_view", "timestamp": 1756942140732}, {"data": {"feature": "library_access", "category": "content"}, "page": "/library", "action": "feature_used", "timestamp": 1756942140732}, {"data": {"page": "/dashboard"}, "page": "/dashboard", "action": "page_view", "timestamp": 1756942149908}, {"data": {"feature": "dashboard_access", "category": "navigation"}, "page": "/dashboard", "action": "feature_used", "timestamp": 1756942149908}, {"data": {"page": "/shop"}, "page": "/shop", "action": "page_view", "timestamp": 1756942163661}, {"data": {"page": "/dashboard"}, "page": "/dashboard", "action": "page_view", "timestamp": 1756942164699}, {"data": {"feature": "dashboard_access", "category": "navigation"}, "page": "/dashboard", "action": "feature_used", "timestamp": 1756942164699}, {"data": {"page": "/shop"}, "page": "/shop", "action": "page_view", "timestamp": 1756942165603}, {"data": {"page": "/dashboard"}, "page": "/dashboard", "action": "page_view", "timestamp": 1756942215375}, {"data": {"feature": "dashboard_access", "category": "navigation"}, "page": "/dashboard", "action": "feature_used", "timestamp": 1756942215375}, {"data": {"page": "/donate"}, "page": "/donate", "action": "page_view", "timestamp": 1756942217542}, {"data": {"page": "/dashboard"}, "page": "/dashboard", "action": "page_view", "timestamp": 1756942289458}, {"data": {"feature": "dashboard_access", "category": "navigation"}, "page": "/dashboard", "action": "feature_used", "timestamp": 1756942289458}, {"data": {"error": "t.className.split is not a function"}, "page": "/dashboard", "action": "error_encountered", "timestamp": 1756942358180}, {"data": {"page": "/library"}, "page": "/library", "action": "page_view", "timestamp": 1756942358191}, {"data": {"feature": "library_access", "category": "content"}, "page": "/library", "action": "feature_used", "timestamp": 1756942358191}, {"data": {"page": "/dashboard"}, "page": "/dashboard", "action": "page_view", "timestamp": 1756942359386}, {"data": {"feature": "dashboard_access", "category": "navigation"}, "page": "/dashboard", "action": "feature_used", "timestamp": 1756942359386}, {"data": {"error": "t.className.split is not a function"}, "page": "/dashboard", "action": "error_encountered", "timestamp": 1756942360511}, {"data": {"page": "/shop"}, "page": "/shop", "action": "page_view", "timestamp": 1756942360519}, {"data": {"page": "/dashboard"}, "page": "/dashboard", "action": "page_view", "timestamp": 1756942362171}, {"data": {"feature": "dashboard_access", "category": "navigation"}, "page": "/dashboard", "action": "feature_used", "timestamp": 1756942362171}, {"data": {"error": "t.className.split is not a function"}, "page": "/dashboard", "action": "error_encountered", "timestamp": 1756942363221}, {"data": {"page": "/about"}, "page": "/about", "action": "page_view", "timestamp": 1756942363233}, {"data": {"page": "/dashboard"}, "page": "/dashboard", "action": "page_view", "timestamp": 1756942364401}, {"data": {"feature": "dashboard_access", "category": "navigation"}, "page": "/dashboard", "action": "feature_used", "timestamp": 1756942364401}, {"data": {"page": "/contact"}, "page": "/contact", "action": "page_view", "timestamp": 1756942365564}, {"data": {"page": "/dashboard"}, "page": "/dashboard", "action": "page_view", "timestamp": 1756942368100}, {"data": {"feature": "dashboard_access", "category": "navigation"}, "page": "/dashboard", "action": "feature_used", "timestamp": 1756942368100}, {"data": {"error": "t.className.split is not a function"}, "page": "/dashboard", "action": "error_encountered", "timestamp": 1756942374638}, {"data": {"page": "/library"}, "page": "/library", "action": "page_view", "timestamp": 1756942374800}, {"data": {"feature": "library_access", "category": "content"}, "page": "/library", "action": "feature_used", "timestamp": 1756942374800}, {"data": {"page": "/dashboard"}, "page": "/dashboard", "action": "page_view", "timestamp": 1756942376419}, {"data": {"feature": "dashboard_access", "category": "navigation"}, "page": "/dashboard", "action": "feature_used", "timestamp": 1756942376419}, {"data": {"page": "/about"}, "page": "/about", "action": "page_view", "timestamp": 1756942399150}]	{"t.className.split is not a function"}	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	desktop	Chrome	macOS	1920x1080	85	f	t	2025-09-03 23:04:00.063	2025-09-04 01:48:28.111
cmf4qywa80094qz01eb03wzim	cmf35gyji000oqz012qoyhjou	8yr4z4en9bjg78gktxge9vmf4mp371	CUSTOMER	f	\N	2025-09-03 23:48:51.948	2025-09-04 01:48:27.808	7175	2	0	0	/programs/workshops	/programs/workshops	[{"page": "/programs/workshops", "timeSpent": 34, "timestamp": 1756943331975}, {"page": "/programs/workshops", "timeSpent": 7175799, "timestamp": 1756943332009}]	{}	[{"data": {"page": "/programs/workshops"}, "page": "/programs/workshops", "action": "page_view", "timestamp": 1756943331975}, {"data": {"page": "/programs/workshops"}, "page": "/programs/workshops", "action": "page_view", "timestamp": 1756943332009}]	{}	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	desktop	Chrome	macOS	1920x1080	21	t	t	2025-09-04 01:48:28.016	2025-09-04 01:48:28.016
cmf4qywch009aqz018eva89qr	cmf35gyji000oqz012qoyhjou	jyny0wyb2arlu987qepmomf4m8zrp	CUSTOMER	f	\N	2025-09-03 23:36:21.013	2025-09-04 01:48:27.814	7926	2	18	1.772264067346034	/contact	/contact	[{"page": "/contact", "timeSpent": 12, "timestamp": 1756942581013}, {"page": "/contact", "timeSpent": 7175814, "timestamp": 1756942581025}]	{}	[{"data": {"page": "/contact"}, "page": "/contact", "action": "page_view", "timestamp": 1756942581013}, {"data": {"page": "/contact"}, "page": "/contact", "action": "page_view", "timestamp": 1756942581025}]	{}	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	desktop	Chrome	macOS	1920x1080	23	t	t	2025-09-04 01:48:28.067	2025-09-04 01:48:28.067
cmf4u1ok6009gqz017vg1nps4	cmemeo50u0000nw66n5s79pkr	khv3rqu2cubnlbp7807qbmf4ocncb	ADMIN	f	\N	2025-09-04 00:35:10.763	2025-09-04 03:15:27.826	9617	3	12	83.93574297188755	/	/admin	[{"page": "/", "timeSpent": 6, "timestamp": 1756946110763}, {"page": "/", "timeSpent": 2790, "timestamp": 1756946110769}, {"page": "/admin", "timeSpent": 7446774, "timestamp": 1756946113559}]	{admin_access}	[{"data": {"page": "/"}, "page": "/", "action": "page_view", "timestamp": 1756946110763}, {"data": {"page": "/"}, "page": "/", "action": "page_view", "timestamp": 1756946110769}, {"data": {"page": "/admin"}, "page": "/admin", "action": "page_view", "timestamp": 1756946113559}, {"data": {"feature": "admin_access", "category": "admin"}, "page": "/admin", "action": "feature_used", "timestamp": 1756946113559}]	{}	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	desktop	Chrome	macOS	1920x1080	40	f	t	2025-09-04 03:14:36.822	2025-09-04 03:15:27.512
\.


--
-- Data for Name: user_deletion_requests; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.user_deletion_requests (id, "userId", status, "deletionReason", "parentalConsentRequired", "parentalConsentVerified", "parentConfirmationToken", "parentConfirmationSentAt", "parentConfirmationExpiry", "softDeletedAt", "hardDeletedAt", "recoveryDeadline", "requestSource", "ipAddress", "userAgent", "additionalContext", "reviewRequired", "reviewedBy", "reviewedAt", "reviewNotes", "finalConfirmationToken", "finalConfirmationSentAt", "finalConfirmationExpiry", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: user_feedback; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.user_feedback (id, "userId", "sessionId", email, "feedbackType", category, page, "userAgent", viewport, rating, title, message, sentiment, "userRole", "previousRole", "migrationDate", "sessionDuration", "clickPath", "scrollBehavior", "timeOnPage", "exitIntent", "bugReport", reproducible, severity, "screenshotUrl", "isResolved", "responseDate", "respondedBy", resolution, tags, priority, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.users (id, email, "emailVerified", name, image, role, "schoolId", "createdAt", "updatedAt", "deletedAt", "deletionRequestId", password, "tokenVersion") FROM stdin;
cmemf40cp0000nwezg7b57ke0	learner@demo.1001stories.org	2025-08-22 05:56:40.008	Demo Learner	\N	LEARNER	\N	2025-08-22 05:56:40.01	2025-08-22 05:56:40.01	\N	\N	\N	1
cmemf40d60003nwezdy1jwqjg	teacher@demo.1001stories.org	2025-08-22 05:56:40.025	Demo Teacher	\N	TEACHER	\N	2025-08-22 05:56:40.026	2025-08-22 05:56:40.026	\N	\N	\N	1
cmemf40dg0006nwez4hwp20qw	volunteer@demo.1001stories.org	2025-08-22 05:56:40.035	Demo Volunteer	\N	VOLUNTEER	\N	2025-08-22 05:56:40.036	2025-08-22 05:56:40.036	\N	\N	\N	1
cmemf40dq0009nwezakrerszo	institution@demo.1001stories.org	2025-08-22 05:56:40.044	Demo Institution	\N	INSTITUTION	\N	2025-08-22 05:56:40.046	2025-08-22 05:56:40.046	\N	\N	\N	1
cmenjw74b0000k19182zkycdb	demo.author@1001stories.org	\N	Demo Author	\N	LEARNER	\N	2025-08-23 00:58:19.786	2025-08-23 00:58:19.786	\N	\N	\N	1
cmenjw75w0002k191e52io5nq	volunteer@1001stories.org	\N	Demo Volunteer	\N	VOLUNTEER	\N	2025-08-23 00:58:19.844	2025-08-23 00:58:19.844	\N	\N	\N	1
cmenjw75r0001k191qs9peaw8	admin@1001stories.org	\N	Admin User	\N	ADMIN	\N	2025-08-23 00:58:19.839	2025-08-23 00:58:19.839	\N	\N	b2p3eH5F8QlJwczHca1dEteb5PLuRk3y9p3etv8ZREcSsOBn1uWgqm	1
cmf35gyji000oqz012qoyhjou	minu803@gmail.com	2025-09-02 22:59:18.717	Minwoo S	\N	CUSTOMER	\N	2025-09-02 22:58:53.022	2025-09-02 22:59:18.721	\N	\N	\N	1
cmemeo50u0000nw66n5s79pkr	purusil55@gmail.com	2025-09-03 02:37:29.332	Admin User	\N	ADMIN	\N	2025-08-22 05:44:19.566	2025-09-03 02:37:29.336	\N	\N	b2OSoGW.CjLR8Lpns7FKZGO6BPyNgKJeSDLAooQ/QpKFNUGoXKAu5q	1
\.


--
-- Data for Name: verification_tokens; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.verification_tokens (identifier, token, expires) FROM stdin;
purusil55@gmail.com	4b39cdc48b440dc0c2d6e260d33a00d7689deba14637eab75ceaf269a41ff154	2025-08-23 06:08:44.913
purusil55@gmail.com	b478d5be380a59504c3403c497ea2aec8f9c1d605843481b8f388fd9da93b536	2025-08-23 13:46:02.686
purusil55@gmail.com	10f8df119df73e9df464d3949c8e4df1e163eda7ccbd47b59c0c555b4be6ab49	2025-08-23 13:47:19.86
purusil55@gmail.com	d0578143c8304103c1436c83365d595bb9dd558d98038f050dd47b49096321e6	2025-08-23 13:47:36.088
\.


--
-- Data for Name: volunteer_applications; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.volunteer_applications (id, "projectId", "volunteerId", motivation, experience, availability, status, "reviewedBy", "reviewedAt", notes, "createdAt", "coverLetter", "isRecommended", "matchScore", "questId", "rejectionReason", "selectionReason", "updatedAt", "volunteerUserId") FROM stdin;
\.


--
-- Data for Name: volunteer_certificates; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.volunteer_certificates (id, "volunteerId", type, title, description, "hoursContributed", "projectCount", "issuedDate", "certificateUrl") FROM stdin;
\.


--
-- Data for Name: volunteer_evidence; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.volunteer_evidence (id, "assignmentId", "volunteerId", "questId", type, title, description, "fileUrls", metadata, status, "submittedAt", "reviewedAt", "reviewerId", "reviewNotes", "hoursSubmitted", "hoursApproved", "pointsAwarded", "autoVerified", "verificationScore", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: volunteer_hours; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.volunteer_hours (id, "volunteerId", "projectId", date, hours, activity, impact, verified, "verifiedBy", "verifiedAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: volunteer_matches; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.volunteer_matches (id, "volunteerId", "questId", "overallScore", "languageScore", "skillScore", "availabilityScore", "experienceScore", "locationScore", reasons, concerns, confidence, "isRecommended", "wasSelected", "selectionReason", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: volunteer_points; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.volunteer_points (id, "volunteerId", type, amount, reason, description, "referenceId", "referenceType", "balanceAfter", metadata, "issuedById", "createdAt") FROM stdin;
\.


--
-- Data for Name: volunteer_profiles; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.volunteer_profiles (id, "userId", languages, "languageLevels", skills, qualifications, experience, portfolio, timezone, "availableSlots", "maxHoursPerWeek", "remoteOnly", "preferredTypes", "verificationStatus", "backgroundCheck", "documentUrl", "verifiedAt", "verifiedById", "totalHours", "totalPoints", "currentLevel", rating, reliability, "isMentor", "mentorLevel", "canAcceptMentees", "maxMentees", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: volunteer_projects; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.volunteer_projects (id, title, description, type, skills, location, "timeCommitment", "startDate", "endDate", "maxVolunteers", "currentVolunteers", status, impact, "coordinatorId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: volunteer_redemptions; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.volunteer_redemptions (id, "volunteerId", "rewardId", "pointsUsed", status, "fulfilledAt", "fulfilledById", "fulfillmentNotes", "trackingInfo", "deliveryMethod", "recipientEmail", "shippingAddress", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: volunteer_rewards; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.volunteer_rewards (id, name, description, type, category, "pointsCost", "levelRequired", "maxRedemptions", "currentRedemptions", value, "imageUrl", terms, "isActive", "validFrom", "validUntil", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: volunteer_submissions; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.volunteer_submissions (id, "volunteerId", "projectId", type, "pdfRef", "originalName", "fileSize", title, "authorAlias", language, "ageRange", category, tags, summary, visibility, "targetAudience", "copyrightConfirmed", "portraitRightsConfirmed", "originalWork", "licenseType", status, priority, "reviewerId", "assigneeId", "dueDate", "reviewNotes", "rejectionReason", "publishDate", compensation, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: welcome_messages; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.welcome_messages (id, "messageType", language, content, "isActive", priority, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: workflow_history; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.workflow_history (id, "storySubmissionId", "fromStatus", "toStatus", comment, "performedById", metadata, "createdAt") FROM stdin;
\.


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: ab_test_participants ab_test_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.ab_test_participants
    ADD CONSTRAINT ab_test_participants_pkey PRIMARY KEY (id);


--
-- Name: accounts accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);


--
-- Name: activity_logs activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (id);


--
-- Name: anonymization_logs anonymization_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.anonymization_logs
    ADD CONSTRAINT anonymization_logs_pkey PRIMARY KEY (id);


--
-- Name: assignments assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_pkey PRIMARY KEY (id);


--
-- Name: bookmarks bookmarks_pkey; Type: CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.bookmarks
    ADD CONSTRAINT bookmarks_pkey PRIMARY KEY (id);


--
-- Name: books books_pkey; Type: CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.books
    ADD CONSTRAINT books_pkey PRIMARY KEY (id);


--
-- Name: budget_items budget_items_pkey; Type: CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.budget_items
    ADD CONSTRAINT budget_items_pkey PRIMARY KEY (id);


--
-- Name: budgets budgets_pkey; Type: CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.budgets
    ADD CONSTRAINT budgets_pkey PRIMARY KEY (id);


--
-- Name: bulk_imports bulk_imports_pkey; Type: CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.bulk_imports
    ADD CONSTRAINT bulk_imports_pkey PRIMARY KEY (id);


--
-- Name: campaign_updates campaign_updates_pkey; Type: CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.campaign_updates
    ADD CONSTRAINT campaign_updates_pkey PRIMARY KEY (id);


--
-- Name: cart_items cart_items_pkey; Type: CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_pkey PRIMARY KEY (id);


--
-- Name: carts carts_pkey; Type: CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: chapters chapters_pkey; Type: CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.chapters
    ADD CONSTRAINT chapters_pkey PRIMARY KEY (id);


--
-- Name: class_announcements class_announcements_pkey; Type: CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.class_announcements
    ADD CONSTRAINT class_announcements_pkey PRIMARY KEY (id);


--
-- Name: class_enrollments class_enrollments_pkey; Type: CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.class_enrollments
    ADD CONSTRAINT class_enrollments_pkey PRIMARY KEY (id);


--
-- Name: class_resources class_resources_pkey; Type: CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.class_resources
    ADD CONSTRAINT class_resources_pkey PRIMARY KEY (id);


--
-- Name: classes classes_pkey; Type: CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_pkey PRIMARY KEY (id);


--
-- Name: deletion_audit_logs deletion_audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.deletion_audit_logs
    ADD CONSTRAINT deletion_audit_logs_pkey PRIMARY KEY (id);


--
-- Name: donation_campaigns donation_campaigns_pkey; Type: CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.donation_campaigns
    ADD CONSTRAINT donation_campaigns_pkey PRIMARY KEY (id);


--
-- Name: donations donations_pkey; Type: CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.donations
    ADD CONSTRAINT donations_pkey PRIMARY KEY (id);


--
-- Name: entitlements entitlements_pkey; Type: CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.entitlements
    ADD CONSTRAINT entitlements_pkey PRIMARY KEY (id);


--
-- Name: feature_usage feature_usage_pkey; Type: CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.feature_usage
    ADD CONSTRAINT feature_usage_pkey PRIMARY KEY (id);


--
-- Name: illustrations illustrations_pkey; Type: CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.illustrations
    ADD CONSTRAINT illustrations_pkey PRIMARY KEY (id);


--
-- Name: inventory inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_pkey PRIMARY KEY (id);


--
-- Name: lesson_progress lesson_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.lesson_progress
    ADD CONSTRAINT lesson_progress_pkey PRIMARY KEY (id);


--
-- Name: lessons lessons_pkey; Type: CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_pkey PRIMARY KEY (id);


--
-- Name: media_files media_files_pkey; Type: CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.media_files
    ADD CONSTRAINT media_files_pkey PRIMARY KEY (id);


--
-- Name: mentor_relations mentor_relations_pkey; Type: CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.mentor_relations
    ADD CONSTRAINT mentor_relations_pkey PRIMARY KEY (id);


--
-- Name: micro_surveys micro_surveys_pkey; Type: CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.micro_surveys
    ADD CONSTRAINT micro_surveys_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: onboarding_activities onboarding_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.onboarding_activities
    ADD CONSTRAINT onboarding_activities_pkey PRIMARY KEY (id);


--
-- Name: onboarding_progress onboarding_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.onboarding_progress
    ADD CONSTRAINT onboarding_progress_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: product_images product_images_pkey; Type: CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.product_images
    ADD CONSTRAINT product_images_pkey PRIMARY KEY (id);


--
-- Name: product_variants product_variants_pkey; Type: CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT product_variants_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: publications publications_pkey; Type: CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.publications
    ADD CONSTRAINT publications_pkey PRIMARY KEY (id);


--
-- Name: quest_assignments quest_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.quest_assignments
    ADD CONSTRAINT quest_assignments_pkey PRIMARY KEY (id);


--
-- Name: quest_reviews quest_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.quest_reviews
    ADD CONSTRAINT quest_reviews_pkey PRIMARY KEY (id);


--
-- Name: quests quests_pkey; Type: CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.quests
    ADD CONSTRAINT quests_pkey PRIMARY KEY (id);


--
-- Name: reading_lists reading_lists_pkey; Type: CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.reading_lists
    ADD CONSTRAINT reading_lists_pkey PRIMARY KEY (id);


--
-- Name: reading_progress reading_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.reading_progress
    ADD CONSTRAINT reading_progress_pkey PRIMARY KEY (id);


--
-- Name: recurring_donations recurring_donations_pkey; Type: CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.recurring_donations
    ADD CONSTRAINT recurring_donations_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: role_migrations role_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.role_migrations
    ADD CONSTRAINT role_migrations_pkey PRIMARY KEY (id);


--
-- Name: sample_content_access sample_content_access_pkey; Type: CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.sample_content_access
    ADD CONSTRAINT sample_content_access_pkey PRIMARY KEY (id);


--
-- Name: school_resources school_resources_pkey; Type: CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.school_resources
    ADD CONSTRAINT school_resources_pkey PRIMARY KEY (id);


--
-- Name: school_volunteers school_volunteers_pkey; Type: CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.school_volunteers
    ADD CONSTRAINT school_volunteers_pkey PRIMARY KEY (id);


--
-- Name: schools schools_pkey; Type: CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.schools
    ADD CONSTRAINT schools_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: shop_products shop_products_pkey; Type: CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.shop_products
    ADD CONSTRAINT shop_products_pkey PRIMARY KEY (id);


--
-- Name: stories stories_pkey; Type: CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.stories
    ADD CONSTRAINT stories_pkey PRIMARY KEY (id);


--
-- Name: story_submissions story_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.story_submissions
    ADD CONSTRAINT story_submissions_pkey PRIMARY KEY (id);


--
-- Name: submissions submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT submissions_pkey PRIMARY KEY (id);


--
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


--
-- Name: survey_responses survey_responses_pkey; Type: CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.survey_responses
    ADD CONSTRAINT survey_responses_pkey PRIMARY KEY (id);


--
-- Name: translations translations_pkey; Type: CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.translations
    ADD CONSTRAINT translations_pkey PRIMARY KEY (id);


--
-- Name: user_analytics user_analytics_pkey; Type: CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.user_analytics
    ADD CONSTRAINT user_analytics_pkey PRIMARY KEY (id);


--
-- Name: user_deletion_requests user_deletion_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.user_deletion_requests
    ADD CONSTRAINT user_deletion_requests_pkey PRIMARY KEY (id);


--
-- Name: user_feedback user_feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.user_feedback
    ADD CONSTRAINT user_feedback_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: volunteer_applications volunteer_applications_pkey; Type: CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.volunteer_applications
    ADD CONSTRAINT volunteer_applications_pkey PRIMARY KEY (id);


--
-- Name: volunteer_certificates volunteer_certificates_pkey; Type: CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.volunteer_certificates
    ADD CONSTRAINT volunteer_certificates_pkey PRIMARY KEY (id);


--
-- Name: volunteer_evidence volunteer_evidence_pkey; Type: CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.volunteer_evidence
    ADD CONSTRAINT volunteer_evidence_pkey PRIMARY KEY (id);


--
-- Name: volunteer_hours volunteer_hours_pkey; Type: CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.volunteer_hours
    ADD CONSTRAINT volunteer_hours_pkey PRIMARY KEY (id);


--
-- Name: volunteer_matches volunteer_matches_pkey; Type: CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.volunteer_matches
    ADD CONSTRAINT volunteer_matches_pkey PRIMARY KEY (id);


--
-- Name: volunteer_points volunteer_points_pkey; Type: CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.volunteer_points
    ADD CONSTRAINT volunteer_points_pkey PRIMARY KEY (id);


--
-- Name: volunteer_profiles volunteer_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.volunteer_profiles
    ADD CONSTRAINT volunteer_profiles_pkey PRIMARY KEY (id);


--
-- Name: volunteer_projects volunteer_projects_pkey; Type: CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.volunteer_projects
    ADD CONSTRAINT volunteer_projects_pkey PRIMARY KEY (id);


--
-- Name: volunteer_redemptions volunteer_redemptions_pkey; Type: CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.volunteer_redemptions
    ADD CONSTRAINT volunteer_redemptions_pkey PRIMARY KEY (id);


--
-- Name: volunteer_rewards volunteer_rewards_pkey; Type: CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.volunteer_rewards
    ADD CONSTRAINT volunteer_rewards_pkey PRIMARY KEY (id);


--
-- Name: volunteer_submissions volunteer_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.volunteer_submissions
    ADD CONSTRAINT volunteer_submissions_pkey PRIMARY KEY (id);


--
-- Name: welcome_messages welcome_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.welcome_messages
    ADD CONSTRAINT welcome_messages_pkey PRIMARY KEY (id);


--
-- Name: workflow_history workflow_history_pkey; Type: CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.workflow_history
    ADD CONSTRAINT workflow_history_pkey PRIMARY KEY (id);


--
-- Name: ab_test_participants_goalAchieved_conversionValue_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX "ab_test_participants_goalAchieved_conversionValue_idx" ON public.ab_test_participants USING btree ("goalAchieved", "conversionValue");


--
-- Name: ab_test_participants_testName_sessionId_key; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE UNIQUE INDEX "ab_test_participants_testName_sessionId_key" ON public.ab_test_participants USING btree ("testName", "sessionId");


--
-- Name: ab_test_participants_testName_variant_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX "ab_test_participants_testName_variant_idx" ON public.ab_test_participants USING btree ("testName", variant);


--
-- Name: accounts_provider_providerAccountId_key; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON public.accounts USING btree (provider, "providerAccountId");


--
-- Name: activity_logs_entity_entityId_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX "activity_logs_entity_entityId_idx" ON public.activity_logs USING btree (entity, "entityId");


--
-- Name: activity_logs_userId_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX "activity_logs_userId_idx" ON public.activity_logs USING btree ("userId");


--
-- Name: anonymization_logs_createdAt_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX "anonymization_logs_createdAt_idx" ON public.anonymization_logs USING btree ("createdAt");


--
-- Name: anonymization_logs_tableName_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX "anonymization_logs_tableName_idx" ON public.anonymization_logs USING btree ("tableName");


--
-- Name: anonymization_logs_tableName_recordId_key; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE UNIQUE INDEX "anonymization_logs_tableName_recordId_key" ON public.anonymization_logs USING btree ("tableName", "recordId");


--
-- Name: assignments_classId_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX "assignments_classId_idx" ON public.assignments USING btree ("classId");


--
-- Name: assignments_dueDate_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX "assignments_dueDate_idx" ON public.assignments USING btree ("dueDate");


--
-- Name: bookmarks_userId_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX "bookmarks_userId_idx" ON public.bookmarks USING btree ("userId");


--
-- Name: bookmarks_userId_storyId_key; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE UNIQUE INDEX "bookmarks_userId_storyId_key" ON public.bookmarks USING btree ("userId", "storyId");


--
-- Name: books_isPremium_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX "books_isPremium_idx" ON public.books USING btree ("isPremium");


--
-- Name: books_isPublished_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX "books_isPublished_idx" ON public.books USING btree ("isPublished");


--
-- Name: books_language_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX books_language_idx ON public.books USING btree (language);


--
-- Name: books_thumbnailGeneratedAt_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX "books_thumbnailGeneratedAt_idx" ON public.books USING btree ("thumbnailGeneratedAt");


--
-- Name: books_visibility_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX books_visibility_idx ON public.books USING btree (visibility);


--
-- Name: budgets_schoolId_year_key; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE UNIQUE INDEX "budgets_schoolId_year_key" ON public.budgets USING btree ("schoolId", year);


--
-- Name: bulk_imports_status_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX bulk_imports_status_idx ON public.bulk_imports USING btree (status);


--
-- Name: bulk_imports_uploadedById_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX "bulk_imports_uploadedById_idx" ON public.bulk_imports USING btree ("uploadedById");


--
-- Name: cart_items_cartId_productId_variantId_key; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE UNIQUE INDEX "cart_items_cartId_productId_variantId_key" ON public.cart_items USING btree ("cartId", "productId", "variantId");


--
-- Name: carts_sessionId_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX "carts_sessionId_idx" ON public.carts USING btree ("sessionId");


--
-- Name: carts_userId_key; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE UNIQUE INDEX "carts_userId_key" ON public.carts USING btree ("userId");


--
-- Name: categories_slug_key; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE UNIQUE INDEX categories_slug_key ON public.categories USING btree (slug);


--
-- Name: chapters_storyId_chapterNumber_key; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE UNIQUE INDEX "chapters_storyId_chapterNumber_key" ON public.chapters USING btree ("storyId", "chapterNumber");


--
-- Name: class_enrollments_classId_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX "class_enrollments_classId_idx" ON public.class_enrollments USING btree ("classId");


--
-- Name: class_enrollments_classId_studentId_key; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE UNIQUE INDEX "class_enrollments_classId_studentId_key" ON public.class_enrollments USING btree ("classId", "studentId");


--
-- Name: class_enrollments_studentId_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX "class_enrollments_studentId_idx" ON public.class_enrollments USING btree ("studentId");


--
-- Name: classes_code_key; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE UNIQUE INDEX classes_code_key ON public.classes USING btree (code);


--
-- Name: classes_schoolId_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX "classes_schoolId_idx" ON public.classes USING btree ("schoolId");


--
-- Name: classes_teacherId_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX "classes_teacherId_idx" ON public.classes USING btree ("teacherId");


--
-- Name: deletion_audit_logs_action_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX deletion_audit_logs_action_idx ON public.deletion_audit_logs USING btree (action);


--
-- Name: deletion_audit_logs_deletionRequestId_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX "deletion_audit_logs_deletionRequestId_idx" ON public.deletion_audit_logs USING btree ("deletionRequestId");


--
-- Name: deletion_audit_logs_tableName_recordId_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX "deletion_audit_logs_tableName_recordId_idx" ON public.deletion_audit_logs USING btree ("tableName", "recordId");


--
-- Name: donation_campaigns_featured_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX donation_campaigns_featured_idx ON public.donation_campaigns USING btree (featured);


--
-- Name: donation_campaigns_status_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX donation_campaigns_status_idx ON public.donation_campaigns USING btree (status);


--
-- Name: donations_campaignId_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX "donations_campaignId_idx" ON public.donations USING btree ("campaignId");


--
-- Name: donations_donorId_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX "donations_donorId_idx" ON public.donations USING btree ("donorId");


--
-- Name: donations_status_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX donations_status_idx ON public.donations USING btree (status);


--
-- Name: entitlements_bookId_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX "entitlements_bookId_idx" ON public.entitlements USING btree ("bookId");


--
-- Name: entitlements_email_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX entitlements_email_idx ON public.entitlements USING btree (email);


--
-- Name: entitlements_expiresAt_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX "entitlements_expiresAt_idx" ON public.entitlements USING btree ("expiresAt");


--
-- Name: entitlements_isActive_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX "entitlements_isActive_idx" ON public.entitlements USING btree ("isActive");


--
-- Name: entitlements_userId_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX "entitlements_userId_idx" ON public.entitlements USING btree ("userId");


--
-- Name: feature_usage_featureName_userRole_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX "feature_usage_featureName_userRole_idx" ON public.feature_usage USING btree ("featureName", "userRole");


--
-- Name: feature_usage_lastAccessed_userRole_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX "feature_usage_lastAccessed_userRole_idx" ON public.feature_usage USING btree ("lastAccessed", "userRole");


--
-- Name: feature_usage_userId_sessionId_featureName_key; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE UNIQUE INDEX "feature_usage_userId_sessionId_featureName_key" ON public.feature_usage USING btree ("userId", "sessionId", "featureName");


--
-- Name: inventory_productId_variantId_location_key; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE UNIQUE INDEX "inventory_productId_variantId_location_key" ON public.inventory USING btree ("productId", "variantId", location);


--
-- Name: lesson_progress_lessonId_studentId_key; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE UNIQUE INDEX "lesson_progress_lessonId_studentId_key" ON public.lesson_progress USING btree ("lessonId", "studentId");


--
-- Name: lesson_progress_studentId_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX "lesson_progress_studentId_idx" ON public.lesson_progress USING btree ("studentId");


--
-- Name: lessons_classId_lessonNumber_key; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE UNIQUE INDEX "lessons_classId_lessonNumber_key" ON public.lessons USING btree ("classId", "lessonNumber");


--
-- Name: media_files_folder_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX media_files_folder_idx ON public.media_files USING btree (folder);


--
-- Name: media_files_mimeType_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX "media_files_mimeType_idx" ON public.media_files USING btree ("mimeType");


--
-- Name: media_files_uploadedById_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX "media_files_uploadedById_idx" ON public.media_files USING btree ("uploadedById");


--
-- Name: mentor_relations_mentorId_menteeId_key; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE UNIQUE INDEX "mentor_relations_mentorId_menteeId_key" ON public.mentor_relations USING btree ("mentorId", "menteeId");


--
-- Name: micro_surveys_isActive_startDate_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX "micro_surveys_isActive_startDate_idx" ON public.micro_surveys USING btree ("isActive", "startDate");


--
-- Name: micro_surveys_targetPage_trigger_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX "micro_surveys_targetPage_trigger_idx" ON public.micro_surveys USING btree ("targetPage", trigger);


--
-- Name: notifications_userId_read_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX "notifications_userId_read_idx" ON public.notifications USING btree ("userId", read);


--
-- Name: onboarding_progress_userId_key; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE UNIQUE INDEX "onboarding_progress_userId_key" ON public.onboarding_progress USING btree ("userId");


--
-- Name: orders_orderNumber_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX "orders_orderNumber_idx" ON public.orders USING btree ("orderNumber");


--
-- Name: orders_orderNumber_key; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE UNIQUE INDEX "orders_orderNumber_key" ON public.orders USING btree ("orderNumber");


--
-- Name: orders_status_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX orders_status_idx ON public.orders USING btree (status);


--
-- Name: orders_userId_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX "orders_userId_idx" ON public.orders USING btree ("userId");


--
-- Name: product_variants_sku_key; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE UNIQUE INDEX product_variants_sku_key ON public.product_variants USING btree (sku);


--
-- Name: products_featured_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX products_featured_idx ON public.products USING btree (featured);


--
-- Name: products_sku_key; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE UNIQUE INDEX products_sku_key ON public.products USING btree (sku);


--
-- Name: products_status_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX products_status_idx ON public.products USING btree (status);


--
-- Name: products_type_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX products_type_idx ON public.products USING btree (type);


--
-- Name: profiles_userId_key; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE UNIQUE INDEX "profiles_userId_key" ON public.profiles USING btree ("userId");


--
-- Name: publications_featured_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX publications_featured_idx ON public.publications USING btree (featured);


--
-- Name: publications_isPremium_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX "publications_isPremium_idx" ON public.publications USING btree ("isPremium");


--
-- Name: publications_publishedAt_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX "publications_publishedAt_idx" ON public.publications USING btree ("publishedAt");


--
-- Name: publications_status_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX publications_status_idx ON public.publications USING btree (status);


--
-- Name: quest_assignments_questId_volunteerId_key; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE UNIQUE INDEX "quest_assignments_questId_volunteerId_key" ON public.quest_assignments USING btree ("questId", "volunteerId");


--
-- Name: quests_status_type_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX quests_status_type_idx ON public.quests USING btree (status, type);


--
-- Name: quests_urgency_startDate_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX "quests_urgency_startDate_idx" ON public.quests USING btree (urgency, "startDate");


--
-- Name: reading_lists_userId_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX "reading_lists_userId_idx" ON public.reading_lists USING btree ("userId");


--
-- Name: reading_progress_lastReadAt_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX "reading_progress_lastReadAt_idx" ON public.reading_progress USING btree ("lastReadAt");


--
-- Name: reading_progress_userId_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX "reading_progress_userId_idx" ON public.reading_progress USING btree ("userId");


--
-- Name: reading_progress_userId_storyId_key; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE UNIQUE INDEX "reading_progress_userId_storyId_key" ON public.reading_progress USING btree ("userId", "storyId");


--
-- Name: recurring_donations_donorId_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX "recurring_donations_donorId_idx" ON public.recurring_donations USING btree ("donorId");


--
-- Name: recurring_donations_status_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX recurring_donations_status_idx ON public.recurring_donations USING btree (status);


--
-- Name: recurring_donations_stripeSubscriptionId_key; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE UNIQUE INDEX "recurring_donations_stripeSubscriptionId_key" ON public.recurring_donations USING btree ("stripeSubscriptionId");


--
-- Name: reviews_contentType_contentId_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX "reviews_contentType_contentId_idx" ON public.reviews USING btree ("contentType", "contentId");


--
-- Name: reviews_userId_contentType_contentId_key; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE UNIQUE INDEX "reviews_userId_contentType_contentId_key" ON public.reviews USING btree ("userId", "contentType", "contentId");


--
-- Name: reviews_userId_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX "reviews_userId_idx" ON public.reviews USING btree ("userId");


--
-- Name: role_migrations_fromRole_toRole_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX "role_migrations_fromRole_toRole_idx" ON public.role_migrations USING btree ("fromRole", "toRole");


--
-- Name: role_migrations_status_completedAt_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX "role_migrations_status_completedAt_idx" ON public.role_migrations USING btree (status, "completedAt");


--
-- Name: role_migrations_userId_initiatedAt_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX "role_migrations_userId_initiatedAt_idx" ON public.role_migrations USING btree ("userId", "initiatedAt");


--
-- Name: sample_content_access_userId_storyId_key; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE UNIQUE INDEX "sample_content_access_userId_storyId_key" ON public.sample_content_access USING btree ("userId", "storyId");


--
-- Name: school_volunteers_schoolId_volunteerId_key; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE UNIQUE INDEX "school_volunteers_schoolId_volunteerId_key" ON public.school_volunteers USING btree ("schoolId", "volunteerId");


--
-- Name: sessions_sessionToken_key; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE UNIQUE INDEX "sessions_sessionToken_key" ON public.sessions USING btree ("sessionToken");


--
-- Name: shop_products_bookId_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX "shop_products_bookId_idx" ON public.shop_products USING btree ("bookId");


--
-- Name: shop_products_featured_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX shop_products_featured_idx ON public.shop_products USING btree (featured);


--
-- Name: shop_products_sku_key; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE UNIQUE INDEX shop_products_sku_key ON public.shop_products USING btree (sku);


--
-- Name: shop_products_status_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX shop_products_status_idx ON public.shop_products USING btree (status);


--
-- Name: shop_products_type_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX shop_products_type_idx ON public.shop_products USING btree (type);


--
-- Name: stories_isPremium_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX "stories_isPremium_idx" ON public.stories USING btree ("isPremium");


--
-- Name: stories_isPublished_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX "stories_isPublished_idx" ON public.stories USING btree ("isPublished");


--
-- Name: stories_isbn_key; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE UNIQUE INDEX stories_isbn_key ON public.stories USING btree (isbn);


--
-- Name: stories_language_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX stories_language_idx ON public.stories USING btree (language);


--
-- Name: story_submissions_assigneeId_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX "story_submissions_assigneeId_idx" ON public.story_submissions USING btree ("assigneeId");


--
-- Name: story_submissions_priority_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX story_submissions_priority_idx ON public.story_submissions USING btree (priority);


--
-- Name: story_submissions_status_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX story_submissions_status_idx ON public.story_submissions USING btree (status);


--
-- Name: submissions_assignmentId_studentId_key; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE UNIQUE INDEX "submissions_assignmentId_studentId_key" ON public.submissions USING btree ("assignmentId", "studentId");


--
-- Name: submissions_studentId_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX "submissions_studentId_idx" ON public.submissions USING btree ("studentId");


--
-- Name: subscriptions_stripeCustomerId_key; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE UNIQUE INDEX "subscriptions_stripeCustomerId_key" ON public.subscriptions USING btree ("stripeCustomerId");


--
-- Name: subscriptions_stripeSubscriptionId_key; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE UNIQUE INDEX "subscriptions_stripeSubscriptionId_key" ON public.subscriptions USING btree ("stripeSubscriptionId");


--
-- Name: subscriptions_userId_key; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE UNIQUE INDEX "subscriptions_userId_key" ON public.subscriptions USING btree ("userId");


--
-- Name: survey_responses_surveyId_userId_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX "survey_responses_surveyId_userId_idx" ON public.survey_responses USING btree ("surveyId", "userId");


--
-- Name: survey_responses_userRole_createdAt_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX "survey_responses_userRole_createdAt_idx" ON public.survey_responses USING btree ("userRole", "createdAt");


--
-- Name: translations_status_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX translations_status_idx ON public.translations USING btree (status);


--
-- Name: translations_storyId_toLanguage_key; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE UNIQUE INDEX "translations_storyId_toLanguage_key" ON public.translations USING btree ("storyId", "toLanguage");


--
-- Name: user_analytics_isNewUser_sessionStart_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX "user_analytics_isNewUser_sessionStart_idx" ON public.user_analytics USING btree ("isNewUser", "sessionStart");


--
-- Name: user_analytics_sessionId_key; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE UNIQUE INDEX "user_analytics_sessionId_key" ON public.user_analytics USING btree ("sessionId");


--
-- Name: user_analytics_userId_sessionStart_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX "user_analytics_userId_sessionStart_idx" ON public.user_analytics USING btree ("userId", "sessionStart");


--
-- Name: user_analytics_userRole_migrationDate_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX "user_analytics_userRole_migrationDate_idx" ON public.user_analytics USING btree ("userRole", "migrationDate");


--
-- Name: user_deletion_requests_finalConfirmationToken_key; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE UNIQUE INDEX "user_deletion_requests_finalConfirmationToken_key" ON public.user_deletion_requests USING btree ("finalConfirmationToken");


--
-- Name: user_deletion_requests_parentConfirmationToken_key; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE UNIQUE INDEX "user_deletion_requests_parentConfirmationToken_key" ON public.user_deletion_requests USING btree ("parentConfirmationToken");


--
-- Name: user_deletion_requests_recoveryDeadline_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX "user_deletion_requests_recoveryDeadline_idx" ON public.user_deletion_requests USING btree ("recoveryDeadline");


--
-- Name: user_deletion_requests_softDeletedAt_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX "user_deletion_requests_softDeletedAt_idx" ON public.user_deletion_requests USING btree ("softDeletedAt");


--
-- Name: user_deletion_requests_status_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX user_deletion_requests_status_idx ON public.user_deletion_requests USING btree (status);


--
-- Name: user_deletion_requests_userId_key; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE UNIQUE INDEX "user_deletion_requests_userId_key" ON public.user_deletion_requests USING btree ("userId");


--
-- Name: user_feedback_feedbackType_category_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX "user_feedback_feedbackType_category_idx" ON public.user_feedback USING btree ("feedbackType", category);


--
-- Name: user_feedback_isResolved_priority_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX "user_feedback_isResolved_priority_idx" ON public.user_feedback USING btree ("isResolved", priority);


--
-- Name: user_feedback_page_createdAt_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX "user_feedback_page_createdAt_idx" ON public.user_feedback USING btree (page, "createdAt");


--
-- Name: user_feedback_userRole_previousRole_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX "user_feedback_userRole_previousRole_idx" ON public.user_feedback USING btree ("userRole", "previousRole");


--
-- Name: users_email_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX users_email_idx ON public.users USING btree (email);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_role_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX users_role_idx ON public.users USING btree (role);


--
-- Name: users_schoolId_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX "users_schoolId_idx" ON public.users USING btree ("schoolId");


--
-- Name: verification_tokens_identifier_token_key; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE UNIQUE INDEX verification_tokens_identifier_token_key ON public.verification_tokens USING btree (identifier, token);


--
-- Name: verification_tokens_token_key; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE UNIQUE INDEX verification_tokens_token_key ON public.verification_tokens USING btree (token);


--
-- Name: volunteer_applications_projectId_volunteerId_key; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE UNIQUE INDEX "volunteer_applications_projectId_volunteerId_key" ON public.volunteer_applications USING btree ("projectId", "volunteerId");


--
-- Name: volunteer_applications_questId_volunteerId_key; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE UNIQUE INDEX "volunteer_applications_questId_volunteerId_key" ON public.volunteer_applications USING btree ("questId", "volunteerId");


--
-- Name: volunteer_evidence_status_submittedAt_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX "volunteer_evidence_status_submittedAt_idx" ON public.volunteer_evidence USING btree (status, "submittedAt");


--
-- Name: volunteer_evidence_volunteerId_status_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX "volunteer_evidence_volunteerId_status_idx" ON public.volunteer_evidence USING btree ("volunteerId", status);


--
-- Name: volunteer_hours_projectId_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX "volunteer_hours_projectId_idx" ON public.volunteer_hours USING btree ("projectId");


--
-- Name: volunteer_hours_volunteerId_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX "volunteer_hours_volunteerId_idx" ON public.volunteer_hours USING btree ("volunteerId");


--
-- Name: volunteer_matches_questId_overallScore_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX "volunteer_matches_questId_overallScore_idx" ON public.volunteer_matches USING btree ("questId", "overallScore");


--
-- Name: volunteer_matches_volunteerId_questId_key; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE UNIQUE INDEX "volunteer_matches_volunteerId_questId_key" ON public.volunteer_matches USING btree ("volunteerId", "questId");


--
-- Name: volunteer_points_volunteerId_createdAt_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX "volunteer_points_volunteerId_createdAt_idx" ON public.volunteer_points USING btree ("volunteerId", "createdAt");


--
-- Name: volunteer_profiles_userId_key; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE UNIQUE INDEX "volunteer_profiles_userId_key" ON public.volunteer_profiles USING btree ("userId");


--
-- Name: volunteer_projects_status_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX volunteer_projects_status_idx ON public.volunteer_projects USING btree (status);


--
-- Name: volunteer_submissions_priority_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX volunteer_submissions_priority_idx ON public.volunteer_submissions USING btree (priority);


--
-- Name: volunteer_submissions_reviewerId_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX "volunteer_submissions_reviewerId_idx" ON public.volunteer_submissions USING btree ("reviewerId");


--
-- Name: volunteer_submissions_status_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX volunteer_submissions_status_idx ON public.volunteer_submissions USING btree (status);


--
-- Name: volunteer_submissions_volunteerId_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX "volunteer_submissions_volunteerId_idx" ON public.volunteer_submissions USING btree ("volunteerId");


--
-- Name: workflow_history_performedById_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX "workflow_history_performedById_idx" ON public.workflow_history USING btree ("performedById");


--
-- Name: workflow_history_storySubmissionId_idx; Type: INDEX; Schema: public; Owner: stories_user
--

CREATE INDEX "workflow_history_storySubmissionId_idx" ON public.workflow_history USING btree ("storySubmissionId");


--
-- Name: ab_test_participants ab_test_participants_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.ab_test_participants
    ADD CONSTRAINT "ab_test_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: accounts accounts_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: activity_logs activity_logs_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT "activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: assignments assignments_classId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT "assignments_classId_fkey" FOREIGN KEY ("classId") REFERENCES public.classes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: bookmarks bookmarks_storyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.bookmarks
    ADD CONSTRAINT "bookmarks_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES public.stories(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: bookmarks bookmarks_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.bookmarks
    ADD CONSTRAINT "bookmarks_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: budget_items budget_items_budgetId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.budget_items
    ADD CONSTRAINT "budget_items_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES public.budgets(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: budgets budgets_schoolId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.budgets
    ADD CONSTRAINT "budgets_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES public.schools(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: bulk_imports bulk_imports_uploadedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.bulk_imports
    ADD CONSTRAINT "bulk_imports_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: campaign_updates campaign_updates_campaignId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.campaign_updates
    ADD CONSTRAINT "campaign_updates_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES public.donation_campaigns(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: cart_items cart_items_cartId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT "cart_items_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES public.carts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: cart_items cart_items_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT "cart_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: cart_items cart_items_variantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT "cart_items_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES public.product_variants(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: carts carts_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT "carts_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: categories categories_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT "categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: chapters chapters_storyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.chapters
    ADD CONSTRAINT "chapters_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES public.stories(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: class_announcements class_announcements_classId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.class_announcements
    ADD CONSTRAINT "class_announcements_classId_fkey" FOREIGN KEY ("classId") REFERENCES public.classes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: class_enrollments class_enrollments_classId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.class_enrollments
    ADD CONSTRAINT "class_enrollments_classId_fkey" FOREIGN KEY ("classId") REFERENCES public.classes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: class_enrollments class_enrollments_studentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.class_enrollments
    ADD CONSTRAINT "class_enrollments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: class_resources class_resources_classId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.class_resources
    ADD CONSTRAINT "class_resources_classId_fkey" FOREIGN KEY ("classId") REFERENCES public.classes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: classes classes_schoolId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT "classes_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES public.schools(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: classes classes_teacherId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT "classes_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: deletion_audit_logs deletion_audit_logs_deletionRequestId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.deletion_audit_logs
    ADD CONSTRAINT "deletion_audit_logs_deletionRequestId_fkey" FOREIGN KEY ("deletionRequestId") REFERENCES public.user_deletion_requests(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: donations donations_campaignId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.donations
    ADD CONSTRAINT "donations_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES public.donation_campaigns(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: donations donations_donorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.donations
    ADD CONSTRAINT "donations_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: entitlements entitlements_bookId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.entitlements
    ADD CONSTRAINT "entitlements_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES public.books(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: entitlements entitlements_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.entitlements
    ADD CONSTRAINT "entitlements_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: entitlements entitlements_storyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.entitlements
    ADD CONSTRAINT "entitlements_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES public.stories(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: entitlements entitlements_subscriptionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.entitlements
    ADD CONSTRAINT "entitlements_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES public.subscriptions(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: entitlements entitlements_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.entitlements
    ADD CONSTRAINT "entitlements_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: feature_usage feature_usage_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.feature_usage
    ADD CONSTRAINT "feature_usage_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: illustrations illustrations_artistId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.illustrations
    ADD CONSTRAINT "illustrations_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: inventory inventory_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT "inventory_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: inventory inventory_variantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT "inventory_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES public.product_variants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: lesson_progress lesson_progress_lessonId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.lesson_progress
    ADD CONSTRAINT "lesson_progress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES public.lessons(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: lesson_progress lesson_progress_studentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.lesson_progress
    ADD CONSTRAINT "lesson_progress_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: lessons lessons_classId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT "lessons_classId_fkey" FOREIGN KEY ("classId") REFERENCES public.classes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: media_files media_files_uploadedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.media_files
    ADD CONSTRAINT "media_files_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: mentor_relations mentor_relations_menteeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.mentor_relations
    ADD CONSTRAINT "mentor_relations_menteeId_fkey" FOREIGN KEY ("menteeId") REFERENCES public.volunteer_profiles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: mentor_relations mentor_relations_mentorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.mentor_relations
    ADD CONSTRAINT "mentor_relations_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES public.volunteer_profiles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: notifications notifications_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: onboarding_activities onboarding_activities_progressId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.onboarding_activities
    ADD CONSTRAINT "onboarding_activities_progressId_fkey" FOREIGN KEY ("progressId") REFERENCES public.onboarding_progress(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: onboarding_progress onboarding_progress_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.onboarding_progress
    ADD CONSTRAINT "onboarding_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_items order_items_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_items order_items_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT "order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: order_items order_items_variantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT "order_items_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES public.product_variants(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: orders orders_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT "orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: product_images product_images_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.product_images
    ADD CONSTRAINT "product_images_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_variants product_variants_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT "product_variants_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: products products_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: profiles profiles_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT "profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: publications publications_bookId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.publications
    ADD CONSTRAINT "publications_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES public.books(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: publications publications_publishedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.publications
    ADD CONSTRAINT "publications_publishedBy_fkey" FOREIGN KEY ("publishedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: publications publications_storyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.publications
    ADD CONSTRAINT "publications_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES public.stories(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: publications publications_submissionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.publications
    ADD CONSTRAINT "publications_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES public.volunteer_submissions(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: quest_assignments quest_assignments_questId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.quest_assignments
    ADD CONSTRAINT "quest_assignments_questId_fkey" FOREIGN KEY ("questId") REFERENCES public.quests(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: quest_assignments quest_assignments_volunteerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.quest_assignments
    ADD CONSTRAINT "quest_assignments_volunteerId_fkey" FOREIGN KEY ("volunteerId") REFERENCES public.volunteer_profiles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: quest_reviews quest_reviews_questId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.quest_reviews
    ADD CONSTRAINT "quest_reviews_questId_fkey" FOREIGN KEY ("questId") REFERENCES public.quests(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: quest_reviews quest_reviews_reviewerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.quest_reviews
    ADD CONSTRAINT "quest_reviews_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: quests quests_creatorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.quests
    ADD CONSTRAINT "quests_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: reading_lists reading_lists_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.reading_lists
    ADD CONSTRAINT "reading_lists_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: reading_progress reading_progress_storyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.reading_progress
    ADD CONSTRAINT "reading_progress_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES public.stories(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: reading_progress reading_progress_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.reading_progress
    ADD CONSTRAINT "reading_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: recurring_donations recurring_donations_donorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.recurring_donations
    ADD CONSTRAINT "recurring_donations_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: reviews reviews_book_contentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT "reviews_book_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES public.books(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: reviews reviews_product_contentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT "reviews_product_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: reviews reviews_story_contentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT "reviews_story_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES public.stories(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: reviews reviews_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT "reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: role_migrations role_migrations_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.role_migrations
    ADD CONSTRAINT "role_migrations_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sample_content_access sample_content_access_storyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.sample_content_access
    ADD CONSTRAINT "sample_content_access_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES public.stories(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: sample_content_access sample_content_access_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.sample_content_access
    ADD CONSTRAINT "sample_content_access_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: school_resources school_resources_schoolId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.school_resources
    ADD CONSTRAINT "school_resources_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES public.schools(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: school_volunteers school_volunteers_schoolId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.school_volunteers
    ADD CONSTRAINT "school_volunteers_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES public.schools(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sessions sessions_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: shop_products shop_products_bookId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.shop_products
    ADD CONSTRAINT "shop_products_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES public.books(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: shop_products shop_products_storyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.shop_products
    ADD CONSTRAINT "shop_products_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES public.stories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: stories stories_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.stories
    ADD CONSTRAINT "stories_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: story_submissions story_submissions_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.story_submissions
    ADD CONSTRAINT "story_submissions_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: story_submissions story_submissions_coverImageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.story_submissions
    ADD CONSTRAINT "story_submissions_coverImageId_fkey" FOREIGN KEY ("coverImageId") REFERENCES public.media_files(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: submissions submissions_assignmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT "submissions_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES public.assignments(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: submissions submissions_studentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT "submissions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: subscriptions subscriptions_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: survey_responses survey_responses_surveyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.survey_responses
    ADD CONSTRAINT "survey_responses_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES public.micro_surveys(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: survey_responses survey_responses_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.survey_responses
    ADD CONSTRAINT "survey_responses_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: translations translations_storyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.translations
    ADD CONSTRAINT "translations_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES public.stories(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: translations translations_translatorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.translations
    ADD CONSTRAINT "translations_translatorId_fkey" FOREIGN KEY ("translatorId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: user_analytics user_analytics_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.user_analytics
    ADD CONSTRAINT "user_analytics_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_deletion_requests user_deletion_requests_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.user_deletion_requests
    ADD CONSTRAINT "user_deletion_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_feedback user_feedback_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.user_feedback
    ADD CONSTRAINT "user_feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: users users_schoolId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "users_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES public.schools(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: volunteer_applications volunteer_applications_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.volunteer_applications
    ADD CONSTRAINT "volunteer_applications_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public.volunteer_projects(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: volunteer_applications volunteer_applications_questId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.volunteer_applications
    ADD CONSTRAINT "volunteer_applications_questId_fkey" FOREIGN KEY ("questId") REFERENCES public.quests(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: volunteer_applications volunteer_applications_volunteerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.volunteer_applications
    ADD CONSTRAINT "volunteer_applications_volunteerId_fkey" FOREIGN KEY ("volunteerId") REFERENCES public.volunteer_profiles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: volunteer_applications volunteer_applications_volunteerUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.volunteer_applications
    ADD CONSTRAINT "volunteer_applications_volunteerUserId_fkey" FOREIGN KEY ("volunteerUserId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: volunteer_certificates volunteer_certificates_volunteerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.volunteer_certificates
    ADD CONSTRAINT "volunteer_certificates_volunteerId_fkey" FOREIGN KEY ("volunteerId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: volunteer_evidence volunteer_evidence_assignmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.volunteer_evidence
    ADD CONSTRAINT "volunteer_evidence_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES public.quest_assignments(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: volunteer_evidence volunteer_evidence_questId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.volunteer_evidence
    ADD CONSTRAINT "volunteer_evidence_questId_fkey" FOREIGN KEY ("questId") REFERENCES public.quests(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: volunteer_evidence volunteer_evidence_reviewerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.volunteer_evidence
    ADD CONSTRAINT "volunteer_evidence_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: volunteer_evidence volunteer_evidence_volunteerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.volunteer_evidence
    ADD CONSTRAINT "volunteer_evidence_volunteerId_fkey" FOREIGN KEY ("volunteerId") REFERENCES public.volunteer_profiles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: volunteer_hours volunteer_hours_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.volunteer_hours
    ADD CONSTRAINT "volunteer_hours_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public.volunteer_projects(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: volunteer_hours volunteer_hours_volunteerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.volunteer_hours
    ADD CONSTRAINT "volunteer_hours_volunteerId_fkey" FOREIGN KEY ("volunteerId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: volunteer_matches volunteer_matches_questId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.volunteer_matches
    ADD CONSTRAINT "volunteer_matches_questId_fkey" FOREIGN KEY ("questId") REFERENCES public.quests(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: volunteer_matches volunteer_matches_volunteerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.volunteer_matches
    ADD CONSTRAINT "volunteer_matches_volunteerId_fkey" FOREIGN KEY ("volunteerId") REFERENCES public.volunteer_profiles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: volunteer_points volunteer_points_issuedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.volunteer_points
    ADD CONSTRAINT "volunteer_points_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: volunteer_points volunteer_points_volunteerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.volunteer_points
    ADD CONSTRAINT "volunteer_points_volunteerId_fkey" FOREIGN KEY ("volunteerId") REFERENCES public.volunteer_profiles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: volunteer_profiles volunteer_profiles_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.volunteer_profiles
    ADD CONSTRAINT "volunteer_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: volunteer_projects volunteer_projects_coordinatorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.volunteer_projects
    ADD CONSTRAINT "volunteer_projects_coordinatorId_fkey" FOREIGN KEY ("coordinatorId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: volunteer_redemptions volunteer_redemptions_fulfilledById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.volunteer_redemptions
    ADD CONSTRAINT "volunteer_redemptions_fulfilledById_fkey" FOREIGN KEY ("fulfilledById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: volunteer_redemptions volunteer_redemptions_rewardId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.volunteer_redemptions
    ADD CONSTRAINT "volunteer_redemptions_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES public.volunteer_rewards(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: volunteer_redemptions volunteer_redemptions_volunteerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.volunteer_redemptions
    ADD CONSTRAINT "volunteer_redemptions_volunteerId_fkey" FOREIGN KEY ("volunteerId") REFERENCES public.volunteer_profiles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: volunteer_submissions volunteer_submissions_assigneeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.volunteer_submissions
    ADD CONSTRAINT "volunteer_submissions_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: volunteer_submissions volunteer_submissions_reviewerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.volunteer_submissions
    ADD CONSTRAINT "volunteer_submissions_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: volunteer_submissions volunteer_submissions_volunteerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.volunteer_submissions
    ADD CONSTRAINT "volunteer_submissions_volunteerId_fkey" FOREIGN KEY ("volunteerId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: workflow_history workflow_history_performedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.workflow_history
    ADD CONSTRAINT "workflow_history_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: workflow_history workflow_history_storySubmissionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.workflow_history
    ADD CONSTRAINT "workflow_history_storySubmissionId_fkey" FOREIGN KEY ("storySubmissionId") REFERENCES public.story_submissions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict KHwxXoAHvbMrSTictjBL43X0XedvkPKaqNjKAE0zk2Ymlmuy06SrTZynuz1Vcp2

