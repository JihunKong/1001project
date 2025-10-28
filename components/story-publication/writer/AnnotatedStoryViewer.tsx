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
        const response = await fetch(`/api/text-submissions/${submissionId}/ai-reviews`);
        if (response.ok) {
          const data = await response.json();
          setAiReviews(data.reviews || []);
        }
      } catch (error) {
        console.error('Failed to fetch AI reviews:', error);
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

  useEffect(() => {
    if (!editor || !aiReviews.length) return;

    const allAnnotations: Array<AIAnnotation & { reviewType: string; suggestion: string }> = [];

    aiReviews.forEach(review => {
      if (review.annotationData) {
        review.annotationData.forEach(annotation => {
          allAnnotations.push({
            ...annotation,
            reviewType: review.reviewType,
            suggestion: review.suggestions[annotation.suggestionIndex] || ''
          });
        });
      }
    });

    allAnnotations.sort((a, b) => a.startOffset - b.startOffset);

    console.log(`[AnnotatedStoryViewer] Applying ${allAnnotations.length} annotations`);
    let successCount = 0;
    let failCount = 0;

    allAnnotations.forEach((annotation, index) => {
      try {
        const docSize = editor.state.doc.content.size;
        const from = Math.max(0, Math.min(annotation.startOffset, docSize - 1));
        const to = Math.max(from, Math.min(annotation.endOffset, docSize));

        if (from >= to) {
          console.warn(`[AnnotatedStoryViewer] Invalid range for annotation #${index}: from=${from}, to=${to}`);
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
        console.error(`[AnnotatedStoryViewer] Failed to apply annotation #${index}:`, {
          error,
          annotation,
          docSize: editor.state.doc.content.size
        });
        failCount++;
      }
    });

    console.log(`[AnnotatedStoryViewer] Applied ${successCount} annotations (${failCount} failed)`);
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
          transition: opacity 0.2s;
        }

        .ai-suggestion:hover {
          opacity: 0.8;
        }

        .ai-suggestion-grammar {
          background-color: #fef3c7;
          border-bottom: 2px solid #fbbf24;
        }

        .ai-suggestion-structure {
          background-color: #dbeafe;
          border-bottom: 2px solid #60a5fa;
        }

        .ai-suggestion-writing_help {
          background-color: #e9d5ff;
          border-bottom: 2px solid #a78bfa;
        }

        .ProseMirror {
          padding: 1rem;
          min-height: 400px;
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
