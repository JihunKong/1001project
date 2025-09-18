'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Eye, 
  Type, 
  Hash, 
  Calendar, 
  User, 
  MapPin, 
  Globe, 
  Target,
  Tag,
  BookOpen,
  MessageSquare,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface TextSubmission {
  id: string;
  title: string;
  contentMd: string;
  chaptersJson?: string;
  summary?: string;
  authorId: string;
  authorRole: string;
  source?: string;
  classId?: string;
  status: string;
  revisionNo: number;
  language: string;
  ageRange?: string;
  category: string[];
  tags: string[];
  reviewNotes?: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    email: string;
  };
  class?: {
    name: string;
    teacher: {
      name: string;
    };
  };
}

interface TextReviewPanelProps {
  submission: TextSubmission;
  onFeedbackAdd?: (feedback: string, line?: number) => void;
  showLineNumbers?: boolean;
  readOnly?: boolean;
}

export default function TextReviewPanel({ 
  submission, 
  onFeedbackAdd, 
  showLineNumbers = true,
  readOnly = false 
}: TextReviewPanelProps) {
  const [selectedView, setSelectedView] = useState<'formatted' | 'raw'>('formatted');
  const [showMetadata, setShowMetadata] = useState(true);
  const [showChapters, setShowChapters] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [selectedLine, setSelectedLine] = useState<number | null>(null);

  const chapters = submission.chaptersJson 
    ? JSON.parse(submission.chaptersJson) 
    : null;

  const contentLines = submission.contentMd.split('\n');

  const handleLineClick = (lineNumber: number) => {
    if (readOnly) return;
    setSelectedLine(lineNumber);
  };

  const handleAddFeedback = () => {
    if (feedbackText.trim() && onFeedbackAdd) {
      onFeedbackAdd(feedbackText.trim(), selectedLine || undefined);
      setFeedbackText('');
      setSelectedLine(null);
    }
  };

  const getSourceDisplay = () => {
    if (submission.source === 'classroom' && submission.class) {
      return `Class: ${submission.class.name} (${submission.class.teacher.name})`;
    }
    return submission.source === 'individual' ? 'Individual Submission' : 'Unknown Source';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{submission.title}</h2>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                <span>{submission.author.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{new Date(submission.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <Globe className="w-4 h-4" />
                <span>{submission.language}</span>
              </div>
              {submission.ageRange && (
                <div className="flex items-center gap-1">
                  <Target className="w-4 h-4" />
                  <span>Ages {submission.ageRange}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setSelectedView('formatted')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                selectedView === 'formatted'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Eye className="w-4 h-4 inline mr-1" />
              Formatted
            </button>
            <button
              onClick={() => setSelectedView('raw')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                selectedView === 'raw'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Type className="w-4 h-4 inline mr-1" />
              Raw
            </button>
          </div>
        </div>
      </div>

      {/* Metadata Section */}
      <div className="p-6 border-b border-gray-200 bg-gray-50">
        <button
          onClick={() => setShowMetadata(!showMetadata)}
          className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 mb-4"
        >
          {showMetadata ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          Submission Details
        </button>

        {showMetadata && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Source</label>
                <p className="text-sm text-gray-900">{getSourceDisplay()}</p>
              </div>
              
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</label>
                <p className="text-sm text-gray-900">{submission.status.replace('_', ' ')}</p>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Revision</label>
                <p className="text-sm text-gray-900">#{submission.revisionNo}</p>
              </div>

              {submission.category.length > 0 && (
                <div className="col-span-full">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Categories</label>
                  <div className="flex gap-2 mt-1">
                    {submission.category.map((cat, idx) => (
                      <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {submission.tags.length > 0 && (
                <div className="col-span-full">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tags</label>
                  <div className="flex gap-1 mt-1">
                    {submission.tags.map((tag, idx) => (
                      <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {submission.summary && (
                <div className="col-span-full">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Summary</label>
                  <p className="text-sm text-gray-900 mt-1">{submission.summary}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Chapters Navigation (if available) */}
      {chapters && (
        <div className="p-4 border-b border-gray-200 bg-amber-50">
          <button
            onClick={() => setShowChapters(!showChapters)}
            className="flex items-center gap-2 text-sm font-medium text-amber-800 hover:text-amber-900 mb-2"
          >
            {showChapters ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <BookOpen className="w-4 h-4" />
            Chapters ({chapters.length})
          </button>

          {showChapters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2"
            >
              {chapters.map((chapter: any, idx: number) => (
                <div key={idx} className="p-2 bg-white rounded border">
                  <div className="font-medium text-sm text-gray-900">
                    Chapter {idx + 1}: {chapter.title}
                  </div>
                  {chapter.summary && (
                    <div className="text-xs text-gray-600 mt-1">
                      {chapter.summary}
                    </div>
                  )}
                </div>
              ))}
            </motion.div>
          )}
        </div>
      )}

      {/* Content Display */}
      <div className="p-6">
        {selectedView === 'formatted' ? (
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown
              components={{
                h1: ({ children }) => <h1 className="text-xl font-bold text-gray-900 mb-4">{children}</h1>,
                h2: ({ children }) => <h2 className="text-lg font-semibold text-gray-900 mb-3">{children}</h2>,
                h3: ({ children }) => <h3 className="text-base font-medium text-gray-900 mb-2">{children}</h3>,
                p: ({ children }) => <p className="text-gray-700 mb-4 leading-relaxed">{children}</p>,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-blue-200 pl-4 py-2 bg-blue-50 my-4">
                    {children}
                  </blockquote>
                ),
                ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-1">{children}</ol>,
                li: ({ children }) => <li className="text-gray-700">{children}</li>,
              }}
            >
              {submission.contentMd}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="bg-gray-50 rounded border">
            <div className="p-3 border-b bg-gray-100">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Hash className="w-4 h-4" />
                <span>Raw Markdown Content</span>
                {showLineNumbers && <span>({contentLines.length} lines)</span>}
              </div>
            </div>
            <div className="p-4 font-mono text-sm">
              {showLineNumbers ? (
                <div className="space-y-1">
                  {contentLines.map((line, idx) => (
                    <div
                      key={idx}
                      className={`flex ${selectedLine === idx + 1 ? 'bg-yellow-100' : 'hover:bg-gray-100'} ${
                        !readOnly ? 'cursor-pointer' : ''
                      }`}
                      onClick={() => handleLineClick(idx + 1)}
                    >
                      <span className="w-12 text-gray-400 text-right pr-4 select-none">
                        {idx + 1}
                      </span>
                      <span className="flex-1 text-gray-800">
                        {line || ' '}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <pre className="whitespace-pre-wrap text-gray-800">
                  {submission.contentMd}
                </pre>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Review Notes */}
      {submission.reviewNotes && (
        <div className="p-6 border-t border-gray-200 bg-blue-50">
          <div className="flex items-center gap-2 text-sm font-medium text-blue-800 mb-2">
            <MessageSquare className="w-4 h-4" />
            Previous Review Notes
          </div>
          <p className="text-sm text-blue-700">{submission.reviewNotes}</p>
        </div>
      )}

      {/* Feedback Input */}
      {!readOnly && onFeedbackAdd && (
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
            <MessageSquare className="w-4 h-4" />
            Add Feedback
            {selectedLine && (
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                Line {selectedLine}
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder={selectedLine 
                ? `Add feedback for line ${selectedLine}...` 
                : "Add general feedback..."
              }
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
            <button
              onClick={handleAddFeedback}
              disabled={!feedbackText.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              Add
            </button>
          </div>
          {selectedLine && (
            <button
              onClick={() => setSelectedLine(null)}
              className="text-xs text-gray-500 hover:text-gray-700 mt-2"
            >
              Clear line selection
            </button>
          )}
        </div>
      )}
    </div>
  );
}