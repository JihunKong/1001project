-- Create test WRITER account for Playwright tests
-- Email: volunteer@test.1001stories.org
-- Password: test123 (bcrypt hash below)
-- Role: WRITER

BEGIN;

-- Insert User
INSERT INTO "users" (id, email, name, "emailVerified", image, role, "createdAt", "updatedAt")
VALUES (
  'test-writer-001',
  'volunteer@test.1001stories.org',
  'Test Writer',
  NOW(),
  NULL,
  'WRITER',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- Insert Profile
INSERT INTO "profiles" (
  id, "userId", "firstName", "lastName", organization, bio, phone, language, timezone,
  "dateOfBirth", "isMinor", "ageVerificationStatus", "parentalConsentStatus",
  "createdAt", "updatedAt"
)
VALUES (
  'test-writer-profile-001',
  'test-writer-001',
  'Test',
  'Writer',
  NULL,
  'Test writer for E2E tests',
  NULL,
  'en',
  'UTC',
  '1990-01-01',
  false,
  'VERIFIED_ADULT',
  'NOT_REQUIRED',
  NOW(),
  NOW()
)
ON CONFLICT ("userId") DO NOTHING;

-- Insert Subscription
INSERT INTO "subscriptions" (
  id, "userId", plan, status, "createdAt", "updatedAt"
)
VALUES (
  'test-writer-sub-001',
  'test-writer-001',
  'FREE',
  'ACTIVE',
  NOW(),
  NOW()
)
ON CONFLICT ("userId") DO NOTHING;

-- Insert VolunteerProfile
INSERT INTO "volunteer_profiles" (
  id, "userId", "verificationStatus", "languageLevels", "availableSlots",
  "createdAt", "updatedAt"
)
VALUES (
  'test-writer-vol-001',
  'test-writer-001',
  'PENDING',
  '{}',
  '{}',
  NOW(),
  NOW()
)
ON CONFLICT ("userId") DO NOTHING;

COMMIT;

-- Verify the user was created
SELECT id, email, name, role FROM "users" WHERE email = 'volunteer@test.1001stories.org';
