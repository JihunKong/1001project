'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { AISuggestionMark } from './extensions/AISuggestionMark';
import { useEffect, useState } from 'react';
import AISuggestionPopover from './AISuggestionPopover';

interface AIAnnotation {
  suggestionIndex: number;
  highlightedText: string;
  startOffset: number;
  endOffset: number;
  suggestionType: string;
  color: string;
}

interface AIReview {
  id: string;
  reviewType: string;
  feedback: any;
  suggestions: string[];
  annotationData?: AIAnnotation[];
  score?: number;
  createdAt: string;
}

interface AnnotatedStoryViewerProps {
  title: string;
  content: string;
  submissionId: string;
  onSuggestionClick?: (suggestionIndex: number, reviewType: string) => void;
}

export default function AnnotatedStoryViewer({
  title,
  content,
  submissionId,
  onSuggestionClick
}: AnnotatedStoryViewerProps) {
  const [aiReviews, setAiReviews] = useState<AIReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSuggestion, setSelectedSuggestion] = useState<{
    annotation: AIAnnotation;
    suggestion: string;
    reviewType: string;
  } | null>(null);

  useEffect(() => {
    async function fetchAIReviews() {
      try {
        setIsLoading(true);
        console.log(`[AnnotatedStoryViewer] Fetching AI reviews for submission ${submissionId}`);

        const response = await fetch(`/api/text-submissions/${submissionId}/ai-reviews`);

        if (!response.ok) {
          console.error(`[AnnotatedStoryViewer] Failed to fetch AI reviews: ${response.status} ${response.statusText}`);
          return;
        }

        const data = await response.json();
        const reviews = data.reviews || [];

        console.log(`[AnnotatedStoryViewer] Fetched ${reviews.length} AI reviews`);

        reviews.forEach((review: AIReview, index: number) => {
          const annotationCount = review.annotationData?.length || 0;
          const suggestionCount = review.suggestions?.length || 0;
          console.log(`[AnnotatedStoryViewer] Review #${index} (${review.reviewType}): ${annotationCount} annotations, ${suggestionCount} suggestions`);

          if (!review.annotationData || review.annotationData.length === 0) {
            console.warn(`[AnnotatedStoryViewer] Review ${review.reviewType} has no annotationData!`);
          }
        });

        setAiReviews(reviews);
      } catch (error) {
        console.error('[AnnotatedStoryViewer] Failed to fetch AI reviews:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAIReviews();
  }, [submissionId]);

  const editor = useEditor({
    extensions: [StarterKit, AISuggestionMark],
    content,
    editable: false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg max-w-none focus:outline-none',
      },
    },
  });

  function convertHTMLToPlainText(html: string): { text: string; mapping: number[] } {
    const mapping: number[] = [];
    let plainText = '';
    let insideTag = false;

    for (let i = 0; i < html.length; i++) {
      const char = html[i];

      if (char === '<') {
        insideTag = true;
        continue;
      }

      if (char === '>') {
        insideTag = false;
        continue;
      }

      if (!insideTag) {
        plainText += char;
        mapping.push(i);
      }
    }

    return { text: plainText, mapping };
  }

  function convertHTMLOffsetToProseMirror(
    htmlContent: string,
    htmlStart: number,
    htmlEnd: number
  ): { from: number; to: number } | null {
    if (!editor) return null;

    const { text: plainText, mapping } = convertHTMLToPlainText(htmlContent);

    let plainStart = -1;
    let plainEnd = -1;

    for (let i = 0; i < mapping.length; i++) {
      if (plainStart === -1 && mapping[i] === htmlStart) {
        plainStart = i;
      }
      if (plainStart !== -1 && mapping[i] >= htmlEnd) {
        plainEnd = i;
        break;
      }
    }

    if (plainStart !== -1 && plainEnd === -1) {
      plainEnd = mapping.length;
    }

    if (plainStart === -1 || plainEnd === -1) {
      console.warn(`[convertHTMLOffset] Could not map HTML offsets ${htmlStart}-${htmlEnd} to plain text`);
      return null;
    }

    const doc = editor.state.doc;
    let currentTextPos = 0;
    let startPos: number | null = null;
    let endPos: number | null = null;

    doc.descendants((node, pos) => {
      if (node.isText && node.text) {
        const nodeStart = currentTextPos;
        const nodeEnd = currentTextPos + node.text.length;

        if (startPos === null && plainStart >= nodeStart && plainStart < nodeEnd) {
          startPos = pos + (plainStart - nodeStart);
        }

        if (endPos === null && plainEnd > nodeStart && plainEnd <= nodeEnd) {
          endPos = pos + (plainEnd - nodeStart);
        }

        currentTextPos = nodeEnd;

        if (startPos !== null && endPos !== null) {
          return false;
        }
      } else if (node.isBlock && currentTextPos > 0) {
        currentTextPos += 1;
      }
      return true;
    });

    if (startPos === null || endPos === null) {
      console.warn(`[convertHTMLOffset] Could not determine ProseMirror positions for plain text ${plainStart}-${plainEnd}`);
      return null;
    }

    console.log(`[convertHTMLOffset] HTML ${htmlStart}-${htmlEnd} → Plain ${plainStart}-${plainEnd} → ProseMirror ${startPos}-${endPos}`);
    return { from: startPos, to: endPos };
  }

  function findTextInDocument(searchText: string): { from: number; to: number } | null {
    if (!editor) return null;

    const doc = editor.state.doc;
    const docText = doc.textBetween(0, doc.content.size, '\n', '\n');

    const normalizedDoc = docText.normalize('NFC').toLowerCase();
    const normalizedSearch = searchText.normalize('NFC').toLowerCase();

    const startIndex = normalizedDoc.indexOf(normalizedSearch);
    if (startIndex === -1) {
      console.warn(`[findTextInDocument] Text not found: "${searchText.substring(0, 30)}..."`);
      return null;
    }

    const endIndex = startIndex + normalizedSearch.length;

    let currentTextPos = 0;
    let startPos: number | null = null;
    let endPos: number | null = null;

    doc.descendants((node, pos) => {
      if (node.isText && node.text) {
        const nodeStart = currentTextPos;
        const nodeEnd = currentTextPos + node.text.length;

        if (startPos === null && startIndex >= nodeStart && startIndex < nodeEnd) {
          startPos = pos + (startIndex - nodeStart);
        }

        if (endPos === null && endIndex > nodeStart && endIndex <= nodeEnd) {
          endPos = pos + (endIndex - nodeStart);
        }

        currentTextPos = nodeEnd;

        if (startPos !== null && endPos !== null) {
          return false;
        }
      } else if (node.isBlock && currentTextPos > 0) {
        currentTextPos += 1;
      }
      return true;
    });

    if (startPos === null || endPos === null) {
      console.warn(`[findTextInDocument] Could not determine positions for: "${searchText.substring(0, 30)}..."`);
      return null;
    }

    return { from: startPos, to: endPos };
  }

  useEffect(() => {
    if (!editor) {
      console.log('[AnnotatedStoryViewer] Editor not ready yet');
      return;
    }

    if (!aiReviews.length) {
      console.log('[AnnotatedStoryViewer] No AI reviews available yet');
      return;
    }

    console.log(`[AnnotatedStoryViewer] Editor content size: ${editor.state.doc.content.size} chars`);

    const allAnnotations: Array<AIAnnotation & { reviewType: string; suggestion: string }> = [];

    aiReviews.forEach(review => {
      if (review.annotationData && review.annotationData.length > 0) {
        review.annotationData.forEach(annotation => {
          const suggestion = review.suggestions[annotation.suggestionIndex] || 'No suggestion available';
          allAnnotations.push({
            ...annotation,
            reviewType: review.reviewType,
            suggestion
          });
        });
      } else {
        console.warn(`[AnnotatedStoryViewer] Review ${review.reviewType} has no annotations to apply`);
      }
    });

    if (allAnnotations.length === 0) {
      console.warn('[AnnotatedStoryViewer] No annotations to apply from any review!');
      return;
    }

    allAnnotations.sort((a, b) => a.startOffset - b.startOffset);

    console.log(`[AnnotatedStoryViewer] Applying ${allAnnotations.length} annotations to editor`);
    let successCount = 0;
    let failCount = 0;

    allAnnotations.forEach((annotation, index) => {
      try {
        let position: { from: number; to: number } | null = null;
        let method = 'unknown';

        position = findTextInDocument(annotation.highlightedText);
        method = 'text-search';

        if (position) {
          console.log(`[AnnotatedStoryViewer] ✅ Annotation #${index} (${annotation.reviewType}) positioned using text search`);
        } else {
          console.warn(`[AnnotatedStoryViewer] ⚠️  Annotation #${index} (${annotation.reviewType}) text search failed, trying offset-based positioning`);

          if (annotation.startOffset !== undefined && annotation.endOffset !== undefined && content) {
            position = convertHTMLOffsetToProseMirror(content, annotation.startOffset, annotation.endOffset);
            method = 'offset-based-fallback';

            if (position) {
              console.log(`[AnnotatedStoryViewer] ✅ Annotation #${index} (${annotation.reviewType}) positioned using stored offsets (fallback)`);
            }
          }
        }

        if (!position) {
          console.error(`[AnnotatedStoryViewer] ❌ Annotation #${index} (${annotation.reviewType}) FAILED - could not determine position`);
          console.error(`  Highlighted text: "${annotation.highlightedText.substring(0, 50)}..."`);
          console.error(`  Stored offsets: ${annotation.startOffset}-${annotation.endOffset}`);
          failCount++;
          return;
        }

        const { from, to } = position;
        const docSize = editor.state.doc.content.size;

        if (from >= to || from < 0 || to > docSize) {
          console.error(`[AnnotatedStoryViewer] ❌ Annotation #${index} (${annotation.reviewType}) FAILED - invalid position range`);
          console.error(`  from=${from}, to=${to}, docSize=${docSize}`);
          console.error(`  Method used: ${method}`);
          failCount++;
          return;
        }

        const selectedText = editor.state.doc.textBetween(from, to);

        console.log(`[AnnotatedStoryViewer] ✅ Annotation #${index} (${annotation.reviewType}) applied successfully:`);
        console.log(`  Method: ${method}`);
        console.log(`  Backend offsets: ${annotation.startOffset}-${annotation.endOffset}`);
        console.log(`  ProseMirror positions: ${from}-${to}`);
        console.log(`  Expected text: "${annotation.highlightedText.substring(0, 30)}..."`);
        console.log(`  Actual text: "${selectedText.substring(0, 30)}${selectedText.length > 30 ? '...' : ''}"`);
        console.log(`  Match: ${annotation.highlightedText.trim().toLowerCase() === selectedText.trim().toLowerCase() ? '✅' : '❌'}`);

        editor.chain()
          .setTextSelection({ from, to })
          .setAISuggestion({
            suggestionId: `${annotation.reviewType}-${annotation.suggestionIndex}`,
            suggestionType: annotation.suggestionType,
            suggestionIndex: annotation.suggestionIndex
          })
          .run();

        successCount++;
      } catch (error) {
        console.error(`[AnnotatedStoryViewer] ❌ Annotation #${index} FAILED with exception:`, {
          error,
          annotation,
          docSize: editor.state.doc.content.size
        });
        failCount++;
      }
    });

    console.log(`[AnnotatedStoryViewer] ✅ Applied ${successCount} annotations, ❌ ${failCount} failed`);

    if (successCount === 0 && allAnnotations.length > 0) {
      console.error('[AnnotatedStoryViewer] ALL annotations failed to apply! Check position offsets.');
    }
  }, [editor, aiReviews]);

  useEffect(() => {
    if (!editor) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const suggestionElement = target.closest('[data-suggestion-id]');

      if (suggestionElement) {
        const suggestionId = suggestionElement.getAttribute('data-suggestion-id');
        const suggestionType = suggestionElement.getAttribute('data-suggestion-type') || 'GRAMMAR';
        const suggestionIndex = parseInt(suggestionElement.getAttribute('data-suggestion-index') || '0', 10);

        const review = aiReviews.find(r => r.reviewType === suggestionType);
        if (review && review.annotationData) {
          const annotation = review.annotationData.find(a => a.suggestionIndex === suggestionIndex);
          if (annotation) {
            setSelectedSuggestion({
              annotation,
              suggestion: review.suggestions[suggestionIndex] || '',
              reviewType: suggestionType
            });

            if (onSuggestionClick) {
              onSuggestionClick(suggestionIndex, suggestionType);
            }
          }
        }
      }
    };

    const editorElement = editor.view.dom;
    editorElement.addEventListener('click', handleClick);

    return () => {
      editorElement.removeEventListener('click', handleClick);
    };
  }, [editor, aiReviews, onSuggestionClick]);

  return (
    <div className="bg-white border border-[#E5E5EA] rounded-lg p-6 relative">
      <style jsx global>{`
        .ai-suggestion {
          position: relative;
          cursor: pointer;
          transition: all 0.2s ease;
          padding: 2px 4px;
          border-radius: 3px;
        }

        .ai-suggestion:hover {
          opacity: 0.85;
          transform: translateY(-1px);
        }

        .ai-suggestion-grammar {
          background-color: rgba(254, 243, 199, 0.6);
          border-bottom: 2px solid #FBBF24;
        }

        .ai-suggestion-grammar:hover {
          background-color: rgba(254, 243, 199, 0.8);
        }

        .ai-suggestion-structure {
          background-color: rgba(219, 234, 254, 0.6);
          border-bottom: 2px solid #60A5FA;
        }

        .ai-suggestion-structure:hover {
          background-color: rgba(219, 234, 254, 0.8);
        }

        .ai-suggestion-writing_help {
          background-color: rgba(233, 213, 255, 0.6);
          border-bottom: 2px solid #A78BFA;
        }

        .ai-suggestion-writing_help:hover {
          background-color: rgba(233, 213, 255, 0.8);
        }

        .ProseMirror {
          padding: 1rem;
          min-height: 400px;
          line-height: 1.7;
        }

        .ProseMirror p {
          margin-bottom: 1em;
        }

        .ProseMirror h1,
        .ProseMirror h2,
        .ProseMirror h3 {
          margin-top: 1.5em;
          margin-bottom: 0.5em;
          font-weight: 600;
        }

        .ProseMirror:focus {
          outline: none;
        }
      `}</style>

      <h3
        className="text-[#141414] mb-4"
        style={{
          fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
          fontSize: '20px',
          fontWeight: 500,
          lineHeight: '1.221'
        }}
      >
        {title}
      </h3>

      <EditorContent editor={editor} />

      {selectedSuggestion && (
        <AISuggestionPopover
          annotation={selectedSuggestion.annotation}
          suggestion={selectedSuggestion.suggestion}
          reviewType={selectedSuggestion.reviewType}
          onClose={() => setSelectedSuggestion(null)}
        />
      )}
    </div>
  );
}
