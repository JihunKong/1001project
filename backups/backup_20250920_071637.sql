--
-- PostgreSQL database dump
--

\restrict o7vhHMw2EVHn9CM2pPDFKqm1k2bBPD8ygYotFP9Wat45yUarpIJlfwXREXEOfeM

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

ALTER TABLE IF EXISTS ONLY public.workflow_history DROP CONSTRAINT IF EXISTS "workflow_history_storySubmissionId_fkey";
ALTER TABLE IF EXISTS ONLY public.workflow_history DROP CONSTRAINT IF EXISTS "workflow_history_performedById_fkey";
ALTER TABLE IF EXISTS ONLY public.volunteer_submissions DROP CONSTRAINT IF EXISTS "volunteer_submissions_volunteerId_fkey";
ALTER TABLE IF EXISTS ONLY public.volunteer_submissions DROP CONSTRAINT IF EXISTS "volunteer_submissions_reviewerId_fkey";
ALTER TABLE IF EXISTS ONLY public.volunteer_submissions DROP CONSTRAINT IF EXISTS "volunteer_submissions_assigneeId_fkey";
ALTER TABLE IF EXISTS ONLY public.volunteer_redemptions DROP CONSTRAINT IF EXISTS "volunteer_redemptions_volunteerId_fkey";
ALTER TABLE IF EXISTS ONLY public.volunteer_redemptions DROP CONSTRAINT IF EXISTS "volunteer_redemptions_rewardId_fkey";
ALTER TABLE IF EXISTS ONLY public.volunteer_redemptions DROP CONSTRAINT IF EXISTS "volunteer_redemptions_fulfilledById_fkey";
ALTER TABLE IF EXISTS ONLY public.volunteer_projects DROP CONSTRAINT IF EXISTS "volunteer_projects_coordinatorId_fkey";
ALTER TABLE IF EXISTS ONLY public.volunteer_profiles DROP CONSTRAINT IF EXISTS "volunteer_profiles_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.volunteer_points DROP CONSTRAINT IF EXISTS "volunteer_points_volunteerId_fkey";
ALTER TABLE IF EXISTS ONLY public.volunteer_points DROP CONSTRAINT IF EXISTS "volunteer_points_issuedById_fkey";
ALTER TABLE IF EXISTS ONLY public.volunteer_matches DROP CONSTRAINT IF EXISTS "volunteer_matches_volunteerId_fkey";
ALTER TABLE IF EXISTS ONLY public.volunteer_matches DROP CONSTRAINT IF EXISTS "volunteer_matches_questId_fkey";
ALTER TABLE IF EXISTS ONLY public.volunteer_hours DROP CONSTRAINT IF EXISTS "volunteer_hours_volunteerId_fkey";
ALTER TABLE IF EXISTS ONLY public.volunteer_hours DROP CONSTRAINT IF EXISTS "volunteer_hours_projectId_fkey";
ALTER TABLE IF EXISTS ONLY public.volunteer_evidence DROP CONSTRAINT IF EXISTS "volunteer_evidence_volunteerId_fkey";
ALTER TABLE IF EXISTS ONLY public.volunteer_evidence DROP CONSTRAINT IF EXISTS "volunteer_evidence_reviewerId_fkey";
ALTER TABLE IF EXISTS ONLY public.volunteer_evidence DROP CONSTRAINT IF EXISTS "volunteer_evidence_questId_fkey";
ALTER TABLE IF EXISTS ONLY public.volunteer_evidence DROP CONSTRAINT IF EXISTS "volunteer_evidence_assignmentId_fkey";
ALTER TABLE IF EXISTS ONLY public.volunteer_certificates DROP CONSTRAINT IF EXISTS "volunteer_certificates_volunteerId_fkey";
ALTER TABLE IF EXISTS ONLY public.volunteer_applications DROP CONSTRAINT IF EXISTS "volunteer_applications_volunteerUserId_fkey";
ALTER TABLE IF EXISTS ONLY public.volunteer_applications DROP CONSTRAINT IF EXISTS "volunteer_applications_volunteerId_fkey";
ALTER TABLE IF EXISTS ONLY public.volunteer_applications DROP CONSTRAINT IF EXISTS "volunteer_applications_questId_fkey";
ALTER TABLE IF EXISTS ONLY public.volunteer_applications DROP CONSTRAINT IF EXISTS "volunteer_applications_projectId_fkey";
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS "users_schoolId_fkey";
ALTER TABLE IF EXISTS ONLY public.user_feedback DROP CONSTRAINT IF EXISTS "user_feedback_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.user_deletion_requests DROP CONSTRAINT IF EXISTS "user_deletion_requests_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.user_analytics DROP CONSTRAINT IF EXISTS "user_analytics_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.translations DROP CONSTRAINT IF EXISTS "translations_translatorId_fkey";
ALTER TABLE IF EXISTS ONLY public.translations DROP CONSTRAINT IF EXISTS "translations_storyId_fkey";
ALTER TABLE IF EXISTS ONLY public.survey_responses DROP CONSTRAINT IF EXISTS "survey_responses_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.survey_responses DROP CONSTRAINT IF EXISTS "survey_responses_surveyId_fkey";
ALTER TABLE IF EXISTS ONLY public.submissions DROP CONSTRAINT IF EXISTS "submissions_studentId_fkey";
ALTER TABLE IF EXISTS ONLY public.submissions DROP CONSTRAINT IF EXISTS "submissions_assignmentId_fkey";
ALTER TABLE IF EXISTS ONLY public.story_submissions DROP CONSTRAINT IF EXISTS "story_submissions_coverImageId_fkey";
ALTER TABLE IF EXISTS ONLY public.story_submissions DROP CONSTRAINT IF EXISTS "story_submissions_authorId_fkey";
ALTER TABLE IF EXISTS ONLY public.stories DROP CONSTRAINT IF EXISTS "stories_authorId_fkey";
ALTER TABLE IF EXISTS ONLY public.shop_products DROP CONSTRAINT IF EXISTS "shop_products_storyId_fkey";
ALTER TABLE IF EXISTS ONLY public.shop_products DROP CONSTRAINT IF EXISTS "shop_products_bookId_fkey";
ALTER TABLE IF EXISTS ONLY public.sessions DROP CONSTRAINT IF EXISTS "sessions_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.school_volunteers DROP CONSTRAINT IF EXISTS "school_volunteers_schoolId_fkey";
ALTER TABLE IF EXISTS ONLY public.school_resources DROP CONSTRAINT IF EXISTS "school_resources_schoolId_fkey";
ALTER TABLE IF EXISTS ONLY public.sample_content_access DROP CONSTRAINT IF EXISTS "sample_content_access_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.sample_content_access DROP CONSTRAINT IF EXISTS "sample_content_access_storyId_fkey";
ALTER TABLE IF EXISTS ONLY public.role_migrations DROP CONSTRAINT IF EXISTS "role_migrations_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.reviews DROP CONSTRAINT IF EXISTS "reviews_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.reviews DROP CONSTRAINT IF EXISTS "reviews_story_contentId_fkey";
ALTER TABLE IF EXISTS ONLY public.reviews DROP CONSTRAINT IF EXISTS "reviews_book_contentId_fkey";
ALTER TABLE IF EXISTS ONLY public.recurring_donations DROP CONSTRAINT IF EXISTS "recurring_donations_donorId_fkey";
ALTER TABLE IF EXISTS ONLY public.reading_progress DROP CONSTRAINT IF EXISTS "reading_progress_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.reading_progress DROP CONSTRAINT IF EXISTS "reading_progress_storyId_fkey";
ALTER TABLE IF EXISTS ONLY public.reading_lists DROP CONSTRAINT IF EXISTS "reading_lists_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.quests DROP CONSTRAINT IF EXISTS "quests_creatorId_fkey";
ALTER TABLE IF EXISTS ONLY public.quest_reviews DROP CONSTRAINT IF EXISTS "quest_reviews_reviewerId_fkey";
ALTER TABLE IF EXISTS ONLY public.quest_reviews DROP CONSTRAINT IF EXISTS "quest_reviews_questId_fkey";
ALTER TABLE IF EXISTS ONLY public.quest_assignments DROP CONSTRAINT IF EXISTS "quest_assignments_volunteerId_fkey";
ALTER TABLE IF EXISTS ONLY public.quest_assignments DROP CONSTRAINT IF EXISTS "quest_assignments_questId_fkey";
ALTER TABLE IF EXISTS ONLY public.publications DROP CONSTRAINT IF EXISTS "publications_submissionId_fkey";
ALTER TABLE IF EXISTS ONLY public.publications DROP CONSTRAINT IF EXISTS "publications_storyId_fkey";
ALTER TABLE IF EXISTS ONLY public.publications DROP CONSTRAINT IF EXISTS "publications_publishedBy_fkey";
ALTER TABLE IF EXISTS ONLY public.publications DROP CONSTRAINT IF EXISTS "publications_bookId_fkey";
ALTER TABLE IF EXISTS ONLY public.profiles DROP CONSTRAINT IF EXISTS "profiles_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.onboarding_progress DROP CONSTRAINT IF EXISTS "onboarding_progress_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.onboarding_activities DROP CONSTRAINT IF EXISTS "onboarding_activities_progressId_fkey";
ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS "notifications_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.mentor_relations DROP CONSTRAINT IF EXISTS "mentor_relations_mentorId_fkey";
ALTER TABLE IF EXISTS ONLY public.mentor_relations DROP CONSTRAINT IF EXISTS "mentor_relations_menteeId_fkey";
ALTER TABLE IF EXISTS ONLY public.media_files DROP CONSTRAINT IF EXISTS "media_files_uploadedById_fkey";
ALTER TABLE IF EXISTS ONLY public.lessons DROP CONSTRAINT IF EXISTS "lessons_classId_fkey";
ALTER TABLE IF EXISTS ONLY public.lesson_progress DROP CONSTRAINT IF EXISTS "lesson_progress_studentId_fkey";
ALTER TABLE IF EXISTS ONLY public.lesson_progress DROP CONSTRAINT IF EXISTS "lesson_progress_lessonId_fkey";
ALTER TABLE IF EXISTS ONLY public.illustrations DROP CONSTRAINT IF EXISTS "illustrations_artistId_fkey";
ALTER TABLE IF EXISTS ONLY public.feature_usage DROP CONSTRAINT IF EXISTS "feature_usage_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.entitlements DROP CONSTRAINT IF EXISTS "entitlements_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.entitlements DROP CONSTRAINT IF EXISTS "entitlements_storyId_fkey";
ALTER TABLE IF EXISTS ONLY public.entitlements DROP CONSTRAINT IF EXISTS "entitlements_bookId_fkey";
ALTER TABLE IF EXISTS ONLY public.donations DROP CONSTRAINT IF EXISTS "donations_donorId_fkey";
ALTER TABLE IF EXISTS ONLY public.donations DROP CONSTRAINT IF EXISTS "donations_campaignId_fkey";
ALTER TABLE IF EXISTS ONLY public.deletion_audit_logs DROP CONSTRAINT IF EXISTS "deletion_audit_logs_deletionRequestId_fkey";
ALTER TABLE IF EXISTS ONLY public.classes DROP CONSTRAINT IF EXISTS "classes_teacherId_fkey";
ALTER TABLE IF EXISTS ONLY public.classes DROP CONSTRAINT IF EXISTS "classes_schoolId_fkey";
ALTER TABLE IF EXISTS ONLY public.class_resources DROP CONSTRAINT IF EXISTS "class_resources_classId_fkey";
ALTER TABLE IF EXISTS ONLY public.class_enrollments DROP CONSTRAINT IF EXISTS "class_enrollments_studentId_fkey";
ALTER TABLE IF EXISTS ONLY public.class_enrollments DROP CONSTRAINT IF EXISTS "class_enrollments_classId_fkey";
ALTER TABLE IF EXISTS ONLY public.class_announcements DROP CONSTRAINT IF EXISTS "class_announcements_classId_fkey";
ALTER TABLE IF EXISTS ONLY public.chapters DROP CONSTRAINT IF EXISTS "chapters_storyId_fkey";
ALTER TABLE IF EXISTS ONLY public.campaign_updates DROP CONSTRAINT IF EXISTS "campaign_updates_campaignId_fkey";
ALTER TABLE IF EXISTS ONLY public.bulk_imports DROP CONSTRAINT IF EXISTS "bulk_imports_uploadedById_fkey";
ALTER TABLE IF EXISTS ONLY public.budgets DROP CONSTRAINT IF EXISTS "budgets_schoolId_fkey";
ALTER TABLE IF EXISTS ONLY public.budget_items DROP CONSTRAINT IF EXISTS "budget_items_budgetId_fkey";
ALTER TABLE IF EXISTS ONLY public.bookmarks DROP CONSTRAINT IF EXISTS "bookmarks_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.bookmarks DROP CONSTRAINT IF EXISTS "bookmarks_storyId_fkey";
ALTER TABLE IF EXISTS ONLY public.assignments DROP CONSTRAINT IF EXISTS "assignments_classId_fkey";
ALTER TABLE IF EXISTS ONLY public.activity_logs DROP CONSTRAINT IF EXISTS "activity_logs_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.accounts DROP CONSTRAINT IF EXISTS "accounts_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.ab_test_participants DROP CONSTRAINT IF EXISTS "ab_test_participants_userId_fkey";
DROP INDEX IF EXISTS public."workflow_history_storySubmissionId_idx";
DROP INDEX IF EXISTS public."workflow_history_performedById_idx";
DROP INDEX IF EXISTS public."volunteer_submissions_volunteerId_idx";
DROP INDEX IF EXISTS public.volunteer_submissions_status_idx;
DROP INDEX IF EXISTS public."volunteer_submissions_reviewerId_idx";
DROP INDEX IF EXISTS public.volunteer_submissions_priority_idx;
DROP INDEX IF EXISTS public.volunteer_projects_status_idx;
DROP INDEX IF EXISTS public."volunteer_profiles_userId_key";
DROP INDEX IF EXISTS public."volunteer_points_volunteerId_createdAt_idx";
DROP INDEX IF EXISTS public."volunteer_matches_volunteerId_questId_key";
DROP INDEX IF EXISTS public."volunteer_matches_questId_overallScore_idx";
DROP INDEX IF EXISTS public."volunteer_hours_volunteerId_idx";
DROP INDEX IF EXISTS public."volunteer_hours_projectId_idx";
DROP INDEX IF EXISTS public."volunteer_evidence_volunteerId_status_idx";
DROP INDEX IF EXISTS public."volunteer_evidence_status_submittedAt_idx";
DROP INDEX IF EXISTS public."volunteer_applications_questId_volunteerId_key";
DROP INDEX IF EXISTS public."volunteer_applications_projectId_volunteerId_key";
DROP INDEX IF EXISTS public.verification_tokens_token_key;
DROP INDEX IF EXISTS public.verification_tokens_identifier_token_key;
DROP INDEX IF EXISTS public."users_schoolId_idx";
DROP INDEX IF EXISTS public.users_role_idx;
DROP INDEX IF EXISTS public.users_email_key;
DROP INDEX IF EXISTS public.users_email_idx;
DROP INDEX IF EXISTS public."user_feedback_userRole_previousRole_idx";
DROP INDEX IF EXISTS public."user_feedback_page_createdAt_idx";
DROP INDEX IF EXISTS public."user_feedback_isResolved_priority_idx";
DROP INDEX IF EXISTS public."user_feedback_feedbackType_category_idx";
DROP INDEX IF EXISTS public."user_deletion_requests_userId_key";
DROP INDEX IF EXISTS public.user_deletion_requests_status_idx;
DROP INDEX IF EXISTS public."user_deletion_requests_softDeletedAt_idx";
DROP INDEX IF EXISTS public."user_deletion_requests_recoveryDeadline_idx";
DROP INDEX IF EXISTS public."user_deletion_requests_parentConfirmationToken_key";
DROP INDEX IF EXISTS public."user_deletion_requests_finalConfirmationToken_key";
DROP INDEX IF EXISTS public."user_analytics_userRole_migrationDate_idx";
DROP INDEX IF EXISTS public."user_analytics_userId_sessionStart_idx";
DROP INDEX IF EXISTS public."user_analytics_sessionId_key";
DROP INDEX IF EXISTS public."user_analytics_isNewUser_sessionStart_idx";
DROP INDEX IF EXISTS public."translations_storyId_toLanguage_key";
DROP INDEX IF EXISTS public.translations_status_idx;
DROP INDEX IF EXISTS public."survey_responses_userRole_createdAt_idx";
DROP INDEX IF EXISTS public."survey_responses_surveyId_userId_idx";
DROP INDEX IF EXISTS public."submissions_studentId_idx";
DROP INDEX IF EXISTS public."submissions_assignmentId_studentId_key";
DROP INDEX IF EXISTS public.story_submissions_status_idx;
DROP INDEX IF EXISTS public.story_submissions_priority_idx;
DROP INDEX IF EXISTS public."story_submissions_assigneeId_idx";
DROP INDEX IF EXISTS public.stories_language_idx;
DROP INDEX IF EXISTS public.stories_isbn_key;
DROP INDEX IF EXISTS public."stories_isPublished_idx";
DROP INDEX IF EXISTS public."stories_isPremium_idx";
DROP INDEX IF EXISTS public.shop_products_type_idx;
DROP INDEX IF EXISTS public.shop_products_status_idx;
DROP INDEX IF EXISTS public.shop_products_sku_key;
DROP INDEX IF EXISTS public.shop_products_featured_idx;
DROP INDEX IF EXISTS public."shop_products_bookId_idx";
DROP INDEX IF EXISTS public."sessions_sessionToken_key";
DROP INDEX IF EXISTS public."school_volunteers_schoolId_volunteerId_key";
DROP INDEX IF EXISTS public."sample_content_access_userId_storyId_key";
DROP INDEX IF EXISTS public."role_migrations_userId_initiatedAt_idx";
DROP INDEX IF EXISTS public."role_migrations_status_completedAt_idx";
DROP INDEX IF EXISTS public."role_migrations_fromRole_toRole_idx";
DROP INDEX IF EXISTS public."reviews_userId_idx";
DROP INDEX IF EXISTS public."reviews_userId_contentType_contentId_key";
DROP INDEX IF EXISTS public."reviews_contentType_contentId_idx";
DROP INDEX IF EXISTS public."recurring_donations_stripeSubscriptionId_key";
DROP INDEX IF EXISTS public.recurring_donations_status_idx;
DROP INDEX IF EXISTS public."recurring_donations_donorId_idx";
DROP INDEX IF EXISTS public."reading_progress_userId_storyId_key";
DROP INDEX IF EXISTS public."reading_progress_userId_idx";
DROP INDEX IF EXISTS public."reading_progress_lastReadAt_idx";
DROP INDEX IF EXISTS public."reading_lists_userId_idx";
DROP INDEX IF EXISTS public."quests_urgency_startDate_idx";
DROP INDEX IF EXISTS public.quests_status_type_idx;
DROP INDEX IF EXISTS public."quest_assignments_questId_volunteerId_key";
DROP INDEX IF EXISTS public.publications_status_idx;
DROP INDEX IF EXISTS public."publications_publishedAt_idx";
DROP INDEX IF EXISTS public."publications_isPremium_idx";
DROP INDEX IF EXISTS public.publications_featured_idx;
DROP INDEX IF EXISTS public."profiles_userId_key";
DROP INDEX IF EXISTS public."onboarding_progress_userId_key";
DROP INDEX IF EXISTS public."notifications_userId_read_idx";
DROP INDEX IF EXISTS public."micro_surveys_targetPage_trigger_idx";
DROP INDEX IF EXISTS public."micro_surveys_isActive_startDate_idx";
DROP INDEX IF EXISTS public."mentor_relations_mentorId_menteeId_key";
DROP INDEX IF EXISTS public."media_files_uploadedById_idx";
DROP INDEX IF EXISTS public."media_files_mimeType_idx";
DROP INDEX IF EXISTS public.media_files_folder_idx;
DROP INDEX IF EXISTS public."lessons_classId_lessonNumber_key";
DROP INDEX IF EXISTS public."lesson_progress_studentId_idx";
DROP INDEX IF EXISTS public."lesson_progress_lessonId_studentId_key";
DROP INDEX IF EXISTS public."feature_usage_userId_sessionId_featureName_key";
DROP INDEX IF EXISTS public."feature_usage_lastAccessed_userRole_idx";
DROP INDEX IF EXISTS public."feature_usage_featureName_userRole_idx";
DROP INDEX IF EXISTS public."entitlements_userId_idx";
DROP INDEX IF EXISTS public."entitlements_isActive_idx";
DROP INDEX IF EXISTS public."entitlements_expiresAt_idx";
DROP INDEX IF EXISTS public.entitlements_email_idx;
DROP INDEX IF EXISTS public."entitlements_bookId_idx";
DROP INDEX IF EXISTS public.donations_status_idx;
DROP INDEX IF EXISTS public."donations_donorId_idx";
DROP INDEX IF EXISTS public."donations_campaignId_idx";
DROP INDEX IF EXISTS public.donation_campaigns_status_idx;
DROP INDEX IF EXISTS public.donation_campaigns_featured_idx;
DROP INDEX IF EXISTS public."deletion_audit_logs_tableName_recordId_idx";
DROP INDEX IF EXISTS public."deletion_audit_logs_deletionRequestId_idx";
DROP INDEX IF EXISTS public.deletion_audit_logs_action_idx;
DROP INDEX IF EXISTS public."classes_teacherId_idx";
DROP INDEX IF EXISTS public."classes_schoolId_idx";
DROP INDEX IF EXISTS public.classes_code_key;
DROP INDEX IF EXISTS public."class_enrollments_studentId_idx";
DROP INDEX IF EXISTS public."class_enrollments_classId_studentId_key";
DROP INDEX IF EXISTS public."class_enrollments_classId_idx";
DROP INDEX IF EXISTS public."chapters_storyId_chapterNumber_key";
DROP INDEX IF EXISTS public."bulk_imports_uploadedById_idx";
DROP INDEX IF EXISTS public.bulk_imports_status_idx;
DROP INDEX IF EXISTS public."budgets_schoolId_year_key";
DROP INDEX IF EXISTS public.books_visibility_idx;
DROP INDEX IF EXISTS public."books_thumbnailGeneratedAt_idx";
DROP INDEX IF EXISTS public.books_language_idx;
DROP INDEX IF EXISTS public."books_isPublished_idx";
DROP INDEX IF EXISTS public."books_isPremium_idx";
DROP INDEX IF EXISTS public."bookmarks_userId_storyId_key";
DROP INDEX IF EXISTS public."bookmarks_userId_idx";
DROP INDEX IF EXISTS public."assignments_dueDate_idx";
DROP INDEX IF EXISTS public."assignments_classId_idx";
DROP INDEX IF EXISTS public."anonymization_logs_tableName_recordId_key";
DROP INDEX IF EXISTS public."anonymization_logs_tableName_idx";
DROP INDEX IF EXISTS public."anonymization_logs_createdAt_idx";
DROP INDEX IF EXISTS public."activity_logs_userId_idx";
DROP INDEX IF EXISTS public."activity_logs_entity_entityId_idx";
DROP INDEX IF EXISTS public."accounts_provider_providerAccountId_key";
DROP INDEX IF EXISTS public."ab_test_participants_testName_variant_idx";
DROP INDEX IF EXISTS public."ab_test_participants_testName_sessionId_key";
DROP INDEX IF EXISTS public."ab_test_participants_goalAchieved_conversionValue_idx";
ALTER TABLE IF EXISTS ONLY public.workflow_history DROP CONSTRAINT IF EXISTS workflow_history_pkey;
ALTER TABLE IF EXISTS ONLY public.welcome_messages DROP CONSTRAINT IF EXISTS welcome_messages_pkey;
ALTER TABLE IF EXISTS ONLY public.volunteer_submissions DROP CONSTRAINT IF EXISTS volunteer_submissions_pkey;
ALTER TABLE IF EXISTS ONLY public.volunteer_rewards DROP CONSTRAINT IF EXISTS volunteer_rewards_pkey;
ALTER TABLE IF EXISTS ONLY public.volunteer_redemptions DROP CONSTRAINT IF EXISTS volunteer_redemptions_pkey;
ALTER TABLE IF EXISTS ONLY public.volunteer_projects DROP CONSTRAINT IF EXISTS volunteer_projects_pkey;
ALTER TABLE IF EXISTS ONLY public.volunteer_profiles DROP CONSTRAINT IF EXISTS volunteer_profiles_pkey;
ALTER TABLE IF EXISTS ONLY public.volunteer_points DROP CONSTRAINT IF EXISTS volunteer_points_pkey;
ALTER TABLE IF EXISTS ONLY public.volunteer_matches DROP CONSTRAINT IF EXISTS volunteer_matches_pkey;
ALTER TABLE IF EXISTS ONLY public.volunteer_hours DROP CONSTRAINT IF EXISTS volunteer_hours_pkey;
ALTER TABLE IF EXISTS ONLY public.volunteer_evidence DROP CONSTRAINT IF EXISTS volunteer_evidence_pkey;
ALTER TABLE IF EXISTS ONLY public.volunteer_certificates DROP CONSTRAINT IF EXISTS volunteer_certificates_pkey;
ALTER TABLE IF EXISTS ONLY public.volunteer_applications DROP CONSTRAINT IF EXISTS volunteer_applications_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.user_feedback DROP CONSTRAINT IF EXISTS user_feedback_pkey;
ALTER TABLE IF EXISTS ONLY public.user_deletion_requests DROP CONSTRAINT IF EXISTS user_deletion_requests_pkey;
ALTER TABLE IF EXISTS ONLY public.user_analytics DROP CONSTRAINT IF EXISTS user_analytics_pkey;
ALTER TABLE IF EXISTS ONLY public.translations DROP CONSTRAINT IF EXISTS translations_pkey;
ALTER TABLE IF EXISTS ONLY public.survey_responses DROP CONSTRAINT IF EXISTS survey_responses_pkey;
ALTER TABLE IF EXISTS ONLY public.submissions DROP CONSTRAINT IF EXISTS submissions_pkey;
ALTER TABLE IF EXISTS ONLY public.story_submissions DROP CONSTRAINT IF EXISTS story_submissions_pkey;
ALTER TABLE IF EXISTS ONLY public.stories DROP CONSTRAINT IF EXISTS stories_pkey;
ALTER TABLE IF EXISTS ONLY public.shop_products DROP CONSTRAINT IF EXISTS shop_products_pkey;
ALTER TABLE IF EXISTS ONLY public.sessions DROP CONSTRAINT IF EXISTS sessions_pkey;
ALTER TABLE IF EXISTS ONLY public.schools DROP CONSTRAINT IF EXISTS schools_pkey;
ALTER TABLE IF EXISTS ONLY public.school_volunteers DROP CONSTRAINT IF EXISTS school_volunteers_pkey;
ALTER TABLE IF EXISTS ONLY public.school_resources DROP CONSTRAINT IF EXISTS school_resources_pkey;
ALTER TABLE IF EXISTS ONLY public.sample_content_access DROP CONSTRAINT IF EXISTS sample_content_access_pkey;
ALTER TABLE IF EXISTS ONLY public.role_migrations DROP CONSTRAINT IF EXISTS role_migrations_pkey;
ALTER TABLE IF EXISTS ONLY public.reviews DROP CONSTRAINT IF EXISTS reviews_pkey;
ALTER TABLE IF EXISTS ONLY public.recurring_donations DROP CONSTRAINT IF EXISTS recurring_donations_pkey;
ALTER TABLE IF EXISTS ONLY public.reading_progress DROP CONSTRAINT IF EXISTS reading_progress_pkey;
ALTER TABLE IF EXISTS ONLY public.reading_lists DROP CONSTRAINT IF EXISTS reading_lists_pkey;
ALTER TABLE IF EXISTS ONLY public.quests DROP CONSTRAINT IF EXISTS quests_pkey;
ALTER TABLE IF EXISTS ONLY public.quest_reviews DROP CONSTRAINT IF EXISTS quest_reviews_pkey;
ALTER TABLE IF EXISTS ONLY public.quest_assignments DROP CONSTRAINT IF EXISTS quest_assignments_pkey;
ALTER TABLE IF EXISTS ONLY public.publications DROP CONSTRAINT IF EXISTS publications_pkey;
ALTER TABLE IF EXISTS ONLY public.profiles DROP CONSTRAINT IF EXISTS profiles_pkey;
ALTER TABLE IF EXISTS ONLY public.onboarding_progress DROP CONSTRAINT IF EXISTS onboarding_progress_pkey;
ALTER TABLE IF EXISTS ONLY public.onboarding_activities DROP CONSTRAINT IF EXISTS onboarding_activities_pkey;
ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS notifications_pkey;
ALTER TABLE IF EXISTS ONLY public.micro_surveys DROP CONSTRAINT IF EXISTS micro_surveys_pkey;
ALTER TABLE IF EXISTS ONLY public.mentor_relations DROP CONSTRAINT IF EXISTS mentor_relations_pkey;
ALTER TABLE IF EXISTS ONLY public.media_files DROP CONSTRAINT IF EXISTS media_files_pkey;
ALTER TABLE IF EXISTS ONLY public.lessons DROP CONSTRAINT IF EXISTS lessons_pkey;
ALTER TABLE IF EXISTS ONLY public.lesson_progress DROP CONSTRAINT IF EXISTS lesson_progress_pkey;
ALTER TABLE IF EXISTS ONLY public.illustrations DROP CONSTRAINT IF EXISTS illustrations_pkey;
ALTER TABLE IF EXISTS ONLY public.feature_usage DROP CONSTRAINT IF EXISTS feature_usage_pkey;
ALTER TABLE IF EXISTS ONLY public.entitlements DROP CONSTRAINT IF EXISTS entitlements_pkey;
ALTER TABLE IF EXISTS ONLY public.donations DROP CONSTRAINT IF EXISTS donations_pkey;
ALTER TABLE IF EXISTS ONLY public.donation_campaigns DROP CONSTRAINT IF EXISTS donation_campaigns_pkey;
ALTER TABLE IF EXISTS ONLY public.deletion_audit_logs DROP CONSTRAINT IF EXISTS deletion_audit_logs_pkey;
ALTER TABLE IF EXISTS ONLY public.classes DROP CONSTRAINT IF EXISTS classes_pkey;
ALTER TABLE IF EXISTS ONLY public.class_resources DROP CONSTRAINT IF EXISTS class_resources_pkey;
ALTER TABLE IF EXISTS ONLY public.class_enrollments DROP CONSTRAINT IF EXISTS class_enrollments_pkey;
ALTER TABLE IF EXISTS ONLY public.class_announcements DROP CONSTRAINT IF EXISTS class_announcements_pkey;
ALTER TABLE IF EXISTS ONLY public.chapters DROP CONSTRAINT IF EXISTS chapters_pkey;
ALTER TABLE IF EXISTS ONLY public.campaign_updates DROP CONSTRAINT IF EXISTS campaign_updates_pkey;
ALTER TABLE IF EXISTS ONLY public.bulk_imports DROP CONSTRAINT IF EXISTS bulk_imports_pkey;
ALTER TABLE IF EXISTS ONLY public.budgets DROP CONSTRAINT IF EXISTS budgets_pkey;
ALTER TABLE IF EXISTS ONLY public.budget_items DROP CONSTRAINT IF EXISTS budget_items_pkey;
ALTER TABLE IF EXISTS ONLY public.books DROP CONSTRAINT IF EXISTS books_pkey;
ALTER TABLE IF EXISTS ONLY public.bookmarks DROP CONSTRAINT IF EXISTS bookmarks_pkey;
ALTER TABLE IF EXISTS ONLY public.assignments DROP CONSTRAINT IF EXISTS assignments_pkey;
ALTER TABLE IF EXISTS ONLY public.anonymization_logs DROP CONSTRAINT IF EXISTS anonymization_logs_pkey;
ALTER TABLE IF EXISTS ONLY public.activity_logs DROP CONSTRAINT IF EXISTS activity_logs_pkey;
ALTER TABLE IF EXISTS ONLY public.accounts DROP CONSTRAINT IF EXISTS accounts_pkey;
ALTER TABLE IF EXISTS ONLY public.ab_test_participants DROP CONSTRAINT IF EXISTS ab_test_participants_pkey;
DROP TABLE IF EXISTS public.workflow_history;
DROP TABLE IF EXISTS public.welcome_messages;
DROP TABLE IF EXISTS public.volunteer_submissions;
DROP TABLE IF EXISTS public.volunteer_rewards;
DROP TABLE IF EXISTS public.volunteer_redemptions;
DROP TABLE IF EXISTS public.volunteer_projects;
DROP TABLE IF EXISTS public.volunteer_profiles;
DROP TABLE IF EXISTS public.volunteer_points;
DROP TABLE IF EXISTS public.volunteer_matches;
DROP TABLE IF EXISTS public.volunteer_hours;
DROP TABLE IF EXISTS public.volunteer_evidence;
DROP TABLE IF EXISTS public.volunteer_certificates;
DROP TABLE IF EXISTS public.volunteer_applications;
DROP TABLE IF EXISTS public.verification_tokens;
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.user_feedback;
DROP TABLE IF EXISTS public.user_deletion_requests;
DROP TABLE IF EXISTS public.user_analytics;
DROP TABLE IF EXISTS public.translations;
DROP TABLE IF EXISTS public.survey_responses;
DROP TABLE IF EXISTS public.submissions;
DROP TABLE IF EXISTS public.story_submissions;
DROP TABLE IF EXISTS public.stories;
DROP TABLE IF EXISTS public.shop_products;
DROP TABLE IF EXISTS public.sessions;
DROP TABLE IF EXISTS public.schools;
DROP TABLE IF EXISTS public.school_volunteers;
DROP TABLE IF EXISTS public.school_resources;
DROP TABLE IF EXISTS public.sample_content_access;
DROP TABLE IF EXISTS public.role_migrations;
DROP TABLE IF EXISTS public.reviews;
DROP TABLE IF EXISTS public.recurring_donations;
DROP TABLE IF EXISTS public.reading_progress;
DROP TABLE IF EXISTS public.reading_lists;
DROP TABLE IF EXISTS public.quests;
DROP TABLE IF EXISTS public.quest_reviews;
DROP TABLE IF EXISTS public.quest_assignments;
DROP TABLE IF EXISTS public.publications;
DROP TABLE IF EXISTS public.profiles;
DROP TABLE IF EXISTS public.onboarding_progress;
DROP TABLE IF EXISTS public.onboarding_activities;
DROP TABLE IF EXISTS public.notifications;
DROP TABLE IF EXISTS public.micro_surveys;
DROP TABLE IF EXISTS public.mentor_relations;
DROP TABLE IF EXISTS public.media_files;
DROP TABLE IF EXISTS public.lessons;
DROP TABLE IF EXISTS public.lesson_progress;
DROP TABLE IF EXISTS public.illustrations;
DROP TABLE IF EXISTS public.feature_usage;
DROP TABLE IF EXISTS public.entitlements;
DROP TABLE IF EXISTS public.donations;
DROP TABLE IF EXISTS public.donation_campaigns;
DROP TABLE IF EXISTS public.deletion_audit_logs;
DROP TABLE IF EXISTS public.classes;
DROP TABLE IF EXISTS public.class_resources;
DROP TABLE IF EXISTS public.class_enrollments;
DROP TABLE IF EXISTS public.class_announcements;
DROP TABLE IF EXISTS public.chapters;
DROP TABLE IF EXISTS public.campaign_updates;
DROP TABLE IF EXISTS public.bulk_imports;
DROP TABLE IF EXISTS public.budgets;
DROP TABLE IF EXISTS public.budget_items;
DROP TABLE IF EXISTS public.books;
DROP TABLE IF EXISTS public.bookmarks;
DROP TABLE IF EXISTS public.assignments;
DROP TABLE IF EXISTS public.anonymization_logs;
DROP TABLE IF EXISTS public.activity_logs;
DROP TABLE IF EXISTS public.accounts;
DROP TABLE IF EXISTS public.ab_test_participants;
DROP TYPE IF EXISTS public."WelcomeType";
DROP TYPE IF EXISTS public."VolunteerType";
DROP TYPE IF EXISTS public."VolunteerSubmissionType";
DROP TYPE IF EXISTS public."VolunteerSubmissionStatus";
DROP TYPE IF EXISTS public."VolunteerLevel";
DROP TYPE IF EXISTS public."VerificationStatus";
DROP TYPE IF EXISTS public."UserRole";
DROP TYPE IF EXISTS public."UrgencyLevel";
DROP TYPE IF EXISTS public."UnlockPolicy";
DROP TYPE IF EXISTS public."TranslationStatus";
DROP TYPE IF EXISTS public."SurveyTrigger";
DROP TYPE IF EXISTS public."SurveyFrequency";
DROP TYPE IF EXISTS public."SurveyDisplayType";
DROP TYPE IF EXISTS public."SubscriptionStatus";
DROP TYPE IF EXISTS public."SubscriptionPlan";
DROP TYPE IF EXISTS public."SubmissionStatus";
DROP TYPE IF EXISTS public."StorySubmissionStatus";
DROP TYPE IF EXISTS public."ShopProductType";
DROP TYPE IF EXISTS public."ShopProductStatus";
DROP TYPE IF EXISTS public."SentimentType";
DROP TYPE IF EXISTS public."SchoolType";
DROP TYPE IF EXISTS public."SchoolStatus";
DROP TYPE IF EXISTS public."SchoolResourceType";
DROP TYPE IF EXISTS public."RewardType";
DROP TYPE IF EXISTS public."RewardCategory";
DROP TYPE IF EXISTS public."ResourceType";
DROP TYPE IF EXISTS public."RedemptionStatus";
DROP TYPE IF EXISTS public."RecurringStatus";
DROP TYPE IF EXISTS public."QuestStatus";
DROP TYPE IF EXISTS public."QuestCategory";
DROP TYPE IF EXISTS public."PublicationStatus";
DROP TYPE IF EXISTS public."ProjectStatus";
DROP TYPE IF EXISTS public."ProductType";
DROP TYPE IF EXISTS public."ProductStatus";
DROP TYPE IF EXISTS public."Priority";
DROP TYPE IF EXISTS public."PointTransactionType";
DROP TYPE IF EXISTS public."PaymentStatus";
DROP TYPE IF EXISTS public."ParentalConsentStatus";
DROP TYPE IF EXISTS public."OrderStatus";
DROP TYPE IF EXISTS public."OnboardingStep";
DROP TYPE IF EXISTS public."NotificationType";
DROP TYPE IF EXISTS public."MigrationType";
DROP TYPE IF EXISTS public."MigrationStatus";
DROP TYPE IF EXISTS public."MentorshipStatus";
DROP TYPE IF EXISTS public."MentorLevel";
DROP TYPE IF EXISTS public."ImportType";
DROP TYPE IF EXISTS public."ImportStatus";
DROP TYPE IF EXISTS public."IllustrationStatus";
DROP TYPE IF EXISTS public."FulfillmentStatus";
DROP TYPE IF EXISTS public."FeedbackType";
DROP TYPE IF EXISTS public."FeedbackSeverity";
DROP TYPE IF EXISTS public."FeedbackCategory";
DROP TYPE IF EXISTS public."EvidenceType";
DROP TYPE IF EXISTS public."EvidenceStatus";
DROP TYPE IF EXISTS public."EntitlementType";
DROP TYPE IF EXISTS public."EntitlementScope";
DROP TYPE IF EXISTS public."EnrollmentStatus";
DROP TYPE IF EXISTS public."DonationType";
DROP TYPE IF EXISTS public."DonationStatus";
DROP TYPE IF EXISTS public."DonationFrequency";
DROP TYPE IF EXISTS public."DifficultyLevel";
DROP TYPE IF EXISTS public."DeletionStatus";
DROP TYPE IF EXISTS public."DeletionAction";
DROP TYPE IF EXISTS public."ContentVisibility";
DROP TYPE IF EXISTS public."ContentType";
DROP TYPE IF EXISTS public."CertificateType";
DROP TYPE IF EXISTS public."CampaignStatus";
DROP TYPE IF EXISTS public."BookVisibility";
DROP TYPE IF EXISTS public."AssignmentType";
DROP TYPE IF EXISTS public."AssignmentStatus";
DROP TYPE IF EXISTS public."ApplicationStatus";
DROP TYPE IF EXISTS public."AnnouncementPriority";
DROP TYPE IF EXISTS public."AgeVerificationStatus";
DROP TYPE IF EXISTS public."ActorType";
DROP TYPE IF EXISTS public."ActivityType";
DROP EXTENSION IF EXISTS pgcrypto;
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
    'CUSTOMER',
    'LEARNER',
    'TEACHER',
    'INSTITUTION',
    'VOLUNTEER',
    'EDITOR',
    'PUBLISHER',
    'ADMIN'
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
    thumbnails jsonb,
    "thumbnailGeneratedAt" timestamp(3) without time zone,
    "thumbnailConfig" jsonb,
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
    "updatedAt" timestamp(3) without time zone NOT NULL
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
    "isMinor" boolean DEFAULT false NOT NULL,
    "ageVerificationStatus" public."AgeVerificationStatus" DEFAULT 'PENDING'::public."AgeVerificationStatus" NOT NULL,
    "parentalConsentRequired" boolean DEFAULT false NOT NULL,
    "parentalConsentStatus" public."ParentalConsentStatus" DEFAULT 'NOT_REQUIRED'::public."ParentalConsentStatus" NOT NULL,
    "parentalConsentDate" timestamp(3) without time zone,
    "parentEmail" text,
    "parentName" text,
    "coppaCompliant" boolean DEFAULT false NOT NULL,
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
    "updatedAt" timestamp(3) without time zone NOT NULL
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
    "totalPages" integer,
    "currentPosition" text,
    "percentComplete" double precision DEFAULT 0 NOT NULL,
    "totalReadingTime" integer DEFAULT 0 NOT NULL,
    "lastReadAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "startedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "completedAt" timestamp(3) without time zone,
    "isCompleted" boolean DEFAULT false NOT NULL,
    notes text[]
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
    summary text,
    language text NOT NULL,
    category text NOT NULL,
    "ageGroup" text NOT NULL,
    status public."StorySubmissionStatus" DEFAULT 'DRAFT'::public."StorySubmissionStatus" NOT NULL,
    priority public."Priority" DEFAULT 'MEDIUM'::public."Priority" NOT NULL,
    "reviewerId" text,
    "assigneeId" text,
    "dueDate" timestamp(3) without time zone,
    "reviewNotes" text,
    "editorialNotes" text,
    "publishDate" timestamp(3) without time zone,
    compensation numeric(10,2),
    tags text[],
    "coverImageId" text,
    attachments text[],
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
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
    password text,
    role public."UserRole" DEFAULT 'CUSTOMER'::public."UserRole" NOT NULL,
    "tokenVersion" integer DEFAULT 1 NOT NULL,
    "schoolId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    "deletionRequestId" text
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
    "questId" text,
    "volunteerId" text NOT NULL,
    "volunteerUserId" text NOT NULL,
    motivation text NOT NULL,
    experience text NOT NULL,
    availability text NOT NULL,
    "coverLetter" text,
    status public."ApplicationStatus" DEFAULT 'PENDING'::public."ApplicationStatus" NOT NULL,
    "reviewedBy" text,
    "reviewedAt" timestamp(3) without time zone,
    notes text,
    "rejectionReason" text,
    "matchScore" double precision,
    "isRecommended" boolean DEFAULT false NOT NULL,
    "selectionReason" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
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

COPY public.books (id, title, subtitle, summary, "authorName", "authorAlias", "authorAge", "authorLocation", "coAuthors", language, "ageRange", "readingLevel", category, genres, subjects, tags, "coverImage", "pdfKey", "pdfFrontCover", "pdfBackCover", "pageLayout", "pageCount", "previewPages", thumbnails, "thumbnailGeneratedAt", "thumbnailConfig", drm, "downloadAllowed", "printAllowed", "isPublished", "publishedAt", featured, "isPremium", price, currency, visibility, "viewCount", "downloadCount", rating, "createdAt", "updatedAt") FROM stdin;
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
\.


--
-- Data for Name: entitlements; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.entitlements (id, "userId", email, "bookId", "storyId", "licenseId", "grantReason", type, scope, "grantedAt", "expiresAt", "isActive", "activatedAt", "lastAccessedAt", "accessCount", "downloadCount", "maxDownloads", "ipRestrictions", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: feature_usage; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.feature_usage (id, "userId", "sessionId", "featureName", "featureCategory", "accessCount", "totalTimeSpent", "avgTimePerAccess", "lastAccessed", "userRole", "deviceType", "taskCompleted", "errorEncountered", "helpSought", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: illustrations; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.illustrations (id, "storyId", "artistId", title, description, "fileUrl", "thumbnailUrl", "position", status, compensation, license, "createdAt", "updatedAt") FROM stdin;
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
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.profiles (id, "userId", "firstName", "lastName", organization, bio, location, phone, "dateOfBirth", language, timezone, "isMinor", "ageVerificationStatus", "parentalConsentRequired", "parentalConsentStatus", "parentalConsentDate", "parentEmail", "parentName", "coppaCompliant", "teachingLevel", subjects, "studentCount", skills, availability, experience, "emailNotifications", "pushNotifications", newsletter, "createdAt", "updatedAt") FROM stdin;
cmfqynb3f0001bp3u3z0jl81h	cmfqynb3f0000bp3u3o5xsg8b	Emma	Student	\N	Curious student eager to learn through engaging stories	Tokyo, Japan	\N	2010-05-15 00:00:00	en	Asia/Tokyo	f	PENDING	f	NOT_REQUIRED	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	t	t	t	2025-09-19 14:54:20.139	2025-09-19 14:54:20.139
cmfqynb3r0003bp3umxbadghb	cmfqynb3r0002bp3ugir1j3zj	Sarah	Teacher	Seoul International School	Experienced teacher managing classes and student assignments	Seoul, Korea	\N	\N	en	Asia/Seoul	f	PENDING	f	NOT_REQUIRED	\N	\N	\N	f	Middle School	{English,Literature}	25	\N	\N	\N	t	t	t	2025-09-19 14:54:20.139	2025-09-19 14:54:20.139
cmfqynb3x0009bp3ufg5prnca	cmfqynb3x0008bp3ue9ksma8n	Jane	StoryManager	1001 Stories Editorial Team	Editorial specialist reviewing and improving submitted stories	New York, USA	\N	\N	en	America/New_York	f	PENDING	f	NOT_REQUIRED	\N	\N	\N	f	\N	\N	\N	{"Editorial Review","Content Quality","Educational Assessment"}	\N	8 years in educational content review and editing	t	t	t	2025-09-19 14:54:20.139	2025-09-19 14:54:20.139
cmfqynb3w0005bp3ujk0z0xhi	cmfqynb3w0004bp3uotv608sh	Admin	User	1001 Stories	System administrator with full access to all features	Seoul, Korea	\N	\N	en	Asia/Seoul	f	PENDING	f	NOT_REQUIRED	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	t	t	t	2025-09-19 14:54:20.139	2025-09-19 14:54:20.139
cmfqynb3y000dbp3uoiaqa3pq	cmfqynb3y000cbp3uevcsxgjt	Lisa	ContentAdmin	1001 Stories Content Team	Senior content administrator with final approval authority	Toronto, Canada	\N	\N	en	America/Toronto	f	PENDING	f	NOT_REQUIRED	\N	\N	\N	f	\N	\N	\N	{"Content Governance","Policy Management","Quality Assurance"}	\N	12 years in educational content management and policy	t	t	t	2025-09-19 14:54:20.139	2025-09-19 14:54:20.139
cmfqynb3x0007bp3uj7ntkr73	cmfqynb3x0006bp3ucps5laa2	Michael	Volunteer	\N	Passionate volunteer creating educational stories for global impact	San Francisco, USA	\N	\N	en	America/Los_Angeles	f	PENDING	f	NOT_REQUIRED	\N	\N	\N	f	\N	\N	\N	{Writing,Translation,"Content Creation"}	Weekends, 5-10 hours per week	Creative writing and educational content development	t	t	t	2025-09-19 14:54:20.139	2025-09-19 14:54:20.139
cmfqynb3y000bbp3u77icirk7	cmfqynb3y000abp3uwu0vp9ck	David	BookManager	1001 Stories Publishing Team	Publishing specialist managing book formats and publication pipeline	London, UK	\N	\N	en	Europe/London	f	PENDING	f	NOT_REQUIRED	\N	\N	\N	f	\N	\N	\N	{Publishing,"Format Management","Production Planning"}	\N	10 years in educational publishing and format optimization	t	t	t	2025-09-19 14:54:20.139	2025-09-19 14:54:20.139
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

COPY public.reading_progress (id, "userId", "storyId", "currentChapter", "currentPage", "totalPages", "currentPosition", "percentComplete", "totalReadingTime", "lastReadAt", "startedAt", "completedAt", "isCompleted", notes) FROM stdin;
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
\.


--
-- Data for Name: story_submissions; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.story_submissions (id, "authorId", title, content, summary, language, category, "ageGroup", status, priority, "reviewerId", "assigneeId", "dueDate", "reviewNotes", "editorialNotes", "publishDate", compensation, tags, "coverImageId", attachments, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: submissions; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.submissions (id, "assignmentId", "studentId", "submittedAt", content, attachments, grade, feedback, status) FROM stdin;
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
cmfqy6a4c0000tf01kw2jrugn	\N	4o52byr2kymzy75llvhrxdmfqy69a0	\N	t	\N	2025-09-19 14:41:04.632	2025-09-19 14:42:11.727	66	3	4	100	/	/login	[{"page": "/", "timeSpent": 6, "timestamp": 1758292865692}, {"page": "/", "timeSpent": 1726, "timestamp": 1758292865698}, {"page": "/login", "timeSpent": 995, "timestamp": 1758292867424}]	{}	[{"data": {"page": "/"}, "page": "/", "action": "page_view", "timestamp": 1758292865692}, {"data": {"page": "/"}, "page": "/", "action": "page_view", "timestamp": 1758292865698}, {"data": {"page": "/login"}, "page": "/login", "action": "page_view", "timestamp": 1758292867424}]	{}	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	tablet	Chrome	macOS	1470x956	21	f	f	2025-09-19 14:41:05.722	2025-09-19 14:42:11.752
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

COPY public.users (id, email, "emailVerified", name, image, password, role, "tokenVersion", "schoolId", "createdAt", "updatedAt", "deletedAt", "deletionRequestId") FROM stdin;
5869876a-c842-4f6a-a853-ecae65ef5d86	teacher@test.edu	2025-09-05 05:16:55.635	Test Teacher	\N	$2b$10$47qz//ue.bzCx7s2lxOhsur8kDdWtBbNoW4wF0zh0y4KfbkyKrkAe	TEACHER	1	\N	2025-09-05 05:16:55.635	2025-09-05 05:16:55.635	\N	\N
67d9b259-1ffa-4dca-8d9f-5f0e985b169a	student1@test.edu	2025-09-05 05:16:55.635	Test Student 1	\N	$2b$10$vf2eX6Fzpy3mlqRS7bi9U.qp5T257k8hLPxhzqb385QEOahSd3d1.	LEARNER	1	\N	2025-09-05 05:16:55.635	2025-09-05 05:16:55.635	\N	\N
3319ef13-e24e-432f-8ce2-a85cceca379f	student2@test.edu	2025-09-05 05:16:55.635	Test Student 2	\N	$2b$10$vf2eX6Fzpy3mlqRS7bi9U.qp5T257k8hLPxhzqb385QEOahSd3d1.	LEARNER	1	\N	2025-09-05 05:16:55.635	2025-09-05 05:16:55.635	\N	\N
cmfqynb3f0000bp3u3o5xsg8b	learner@test.1001stories.org	2025-09-19 14:54:20.138	Learner Test User	\N	$2b$12$oIME.77bx67ryXVeeFM20uNFhM2L29ao9zk9BHP.WDAs1zeI7hns.	LEARNER	1	\N	2025-09-19 14:54:20.139	2025-09-19 14:54:20.139	\N	\N
cmfqynb3r0002bp3ugir1j3zj	teacher@test.1001stories.org	2025-09-19 14:54:20.137	Teacher Test User	\N	$2b$12$oIME.77bx67ryXVeeFM20uNFhM2L29ao9zk9BHP.WDAs1zeI7hns.	TEACHER	1	\N	2025-09-19 14:54:20.139	2025-09-19 14:54:20.139	\N	\N
cmfqynb3w0004bp3uotv608sh	admin@test.1001stories.org	2025-09-19 14:54:20.137	Admin Test User	\N	$2b$12$oIME.77bx67ryXVeeFM20uNFhM2L29ao9zk9BHP.WDAs1zeI7hns.	ADMIN	1	\N	2025-09-19 14:54:20.139	2025-09-19 14:54:20.139	\N	\N
cmfqynb3x0008bp3ue9ksma8n	story-manager@test.1001stories.org	2025-09-19 14:54:20.138	Story Manager Test User	\N	$2b$12$oIME.77bx67ryXVeeFM20uNFhM2L29ao9zk9BHP.WDAs1zeI7hns.	LEARNER	1	\N	2025-09-19 14:54:20.139	2025-09-19 14:54:20.139	\N	\N
cmfqynb3x0006bp3ucps5laa2	volunteer@test.1001stories.org	2025-09-19 14:54:20.137	Volunteer Test User	\N	$2b$12$oIME.77bx67ryXVeeFM20uNFhM2L29ao9zk9BHP.WDAs1zeI7hns.	VOLUNTEER	1	\N	2025-09-19 14:54:20.139	2025-09-19 14:54:20.139	\N	\N
cmfqynb3y000cbp3uevcsxgjt	content-admin@test.1001stories.org	2025-09-19 14:54:20.138	Content Admin Test User	\N	$2b$12$oIME.77bx67ryXVeeFM20uNFhM2L29ao9zk9BHP.WDAs1zeI7hns.	LEARNER	1	\N	2025-09-19 14:54:20.139	2025-09-19 14:54:20.139	\N	\N
cmfqynb3y000abp3uwu0vp9ck	book-manager@test.1001stories.org	2025-09-19 14:54:20.138	Book Manager Test User	\N	$2b$12$oIME.77bx67ryXVeeFM20uNFhM2L29ao9zk9BHP.WDAs1zeI7hns.	LEARNER	1	\N	2025-09-19 14:54:20.139	2025-09-19 14:54:20.139	\N	\N
\.


--
-- Data for Name: verification_tokens; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.verification_tokens (identifier, token, expires) FROM stdin;
\.


--
-- Data for Name: volunteer_applications; Type: TABLE DATA; Schema: public; Owner: stories_user
--

COPY public.volunteer_applications (id, "projectId", "questId", "volunteerId", "volunteerUserId", motivation, experience, availability, "coverLetter", status, "reviewedBy", "reviewedAt", notes, "rejectionReason", "matchScore", "isRecommended", "selectionReason", "createdAt", "updatedAt") FROM stdin;
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
-- Name: entitlements entitlements_storyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stories_user
--

ALTER TABLE ONLY public.entitlements
    ADD CONSTRAINT "entitlements_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES public.stories(id) ON UPDATE CASCADE ON DELETE CASCADE;


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

\unrestrict o7vhHMw2EVHn9CM2pPDFKqm1k2bBPD8ygYotFP9Wat45yUarpIJlfwXREXEOfeM

