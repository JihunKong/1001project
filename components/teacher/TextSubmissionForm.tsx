'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText,
  AlertCircle, 
  CheckCircle, 
  X, 
  Info,
  User,
  Globe,
  Tag,
  Save,
  Send,
  Clock
} from 'lucide-react';

interface TextSubmissionFormProps {
  onSuccess?: (submissionId: string) => void;
  onCancel?: () => void;
}

interface FormData {
  title: string;
  content: string;
  summary: string;
  language: string;
  category: string;
  ageGroup: string;
  tags: string;
  studentName: string;
  source: 'classroom';
}

export default function TextSubmissionForm({ onSuccess, onCancel }: TextSubmissionFormProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    title: '',
    content: '',
    summary: '',
    language: 'en',
    category: '',
    ageGroup: '',
    tags: '',
    studentName: '',
    source: 'classroom'
  });

  // Auto-save functionality
  useEffect(() => {
    const savedDraft = localStorage.getItem('teacher-text-submission-draft');
    if (savedDraft) {
      try {
        const parsedDraft = JSON.parse(savedDraft);
        setFormData(parsedDraft);
      } catch (error) {
        console.error('Failed to load saved draft:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (hasChanges) {
      const timeoutId = setTimeout(() => {
        localStorage.setItem('teacher-text-submission-draft', JSON.stringify(formData));
        setSaving(false);
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [formData, hasChanges]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
    setHasChanges(true);
    setSaving(true);
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      localStorage.setItem('teacher-text-submission-draft', JSON.stringify(formData));
      
      // Also save to database if needed
      const response = await fetch('/api/teacher/save-draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setHasChanges(false);
      }
    } catch (error) {
      console.error('Failed to save draft:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.content || !formData.summary) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.content.length < 100) {
      setError('Story content should be at least 100 characters long');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/teacher/submit-story', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit story');
      }

      setSuccess(result.message);
      
      // Clear the saved draft
      localStorage.removeItem('teacher-text-submission-draft');
      
      // Reset form
      setFormData({
        title: '',
        content: '',
        summary: '',
        language: 'en',
        category: '',
        ageGroup: '',
        tags: '',
        studentName: '',
        source: 'classroom'
      });
      setHasChanges(false);

      if (onSuccess) {
        setTimeout(() => onSuccess(result.submissionId), 2000);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const wordCount = formData.content.split(/\s+/).filter(word => word.length > 0).length;

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg shadow-sm p-8 text-center"
      >
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Submission Successful!</h3>
        <p className="text-gray-600 mb-6">{success}</p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => {
              setSuccess(null);
            }}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Submit Another
          </button>
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Back to Dashboard
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-sm p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Submit Text Story</h2>
          <p className="text-gray-600">Submit a story on behalf of your class</p>
        </div>
        <div className="flex items-center gap-2">
          {saving && (
            <div className="flex items-center gap-2 text-blue-600">
              <Clock className="w-4 h-4 animate-spin" />
              <span className="text-sm">Saving...</span>
            </div>
          )}
          {onCancel && (
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Story Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-1" />
              Story Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter the story title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-1" />
              Student Name (Optional)
            </label>
            <input
              type="text"
              value={formData.studentName}
              onChange={(e) => handleInputChange('studentName', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Name of the student author (if individual work)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Globe className="w-4 h-4 inline mr-1" />
              Language
            </label>
            <select
              value={formData.language}
              onChange={(e) => handleInputChange('language', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="en">English</option>
              <option value="ko">Korean</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="zh">Chinese</option>
              <option value="ja">Japanese</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Age Group
            </label>
            <select
              value={formData.ageGroup}
              onChange={(e) => handleInputChange('ageGroup', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select age group</option>
              <option value="0-3">0-3 years</option>
              <option value="4-6">4-6 years</option>
              <option value="7-9">7-9 years</option>
              <option value="10-12">10-12 years</option>
              <option value="13-15">13-15 years</option>
              <option value="16+">16+ years</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Tag className="w-4 h-4 inline mr-1" />
              Category
            </label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Adventure, Educational, Fantasy"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Tag className="w-4 h-4 inline mr-1" />
              Tags (comma separated)
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => handleInputChange('tags', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="friendship, courage, animals"
            />
          </div>
        </div>

        {/* Story Content */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Story Content *
            </label>
            <span className="text-sm text-gray-500">
              {wordCount} words
            </span>
          </div>
          <textarea
            required
            value={formData.content}
            onChange={(e) => handleInputChange('content', e.target.value)}
            rows={12}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Write or paste the full story content here..."
          />
        </div>

        {/* Story Summary */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Story Summary *
          </label>
          <textarea
            required
            value={formData.summary}
            onChange={(e) => handleInputChange('summary', e.target.value)}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Brief description of the story, its themes, and key messages..."
          />
        </div>

        {/* Information Panel */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Classroom Submission Process:</p>
              <ul className="space-y-1">
                <li>• Story will be reviewed by our content team</li>
                <li>• Review typically takes 3-5 business days</li>
                <li>• You'll receive feedback via email</li>
                <li>• Approved stories will be published on the platform</li>
                <li>• Stories are automatically tagged as "classroom" submissions</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={saving || !hasChanges}
            className={`
              px-6 py-3 rounded-lg font-medium transition-all
              ${saving || !hasChanges
                ? 'bg-gray-300 cursor-not-allowed' 
                : 'bg-gray-600 hover:bg-gray-700'
              } text-white
            `}
          >
            <Save className="w-4 h-4 inline mr-2" />
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          
          <button
            type="submit"
            disabled={loading}
            className={`
              flex-1 px-6 py-3 rounded-lg font-semibold transition-all
              ${loading
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
              } text-white
            `}
          >
            <Send className="w-4 h-4 inline mr-2" />
            {loading ? 'Submitting...' : 'Submit Story for Review'}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </motion.div>
  );
}