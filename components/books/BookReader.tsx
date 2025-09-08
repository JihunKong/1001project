'use client';

import React, { useState } from 'react';
import { MultiFormatReader } from '@/components/learn/MultiFormatReader';
import { AITutorSidebar } from '@/components/learn/AITutorSidebar';
import { BookContent } from '@/lib/content-loader';
import { 
  BookOpen, 
  MessageSquare, 
  Brain,
  ChevronLeft,
  Menu,
  X
} from 'lucide-react';

interface BookReaderProps {
  bookId: string;
  content: BookContent;
  coverImage: string | null;
  thumbnails: string[];
  previewMode?: boolean;
}

export default function BookReader({
  bookId,
  content,
  coverImage,
  thumbnails,
  previewMode = false
}: BookReaderProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [showAITutor, setShowAITutor] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [highlightedWords, setHighlightedWords] = useState<string[]>([
    'artificial', 'intelligence', 'vocabulary', 'collaborative', 
    'comprehension', 'assessment', 'gamification', 'achievements'
  ]);

  const handleWordClick = (word: string, definition: string) => {
    console.log('Word clicked:', word, definition);
    // Add to vocabulary list
  };

  const totalPages = content.metadata?.pageCount || 10;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Main Content Area */}
      <div className={`flex-1 transition-all duration-300 ${showAITutor ? 'mr-96' : ''}`}>
        {/* Header */}
        <div className="bg-white shadow-sm border-b sticky top-0 z-10">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => window.history.back()}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-lg font-semibold">{content.metadata?.title || 'Untitled Book'}</h1>
                  <p className="text-sm text-gray-600">
                    by {content.metadata?.author || 'Unknown Author'}
                  </p>
                </div>
              </div>

              {/* Desktop Menu */}
              <div className="hidden md:flex items-center space-x-2">
                <button
                  onClick={() => setShowAITutor(!showAITutor)}
                  className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                    showAITutor 
                      ? 'bg-purple-100 text-purple-700' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <Brain className="w-5 h-5" />
                  <span>AI Tutor</span>
                </button>
                <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center space-x-2 text-gray-700">
                  <MessageSquare className="w-5 h-5" />
                  <span>Discuss</span>
                </button>
                <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center space-x-2 text-gray-700">
                  <BookOpen className="w-5 h-5" />
                  <span>Quiz</span>
                </button>
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
              >
                {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>

            {/* Mobile Menu */}
            {showMobileMenu && (
              <div className="md:hidden mt-3 pt-3 border-t space-y-2">
                <button
                  onClick={() => {
                    setShowAITutor(!showAITutor);
                    setShowMobileMenu(false);
                  }}
                  className={`w-full px-4 py-2 rounded-lg flex items-center space-x-2 ${
                    showAITutor 
                      ? 'bg-purple-100 text-purple-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  <Brain className="w-5 h-5" />
                  <span>AI Tutor</span>
                </button>
                <button className="w-full px-4 py-2 bg-gray-100 rounded-lg flex items-center space-x-2 text-gray-700">
                  <MessageSquare className="w-5 h-5" />
                  <span>Discuss</span>
                </button>
                <button className="w-full px-4 py-2 bg-gray-100 rounded-lg flex items-center space-x-2 text-gray-700">
                  <BookOpen className="w-5 h-5" />
                  <span>Quiz</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Book Reader */}
        <div className="container mx-auto px-4 py-6">
          <div className="bg-white rounded-lg shadow-lg" style={{ height: 'calc(100vh - 120px)' }}>
            <MultiFormatReader
              content={content.content}
              format={content.format}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              highlightedWords={highlightedWords}
              onWordClick={handleWordClick}
            />
          </div>
        </div>

        {/* Preview Mode Notice */}
        {previewMode && (
          <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-lg">
            <p className="text-sm text-yellow-800">
              <strong>Preview Mode:</strong> You're viewing a limited preview. 
              Sign in to access the full book and all learning features.
            </p>
          </div>
        )}
      </div>

      {/* AI Tutor Sidebar */}
      <AITutorSidebar
        isOpen={showAITutor}
        onClose={() => setShowAITutor(false)}
        bookId={bookId}
        bookTitle={content.metadata?.title || 'Untitled Book'}
        currentPage={currentPage}
        pageContent={content.content}
      />
    </div>
  );
}