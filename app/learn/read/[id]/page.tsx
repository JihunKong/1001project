'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  ArrowLeft, 
  BookOpen, 
  Volume2, 
  Settings, 
  Sparkles, 
  Brain,
  ChevronDown,
  Loader2,
  Eye,
  Type,
  Zap,
  MessageCircle,
  X,
  Send
} from 'lucide-react';
import Link from 'next/link';

interface BookContent {
  id: string;
  title: string;
  author: string;
  originalText: string;
  currentText: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  readingTime: number;
  vocabulary: VocabularyWord[];
}

interface VocabularyWord {
  word: string;
  definition: string;
  example: string;
  difficulty: number;
}

export default function LearnReadPage() {
  const { id: bookId } = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  
  const [book, setBook] = useState<BookContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [difficulty, setDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Intermediate');
  const [showDifficultyMenu, setShowDifficultyMenu] = useState(false);
  const [showVocabulary, setShowVocabulary] = useState(false);
  const [selectedWord, setSelectedWord] = useState<VocabularyWord | null>(null);
  const [fontSize, setFontSize] = useState('text-lg');
  const [isAdapting, setIsAdapting] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [showAITutor, setShowAITutor] = useState(false);
  const [aiTutorMessages, setAiTutorMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const [aiTutorInput, setAiTutorInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    if (bookId) {
      fetchBookContent();
    }
  }, [bookId]);

  useEffect(() => {
    // Track reading progress
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollTop / docHeight) * 100;
      const newProgress = Math.min(100, Math.max(0, progress));
      
      setReadingProgress(newProgress);
      
      // Update progress in database periodically
      if (Math.abs(newProgress - readingProgress) > 5) { // Update every 5% progress
        updateReadingProgress(newProgress);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [readingProgress, book]);

  const fetchBookContent = async () => {
    try {
      setLoading(true);
      
      // First check if this book is assigned to the student
      const assignmentCheck = await fetch('/api/learn/assignments');
      if (assignmentCheck.ok) {
        const assignmentData = await assignmentCheck.json();
        const isAssigned = assignmentData.assignments?.some((assignment: any) => 
          assignment.book.id === bookId
        );
        
        if (!isAssigned) {
          throw new Error('This book is not assigned to you. Please check with your teacher.');
        }
      }
      
      // Fetch book details
      const bookResponse = await fetch(`/api/library/books/${bookId}`);
      if (!bookResponse.ok) throw new Error('Failed to fetch book details');
      const response = await bookResponse.json();
      const bookData = response.book;
      
      // Parse PDF to get text content with Upstage integration
      const contentResponse = await fetch(`/api/learn/parse-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          bookId,
          difficulty: 'Intermediate' // Default difficulty
        }),
      });
      
      let parsedContent = null;
      if (contentResponse.ok) {
        parsedContent = await contentResponse.json();
      } else {
        // Fallback content for demo purposes
        parsedContent = {
          text: bookData.summary || 'Content will be available after teacher assigns reading level.',
          vocabulary: [],
          difficulty: 'Intermediate'
        };
      }

      const bookContent: BookContent = {
        id: bookData.id,
        title: bookData.title,
        author: bookData.authorName || bookData.author || 'Unknown Author',
        originalText: parsedContent.text,
        currentText: parsedContent.text,
        difficulty: parsedContent.difficulty || 'Intermediate',
        readingTime: Math.ceil(parsedContent.text.split(' ').length / 200),
        vocabulary: parsedContent.vocabulary || []
      };

      setBook(bookContent);
      
      // Update reading progress
      await updateReadingProgress(0); // Initialize reading session
      
    } catch (error) {
      console.error('Error fetching book:', error);
      // Show user-friendly error message
      setBook(null);
    } finally {
      setLoading(false);
    }
  };

  // Update reading progress function
  const updateReadingProgress = async (percentComplete: number) => {
    if (!bookId || !session?.user?.id) return;
    
    try {
      await fetch('/api/learn/progress/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storyId: bookId,
          percentComplete,
          currentPage: Math.floor(percentComplete / 10), // Rough page estimation
          totalPages: Math.ceil(book?.currentText.split(' ').length / 250) || 1, // Words per page estimation
        }),
      });
    } catch (error) {
      console.error('Failed to update reading progress:', error);
    }
  };

  const adaptTextDifficulty = async (newDifficulty: 'Beginner' | 'Intermediate' | 'Advanced') => {
    if (!book) return;
    
    setIsAdapting(true);
    setDifficulty(newDifficulty);
    setShowDifficultyMenu(false);

    try {
      // Call Upstage API for content parsing and adaptation
      const response = await fetch('/api/learn/parse-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          bookId,
          difficulty: newDifficulty.toLowerCase() === 'beginner' ? 'under-7' :
                     newDifficulty.toLowerCase() === 'intermediate' ? '7-9' : 
                     newDifficulty.toLowerCase() === 'advanced' ? '10-12' : 'adult'
        }),
      });

      if (response.ok) {
        const adaptedContent = await response.json();
        setBook({ 
          ...book, 
          currentText: adaptedContent.text || book.originalText,
          difficulty: newDifficulty,
          vocabulary: adaptedContent.vocabulary || book.vocabulary
        });
      } else {
        // Fallback to simple text replacement for demo
        let adaptedText = book.originalText;
        
        if (newDifficulty === 'Beginner') {
          adaptedText = book.originalText
            .replace(/difficult/g, 'hard')
            .replace(/magnificent/g, 'beautiful')
            .replace(/adventurous/g, 'fun')
            .replace(/discovered/g, 'found')
            .replace(/mysterious/g, 'strange');
        } else if (newDifficulty === 'Advanced') {
          adaptedText = `${book.originalText}

This narrative exemplifies the quintessential bildungsroman elements, demonstrating the protagonist's psychological and moral development through their encounters with adversity and revelation. The thematic undertones explore existential questions while maintaining accessibility through archetypal character construction.`;
        }

        setBook({ ...book, currentText: adaptedText, difficulty: newDifficulty });
      }
    } catch (error) {
      console.error('Error adapting text:', error);
      // Keep original text on error
    } finally {
      setIsAdapting(false);
    }
  };

  const toggleFontSize = () => {
    const sizes = ['text-base', 'text-lg', 'text-xl', 'text-2xl'];
    const currentIndex = sizes.indexOf(fontSize);
    setFontSize(sizes[(currentIndex + 1) % sizes.length]);
  };

  const handleWordClick = (word: string) => {
    const vocabWord = book?.vocabulary.find(v => 
      v.word.toLowerCase() === word.toLowerCase()
    );
    if (vocabWord) {
      setSelectedWord(vocabWord);
      setShowVocabulary(true);
    }
  };

  const speakText = async (text: string) => {
    if (isSpeaking) {
      // Stop current audio
      if (audioUrl) {
        const audio = document.getElementById('tts-audio') as HTMLAudioElement;
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
        }
      }
      setIsSpeaking(false);
      setAudioUrl(null);
      return;
    }

    try {
      setIsSpeaking(true);
      
      // Call OpenAI TTS API
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text.slice(0, 4096), // OpenAI limit
          voice: 'nova', // Use nova voice - clearer and more natural
          speed: 1.0
        }),
      });

      if (!response.ok) {
        throw new Error('TTS request failed');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);

      // Play audio
      const audio = new Audio(url);
      audio.id = 'tts-audio';
      
      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(url);
        setAudioUrl(null);
      };

      await audio.play();
    } catch (error) {
      console.error('TTS Error:', error);
      setIsSpeaking(false);
      // TTS disabled - no browser fallback to prevent monster sounds
      console.log('TTS disabled to prevent monster sounds');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your reading material...</p>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Book not found</p>
          <Link href="/learn" className="text-blue-600 hover:underline">
            Return to Learning Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gray-200 z-50">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      {/* Header */}
      <div className="bg-white shadow-sm sticky top-1 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/learn')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors min-w-0"
            >
              <ArrowLeft className="w-5 h-5 flex-shrink-0" />
              <span className="hidden sm:inline">Back to Learning</span>
            </button>
            
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate mx-4">{book.title}</h1>
            
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Difficulty Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowDifficultyMenu(!showDifficultyMenu)}
                  className={`p-2 rounded-lg transition-colors ${
                    showDifficultyMenu 
                      ? 'bg-purple-100 text-purple-700' 
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                  title="Adjust difficulty level"
                >
                  <Zap className="w-5 h-5" />
                </button>
                {showDifficultyMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
                    {(['Beginner', 'Intermediate', 'Advanced'] as const).map((level) => (
                      <button
                        key={level}
                        onClick={() => adaptTextDifficulty(level)}
                        className={`w-full px-4 py-2 text-left hover:bg-gray-100 ${
                          difficulty === level ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                        }`}
                      >
                        {level}
                        {difficulty === level && ' ✓'}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Font Size */}
              <button
                onClick={toggleFontSize}
                className="p-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                title="Change text size"
              >
                <Type className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {/* Text to Speech */}
              <button
                onClick={() => speakText(book.currentText)}
                className={`p-2 rounded-lg transition-colors ${
                  isSpeaking 
                    ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
                title={isSpeaking ? 'Stop reading' : 'Start reading'}
              >
                <Volume2 className={`w-4 h-4 sm:w-5 sm:h-5 ${isSpeaking ? 'animate-pulse' : ''}`} />
              </button>

              {/* Vocabulary */}
              <button
                onClick={() => setShowVocabulary(!showVocabulary)}
                className={`p-2 rounded-lg transition-colors ${
                  showVocabulary 
                    ? 'bg-orange-100 text-orange-700' 
                    : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                }`}
                title={showVocabulary ? 'Hide vocabulary' : 'Show vocabulary'}
              >
                <Brain className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          {/* Reading Stats */}
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {book.readingTime} min read
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="w-4 h-4" />
              {book.currentText.split(' ').length} words
            </span>
            <span className="flex items-center gap-1">
              <Sparkles className="w-4 h-4" />
              {book.vocabulary.length} vocabulary words
            </span>
          </div>
        </div>
      </div>

      {/* Main Content with AI Tutor Side Panel */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-6">
          {/* Reading Content */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-lg p-8">
              {isAdapting && (
                <div className="mb-4 p-4 bg-blue-50 rounded-lg flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  <span className="text-blue-700">Adapting text to {difficulty} level...</span>
                </div>
              )}

              {/* Content Display - Always text content in learn mode */}
              <div className={`prose prose-lg max-w-none ${fontSize}`}>
                {book.currentText.split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-4 leading-relaxed text-gray-800">
                    {paragraph.split(' ').map((word, wordIndex) => {
                      const isVocab = book.vocabulary.some(v => 
                        v.word.toLowerCase() === word.toLowerCase().replace(/[.,!?;:]/, '')
                      );
                      
                      return (
                        <span key={wordIndex}>
                          {isVocab ? (
                            <span
                              onClick={() => handleWordClick(word.replace(/[.,!?;:]/, ''))}
                              className="cursor-pointer text-blue-600 hover:text-blue-700 underline decoration-dotted"
                            >
                              {word}
                            </span>
                          ) : (
                            word
                          )}
                          {' '}
                        </span>
                      );
                    })}
                  </p>
                ))}
              </div>
            </div>

            {/* Vocabulary Panel */}
            {showVocabulary && (
              <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  Vocabulary Helper
                </h3>
                
                {selectedWord ? (
                  <div className="mb-4 p-4 bg-purple-50 rounded-lg">
                    <h4 className="font-semibold text-purple-900 mb-2">{selectedWord.word}</h4>
                    <p className="text-purple-700 mb-2">{selectedWord.definition}</p>
                    <p className="text-sm text-purple-600 italic">Example: {selectedWord.example}</p>
                    <div className="mt-2">
                      <span className="text-xs text-purple-500">
                        Difficulty: {'⭐'.repeat(selectedWord.difficulty)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 mb-4">Click on highlighted words in the text to see definitions</p>
                )}
                
                <div className="grid grid-cols-2 gap-3">
                  {book.vocabulary.map((word, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedWord(word)}
                      className="text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="font-medium text-gray-800">{word.word}</div>
                      <div className="text-xs text-gray-500">
                        {'⭐'.repeat(word.difficulty)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="mt-6 flex justify-center gap-4">
              <button
                onClick={() => router.push(`/learn/quiz/${bookId}`)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Take Quiz
              </button>
            </div>
          </div>

          {/* AI Tutor Side Panel - Mobile: Full overlay, Desktop: Side panel */}
          <div className={`transition-all duration-300 ${showAITutor ? 'w-96' : 'w-0'} overflow-hidden ${showAITutor ? 'fixed lg:relative' : ''} ${showAITutor ? 'top-0 left-0 right-0 bottom-0 lg:top-auto lg:left-auto lg:right-auto lg:bottom-auto' : ''} ${showAITutor ? 'z-50 lg:z-auto' : ''}`}>
            {showAITutor && (
              <>
                {/* Mobile backdrop */}
                <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowAITutor(false)} />
                
                <div className={`${showAITutor ? 'w-full lg:w-96' : 'w-96'} bg-white rounded-lg shadow-lg h-[calc(100vh-80px)] lg:h-[calc(100vh-200px)] ${showAITutor ? 'fixed lg:sticky' : 'sticky'} ${showAITutor ? 'top-20 lg:top-24' : 'top-24'} ${showAITutor ? 'left-4 right-4 lg:left-auto lg:right-auto' : ''} flex flex-col z-50`}>
                  {/* AI Tutor Header */}
                  <div className="p-4 border-b bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Brain className="w-5 h-5" />
                        <h3 className="font-semibold">AI Tutor</h3>
                      </div>
                      <button
                        onClick={() => setShowAITutor(false)}
                        className="p-1 hover:bg-white/20 rounded transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs mt-1 opacity-90">Ask questions about the text</p>
                  </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {aiTutorMessages.length === 0 ? (
                    <div className="text-center text-gray-500 mt-8">
                      <Brain className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-sm">Hi! I'm your AI tutor.</p>
                      <p className="text-sm mt-2">Ask me anything about this text!</p>
                      <div className="mt-4 space-y-2">
                        <button
                          onClick={() => {
                            setAiTutorInput('What is the main idea of this text?');
                          }}
                          className="block w-full text-left px-3 py-2 text-xs bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
                        >
                          💡 What is the main idea?
                        </button>
                        <button
                          onClick={() => {
                            setAiTutorInput('Can you explain the vocabulary words?');
                          }}
                          className="block w-full text-left px-3 py-2 text-xs bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
                        >
                          📚 Explain the vocabulary
                        </button>
                        <button
                          onClick={() => {
                            setAiTutorInput('Give me a summary of this story.');
                          }}
                          className="block w-full text-left px-3 py-2 text-xs bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
                        >
                          📝 Summarize the story
                        </button>
                      </div>
                    </div>
                  ) : (
                    aiTutorMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex ${
                          msg.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-lg ${
                            msg.role === 'user'
                              ? 'bg-purple-500 text-white'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                  {isAiLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 p-3 rounded-lg">
                        <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Input Area */}
                <div className="p-4 border-t">
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!aiTutorInput.trim() || isAiLoading) return;

                      const userMessage = aiTutorInput;
                      setAiTutorMessages(prev => [...prev, { role: 'user', content: userMessage }]);
                      setAiTutorInput('');
                      setIsAiLoading(true);

                      try {
                        // Call actual AI chat API
                        const response = await fetch('/api/learn/chat', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            message: userMessage,
                            bookId,
                            bookContext: {
                              title: book.title,
                              content: book.currentText.substring(0, 2000) // Send relevant context
                            },
                            chatHistory: aiTutorMessages
                          }),
                        });

                        if (response.ok) {
                          const data = await response.json();
                          setAiTutorMessages(prev => [...prev, {
                            role: 'assistant',
                            content: data.response
                          }]);
                        } else {
                          throw new Error('AI service temporarily unavailable');
                        }
                        setIsAiLoading(false);
                      } catch (error) {
                        console.error('AI Tutor error:', error);
                        setAiTutorMessages(prev => [...prev, {
                          role: 'assistant',
                          content: 'I apologize, but I\'m having trouble right now. Please try asking your question again in a moment.'
                        }]);
                        setIsAiLoading(false);
                      }
                    }}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      value={aiTutorInput}
                      onChange={(e) => setAiTutorInput(e.target.value)}
                      placeholder="Ask a question..."
                      className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      disabled={isAiLoading}
                    />
                    <button
                      type="submit"
                      disabled={!aiTutorInput.trim() || isAiLoading}
                      className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Floating AI Tutor Toggle Button */}
      {!showAITutor && (
        <button
          onClick={() => setShowAITutor(true)}
          className="fixed right-4 sm:right-8 bottom-4 sm:bottom-8 p-3 sm:p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200 z-40"
          title="Ask AI Tutor"
        >
          <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      )}
    </div>
  );
}