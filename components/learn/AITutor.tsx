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
  RefreshCw,
  BookOpen,
  HelpCircle,
  Sparkles,
  MessageSquare
} from 'lucide-react';

interface AITutorProps {
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

export function AITutor({ bookId, bookTitle, currentPage, pageContent }: AITutorProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hello! I'm your AI tutor. I'm here to help you understand "${bookTitle}". Feel free to ask me anything about the text, vocabulary, or concepts!`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const suggestedQuestions = [
    'What is the main idea of this page?',
    'Can you explain difficult words?',
    'Give me a summary of this section',
    'Create a quiz question about this',
    'How does this relate to real life?',
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
      return 'The main idea of this section focuses on the ESL learning system that combines reading, vocabulary building, and interactive features. It emphasizes how AI technology helps identify difficult words and track student progress.';
    }
    
    if (lowerQuestion.includes('difficult') || lowerQuestion.includes('vocabulary')) {
      return 'Some challenging vocabulary in this section includes:\n\n• **Comprehension** - Understanding of something\n• **Collaborative** - Working together with others\n• **Assessment** - Evaluation or testing\n• **Gamification** - Using game elements in learning\n\nWould you like me to explain any of these in more detail?';
    }
    
    if (lowerQuestion.includes('quiz')) {
      return 'Here\'s a quiz question based on this page:\n\n**Question:** What are the main components of the ESL learning system described?\n\na) Only reading and writing\nb) Reading, vocabulary, quizzes, and social interaction\nc) Just vocabulary memorization\nd) Only grammar exercises\n\n**Answer:** b) The system combines multiple learning approaches for comprehensive education.';
    }
    
    if (lowerQuestion.includes('real life') || lowerQuestion.includes('relate')) {
      return 'This learning approach relates to real-life language acquisition by:\n\n1. **Context-based learning** - Words are learned within meaningful text\n2. **Social interaction** - Discussion with peers mimics real conversations\n3. **Practical application** - Quizzes test real understanding\n4. **Progressive difficulty** - Matches natural language learning progression\n\nThese elements prepare you for actual English usage in daily life!';
    }
    
    return 'That\'s a great question! Based on the text, I can help you understand this concept better. The passage discusses how integrated learning systems can enhance ESL education through technology. Would you like me to elaborate on any specific aspect?';
  };

  const handleVoiceInput = () => {
    setIsListening(!isListening);
    // In production, implement speech-to-text
  };

  const speakMessage = async (text: string) => {
    try {
      // Call the TTS API
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voice: 'alloy', // You can make this configurable
          speed: 1.0,
        }),
      });

      if (!response.ok) {
        throw new Error('TTS generation failed');
      }

      const data = await response.json();
      
      // Play the audio
      if (data.audioUrl) {
        const audio = new Audio(data.audioUrl);
        audio.play();
      }
    } catch (error) {
      console.error('TTS Error:', error);
      // TTS disabled - no browser fallback to prevent monster sounds
      console.log('TTS disabled to prevent monster sounds');
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
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Bot className="w-8 h-8 text-purple-600" />
              <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">AI Tutor</h3>
              <p className="text-xs text-gray-600">Always here to help</p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            <span className="text-sm font-medium text-gray-700">Level B1</span>
          </div>
        </div>
      </div>

      {/* Suggested Questions */}
      <div className="p-3 border-b border-gray-100 bg-gray-50">
        <p className="text-xs text-gray-600 mb-2">Quick questions:</p>
        <div className="flex flex-wrap gap-2">
          {suggestedQuestions.slice(0, 3).map((question, index) => (
            <button
              key={index}
              onClick={() => setInput(question)}
              className="text-xs px-2 py-1 bg-white border border-gray-200 rounded-full hover:bg-blue-50 hover:border-blue-300 transition-colors"
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
                className={`max-w-[80%] rounded-lg p-3 ${
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
          <button
            onClick={handleVoiceInput}
            className={`p-2 rounded-lg transition-colors ${
              isListening
                ? 'bg-red-100 text-red-600'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title="Voice input"
          >
            <Mic className="w-5 h-5" />
          </button>
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
            placeholder="Ask me anything about the text..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          💡 Tip: Ask about vocabulary, main ideas, or request practice questions!
        </p>
      </div>
    </div>
  );
}