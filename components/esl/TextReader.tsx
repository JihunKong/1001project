'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, 
  Volume2, 
  VolumeX, 
  BookOpen,
  Lightbulb,
  Eye,
  EyeOff
} from 'lucide-react';
import WordExplanation from './WordExplanation';
import DifficultyAdjuster from './DifficultyAdjuster';

interface TextReaderProps {
  content: string;
  title: string;
  authorName: string;
  language: string;
  initialDifficulty?: 'beginner' | 'intermediate' | 'advanced';
  onProgressUpdate?: (progress: number) => void;
}

interface ReadingSettings {
  fontSize: number;
  lineHeight: number;
  fontFamily: string;
  backgroundColor: string;
  textColor: string;
  enableWordHighlight: boolean;
  enableReadingGuide: boolean;
  enableFocusMode: boolean;
}

export default function TextReader({
  content,
  title,
  authorName,
  language,
  initialDifficulty = 'intermediate',
  onProgressUpdate
}: TextReaderProps) {
  const [adaptedContent, setAdaptedContent] = useState<string>(content);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [selectedWordPosition, setSelectedWordPosition] = useState<{ x: number; y: number } | null>(null);
  const [difficulty, setDifficulty] = useState(initialDifficulty);
  const [isAdapting, setIsAdapting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [settings, setSettings] = useState<ReadingSettings>({
    fontSize: 16,
    lineHeight: 1.6,
    fontFamily: 'system-ui',
    backgroundColor: '#ffffff',
    textColor: '#1f2937',
    enableWordHighlight: true,
    enableReadingGuide: false,
    enableFocusMode: false
  });

  const textContainerRef = useRef<HTMLDivElement>(null);
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    // Initialize with original content
    setAdaptedContent(content);
  }, [content]);

  useEffect(() => {
    // Clean up speech synthesis on unmount
    return () => {
      if (speechSynthRef.current) {
        speechSynthesis.cancel();
      }
    };
  }, []);

  const handleWordClick = (event: React.MouseEvent) => {
    const target = event.target as HTMLElement;
    if (target.tagName === 'SPAN' && target.classList.contains('word')) {
      const word = target.textContent?.trim();
      if (word && word.length > 3) { // Only show explanation for words longer than 3 characters
        const rect = target.getBoundingClientRect();
        setSelectedWord(word);
        setSelectedWordPosition({
          x: rect.left + rect.width / 2,
          y: rect.top
        });
      }
    }
  };

  const handleDifficultyChange = async (newDifficulty: 'beginner' | 'intermediate' | 'advanced') => {
    if (newDifficulty === difficulty) return;
    
    setIsAdapting(true);
    setDifficulty(newDifficulty);

    try {
      const response = await fetch('/api/education/adapt-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: content,
          targetLevel: newDifficulty,
          title: title
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAdaptedContent(data.adaptedText || content);
      } else {
        console.error('Failed to adapt text');
        setAdaptedContent(content);
      }
    } catch (error) {
      console.error('Error adapting text:', error);
      setAdaptedContent(content);
    } finally {
      setIsAdapting(false);
    }
  };

  const toggleTextToSpeech = () => {
    if (isPlaying) {
      speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(adaptedContent);
      utterance.lang = language === 'en' ? 'en-US' : language;
      utterance.rate = 0.8;
      utterance.pitch = 1;
      
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      
      speechSynthRef.current = utterance;
      speechSynthesis.speak(utterance);
      setIsPlaying(true);
    }
  };

  const renderTextWithClickableWords = (text: string) => {
    // Split text into words while preserving punctuation and spacing
    const words = text.split(/(\s+|[^\w\s]+)/);
    
    return words.map((segment, index) => {
      const isWord = /^\w+$/.test(segment);
      
      if (isWord) {
        return (
          <span
            key={index}
            className={`word cursor-pointer transition-colors duration-200 ${
              settings.enableWordHighlight
                ? 'hover:bg-blue-100 hover:text-blue-700 rounded px-1'
                : ''
            }`}
            onClick={handleWordClick}
          >
            {segment}
          </span>
        );
      }
      
      return <span key={index}>{segment}</span>;
    });
  };

  const updateSetting = (key: keyof ReadingSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm mb-6 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            <p className="text-gray-600">by {authorName}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTextToSpeech}
              className={`p-2 rounded-lg transition-colors ${
                isPlaying
                  ? 'bg-red-100 text-red-600 hover:bg-red-200'
                  : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
              }`}
              title={isPlaying ? 'Stop reading' : 'Read aloud'}
            >
              {isPlaying ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
              title="Reading settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Difficulty Adjuster */}
        <DifficultyAdjuster
          currentDifficulty={difficulty}
          onDifficultyChange={handleDifficultyChange}
          isLoading={isAdapting}
        />
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm mb-6 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Reading Settings
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Font Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Font Size
              </label>
              <input
                type="range"
                min="12"
                max="24"
                value={settings.fontSize}
                onChange={(e) => updateSetting('fontSize', parseInt(e.target.value))}
                className="w-full"
              />
              <span className="text-sm text-gray-600">{settings.fontSize}px</span>
            </div>

            {/* Line Height */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Line Spacing
              </label>
              <input
                type="range"
                min="1.2"
                max="2.0"
                step="0.1"
                value={settings.lineHeight}
                onChange={(e) => updateSetting('lineHeight', parseFloat(e.target.value))}
                className="w-full"
              />
              <span className="text-sm text-gray-600">{settings.lineHeight}</span>
            </div>

            {/* Font Family */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Font Family
              </label>
              <select
                value={settings.fontFamily}
                onChange={(e) => updateSetting('fontFamily', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="system-ui">System UI</option>
                <option value="serif">Serif</option>
                <option value="sans-serif">Sans Serif</option>
                <option value="monospace">Monospace</option>
                <option value="'Times New Roman', serif">Times New Roman</option>
                <option value="'Arial', sans-serif">Arial</option>
                <option value="'Georgia', serif">Georgia</option>
              </select>
            </div>

            {/* Background Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Background
              </label>
              <select
                value={settings.backgroundColor}
                onChange={(e) => updateSetting('backgroundColor', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="#ffffff">White</option>
                <option value="#f9fafb">Light Gray</option>
                <option value="#fefce8">Warm Light</option>
                <option value="#1f2937">Dark</option>
                <option value="#0f172a">Black</option>
              </select>
            </div>

            {/* Text Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Text Color
              </label>
              <select
                value={settings.textColor}
                onChange={(e) => updateSetting('textColor', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="#1f2937">Dark Gray</option>
                <option value="#000000">Black</option>
                <option value="#374151">Medium Gray</option>
                <option value="#ffffff">White</option>
                <option value="#fbbf24">Amber</option>
              </select>
            </div>

            {/* Feature Toggles */}
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.enableWordHighlight}
                  onChange={(e) => updateSetting('enableWordHighlight', e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Word Highlighting</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.enableReadingGuide}
                  onChange={(e) => updateSetting('enableReadingGuide', e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Reading Guide</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.enableFocusMode}
                  onChange={(e) => updateSetting('enableFocusMode', e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Focus Mode</span>
              </label>
            </div>
          </div>
        </motion.div>
      )}

      {/* Text Content */}
      <div
        ref={textContainerRef}
        className={`bg-white rounded-lg shadow-sm p-8 ${
          settings.enableFocusMode ? 'max-w-2xl mx-auto' : ''
        }`}
        style={{
          backgroundColor: settings.backgroundColor,
          color: settings.textColor,
          fontSize: `${settings.fontSize}px`,
          lineHeight: settings.lineHeight,
          fontFamily: settings.fontFamily
        }}
      >
        {isAdapting ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Adapting text difficulty...</p>
            </div>
          </div>
        ) : (
          <div className="prose prose-lg max-w-none">
            {renderTextWithClickableWords(adaptedContent)}
          </div>
        )}
      </div>

      {/* Word Explanation Popup */}
      {selectedWord && selectedWordPosition && (
        <WordExplanation
          word={selectedWord}
          position={selectedWordPosition}
          language={language}
          onClose={() => {
            setSelectedWord(null);
            setSelectedWordPosition(null);
          }}
        />
      )}

      {/* Reading Guide Overlay */}
      {settings.enableReadingGuide && (
        <div 
          className="fixed inset-0 pointer-events-none z-10"
          style={{
            background: `linear-gradient(transparent 40%, rgba(255,255,255,0.1) 45%, rgba(255,255,255,0.1) 55%, transparent 60%)`
          }}
        />
      )}

      {/* ESL Learning Tips */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          ESL Learning Tips
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
          <div>
            <strong>Click on words</strong> to see definitions and hear pronunciation
          </div>
          <div>
            <strong>Adjust difficulty</strong> to match your reading level
          </div>
          <div>
            <strong>Use text-to-speech</strong> to improve listening skills
          </div>
          <div>
            <strong>Change text settings</strong> for comfortable reading
          </div>
        </div>
      </div>
    </div>
  );
}