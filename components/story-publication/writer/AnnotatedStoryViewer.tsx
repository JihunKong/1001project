'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { AISuggestionMark } from './extensions/AISuggestionMark';
import { useEffect, useState, useCallback } from 'react';
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
  enabledTypes?: Set<string>;
}

export default function AnnotatedStoryViewer({
  title,
  content,
  submissionId,
  onSuggestionClick,
  enabledTypes = new Set(['GRAMMAR', 'STRUCTURE', 'WRITING_HELP'])
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

        const response = await fetch(`/api/text-submissions/${submissionId}/ai-reviews`);

        if (!response.ok) {
          // Failed to fetch AI reviews - will show error state
          return;
        }

        const data = await response.json();
        const reviews = data.reviews || [];

        reviews.forEach((review: AIReview) => {
          if (!review.annotationData || review.annotationData.length === 0) {
            // Review has no annotation data - skip
          }
        });

        setAiReviews(reviews);
      } catch (error) {
        // Failed to fetch AI reviews
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

  const convertHTMLOffsetToProseMirror = useCallback((
    htmlContent: string,
    htmlStart: number,
    htmlEnd: number
  ): { from: number; to: number } | null => {
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
      // Could not map HTML offsets to plain text
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
      // Could not determine ProseMirror positions
      return null;
    }

    return { from: startPos, to: endPos };
  }, [editor]);

  const findTextInDocument = useCallback((searchText: string): { from: number; to: number } | null => {
    if (!editor) return null;

    const doc = editor.state.doc;
    const docText = doc.textBetween(0, doc.content.size, '\n', '\n');

    const normalizedDoc = docText.normalize('NFC').toLowerCase();
    const normalizedSearch = searchText.normalize('NFC').toLowerCase();

    const startIndex = normalizedDoc.indexOf(normalizedSearch);
    if (startIndex === -1) {
      // Text not found in document
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
      // Could not determine positions for text
      return null;
    }

    return { from: startPos, to: endPos };
  }, [editor]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    if (!aiReviews.length) {
      return;
    }

    const allAnnotations: Array<AIAnnotation & { reviewType: string; suggestion: string }> = [];

    aiReviews.forEach(review => {
      if (!enabledTypes.has(review.reviewType)) {
        return;
      }

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
        // Review has no annotations to apply
      }
    });

    if (allAnnotations.length === 0) {
      // No annotations to apply from any review
      return;
    }

    allAnnotations.sort((a, b) => a.startOffset - b.startOffset);

    let successCount = 0;
    let failCount = 0;

    allAnnotations.forEach((annotation, index) => {
      try {
        let position: { from: number; to: number } | null = null;

        position = findTextInDocument(annotation.highlightedText);

        if (!position) {
          if (annotation.startOffset !== undefined && annotation.endOffset !== undefined && content) {
            position = convertHTMLOffsetToProseMirror(content, annotation.startOffset, annotation.endOffset);
          }
        }

        if (!position) {
          // Annotation failed - could not determine position
          failCount++;
          return;
        }

        const { from, to } = position;
        const docSize = editor.state.doc.content.size;

        if (from >= to || from < 0 || to > docSize) {
          // Annotation failed - invalid position range
          failCount++;
          return;
        }

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
        // Annotation failed with exception
        failCount++;
      }
    });

    if (successCount === 0 && allAnnotations.length > 0) {
      // All annotations failed to apply
    }
  }, [editor, aiReviews, content, convertHTMLOffsetToProseMirror, findTextInDocument, enabledTypes]);

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
          background-color: rgba(224, 242, 254, 0.6);
          border-bottom: 2px solid #38BDF8;
        }

        .ai-suggestion-structure:hover {
          background-color: rgba(224, 242, 254, 0.8);
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
