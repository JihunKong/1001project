-- Test complete publishing workflow

-- Step 1: Assign Story Manager
UPDATE text_submissions
SET
    "storyManagerId" = 'cmfxo4lgj000qbpp2a8o4hnpu',  -- story-manager user ID
    status = 'STORY_REVIEW',
    "updatedAt" = NOW()
WHERE id = 'test-submission-001';

-- Step 2: Story Manager approves with feedback
UPDATE text_submissions
SET
    status = 'STORY_APPROVED',
    "storyFeedback" = 'Excellent cultural story! The narrative beautifully captures intergenerational wisdom. Minor suggestion: consider adding more specific details about the cultural practices mentioned.',
    "updatedAt" = NOW()
WHERE id = 'test-submission-001';

-- Step 3: Assign Book Manager
UPDATE text_submissions
SET
    "bookManagerId" = 'cmfxo4lgn000tbpp2vtbgijkl',  -- book-manager user ID (if exists)
    status = 'FORMAT_REVIEW',
    "updatedAt" = NOW()
WHERE id = 'test-submission-001';

-- Step 4: Book Manager decides format
UPDATE text_submissions
SET
    status = 'CONTENT_REVIEW',
    "bookDecision" = 'Recommended for digital publication with AI-generated illustrations. The story length and content are perfect for an illustrated children''s book format.',
    "estimatedImages" = 3,
    "updatedAt" = NOW()
WHERE id = 'test-submission-001';

-- Step 5: Content Admin final approval
UPDATE text_submissions
SET
    "contentAdminId" = 'cmfxo4lgq000wbpp2d5l2pqrs',  -- content-admin user ID (if exists)
    status = 'PUBLISHED',
    "finalNotes" = 'Approved for publication. This story aligns perfectly with our mission of preserving cultural heritage. Scheduling for AI image generation and final publishing.',
    "publishedAt" = NOW(),
    "updatedAt" = NOW()
WHERE id = 'test-submission-001';

-- Check final status
SELECT
    id,
    title,
    status,
    "storyFeedback",
    "bookDecision",
    "finalNotes",
    "publishedAt"
FROM text_submissions
WHERE id = 'test-submission-001';