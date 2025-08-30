-- Fix TEst book visibility issues
-- This script ensures the TEst book is visible in both the library and admin panel

-- First, let's see the current state of the TEst book
SELECT 
  id, 
  title, 
  isPublished, 
  fullPdf, 
  authorName,
  createdAt
FROM stories 
WHERE title ILIKE '%test%' OR id ILIKE '%test%'
ORDER BY createdAt DESC;

-- Update the TEst book to be published and have a fullPdf path
-- This will make it visible in both library (requires isPublished=true) 
-- and admin books (requires fullPdf to be not null)
UPDATE stories 
SET 
  isPublished = true,
  fullPdf = CASE 
    WHEN fullPdf IS NULL OR fullPdf = '' THEN '/books/test/main.pdf'
    ELSE fullPdf 
  END,
  -- Ensure it has basic required fields
  summary = CASE 
    WHEN summary IS NULL OR summary = '' THEN 'Test book for validation purposes'
    ELSE summary 
  END
WHERE (title ILIKE '%test%' OR id ILIKE '%test%')
  AND (isPublished = false OR fullPdf IS NULL OR fullPdf = '');

-- Verify the changes
SELECT 
  id, 
  title, 
  isPublished, 
  fullPdf, 
  summary,
  authorName
FROM stories 
WHERE title ILIKE '%test%' OR id ILIKE '%test%'
ORDER BY updatedAt DESC;

-- Show visibility status for all books that might have issues
SELECT 
  id,
  title,
  isPublished,
  CASE WHEN fullPdf IS NOT NULL THEN 'Has PDF' ELSE 'No PDF' END as pdf_status,
  CASE 
    WHEN isPublished = true AND fullPdf IS NOT NULL THEN 'Visible in Library & Admin'
    WHEN isPublished = true AND fullPdf IS NULL THEN 'Library only (no PDF)'
    WHEN isPublished = false AND fullPdf IS NOT NULL THEN 'Admin only (unpublished)'
    ELSE 'Not visible anywhere'
  END as visibility_status,
  authorName,
  createdAt
FROM stories 
ORDER BY createdAt DESC
LIMIT 10;