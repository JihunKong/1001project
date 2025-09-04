'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  BookOpen, 
  MessageSquare, 
  Send,
  User,
  Bot,
  AlertCircle,
  FileText,
  Brain,
  PenTool,
  Users,
  CheckSquare,
  Loader2,
  Settings
} from 'lucide-react';
import Link from 'next/link';
import { eslActivityTemplates, ActivityTemplate } from '@/components/esl/ActivityTemplates';
import ActivityWorkspace from '@/components/esl/ActivityWorkspace';

interface Book {
  id: string;
  title: string;
  subtitle?: string;
  summary?: string;
  author: {
    id: string;
    name: string;
    age?: number;
    location?: string;
  };
  language: string;
  pageCount?: number;
  readingLevel?: string;
  category: string[];
  tags: string[];
  isPremium: boolean;
  pdfKey?: string;
  fullPdf?: string;
  samplePdf?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Activity {
  id: string;
  type: 'vocabulary' | 'comprehension' | 'discussion' | 'writing';
  title: string;
  description: string;
  icon: string;
  completed: boolean;
}

export default function ESLBookPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const bookId = params.id as string;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // State management
  const [book, setBook] = useState<Book | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [textExtracting, setTextExtracting] = useState(false);
  
  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // Activity state
  const [activeTab, setActiveTab] = useState<'reading' | 'vocabulary' | 'comprehension' | 'discussion' | 'writing'>('reading');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [currentActivityTemplate, setCurrentActivityTemplate] = useState<ActivityTemplate | null>(null);

  useEffect(() => {
    if (bookId) {
      fetchBookDetails();
      loadActivities();
      loadChatHistory();
    }
  }, [bookId]);

  useEffect(() => {
    // Update current activity template when tab changes
    if (activeTab !== 'reading') {
      const template = eslActivityTemplates.find(t => t.type === activeTab);
      setCurrentActivityTemplate(template || null);
    } else {
      setCurrentActivityTemplate(null);
    }
  }, [activeTab]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchBookDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/library/books/${bookId}`);
      
      if (!response.ok) {
        setError('Book not found');
        return;
      }

      const data = await response.json();
      setBook(data);
      
      // Extract text from PDF
      if (data.pdfKey || data.fullPdf || data.samplePdf) {
        await extractTextFromPDF(data);
      }
    } catch (err) {
      setError('Failed to load book');
    } finally {
      setLoading(false);
    }
  };

  const extractTextFromPDF = async (bookData: Book) => {
    try {
      setTextExtracting(true);
      const pdfUrl = bookData.pdfKey || bookData.fullPdf || bookData.samplePdf;
      
      const response = await fetch('/api/esl/extract-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookId: bookData.id,
          pdfUrl: pdfUrl
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setExtractedText(data.text || 'No text could be extracted from this PDF.');
      } else {
        setExtractedText('Unable to extract text from this PDF. Please try a different book.');
      }
    } catch (err) {
      setExtractedText('Error extracting text from PDF.');
    } finally {
      setTextExtracting(false);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isTyping) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Save user message
    saveChatMessage(userMessage);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          bookContext: {
            title: book?.title,
            text: extractedText.substring(0, 3000), // Limit context size
            userAge: session?.user?.profile?.age || 18
          },
          chatHistory: messages.slice(-5) // Last 5 messages for context
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
        
        // Save assistant message
        saveChatMessage(assistantMessage);
      } else {
        throw new Error('Failed to get AI response');
      }
    } catch (err) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const loadActivities = async () => {
    try {
      // Try to load saved activities from history API
      const response = await fetch(`/api/esl/history?type=activity&bookId=${bookId}`);
      if (response.ok) {
        const data = await response.json();
        const savedActivities = data.activities || [];
        
        // Create activities with completion status
        const activities: Activity[] = eslActivityTemplates.map(template => {
          const saved = savedActivities.find((a: any) => a.templateId === template.id);
          return {
            id: template.id,
            type: template.type,
            title: template.title,
            description: template.description,
            icon: template.icon,
            completed: saved?.status === 'submitted' || saved?.status === 'evaluated'
          };
        });
        
        setActivities(activities);
      } else {
        throw new Error('Failed to load activities');
      }
    } catch (error) {
      console.error('Error loading activities:', error);
      // Fallback to default activities
      const defaultActivities: Activity[] = eslActivityTemplates.map(template => ({
        id: template.id,
        type: template.type,
        title: template.title,
        description: template.description,
        icon: template.icon,
        completed: false
      }));
      setActivities(defaultActivities);
    }
  };

  const loadChatHistory = async () => {
    try {
      const response = await fetch(`/api/esl/history?type=chat&bookId=${bookId}`);
      if (response.ok) {
        const data = await response.json();
        const savedMessages = data.history || [];
        
        // Convert saved messages to ChatMessage format
        const chatMessages: ChatMessage[] = savedMessages.map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.timestamp)
        }));
        
        setMessages(chatMessages);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleActivitySave = async (activity: any) => {
    try {
      await fetch('/api/esl/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'activity',
          bookId: bookId,
          data: activity
        }),
      });
      console.log('Activity saved:', activity);
    } catch (error) {
      console.error('Error saving activity:', error);
    }
  };

  const handleActivitySubmit = async (activity: any) => {
    try {
      await fetch('/api/esl/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'activity',
          bookId: bookId,
          data: { ...activity, status: 'submitted' }
        }),
      });

      // Mark activity as completed in UI
      setActivities(prev => 
        prev.map(act => 
          act.type === activeTab 
            ? { ...act, completed: true }
            : act
        )
      );
      
      console.log('Activity submitted:', activity);
    } catch (error) {
      console.error('Error submitting activity:', error);
    }
  };

  const saveChatMessage = async (message: ChatMessage) => {
    try {
      await fetch('/api/esl/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'chat',
          bookId: bookId,
          data: {
            role: message.role,
            content: message.content
          }
        }),
      });
    } catch (error) {
      console.error('Error saving chat message:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading book...</p>
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Book Not Found</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link
            href="/library"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Library
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/programs/esl"
                className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to ESL Program
              </Link>
              <div className="text-sm text-gray-500">|</div>
              <h1 className="text-xl font-semibold text-gray-900">{book.title}</h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">by {book.author.name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('reading')}
              className={`py-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'reading'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Reading Mode
              </div>
            </button>
            {activities.map(activity => (
              <button
                key={activity.id}
                onClick={() => setActiveTab(activity.type)}
                className={`py-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === activity.type
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  {activity.type === 'vocabulary' && <FileText className="w-4 h-4" />}
                  {activity.type === 'comprehension' && <Brain className="w-4 h-4" />}
                  {activity.type === 'discussion' && <Users className="w-4 h-4" />}
                  {activity.type === 'writing' && <PenTool className="w-4 h-4" />}
                  {activity.title}
                  {activity.completed && <CheckSquare className="w-4 h-4 text-green-600" />}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'reading' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
            
            {/* Left Side - Extracted Text */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Book Content
                </h2>
              </div>
              
              <div className="p-6 h-[calc(100%-80px)] overflow-y-auto">
                {textExtracting ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                      <p className="text-gray-600">Extracting text from PDF...</p>
                    </div>
                  </div>
                ) : (
                  <div className="prose prose-sm max-w-none">
                    {extractedText ? (
                      <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
                        {extractedText}
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-8">
                        <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p>No text content available for this book.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Side - AI Chat */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  AI Learning Assistant
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Ask questions about the story or get help with vocabulary
                </p>
              </div>
              
              {/* Messages */}
              <div className="h-[calc(100%-140px)] overflow-y-auto p-6">
                <div className="space-y-4">
                  {messages.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                      <Bot className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p className="mb-2">Hi! I'm your AI learning assistant.</p>
                      <p className="text-sm">Ask me about the story, vocabulary, or anything you'd like to discuss!</p>
                    </div>
                  )}
                  
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex gap-3 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          message.role === 'user' ? 'bg-blue-100' : 'bg-gray-100'
                        }`}>
                          {message.role === 'user' ? (
                            <User className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Bot className="w-4 h-4 text-gray-600" />
                          )}
                        </div>
                        <div className={`rounded-lg px-4 py-2 ${
                          message.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}>
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          <p className={`text-xs mt-1 ${
                            message.role === 'user' ? 'text-blue-200' : 'text-gray-500'
                          }`}>
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {isTyping && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-gray-600" />
                      </div>
                      <div className="bg-gray-100 rounded-lg px-4 py-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>
              
              {/* Input */}
              <div className="p-6 border-t">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask about the story, vocabulary, or themes..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isTyping}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!inputMessage.trim() || isTyping}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Activity Panels */}
        {activeTab !== 'reading' && currentActivityTemplate && (
          <ActivityWorkspace
            template={currentActivityTemplate}
            bookId={bookId}
            studentId={session?.user?.id || 'anonymous'}
            onSave={handleActivitySave}
            onSubmit={handleActivitySubmit}
          />
        )}
      </div>
    </div>
  );
}