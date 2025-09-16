-- Phase 5 Publishing Workflow Test Accounts
-- 비밀번호는 모두 bcrypt로 해시된 값입니다

-- 테스트 계정들 생성 (비밀번호는 각 역할명+123)
-- bcrypt hash for 'learner123'
-- bcrypt hash for 'teacher123'
-- bcrypt hash for 'volunteer123'
-- bcrypt hash for 'storymanager123'
-- bcrypt hash for 'bookmanager123'
-- bcrypt hash for 'contentadmin123'
-- bcrypt hash for 'admin123456'

-- Learner account
INSERT INTO users (id, email, name, "emailVerified", password, role, "createdAt", "updatedAt", image)
VALUES (
  gen_random_uuid(),
  'learner.test@1001stories.org',
  'Test Learner',
  NOW(),
  '$2b$10$v/l8XWXUzKRWxSuvz5wP9uo.xsbX3OMKkEbJx1hACEqiI52Azku.W',
  'LEARNER',
  NOW(),
  NOW(),
  '/images/avatars/learner.png'
) ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  password = EXCLUDED.password,
  "emailVerified" = EXCLUDED."emailVerified",
  "updatedAt" = NOW();

-- Teacher account
INSERT INTO users (id, email, name, "emailVerified", password, role, "createdAt", "updatedAt", image)
VALUES (
  gen_random_uuid(),
  'teacher.test@1001stories.org',
  'Test Teacher',
  NOW(),
  '$2b$10$jXwQpHHYrcePmW2gQm1b7Okitp6PuCCLaOVKNqoJCdebeXSco9ZpC',
  'TEACHER',
  NOW(),
  NOW(),
  '/images/avatars/teacher.png'
) ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  password = EXCLUDED.password,
  "emailVerified" = EXCLUDED."emailVerified",
  "updatedAt" = NOW();

-- Volunteer account
INSERT INTO users (id, email, name, "emailVerified", password, role, "createdAt", "updatedAt", image)
VALUES (
  gen_random_uuid(),
  'volunteer.test@1001stories.org',
  'Test Volunteer',
  NOW(),
  '$2b$10$0vSoiGwckSO/Yut/441FV.6vJSVbJOiSiZx3oRpVdZwF4b.LyehfO',
  'VOLUNTEER',
  NOW(),
  NOW(),
  '/images/avatars/volunteer.png'
) ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  password = EXCLUDED.password,
  "emailVerified" = EXCLUDED."emailVerified",
  "updatedAt" = NOW();

-- Story Manager account
INSERT INTO users (id, email, name, "emailVerified", password, role, "createdAt", "updatedAt", image)
VALUES (
  gen_random_uuid(),
  'story.manager@1001stories.org',
  'Story Manager Test',
  NOW(),
  '$2b$10$bEfY5PNIKEgKngAIebvU5eHicV0L5MN7WqyWMbslND4ilOMo9Ug4C',
  'STORY_MANAGER',
  NOW(),
  NOW(),
  '/images/avatars/story_manager.png'
) ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  password = EXCLUDED.password,
  "emailVerified" = EXCLUDED."emailVerified",
  "updatedAt" = NOW();

-- Book Manager account
INSERT INTO users (id, email, name, "emailVerified", password, role, "createdAt", "updatedAt", image)
VALUES (
  gen_random_uuid(),
  'book.manager@1001stories.org',
  'Book Manager Test',
  NOW(),
  '$2b$10$jXJwcn8yszhWhhdR2q.j6eU/okE83MGNPasVnCbSyNOwtWNu7wXtK',
  'BOOK_MANAGER',
  NOW(),
  NOW(),
  '/images/avatars/book_manager.png'
) ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  password = EXCLUDED.password,
  "emailVerified" = EXCLUDED."emailVerified",
  "updatedAt" = NOW();

-- Content Admin account
INSERT INTO users (id, email, name, "emailVerified", password, role, "createdAt", "updatedAt", image)
VALUES (
  gen_random_uuid(),
  'content.admin@1001stories.org',
  'Content Admin Test',
  NOW(),
  '$2b$10$MVFSyNP9LLdTAqzaGXVFRuyTjLaAHTvstEwKG4gFojdAP5MJ3TSCy',
  'CONTENT_ADMIN',
  NOW(),
  NOW(),
  '/images/avatars/content_admin.png'
) ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  password = EXCLUDED.password,
  "emailVerified" = EXCLUDED."emailVerified",
  "updatedAt" = NOW();

-- System Admin account
INSERT INTO users (id, email, name, "emailVerified", password, role, "createdAt", "updatedAt", image)
VALUES (
  gen_random_uuid(),
  'admin.test@1001stories.org',
  'System Admin Test',
  NOW(),
  '$2b$10$P0C4tFu6bWNtoH9IsLQhfuNNEAa31KPi.LGBnCiVUau65MDWrItji',
  'ADMIN',
  NOW(),
  NOW(),
  '/images/avatars/admin.png'
) ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  password = EXCLUDED.password,
  "emailVerified" = EXCLUDED."emailVerified",
  "updatedAt" = NOW();

-- Test Class 생성 및 학생 등록을 위한 쿼리는 별도로 실행
-- (User ID가 생성된 후에 실행해야 함)