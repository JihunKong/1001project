'use client';

import { useState, useCallback, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Save, 
  Send, 
  Eye, 
  EyeOff,
  FileText, 
  AlertCircle, 
  Check,
  Upload,
  X,
  Users,
  User,
  Loader2
} from 'lucide-react';
import { debounce } from 'lodash';

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

const submissionSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be less than 100 characters'),
  summary: z.string()
    .max(500, 'Summary must be less than 500 characters')
    .optional(),
  ageGroup: z.string()
    .min(1, 'Age group is required'),
  language: z.string()
    .min(1, 'Language is required'),
  category: z.string()
    .min(1, 'Category is required'),
  tags: z.array(z.string()).optional(),
  content: z.string()
    .min(1, 'Story content is required')
    .min(50, 'Story must be at least 50 characters long'),
  submissionType: z.enum(['individual', 'classroom']),
  isClassroomSubmission: z.boolean().optional(),
  attachments: z.array(z.any()).optional()
});

type SubmissionFormData = z.infer<typeof submissionSchema>;

interface AutoSaveStatus {
  status: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved?: Date;
  message?: string;
}

interface TextSubmissionFormProps {
  initialData?: Partial<SubmissionFormData>;
  onSaveDraft?: (data: SubmissionFormData) => Promise<void>;
  onSubmit: (data: SubmissionFormData) => Promise<void>;
  userRole: 'LEARNER' | 'TEACHER' | 'VOLUNTEER';
  allowClassroomSubmission?: boolean;
  isLoading?: boolean;
  draftId?: string;
  mode?: 'create' | 'edit';
}

export default function TextSubmissionForm({
  initialData,
  onSaveDraft,
  onSubmit,
  allowClassroomSubmission = false,
  isLoading = false,
  mode = 'create'
}: TextSubmissionFormProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>({ status: 'idle' });
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [wordCount, setWordCount] = useState(0);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors, isDirty, isValid }
  } = useForm<SubmissionFormData>({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      title: initialData?.title || '',
      summary: initialData?.summary || '',
      ageGroup: initialData?.ageGroup || '',
      language: initialData?.language || 'en',
      category: initialData?.category || '',
      tags: initialData?.tags || [],
      content: initialData?.content || '',
      submissionType: initialData?.submissionType || 'individual',
      isClassroomSubmission: initialData?.isClassroomSubmission || false,
      attachments: initialData?.attachments || []
    },
    mode: 'onChange'
  });

  const watchedFields = watch();
  const contentValue = watch('content');

  // Update word count
  useEffect(() => {
    if (contentValue) {
      const words = contentValue
        .trim()
        .split(/\s+/)
        .filter(word => word.length > 0).length;
      setWordCount(words);
    } else {
      setWordCount(0);
    }
  }, [contentValue]);

  // Auto-save draft
  const debouncedSave = useCallback(
    debounce(async (data: SubmissionFormData) => {
      if (!onSaveDraft || !isDirty) return;

      setAutoSaveStatus({ status: 'saving' });
      try {
        await onSaveDraft(data);
        setAutoSaveStatus({
          status: 'saved',
          lastSaved: new Date(),
          message: 'Draft saved automatically'
        });
        
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
    }, 2000),
     
    [onSaveDraft]
  );

  // Trigger auto-save when form data changes
  useEffect(() => {
    if (isDirty) {
      debouncedSave(getValues());
    }
  }, [watchedFields, isDirty, debouncedSave, getValues]);

  const handleManualSave = async () => {
    if (!onSaveDraft) return;
    
    setAutoSaveStatus({ status: 'saving' });
    try {
      const data = getValues();
      await onSaveDraft({ ...data, attachments: attachedFiles });
      setAutoSaveStatus({
        status: 'saved',
        lastSaved: new Date(),
        message: 'Draft saved successfully'
      });
    } catch (error) {
      console.error('Manual save failed:', error);
      setAutoSaveStatus({
        status: 'error',
        message: 'Failed to save draft'
      });
    }
  };

  const handleFormSubmit = async (data: SubmissionFormData) => {
    try {
      const submissionData = {
        ...data,
        attachments: attachedFiles
      };
      await onSubmit(submissionData);
    } catch (error) {
      console.error('Submission failed:', error);
      setAutoSaveStatus({
        status: 'error',
        message: 'Failed to submit story'
      });
    }
  };

  const addTag = () => {
    if (!tagInput.trim()) return;
    
    const currentTags = getValues('tags') || [];
    if (!currentTags.includes(tagInput.trim())) {
      setValue('tags', [...currentTags, tagInput.trim()], { shouldDirty: true });
    }
    setTagInput('');
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = getValues('tags') || [];
    setValue('tags', currentTags.filter(tag => tag !== tagToRemove), { shouldDirty: true });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    setAttachedFiles(prev => [...prev, ...imageFiles]);
    setValue('attachments', attachedFiles, { shouldDirty: true });
  };

  const removeFile = (index: number) => {
    const updatedFiles = attachedFiles.filter((_, i) => i !== index);
    setAttachedFiles(updatedFiles);
    setValue('attachments', updatedFiles, { shouldDirty: true });
  };

  const formatLastSaved = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  const renderPreview = () => (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {watchedFields.title || 'Untitled Story'}
        </h1>
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <span className="font-medium">Category:</span>
            <span>{CATEGORIES.find(c => c.value === watchedFields.category)?.label || 'Not selected'}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium">Age Group:</span>
            <span>{AGE_GROUPS.find(a => a.value === watchedFields.ageGroup)?.label || 'Not selected'}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium">Language:</span>
            <span>{LANGUAGES.find(l => l.value === watchedFields.language)?.label}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium">Words:</span>
            <span>{wordCount}</span>
          </div>
        </div>
        {watchedFields.summary && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Summary</h3>
            <p className="text-blue-800">{watchedFields.summary}</p>
          </div>
        )}
        {watchedFields.tags && watchedFields.tags.length > 0 && (
          <div className="mt-4">
            <span className="font-medium text-gray-700">Tags: </span>
            <div className="inline-flex flex-wrap gap-2 mt-1">
              {watchedFields.tags.map(tag => (
                <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="prose prose-lg max-w-none">
        {watchedFields.content?.split('\n').map((paragraph, index) => (
          <p key={index} className="mb-4">
            {paragraph || '\u00A0'}
          </p>
        )) || <p className="text-gray-500 italic">No content yet...</p>}
      </div>
      {attachedFiles.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-3">Attached Images</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {attachedFiles.map((file, index) => (
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
  );

  const renderEditForm = () => (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Submission Type */}
      {allowClassroomSubmission && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Submission Type
          </label>
          <div className="flex gap-4">
            <Controller
              name="submissionType"
              control={control}
              render={({ field }) => (
                <>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="individual"
                      checked={field.value === 'individual'}
                      onChange={() => field.onChange('individual')}
                      className="w-4 h-4 text-blue-600"
                    />
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">Individual Submission</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="classroom"
                      checked={field.value === 'classroom'}
                      onChange={() => field.onChange('classroom')}
                      className="w-4 h-4 text-blue-600"
                    />
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">Classroom Submission</span>
                  </label>
                </>
              )}
            />
          </div>
        </div>
      )}

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Story Title *
        </label>
        <Controller
          name="title"
          control={control}
          render={({ field }) => (
            <input
              {...field}
              type="text"
              placeholder="Enter your story title..."
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.title ? 'border-red-300' : 'border-gray-300'
              }`}
            />
          )}
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.title.message}
          </p>
        )}
      </div>

      {/* Summary */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Story Summary (Optional)
        </label>
        <Controller
          name="summary"
          control={control}
          render={({ field }) => (
            <div className="relative">
              <textarea
                {...field}
                rows={3}
                placeholder="Brief summary of your story (max 500 characters)..."
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none ${
                  errors.summary ? 'border-red-300' : 'border-gray-300'
                }`}
                maxLength={500}
              />
              <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                {field.value?.length || 0}/500
              </div>
            </div>
          )}
        />
        {errors.summary && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.summary.message}
          </p>
        )}
      </div>

      {/* Metadata Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category *
          </label>
          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <select
                {...field}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  errors.category ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select category...</option>
                {CATEGORIES.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            )}
          />
          {errors.category && (
            <p className="mt-1 text-xs text-red-600">{errors.category.message}</p>
          )}
        </div>

        {/* Age Group */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Age Group *
          </label>
          <Controller
            name="ageGroup"
            control={control}
            render={({ field }) => (
              <select
                {...field}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  errors.ageGroup ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select age group...</option>
                {AGE_GROUPS.map(age => (
                  <option key={age.value} value={age.value}>
                    {age.label}
                  </option>
                ))}
              </select>
            )}
          />
          {errors.ageGroup && (
            <p className="mt-1 text-xs text-red-600">{errors.ageGroup.message}</p>
          )}
        </div>

        {/* Language */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Language *
          </label>
          <Controller
            name="language"
            control={control}
            render={({ field }) => (
              <select
                {...field}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  errors.language ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                {LANGUAGES.map(language => (
                  <option key={language.value} value={language.value}>
                    {language.label}
                  </option>
                ))}
              </select>
            )}
          />
          {errors.language && (
            <p className="mt-1 text-xs text-red-600">{errors.language.message}</p>
          )}
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tags (Optional)
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            placeholder="Add a tag..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="button"
            onClick={addTag}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add
          </button>
        </div>
        {watchedFields.tags && watchedFields.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {watchedFields.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Story Content */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Story Content *
          </label>
          <span className="text-sm text-gray-500">{wordCount} words</span>
        </div>
        <Controller
          name="content"
          control={control}
          render={({ field }) => (
            <textarea
              {...field}
              rows={12}
              placeholder="Start writing your story here..."
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none ${
                errors.content ? 'border-red-300' : 'border-gray-300'
              }`}
            />
          )}
        />
        {errors.content && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.content.message}
          </p>
        )}
      </div>

      {/* File Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Images (Optional)
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600 mb-2">Upload images for your story</p>
          <label className="cursor-pointer">
            <span className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-block">
              Choose Files
            </span>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* Uploaded Files */}
        {attachedFiles.length > 0 && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            {attachedFiles.map((file, index) => (
              <div key={index} className="relative group">
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-1 left-1 right-1 bg-black bg-opacity-50 text-white text-xs px-1 py-0.5 rounded truncate">
                  {file.name}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </form>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">
                {mode === 'edit' ? 'Edit Story' : 'Submit Your Story'}
              </h1>
            </div>
            
            {/* Auto-save status */}
            <div className="flex items-center gap-2 text-sm">
              <AnimatePresence>
                {autoSaveStatus.status === 'saving' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-2 text-blue-600"
                  >
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </motion.div>
                )}
                {autoSaveStatus.status === 'saved' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-2 text-green-600"
                  >
                    <Check className="w-4 h-4" />
                    <span>
                      {autoSaveStatus.lastSaved && formatLastSaved(autoSaveStatus.lastSaved)}
                    </span>
                  </motion.div>
                )}
                {autoSaveStatus.status === 'error' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-2 text-red-600"
                  >
                    <AlertCircle className="w-4 h-4" />
                    <span>{autoSaveStatus.message}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            {onSaveDraft && (
              <button
                onClick={handleManualSave}
                disabled={isLoading || autoSaveStatus.status === 'saving' || !isDirty}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                Save Draft
              </button>
            )}
            
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showPreview ? 'Edit' : 'Preview'}
            </button>
            
            <button
              onClick={handleSubmit(handleFormSubmit)}
              disabled={isLoading || !isValid}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {isLoading ? 'Submitting...' : 'Submit for Review'}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {showPreview ? (
              <motion.div
                key="preview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {renderPreview()}
              </motion.div>
            ) : (
              <motion.div
                key="edit"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                {renderEditForm()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}