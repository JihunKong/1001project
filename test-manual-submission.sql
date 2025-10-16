-- Create a test text submission directly in database for workflow testing

INSERT INTO text_submissions (
    id,
    "authorId",
    title,
    content,
    "authorAlias",
    summary,
    language,
    "ageRange",
    category,
    tags,
    status,
    priority,
    "copyrightConfirmed",
    "originalWork",
    "licenseType",
    "wordCount",
    "createdAt",
    "updatedAt"
) VALUES (
    'test-submission-001',
    'cmfxo4lfy0009bpp2h9k8nq99',  -- volunteer user ID
    'My Cultural Heritage Story',
    '<p>This is a beautiful story about my grandmother''s wisdom and our family traditions.</p><p>She taught me the importance of <strong>preserving our cultural heritage</strong> for future generations.</p><p>Every evening, she would share stories of our ancestors, their struggles, and their triumphs. These stories became the foundation of my identity.</p>',
    'Heritage Keeper',
    'A heartwarming narrative about intergenerational wisdom and the preservation of cultural traditions through storytelling.',
    'en',
    '13-adult',
    ARRAY['family', 'tradition', 'heritage'],
    ARRAY['grandmother', 'wisdom', 'culture', 'tradition', 'heritage'],
    'PENDING',
    'MEDIUM',
    true,
    true,
    'CC BY-SA 4.0',
    85,  -- word count
    NOW(),
    NOW()
);

-- Check if the submission was created
SELECT id, title, status, "authorId", "wordCount" FROM text_submissions WHERE id = 'test-submission-001';