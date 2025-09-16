'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Save, 
  Clock, 
  Send, 
  FileText, 
  Eye, 
  AlertCircle, 
  Check,
  Upload,
  X
} from 'lucide-react';
import { debounce } from 'lodash';

interface StoryEditorProps {
  initialData?: {
    id?: string;
    title?: string;
    content?: string;
    category?: string;
    ageGroup?: string;
    language?: string;
  };
  onSave?: (data: StoryData) => Promise<void>;
  onSubmit?: (data: StoryData) => Promise<void>;
  isLoading?: boolean;
}

interface StoryData {
  title: string;
  content: string;
  category: string;
  ageGroup: string;
  language: string;
  attachments?: File[];
}

interface AutoSaveStatus {
  status: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved?: Date;
  message?: string;
}

const CATEGORIES = [
  { value: 'adventure', label: 'Adventure' },
  { value: 'friendship', label: 'Friendship' },
  { value: 'family', label: 'Family' },
  { value: 'education', label: 'Education' },
  { value: 'fantasy', label: 'Fantasy' },
  { value: 'real-life', label: 'Real Life' },
  { value: 'cultural', label: 'Cultural' },
  { value: 'inspirational', label: 'Inspirational' }
];

const AGE_GROUPS = [
  { value: '3-6', label: '3-6 years (Preschool)' },
  { value: '7-9', label: '7-9 years (Early Elementary)' },
  { value: '10-12', label: '10-12 years (Elementary)' },
  { value: '13-15', label: '13-15 years (Middle School)' },
  { value: '16-18', label: '16-18 years (High School)' }
];

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'ko', label: 'Korean' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ar', label: 'Arabic' },
  { value: 'hi', label: 'Hindi' },
  { value: 'pt', label: 'Portuguese' }
];

export default function StoryEditor({
  initialData,
  onSave,
  onSubmit,
  isLoading = false
}: StoryEditorProps) {
  const [formData, setFormData] = useState<StoryData>({
    title: initialData?.title || '',
    content: initialData?.content || '',
    category: initialData?.category || '',
    ageGroup: initialData?.ageGroup || '',
    language: initialData?.language || 'en',
    attachments: []
  });

  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>({
    status: 'idle'
  });

  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update word count when content changes
  useEffect(() => {
    const words = formData.content
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 0).length;
    setWordCount(words);
  }, [formData.content]);

  // Auto-save function with debounce
  const autoSave = useCallback(
    debounce(async (data: StoryData) => {
      if (!onSave) return;
      
      setAutoSaveStatus({ status: 'saving' });
      
      try {
        await onSave(data);
        setAutoSaveStatus({
          status: 'saved',
          lastSaved: new Date(),
          message: 'Draft saved automatically'
        });
        setHasUnsavedChanges(false);
        
        // Clear saved status after 3 seconds
        setTimeout(() => {
          setAutoSaveStatus(prev => ({ ...prev, status: 'idle' }));
        }, 3000);
      } catch (error) {
        console.error('Auto-save failed:', error);
        setAutoSaveStatus({
          status: 'error',
          message: 'Failed to save draft'
        });
      }
    }, 2000), // 2 second debounce
    [onSave]
  );

  // Trigger auto-save when data changes
  useEffect(() => {
    if (hasUnsavedChanges && (formData.title || formData.content)) {
      autoSave(formData);
    }
  }, [formData, hasUnsavedChanges, autoSave]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }
  }, [formData.content]);

  const handleInputChange = (field: keyof StoryData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    setUploadedImages(prev => [...prev, ...imageFiles]);
    setFormData(prev => ({
      ...prev,
      attachments: [...(prev.attachments || []), ...imageFiles]
    }));
    setHasUnsavedChanges(true);
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments?.filter((_, i) => i !== index) || []
    }));
    setHasUnsavedChanges(true);
  };

  const handleManualSave = async () => {
    if (!onSave) return;
    
    setAutoSaveStatus({ status: 'saving' });
    
    try {
      await onSave(formData);
      setAutoSaveStatus({
        status: 'saved',
        lastSaved: new Date(),
        message: 'Draft saved successfully'
      });
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Manual save failed:', error);
      setAutoSaveStatus({
        status: 'error',
        message: 'Failed to save draft'
      });
    }
  };

  const handleSubmit = async () => {
    if (!onSubmit) return;
    
    if (!formData.title.trim() || !formData.content.trim() || !formData.category || !formData.ageGroup) {
      setAutoSaveStatus({
        status: 'error',
        message: 'Please fill in all required fields'
      });
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Submit failed:', error);
      setAutoSaveStatus({
        status: 'error',
        message: 'Failed to submit story'
      });
    }
  };

  const formatLastSaved = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Write Your Story</h1>
          </div>
          
          {/* Auto-save status */}
          <div className="flex items-center gap-2 text-sm">
            {autoSaveStatus.status === 'saving' && (
              <div className="flex items-center gap-2 text-blue-600">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </div>
            )}
            {autoSaveStatus.status === 'saved' && (
              <div className="flex items-center gap-2 text-green-600">
                <Check className="w-4 h-4" />
                <span>
                  {autoSaveStatus.lastSaved && formatLastSaved(autoSaveStatus.lastSaved)}
                </span>
              </div>
            )}
            {autoSaveStatus.status === 'error' && (
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-4 h-4" />
                <span>{autoSaveStatus.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleManualSave}
            disabled={isLoading || autoSaveStatus.status === 'saving' || !hasUnsavedChanges}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            Save Draft
          </button>
          
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Eye className="w-4 h-4" />
            {showPreview ? 'Edit' : 'Preview'}
          </button>
          
          <button
            onClick={handleSubmit}
            disabled={isLoading || !formData.title.trim() || !formData.content.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            Submit for Review
          </button>
        </div>
      </div>

      <div className="p-6">
        {showPreview ? (
          /* Preview Mode */
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{formData.title || 'Untitled Story'}</h2>
              <div className="flex gap-4 text-sm text-gray-600 mb-4">
                {formData.category && <span>Category: {CATEGORIES.find(c => c.value === formData.category)?.label}</span>}
                {formData.ageGroup && <span>Age: {AGE_GROUPS.find(a => a.value === formData.ageGroup)?.label}</span>}
                <span>Words: {wordCount}</span>
              </div>
            </div>
            <div className="prose prose-lg max-w-none">
              {formData.content.split('\n').map((paragraph, index) => (
                <p key={index} className="mb-4">
                  {paragraph || '\u00A0'}
                </p>
              ))}
            </div>
            {uploadedImages.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-3">Images</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {uploadedImages.map((file, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Edit Mode */
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Story Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter your story title..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select category...</option>
                  {CATEGORIES.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Age Group *
                </label>
                <select
                  value={formData.ageGroup}
                  onChange={(e) => handleInputChange('ageGroup', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select age group...</option>
                  {AGE_GROUPS.map(age => (
                    <option key={age.value} value={age.value}>
                      {age.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Language
                </label>
                <select
                  value={formData.language}
                  onChange={(e) => handleInputChange('language', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {LANGUAGES.map(language => (
                    <option key={language.value} value={language.value}>
                      {language.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Story Content */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Story Content *
                </label>
                <span className="text-sm text-gray-500">{wordCount} words</span>
              </div>
              <textarea
                ref={textareaRef}
                value={formData.content}
                onChange={(e) => handleInputChange('content', e.target.value)}
                placeholder="Start writing your story here..."
                className="w-full min-h-[400px] px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                style={{ height: 'auto' }}
              />
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Images (Optional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 mb-2">Upload images for your story</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Choose Files
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              {/* Uploaded Images */}
              {uploadedImages.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {uploadedImages.map((file, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}