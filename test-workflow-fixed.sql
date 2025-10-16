-- Test complete publishing workflow with correct user IDs

-- Step 1: Assign Book Manager (using real ID)
UPDATE text_submissions
SET
    "bookManagerId" = 'cmfxo4lgm000vbpp2j54v2mi6',  -- book-manager user ID (correct)
    status = 'FORMAT_REVIEW',
    "updatedAt" = NOW()
WHERE id = 'test-submission-001';

-- Step 2: Book Manager decides format
UPDATE text_submissions
SET
    status = 'CONTENT_REVIEW',
    "bookDecision" = 'Recommended for digital publication with AI-generated illustrations. The story length and content are perfect for an illustrated children''s book format.',
    "estimatedImages" = 3,
    "updatedAt" = NOW()
WHERE id = 'test-submission-001';

-- Step 3: Content Admin final approval (using real ID)
UPDATE text_submissions
SET
    "contentAdminId" = 'cmfxo4lgq0010bpp2ncltt2g1',  -- content-admin user ID (correct)
    status = 'PUBLISHED',
    "finalNotes" = 'Approved for publication. This story aligns perfectly with our mission of preserving cultural heritage. Scheduling for AI image generation and final publishing.',
    "publishedAt" = NOW(),
    "updatedAt" = NOW()
WHERE id = 'test-submission-001';

-- Check final status with all workflow details
SELECT
    id,
    title,
    status,
    "storyManagerId",
    "bookManagerId",
    "contentAdminId",
    "storyFeedback",
    "bookDecision",
    "finalNotes",
    "publishedAt",
    "estimatedImages"
FROM text_submissions
WHERE id = 'test-submission-001';