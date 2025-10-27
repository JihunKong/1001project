'use client';

import { MoreVertical } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

interface Submission {
  id: string;
  title: string;
  content: string;
  status: string;
  submittedAt?: Date;
  wordCount?: number | null;
  thumbnailUrl?: string;
}

interface SubmissionListProps {
  submissions: Submission[];
  onViewClick?: (id: string) => void;
  onEditClick: (id: string) => void;
  onDeleteClick?: (id: string) => void;
}

export default function SubmissionList({ submissions, onViewClick, onEditClick, onDeleteClick }: SubmissionListProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  if (!submissions || submissions.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <p
          className="text-[#8E8E93]"
          style={{
            fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
            fontSize: '16px',
            fontWeight: 400,
            lineHeight: '1.193'
          }}
        >
          No submissions found
        </p>
      </div>
    );
  }

  const getSummary = (content: string) => {
    const plainText = content.replace(/<[^>]*>/g, '');
    return plainText.length > 100 ? plainText.substring(0, 100) + '...' : plainText;
  };

  const countWords = (content: string) => {
    const plainText = content.replace(/<[^>]*>/g, '');
    return plainText.split(/\s+/).filter(word => word.length > 0).length;
  };

  return (
    <div className="flex flex-col gap-4">
      {submissions.map((submission) => (
        <div
          key={submission.id}
          className="bg-white border border-[#E5E5EA] rounded-lg p-6 hover:shadow-md transition-all hover:border-[#141414]/20 cursor-pointer"
          onClick={() => onViewClick ? onViewClick(submission.id) : onEditClick(submission.id)}
        >
          <div className="flex items-start gap-6">
            {/* Thumbnail */}
            <div className="flex-shrink-0 w-[160px] h-[90px] bg-[#F9FAFB] rounded-lg overflow-hidden border border-[#E5E5EA]">
              {submission.thumbnailUrl ? (
                <Image
                  src={submission.thumbnailUrl}
                  alt={submission.title}
                  width={160}
                  height={90}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#AEAEB2]">
                  <span
                    style={{
                      fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                      fontSize: '12px',
                      fontWeight: 400
                    }}
                  >
                    No image
                  </span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3
                className="text-[#141414] mb-2 truncate"
                style={{
                  fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                  fontSize: '20px',
                  fontWeight: 500,
                  lineHeight: '1.221'
                }}
              >
                {submission.title || 'Untitled'}
              </h3>
              <p
                className="text-[#8E8E93] line-clamp-2"
                style={{
                  fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                  fontSize: '14px',
                  fontWeight: 400,
                  lineHeight: '1.5'
                }}
              >
                {getSummary(submission.content)}
              </p>
              <div className="flex items-center gap-4 mt-3">
                <span
                  className="text-[#AEAEB2]"
                  style={{
                    fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                    fontSize: '13px',
                    fontWeight: 400
                  }}
                >
                  {submission.wordCount || countWords(submission.content)} words
                </span>
                <span className="text-[#E5E5EA]">•</span>
                <span
                  className="text-[#AEAEB2]"
                  style={{
                    fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                    fontSize: '13px',
                    fontWeight: 400
                  }}
                >
                  {submission.submittedAt
                    ? new Date(submission.submittedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })
                    : 'Not submitted'}
                </span>
              </div>
            </div>

            {/* More Actions - Only show for DRAFT status */}
            {submission.status === 'DRAFT' && (
              <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setOpenMenuId(openMenuId === submission.id ? null : submission.id)}
                  className="p-2 hover:bg-[#F9FAFB] rounded-lg transition-colors"
                >
                  <MoreVertical className="h-5 w-5 text-[#8E8E93]" />
                </button>

                {openMenuId === submission.id && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-[#E5E5EA] rounded-lg shadow-lg z-10">
                    <button
                      onClick={() => {
                        onEditClick(submission.id);
                        setOpenMenuId(null);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-[#F9FAFB] text-[#141414] first:rounded-t-lg transition-colors"
                      style={{
                        fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                        fontSize: '14px',
                        fontWeight: 400
                      }}
                    >
                      Edit
                    </button>
                    {onDeleteClick && (
                      <button
                        onClick={() => {
                          onDeleteClick(submission.id);
                          setOpenMenuId(null);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-[#F9FAFB] text-red-600 last:rounded-b-lg transition-colors border-t border-[#E5E5EA]"
                        style={{
                          fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                          fontSize: '14px',
                          fontWeight: 400
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
