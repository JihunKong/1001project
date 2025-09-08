'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, 
  Send, 
  Mic, 
  Volume2,
  ThumbsUp,
  ThumbsDown,
  X,
  Sparkles,
  Minimize2,
  Maximize2
} from 'lucide-react';

interface AITutorSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  bookId: string;
  bookTitle: string;
  currentPage: number;
  pageContent: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  helpful?: boolean;
}

export function AITutorSidebar({ 
  isOpen, 
  onClose, 
  bookId, 
  bookTitle, 
  currentPage, 
  pageContent 
}: AITutorSidebarProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hello! I'm your AI tutor for "${bookTitle}". I'm here to help you understand the text, learn vocabulary, and answer any questions. What would you like to know?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const suggestedQuestions = [
    'What is the main idea?',
    'Explain difficult words',
    'Give me a quiz',
    'Summarize this page',
  ];

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateAIResponse(input, pageContent),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const generateAIResponse = (question: string, content: string): string => {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('main idea') || lowerQuestion.includes('summary')) {
      return 'The main idea of this section focuses on the integrated ESL learning system that combines reading, vocabulary building, and interactive features. It emphasizes how technology enhances language learning through AI-powered vocabulary identification and gamification.';
    }
    
    if (lowerQuestion.includes('difficult') || lowerQuestion.includes('vocabulary')) {
      return 'Here are some challenging words from this page:\\n\\n• **Artificial Intelligence** - Computer systems that can perform tasks normally requiring human intelligence\\n• **Collaborative** - Working together with others\\n• **Comprehension** - Understanding of something\\n• **Gamification** - Using game elements in learning\\n\\nClick any word to see its definition and add it to your vocabulary list!';
    }
    
    if (lowerQuestion.includes('quiz')) {
      return 'Let\\'s test your understanding!\\n\\n**Question 1:** What are the main components of the ESL learning system described?\\n\\na) Only reading\\nb) Reading, vocabulary, quizzes, and social features\\nc) Just vocabulary\\nd) Only gamification\\n\\nType your answer (a, b, c, or d) to continue!';
    }
    
    return 'That\\'s a great question! Based on the text, the integrated learning approach combines multiple elements to create an effective ESL learning experience. The system tracks progress, provides instant feedback, and adapts to your learning level. Would you like me to explain any specific part in more detail?';
  };

  const speakMessage = async (text: string) => {
    console.log('Attempting to speak:', text);
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voice: 'nova', // 부드럽고 친근한 여성 목소리
          speed: 1.0,
        }),
      });

      console.log('TTS API Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.text();
        console.error('TTS API Error response:', errorData);
        throw new Error(`TTS generation failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('TTS API Response data:', data);
      
      if (data.audioUrl) {
        console.log('Playing audio from:', data.audioUrl);
        const audio = new Audio(data.audioUrl);
        await audio.play();
      } else {
        console.error('No audio URL in response');
      }
    } catch (error) {
      console.error('TTS Error:', error);
      // OpenAI TTS 실패 시 브라우저 TTS를 사용하지 않음
      // 크롬의 기본 음성이 불편하므로 차라리 음성 재생을 하지 않음
      console.log('TTS is not available. Please check OpenAI API configuration.');
    }
  };

  const handleFeedback = (messageId: string, helpful: boolean) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId ? { ...msg, helpful } : msg
      )
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className={`fixed right-0 top-0 h-full bg-white shadow-2xl z-50 flex flex-col ${
            isMinimized ? 'w-16' : 'w-96'
          }`}
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
            <div className="flex items-center justify-between">
              <div className={`flex items-center space-x-2 ${isMinimized ? 'hidden' : ''}`}>
                <div className="relative">
                  <Bot className="w-8 h-8 text-purple-600" />
                  <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">AI Tutor</h3>
                  <p className="text-xs text-gray-600">Page {currentPage}</p>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1.5 hover:bg-white/50 rounded-lg transition-colors"
                  title={isMinimized ? 'Expand' : 'Minimize'}
                >
                  {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={onClose}
                  className="p-1.5 hover:bg-white/50 rounded-lg transition-colors"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Suggested Questions */}
              <div className="p-3 border-b border-gray-100 bg-gray-50">
                <p className="text-xs text-gray-600 mb-2">Quick questions:</p>
                <div className="grid grid-cols-2 gap-2">
                  {suggestedQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => setInput(question)}
                      className="text-xs px-2 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-left"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <AnimatePresence>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-lg p-3 ${
                          message.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white border border-gray-200'
                        }`}
                      >
                        {message.role === 'assistant' && (
                          <div className="flex items-center space-x-2 mb-1">
                            <Bot className="w-4 h-4 text-purple-600" />
                            <span className="text-xs font-medium text-gray-600">AI Tutor</span>
                          </div>
                        )}
                        <p className={`text-sm whitespace-pre-wrap ${
                          message.role === 'user' ? 'text-white' : 'text-gray-800'
                        }`}>
                          {message.content}
                        </p>
                        {message.role === 'assistant' && (
                          <div className="flex items-center space-x-2 mt-2">
                            <button
                              onClick={() => speakMessage(message.content)}
                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                              title="Read aloud"
                            >
                              <Volume2 className="w-3 h-3 text-gray-500" />
                            </button>
                            <button
                              onClick={() => handleFeedback(message.id, true)}
                              className={`p-1 hover:bg-gray-100 rounded transition-colors ${
                                message.helpful === true ? 'bg-green-100' : ''
                              }`}
                              title="Helpful"
                            >
                              <ThumbsUp className={`w-3 h-3 ${
                                message.helpful === true ? 'text-green-600' : 'text-gray-500'
                              }`} />
                            </button>
                            <button
                              onClick={() => handleFeedback(message.id, false)}
                              className={`p-1 hover:bg-gray-100 rounded transition-colors ${
                                message.helpful === false ? 'bg-red-100' : ''
                              }`}
                              title="Not helpful"
                            >
                              <ThumbsDown className={`w-3 h-3 ${
                                message.helpful === false ? 'text-red-600' : 'text-gray-500'
                              }`} />
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="bg-white border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <Bot className="w-4 h-4 text-purple-600" />
                        <div className="flex space-x-1">
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Ask about the text..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    rows={1}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || isTyping}
                    className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <button className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                    <Mic className="w-4 h-4" />
                  </button>
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <Sparkles className="w-3 h-3 text-yellow-500" />
                    <span>Powered by AI</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Minimized State */}
          {isMinimized && (
            <div className="flex-1 flex flex-col items-center justify-center">
              <Bot className="w-8 h-8 text-purple-600 mb-2" />
              <span className="text-xs text-gray-600 -rotate-90 whitespace-nowrap mt-8">AI Tutor</span>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}