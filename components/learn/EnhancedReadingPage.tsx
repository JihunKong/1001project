'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Brain, 
  Users, 
  Trophy,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Settings,
  MessageSquare,
  Volume2,
  Bookmark,
  CheckCircle,
  Play,
  Pause,
  Menu,
  X,
  User,
  Zap
} from 'lucide-react';
import { useLearningStore } from '@/lib/stores/learning-store';
import { createProgress, updateProgress, markAsCompleted } from '@/lib/api/learning-api';
import { VocabularyHighlighter } from './VocabularyHighlighter';
import { ContentProcessor } from '@/lib/content-processor';
import { WordDefinitionPopup } from './WordDefinitionPopup';
import { VocabularyPanel } from './VocabularyPanel';
import { QuizModal } from './QuizModal';
import { BookClub } from './BookClub';
import { ProgressTracker } from './ProgressTracker';
import { Leaderboard } from './Leaderboard';
import { UserProfile } from './UserProfile';
import { AITutor } from './AITutor';

interface EnhancedReadingPageProps {
  bookId: string;
  bookTitle: string;
  bookContent: string;
  totalPages: number;
  userLevel?: string;
}

export function EnhancedReadingPage({
  bookId,
  bookTitle,
  bookContent,
  totalPages,
  userLevel = 'B1',
}: EnhancedReadingPageProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [showVocabulary, setShowVocabulary] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showBookClub, setShowBookClub] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showAITutor, setShowAITutor] = useState(true);
  const [selectedWord, setSelectedWord] = useState<{ word: string; definition: string; position: { x: number; y: number } } | null>(null);
  const [isReading, setIsReading] = useState(false);
  const [readingSpeed, setReadingSpeed] = useState(250); // words per minute
  const [fontSize, setFontSize] = useState(18);
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isSimplified, setIsSimplified] = useState(false);
  const [simplifiedContent, setSimplifiedContent] = useState<string>('');
  const [isSimplifying, setIsSimplifying] = useState(false);
  const [processedContent, setProcessedContent] = useState<any>(null);
  const [currentChapterTitle, setCurrentChapterTitle] = useState<string>('');
  const readingTimerRef = useRef<NodeJS.Timeout>();
  const sessionStartRef = useRef<Date>();
  
  const { 
    startSession,
    endSession,
    updateReadingTime,
    updatePageProgress,
    completeReading,
    currentBookId,
    learningProgress,
    userStats,
  } = useLearningStore();

  useEffect(() => {
    // Start learning session
    startSession(bookId);
    sessionStartRef.current = new Date();
    initializeProgress();
    
    // Set up reading timer
    readingTimerRef.current = setInterval(() => {
      if (isReading) {
        updateReadingTime(1); // Update every minute
      }
    }, 60000);
    
    return () => {
      // Clean up
      if (readingTimerRef.current) {
        clearInterval(readingTimerRef.current);
      }
      endSession();
    };
  }, [bookId]);
  
  useEffect(() => {
    // Process content
    const content = isSimplified && simplifiedContent ? simplifiedContent : bookContent;
    const processed = ContentProcessor.processContent(content);
    setProcessedContent(processed);
  }, [bookContent, isSimplified, simplifiedContent]);
  
  useEffect(() => {
    // Update current chapter title when page changes
    if (processedContent) {
      const pageData = ContentProcessor.getPageContent(
        processedContent,
        currentPage,
        400
      );
      setCurrentChapterTitle(pageData.currentChapter);
    }
  }, [currentPage, processedContent]);

  const initializeProgress = async () => {
    try {
      const response = await createProgress(bookId);
      if (response.success && response.data) {
        const lastPage = response.data.lastPageRead || 1;
        setCurrentPage(lastPage);
      }
    } catch (error) {
      console.error('Error initializing progress:', error);
    }
  };

  const handlePageChange = async (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    
    setCurrentPage(newPage);
    updatePageProgress(bookId, newPage, totalPages);
    
    // Update progress in backend
    try {
      await updateProgress(bookId, {
        pagesRead: newPage,
        lastPageRead: newPage,
        readingTime: Math.floor(
          (new Date().getTime() - (sessionStartRef.current?.getTime() || 0)) / 60000
        ),
      });
    } catch (error) {
      console.error('Error updating progress:', error);
    }
    
    // Check if book is completed
    if (newPage === totalPages) {
      handleBookCompletion();
    }
  };

  const handleBookCompletion = async () => {
    try {
      await markAsCompleted(bookId);
      completeReading(bookId);
      setShowQuiz(true); // Automatically show quiz on completion
    } catch (error) {
      console.error('Error completing book:', error);
    }
  };

  const handleWordClick = (word: string, definition: string, position: { x: number; y: number }) => {
    setSelectedWord({ word, definition, position });
  };

  const toggleReading = () => {
    // This function is no longer used - replaced by speakText
    setIsReading(!isReading);
  };

  const [isSpeaking, setIsSpeaking] = useState(false);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const speakText = async () => {
    // 이미 재생 중이면 중지
    if (isSpeaking && currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
      setIsSpeaking(false);
      setIsReading(false); // Also stop reading time tracking
      return;
    }

    // 이미 재생 중이면 메시지 표시하고 리턴
    if (isSpeaking) {
      console.log('Audio is already playing. Please wait...');
      return;
    }

    const textToSpeak = getPageContent();
    
    try {
      setIsSpeaking(true);
      setIsReading(true); // Start reading time tracking when audio starts
      
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: textToSpeak,
          voice: 'nova', // 부드러운 여성 목소리
          speed: readingSpeed / 250, // 읽기 속도에 맞춰 조절
        }),
      });

      if (!response.ok) {
        throw new Error('TTS generation failed');
      }

      const data = await response.json();
      
      if (data.audioUrl) {
        const audio = new Audio(data.audioUrl);
        currentAudioRef.current = audio;
        
        audio.onended = () => {
          setIsSpeaking(false);
          setIsReading(false); // Stop reading time tracking
          currentAudioRef.current = null;
        };
        
        audio.onerror = () => {
          setIsSpeaking(false);
          setIsReading(false); // Stop reading time tracking
          currentAudioRef.current = null;
          console.error('Audio playback failed');
        };
        
        await audio.play();
      }
    } catch (error) {
      console.error('TTS Error:', error);
      setIsSpeaking(false);
      setIsReading(false); // Stop reading time tracking
      currentAudioRef.current = null;
      // OpenAI TTS 실패 시 음성 재생 안 함 (크롬 기본 음성 사용 안 함)
    }
  };

  const getPageContent = () => {
    if (!processedContent) return { html: '', currentChapter: '', progress: 0 };
    
    const pageData = ContentProcessor.getPageContent(
      processedContent,
      currentPage,
      400 // words per page
    );
    
    return pageData;
  };

  const toggleSimplification = async () => {
    if (isSimplified) {
      setIsSimplified(false);
      return;
    }

    if (simplifiedContent) {
      setIsSimplified(true);
      return;
    }

    setIsSimplifying(true);
    try {
      const response = await fetch('/api/learn/simplify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: bookContent,
          targetLevel: userLevel
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSimplifiedContent(data.data.simplifiedText);
        setIsSimplified(true);
      }
    } catch (error) {
      console.error('Failed to simplify text:', error);
    } finally {
      setIsSimplifying(false);
    }
  };

  const currentProgress = learningProgress?.find(p => p.bookId === bookId);
  const progressPercentage = currentProgress 
    ? Math.round((currentProgress.pagesRead / currentProgress.totalPages) * 100)
    : 0;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className="w-80 bg-white border-r border-gray-200 flex flex-col"
          >
            {/* Sidebar Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Learning Tools</h3>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-blue-50 rounded-lg p-2">
                  <p className="text-2xl font-bold text-blue-600">{progressPercentage}%</p>
                  <p className="text-xs text-gray-600">Progress</p>
                </div>
                <div className="bg-green-50 rounded-lg p-2">
                  <p className="text-2xl font-bold text-green-600">
                    {userStats?.level || 1}
                  </p>
                  <p className="text-xs text-gray-600">Level</p>
                </div>
              </div>
            </div>
            
            {/* Tool Buttons */}
            <div className="flex-1 p-4 space-y-2 overflow-y-auto">
              <button
                onClick={() => setShowVocabulary(true)}
                className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <BookOpen className="w-5 h-5 text-blue-600" />
                <span className="text-gray-700">My Vocabulary</span>
                <span className="ml-auto bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">
                  {useLearningStore.getState().vocabulary.length}
                </span>
              </button>
              
              <button
                onClick={() => setShowQuiz(true)}
                className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Brain className="w-5 h-5 text-purple-600" />
                <span className="text-gray-700">Take Quiz</span>
              </button>
              
              <button
                onClick={() => setShowBookClub(true)}
                className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Users className="w-5 h-5 text-green-600" />
                <span className="text-gray-700">Book Club</span>
              </button>
              
              <button
                onClick={() => setShowLeaderboard(true)}
                className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Trophy className="w-5 h-5 text-yellow-600" />
                <span className="text-gray-700">Leaderboard</span>
              </button>
              
              <button
                onClick={() => setShowProfile(true)}
                className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <User className="w-5 h-5 text-indigo-600" />
                <span className="text-gray-700">My Profile</span>
              </button>
              
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Settings className="w-5 h-5 text-gray-600" />
                <span className="text-gray-700">Settings</span>
              </button>
            </div>
            
            {/* Settings Panel */}
            {showSettings && (
              <div className="p-4 border-t border-gray-200 space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Font Size</label>
                  <input
                    type="range"
                    min="14"
                    max="24"
                    value={fontSize}
                    onChange={(e) => setFontSize(parseInt(e.target.value))}
                    className="w-full mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Reading Speed</label>
                  <input
                    type="range"
                    min="150"
                    max="350"
                    step="25"
                    value={readingSpeed}
                    onChange={(e) => setReadingSpeed(parseInt(e.target.value))}
                    className="w-full mt-1"
                  />
                  <span className="text-xs text-gray-500">{readingSpeed} wpm</span>
                </div>
              </div>
            )}
            
            {/* Progress Tracker */}
            <div className="p-4 border-t border-gray-200">
              <ProgressTracker
                bookId={bookId}
                currentPage={currentPage}
                totalPages={totalPages}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {!sidebarOpen && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <Menu className="w-5 h-5 text-gray-600" />
                </button>
              )}
              <div>
                <h1 className="text-xl font-bold text-gray-900">{bookTitle}</h1>
                <p className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </p>
              </div>
            </div>
            
            {/* Reading Controls */}
            <div className="flex items-center space-x-3">
              <button
                onClick={speakText}
                className={`p-2 rounded-lg transition-all ${
                  isSpeaking 
                    ? 'bg-blue-100 hover:bg-blue-200' 
                    : 'hover:bg-gray-100'
                }`}
                title={isSpeaking ? 'Stop Reading' : 'Start Reading'}
              >
                {isSpeaking ? (
                  <Pause className={`w-5 h-5 ${
                    isSpeaking ? 'text-blue-600 animate-pulse' : 'text-gray-600'
                  }`} />
                ) : (
                  <Play className="w-5 h-5 text-gray-600" />
                )}
              </button>
              <button
                className="p-2 hover:bg-gray-100 rounded-lg"
                title="Bookmark"
              >
                <Bookmark className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={toggleSimplification}
                disabled={isSimplifying}
                className={`px-3 py-2 rounded-lg transition-all ${
                  isSimplified 
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                    : 'hover:bg-gray-100 text-gray-700'
                } ${
                  isSimplifying ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                title="Simplify Text"
              >
                {isSimplifying ? (
                  <span className="flex items-center space-x-2">
                    <span className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></span>
                    <span>Simplifying...</span>
                  </span>
                ) : (
                  <span className="flex items-center space-x-2">
                    <Zap className="w-4 h-4" />
                    <span>{isSimplified ? 'Original' : `Simplify (${userLevel})`}</span>
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Reading Area */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col">
            {/* Chapter Header */}
            {currentChapterTitle && (
              <div className="bg-white border-b px-8 py-3">
                <p className="text-sm text-gray-500">Current Chapter</p>
                <h3 className="text-lg font-semibold text-gray-900">{currentChapterTitle}</h3>
              </div>
            )}
            
            {/* Content Area with proper overflow */}
            <div className="flex-1 overflow-y-auto bg-white">
              <div className="p-8">
                <div className="max-w-3xl mx-auto">
                  {isSimplified && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        📚 This text has been simplified for {userLevel} level learners
                      </p>
                    </div>
                  )}
                  
                  <div 
                    className="text-gray-800 leading-relaxed"
                    style={{ fontSize: `${fontSize}px`, lineHeight: '1.8' }}
                    dangerouslySetInnerHTML={{ __html: getPageContent().html }}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* AI Tutor Sidebar */}
          {showAITutor && (
            <div className="w-96 border-l border-gray-200 bg-white flex flex-col overflow-hidden">
              <AITutor
                bookId={bookId}
                bookTitle={bookTitle}
                currentPage={currentPage}
                pageContent={getPageContent().html}
              />
            </div>
          )}
        </div>
        
        {/* Page Navigation */}
        <div className="bg-white border-t border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Previous</span>
            </button>
            
            <div className="flex items-center space-x-4">
              <div className="w-48 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <span className="text-sm text-gray-600">{progressPercentage}%</span>
            </div>
            
            {currentPage === totalPages ? (
              <button
                onClick={() => setShowQuiz(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <CheckCircle className="w-5 h-5" />
                <span>Complete & Quiz</span>
              </button>
            ) : (
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                <span>Next</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Modals and Popups */}
      {selectedWord && (
        <WordDefinitionPopup
          word={selectedWord.word}
          definition={selectedWord.definition}
          position={selectedWord.position}
          bookId={bookId}
          onClose={() => setSelectedWord(null)}
        />
      )}
      
      <VocabularyPanel
        isOpen={showVocabulary}
        onClose={() => setShowVocabulary(false)}
        bookId={bookId}
      />
      
      <QuizModal
        isOpen={showQuiz}
        onClose={() => setShowQuiz(false)}
        bookId={bookId}
        bookText={bookContent}
      />
      
      {/* Full Page Modals */}
      <AnimatePresence>
        {showBookClub && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white z-50 overflow-y-auto"
          >
            <div className="p-4">
              <button
                onClick={() => setShowBookClub(false)}
                className="mb-4 flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <ChevronLeft className="w-5 h-5" />
                <span>Back to Reading</span>
              </button>
              <BookClub bookId={bookId} bookTitle={bookTitle} />
            </div>
          </motion.div>
        )}
        
        {showLeaderboard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white z-50 overflow-y-auto"
          >
            <div className="p-4">
              <button
                onClick={() => setShowLeaderboard(false)}
                className="mb-4 flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <ChevronLeft className="w-5 h-5" />
                <span>Back to Reading</span>
              </button>
              <Leaderboard />
            </div>
          </motion.div>
        )}
        
        {showProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white z-50 overflow-y-auto"
          >
            <div className="p-4">
              <button
                onClick={() => setShowProfile(false)}
                className="mb-4 flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <ChevronLeft className="w-5 h-5" />
                <span>Back to Reading</span>
              </button>
              <UserProfile />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}