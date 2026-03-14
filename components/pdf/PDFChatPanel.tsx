'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, MessageCircle, Sparkles, BookOpen, X } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface PDFChatPanelProps {
  bookId: string;
  bookTitle: string;
  pdfText: string;
  language: string;
  onClose: () => void;
}

const QUICK_ACTIONS = [
  { label: { en: 'Summarize', ko: '요약', es: 'Resumir', ar: 'تلخيص', hi: 'सारांश', fr: 'Résumer', de: 'Zusammenfassen', ja: '要約', pt: 'Resumir', ru: 'Резюме', it: 'Riassumi', zh: '总结' }, icon: BookOpen },
  { label: { en: 'Explain character', ko: '등장인물 설명', es: 'Explicar personaje', ar: 'شرح الشخصية', hi: 'चरित्र समझाएं', fr: 'Expliquer le personnage', de: 'Charakter erklären', ja: 'キャラクター説明', pt: 'Explicar personagem', ru: 'Объяснить персонажа', it: 'Spiega personaggio', zh: '解释角色' }, icon: MessageCircle },
  { label: { en: 'Key themes', ko: '주요 주제', es: 'Temas clave', ar: 'المواضيع الرئيسية', hi: 'मुख्य विषय', fr: 'Thèmes clés', de: 'Hauptthemen', ja: '主要テーマ', pt: 'Temas principais', ru: 'Ключевые темы', it: 'Temi chiave', zh: '关键主题' }, icon: Sparkles },
];

export default function PDFChatPanel({ bookId, bookTitle, pdfText, language, onClose }: PDFChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const welcomeMessages: Record<string, string> = {
      en: `Hi! I'm your reading assistant for "${bookTitle}". Ask me anything about the story!`,
      ko: `안녕하세요! "${bookTitle}" 독서 도우미입니다. 이야기에 대해 무엇이든 물어보세요!`,
      es: `¡Hola! Soy tu asistente de lectura para "${bookTitle}". ¡Pregúntame cualquier cosa sobre la historia!`,
      ar: `مرحبًا! أنا مساعد القراءة الخاص بك لـ "${bookTitle}". اسألني أي شيء عن القصة!`,
      hi: `नमस्ते! मैं "${bookTitle}" के लिए आपका पठन सहायक हूँ। कहानी के बारे में मुझसे कुछ भी पूछें!`,
      fr: `Bonjour ! Je suis votre assistant de lecture pour "${bookTitle}". Posez-moi n'importe quelle question sur l'histoire !`,
      de: `Hallo! Ich bin dein Leseassistent für "${bookTitle}". Frag mich alles über die Geschichte!`,
      ja: `こんにちは！「${bookTitle}」の読書アシスタントです。物語について何でも聞いてください！`,
      pt: `Olá! Sou seu assistente de leitura para "${bookTitle}". Pergunte-me qualquer coisa sobre a história!`,
      ru: `Привет! Я твой помощник по чтению для "${bookTitle}". Спроси меня что угодно о истории!`,
      it: `Ciao! Sono il tuo assistente di lettura per "${bookTitle}". Chiedimi qualsiasi cosa sulla storia!`,
      zh: `你好！我是"${bookTitle}"的阅读助手。问我关于故事的任何问题！`,
    };

    setMessages([{
      role: 'assistant',
      content: welcomeMessages[language] || welcomeMessages.en,
      timestamp: new Date(),
    }]);
  }, [bookTitle, language]);

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || input.trim();
    if (!textToSend || loading) return;

    const userMessage: Message = { role: 'user', content: textToSend, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai/reading-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId,
          message: textToSend,
          chatHistory: messages.map(m => ({ role: m.role, content: m.content })),
          language,
          pdfTextContent: pdfText,
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response, timestamp: new Date() }]);
    } catch {
      const errorMessages: Record<string, string> = {
        en: "Sorry, I couldn't process that. Please try again.",
        ko: '죄송합니다. 처리할 수 없습니다. 다시 시도해주세요.',
        es: 'Lo siento, no pude procesar eso. Por favor, inténtalo de nuevo.',
        ar: 'عذرًا، لم أتمكن من معالجة ذلك. يرجى المحاولة مرة أخرى.',
        hi: 'क्षमा करें, मैं इसे संसाधित नहीं कर सका। कृपया पुनः प्रयास करें.',
        fr: "Désolé, je n'ai pas pu traiter cela. Veuillez réessayer.",
        de: 'Entschuldigung, ich konnte das nicht verarbeiten. Bitte versuchen Sie es erneut.',
        ja: '申し訳ありません。処理できませんでした。もう一度お試しください。',
        pt: 'Desculpe, não consegui processar isso. Por favor, tente novamente.',
        ru: 'Извините, я не смог обработать это. Пожалуйста, попробуйте снова.',
        it: 'Scusa, non sono riuscito a elaborare questo. Per favore, riprova.',
        zh: '抱歉，我无法处理。请重试。',
      };
      setMessages(prev => [...prev, { role: 'assistant', content: errorMessages[language] || errorMessages.en, timestamp: new Date() }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const placeholderText: Record<string, string> = {
    en: 'Ask me anything about the story...',
    ko: '이야기에 대해 무엇이든 물어보세요...',
    es: 'Pregúntame cualquier cosa sobre la historia...',
    ar: 'اسألني أي شيء عن القصة...',
    hi: 'कहानी के बारे में मुझसे कुछ भी पूछें...',
    fr: "Posez-moi n'importe quelle question sur l'histoire...",
    de: 'Frag mich alles über die Geschichte...',
    ja: '物語について何でも聞いてください...',
    pt: 'Pergunte-me qualquer coisa sobre a história...',
    ru: 'Спроси меня что угодно о истории...',
    it: 'Chiedimi qualsiasi cosa sulla storia...',
    zh: '问我关于故事的任何问题...',
  };

  return (
    <div className="h-full flex flex-col bg-gray-800 text-gray-100">
      <div className="p-3 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-blue-400" />
          <h2 className="font-medium text-sm">AI Reading Assistant</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-white rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {messages.length <= 1 && (
        <div className="p-3 border-b border-gray-700">
          <p className="text-xs text-gray-400 mb-2">Quick actions:</p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_ACTIONS.map((action, index) => {
              const Icon = action.icon;
              const label = action.label[language as keyof typeof action.label] || action.label.en;
              return (
                <button
                  key={index}
                  onClick={() => sendMessage(label)}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-700 border border-gray-600 rounded-full text-xs text-gray-300 hover:bg-gray-600 hover:text-white transition-colors"
                  disabled={loading}
                >
                  <Icon className="w-3 h-3" />
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-lg p-2.5 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-100'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <p className={`text-xs mt-1 ${message.role === 'user' ? 'text-blue-200' : 'text-gray-400'}`}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-700 text-gray-100 rounded-lg p-2.5 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-gray-700">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={placeholderText[language] || placeholderText.en}
            className="flex-1 resize-none bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={2}
            disabled={loading}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="self-end p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
