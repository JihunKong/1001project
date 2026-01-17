'use client';

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { ArrowLeft, BookOpen, Send, Bot, User } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface Book {
  id: string;
  title: string;
  coverImage?: string;
  authorName: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AIHelperPage() {
  const { t, language } = useTranslation();
  const { data: session, status } = useSession();
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      redirect('/login');
    }
    if (session.user?.role !== 'LEARNER') {
      redirect('/dashboard');
    }
  }, [session, status]);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const res = await fetch('/api/book-assignments');
        if (res.ok) {
          const data = await res.json();
          const assignedBooks = (data.assignments || []).map((a: { bookId: string; bookTitle: string; coverImage?: string; authorName: string }) => ({
            id: a.bookId,
            title: a.bookTitle,
            coverImage: a.coverImage,
            authorName: a.authorName,
          }));
          setBooks(assignedBooks);
        }
      } catch (error) {
        console.error('Error fetching books:', error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.id) {
      fetchBooks();
    }
  }, [session]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectBook = (book: Book) => {
    setSelectedBook(book);
    setMessages([]);
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !selectedBook || sending) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setSending(true);

    try {
      const res = await fetch('/api/ai/reading-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: selectedBook.id,
          message: userMessage,
          chatHistory: messages,
          language,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, { role: 'assistant', content: data.response }]);
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', content: t('dashboard.learner.aiHelper.errorMessage') }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: t('dashboard.learner.aiHelper.errorMessage') }]);
    } finally {
      setSending(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('dashboard.common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.location.href = '/dashboard/learner'}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('dashboard.learner.aiHelper.title')}</h1>
              <p className="mt-1 text-sm text-gray-500">{t('dashboard.learner.aiHelper.subtitle')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="px-4 py-3 border-b border-gray-200">
                <h2 className="font-medium text-gray-900">{t('dashboard.learner.aiHelper.selectBook')}</h2>
              </div>
              <div className="p-4 max-h-96 overflow-y-auto">
                {books.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">{t('dashboard.learner.aiHelper.noBooks')}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {books.map((book) => (
                      <button
                        key={book.id}
                        onClick={() => handleSelectBook(book)}
                        className={`w-full p-3 rounded-lg text-left transition-colors ${
                          selectedBook?.id === book.id
                            ? 'bg-indigo-50 border-2 border-indigo-300'
                            : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <p className="font-medium text-gray-900 text-sm truncate">{book.title}</p>
                        <p className="text-xs text-gray-500 truncate">{book.authorName}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow h-[600px] flex flex-col">
              {selectedBook ? (
                <>
                  <div className="px-4 py-3 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <Bot className="h-6 w-6 text-indigo-500" />
                      <div>
                        <h2 className="font-medium text-gray-900">{t('dashboard.learner.aiHelper.chatTitle')}</h2>
                        <p className="text-sm text-gray-500">{selectedBook.title}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 && (
                      <div className="text-center py-12">
                        <Bot className="h-12 w-12 text-indigo-300 mx-auto mb-4" />
                        <p className="text-gray-500">{t('dashboard.learner.aiHelper.startMessage')}</p>
                        <p className="text-sm text-gray-400 mt-2">{t('dashboard.learner.aiHelper.suggestQuestions')}</p>
                      </div>
                    )}
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {message.role === 'assistant' && (
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Bot className="h-4 w-4 text-indigo-600" />
                          </div>
                        )}
                        <div
                          className={`max-w-[80%] rounded-lg px-4 py-2 ${
                            message.role === 'user'
                              ? 'bg-indigo-500 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        </div>
                        {message.role === 'user' && (
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                            <User className="h-4 w-4 text-gray-600" />
                          </div>
                        )}
                      </div>
                    ))}
                    {sending && (
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                          <Bot className="h-4 w-4 text-indigo-600" />
                        </div>
                        <div className="bg-gray-100 rounded-lg px-4 py-2">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="p-4 border-t border-gray-200">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSendMessage();
                      }}
                      className="flex gap-2"
                    >
                      <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={t('dashboard.learner.aiHelper.inputPlaceholder')}
                        className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        maxLength={500}
                        disabled={sending}
                      />
                      <button
                        type="submit"
                        disabled={!input.trim() || sending}
                        className="bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        <Send className="h-5 w-5" />
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">{t('dashboard.learner.aiHelper.selectBookPrompt')}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
