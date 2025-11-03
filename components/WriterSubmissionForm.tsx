'use client';

import { useState, useEffect, useCallback } from 'react';
import WriterTextEditor from './WriterTextEditor';
import { Sparkles, CheckCircle, AlertCircle, MessageCircle, Send } from 'lucide-react';

interface WriterSubmissionFormProps {
  onSubmit?: (data: FormData) => Promise<void>;
  initialData?: {
    title?: string;
    content?: string;
    summary?: string;
    category?: string;
    tags?: string[];
    ageRange?: string;
  };
}

interface GrammarResult {
  grammarIssues: Array<{
    line: number;
    issue: string;
    suggestion: string;
  }>;
  grammarScore: number;
  suggestions: string[];
}

interface StructureResult {
  structureScore: number;
  hasIntro: boolean;
  hasBody: boolean;
  hasConclusion: boolean;
  suggestions: string[];
}

interface FormData {
  title: string;
  content: string;
  summary: string;
  category: string;
  tags: string[];
  ageRange: string;
}

export default function WriterSubmissionForm({ onSubmit, initialData }: WriterSubmissionFormProps) {
  const [formData, setFormData] = useState<FormData>({
    title: initialData?.title || '',
    content: initialData?.content || '',
    summary: initialData?.summary || '',
    category: initialData?.category || 'PERSONAL_STORY',
    tags: initialData?.tags || [],
    ageRange: initialData?.ageRange || '7-12',
  });

  const [grammarResult, setGrammarResult] = useState<GrammarResult | null>(null);
  const [structureResult, setStructureResult] = useState<StructureResult | null>(null);
  const [chatMessages, setChatMessages] = useState<Array<{ question: string; answer: string }>>([]);
  const [currentQuestion, setCurrentQuestion] = useState('');

  const [isCheckingGrammar, setIsCheckingGrammar] = useState(false);
  const [isAnalyzingStructure, setIsAnalyzingStructure] = useState(false);
  const [isAskingQuestion, setIsAskingQuestion] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [tagInput, setTagInput] = useState('');
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle');

  const checkGrammar = useCallback(async () => {
    if (!formData.content || formData.content === '<p></p>') return;

    setIsCheckingGrammar(true);
    try {
      const response = await fetch('/api/ai/check-grammar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: formData.content }),
      });

      const result = await response.json();
      if (result.success) {
        setGrammarResult(result.data);
      }
    } catch (error) {
      // Grammar check failed silently
    } finally {
      setIsCheckingGrammar(false);
    }
  }, [formData.content]);

  // Debounced auto grammar check
  useEffect(() => {
    if (!formData.content || formData.content === '<p></p>') return;

    const timeoutId = setTimeout(() => {
      checkGrammar();
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, [formData.content, checkGrammar]);

  const analyzeStructure = useCallback(async () => {
    if (!formData.content || formData.content === '<p></p>') return;

    setIsAnalyzingStructure(true);
    try {
      const response = await fetch('/api/ai/analyze-structure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: formData.content }),
      });

      const result = await response.json();
      if (result.success) {
        setStructureResult(result.data);
      }
    } catch (error) {
      // Structure analysis failed silently
    } finally {
      setIsAnalyzingStructure(false);
    }
  }, [formData.content]);

  const askQuestion = useCallback(async () => {
    if (!currentQuestion.trim()) return;

    setIsAskingQuestion(true);
    const question = currentQuestion;
    setCurrentQuestion('');

    try {
      const response = await fetch('/api/ai/writing-help', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: formData.content,
          question
        }),
      });

      const result = await response.json();
      if (result.success) {
        setChatMessages(prev => [...prev, {
          question,
          answer: result.data.answer
        }]);
      }
    } catch (error) {
      // Writing help failed silently
    } finally {
      setIsAskingQuestion(false);
    }
  }, [currentQuestion, formData.content]);

  const handleAutoSave = useCallback((content: string) => {
    setAutoSaveStatus('saving');
    setFormData(prev => ({ ...prev, content }));

    setTimeout(() => {
      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus('idle'), 2000);
    }, 500);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSubmit) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      // Submission error is handled by parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const getScoreEmoji = (score: number) => {
    if (score >= 80) return '😊';
    if (score >= 60) return '😐';
    return '😟';
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-6xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <label className="block text-lg font-medium text-gray-700 mb-2">
          제목 ✏️
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="당신의 이야기 제목을 입력하세요"
          className="w-full px-4 py-3 border-2 border-blue-300 rounded-xl focus:outline-none focus:border-blue-500 text-lg"
          required
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Editor - 2/3 width */}
        <div className="lg:col-span-2 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-lg font-medium text-gray-700">
                이야기 내용 📖
              </label>
              {autoSaveStatus === 'saving' && (
                <span className="text-sm text-blue-500">저장 중...</span>
              )}
              {autoSaveStatus === 'saved' && (
                <span className="text-sm text-green-500">✓ 자동 저장됨</span>
              )}
            </div>
            <WriterTextEditor
              content={formData.content}
              onChange={(content) => setFormData(prev => ({ ...prev, content }))}
              onAutoSave={handleAutoSave}
            />
          </div>

          {/* Summary */}
          <div>
            <label className="block text-lg font-medium text-gray-700 mb-2">
              요약 (짧게 설명해주세요) 📝
            </label>
            <textarea
              value={formData.summary}
              onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
              placeholder="이야기를 짧게 요약해주세요 (2-3문장)"
              className="w-full px-4 py-3 border-2 border-blue-300 rounded-xl focus:outline-none focus:border-blue-500"
              rows={3}
              required
            />
          </div>

          {/* Category and Age Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                카테고리 🗂️
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-4 py-3 border-2 border-blue-300 rounded-xl focus:outline-none focus:border-blue-500"
              >
                <option value="PERSONAL_STORY">개인 이야기</option>
                <option value="FAMILY">가족 이야기</option>
                <option value="FRIEND">친구 이야기</option>
                <option value="SCHOOL">학교 이야기</option>
                <option value="DREAM">꿈과 희망</option>
                <option value="ADVENTURE">모험</option>
                <option value="FANTASY">상상 이야기</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                나이 👶
              </label>
              <select
                value={formData.ageRange}
                onChange={(e) => setFormData(prev => ({ ...prev, ageRange: e.target.value }))}
                className="w-full px-4 py-3 border-2 border-blue-300 rounded-xl focus:outline-none focus:border-blue-500"
              >
                <option value="5-7">5-7살</option>
                <option value="7-12">7-12살</option>
                <option value="12-15">12-15살</option>
                <option value="15+">15살 이상</option>
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              태그 🏷️
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="태그 입력 후 엔터"
                className="flex-1 px-4 py-2 border-2 border-blue-300 rounded-xl focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600"
              >
                추가
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:text-blue-900"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* AI Assistant Panel - 1/3 width */}
        <div className="space-y-4">
          {/* Grammar Check */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-4 rounded-xl border-2 border-blue-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-blue-900 flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                문법 검사
              </h3>
              <button
                type="button"
                onClick={checkGrammar}
                disabled={isCheckingGrammar}
                className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm disabled:opacity-50"
              >
                {isCheckingGrammar ? '검사 중...' : '검사'}
              </button>
            </div>

            {grammarResult && (
              <div className="space-y-2">
                <div className="text-3xl text-center">
                  {getScoreEmoji(grammarResult.grammarScore)}
                </div>
                <div className="text-center font-bold text-blue-700">
                  점수: {grammarResult.grammarScore}점
                </div>
                {grammarResult.grammarIssues.length > 0 && (
                  <div className="text-sm space-y-1">
                    {grammarResult.grammarIssues.slice(0, 3).map((issue, idx) => (
                      <div key={idx} className="bg-white p-2 rounded">
                        <div className="font-medium text-red-600">{issue.issue}</div>
                        <div className="text-green-600">{issue.suggestion}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Structure Analysis */}
          <div className="bg-gradient-to-br from-green-50 to-blue-50 p-4 rounded-xl border-2 border-green-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-green-900 flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                구조 분석
              </h3>
              <button
                type="button"
                onClick={analyzeStructure}
                disabled={isAnalyzingStructure}
                className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm disabled:opacity-50"
              >
                {isAnalyzingStructure ? '분석 중...' : '분석'}
              </button>
            </div>

            {structureResult && (
              <div className="space-y-2">
                <div className="text-3xl text-center">
                  {getScoreEmoji(structureResult.structureScore)}
                </div>
                <div className="text-center font-bold text-green-700">
                  점수: {structureResult.structureScore}점
                </div>
                <div className="text-sm space-y-1">
                  <div className={`flex items-center gap-2 ${structureResult.hasIntro ? 'text-green-600' : 'text-gray-400'}`}>
                    {structureResult.hasIntro ? '✓' : '○'} 시작 부분
                  </div>
                  <div className={`flex items-center gap-2 ${structureResult.hasBody ? 'text-green-600' : 'text-gray-400'}`}>
                    {structureResult.hasBody ? '✓' : '○'} 본문
                  </div>
                  <div className={`flex items-center gap-2 ${structureResult.hasConclusion ? 'text-green-600' : 'text-gray-400'}`}>
                    {structureResult.hasConclusion ? '✓' : '○'} 결론 부분
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* AI Helper Chat */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl border-2 border-purple-200">
            <h3 className="font-bold text-purple-900 flex items-center gap-2 mb-3">
              <MessageCircle className="h-5 w-5" />
              AI 도우미
            </h3>

            <div className="space-y-2 mb-3 max-h-60 overflow-y-auto">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="bg-purple-100 p-2 rounded-lg text-sm">
                    <strong>나:</strong> {msg.question}
                  </div>
                  <div className="bg-white p-2 rounded-lg text-sm">
                    <strong>AI:</strong> {msg.answer}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={currentQuestion}
                onChange={(e) => setCurrentQuestion(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), askQuestion())}
                placeholder="궁금한 것을 물어보세요..."
                className="flex-1 px-3 py-2 border border-purple-300 rounded-lg focus:outline-none focus:border-purple-500 text-sm"
              />
              <button
                type="button"
                onClick={askQuestion}
                disabled={isAskingQuestion || !currentQuestion.trim()}
                className="p-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-center pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-lg font-bold rounded-xl hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 shadow-lg transform hover:scale-105 transition-all"
        >
          {isSubmitting ? '제출 중...' : '이야기 제출하기 🎉'}
        </button>
      </div>
    </form>
  );
}
