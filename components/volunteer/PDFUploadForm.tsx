'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Upload, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  X, 
  Info,
  User,
  Globe,
  Tag,
  FileCheck
} from 'lucide-react';

interface PDFUploadFormProps {
  onSuccess?: (submissionId: string) => void;
  onCancel?: () => void;
}

interface FormData {
  title: string;
  authorAlias: string;
  language: string;
  ageRange: string;
  category: string;
  tags: string;
  summary: string;
  targetAudience: string;
  copyrightConfirmed: boolean;
  portraitRightsConfirmed: boolean;
  originalWork: boolean;
  licenseType: string;
}

export default function PDFUploadForm({ onSuccess, onCancel }: PDFUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    title: '',
    authorAlias: '',
    language: 'en',
    ageRange: '',
    category: '',
    tags: '',
    summary: '',
    targetAudience: '',
    copyrightConfirmed: false,
    portraitRightsConfirmed: false,
    originalWork: true,
    licenseType: 'CC-BY'
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf') {
        setFile(droppedFile);
        setError(null);
      } else {
        setError('Please select a PDF file');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Please select a PDF file');
      }
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a PDF file to upload');
      return;
    }

    if (!formData.title || !formData.authorAlias || !formData.summary) {
      setError('Please fill in all required fields');
      return;
    }

    if (!formData.copyrightConfirmed || !formData.portraitRightsConfirmed) {
      setError('Please confirm copyright and portrait rights');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const submitFormData = new FormData();
      submitFormData.append('pdf', file);
      
      Object.entries(formData).forEach(([key, value]) => {
        submitFormData.append(key, value.toString());
      });

      const response = await fetch('/api/volunteer/submit-pdf', {
        method: 'POST',
        body: submitFormData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit PDF');
      }

      setSuccess(result.message);
      setFile(null);
      setFormData({
        title: '',
        authorAlias: '',
        language: 'en',
        ageRange: '',
        category: '',
        tags: '',
        summary: '',
        targetAudience: '',
        copyrightConfirmed: false,
        portraitRightsConfirmed: false,
        originalWork: true,
        licenseType: 'CC-BY'
      });

      if (onSuccess) {
        setTimeout(() => onSuccess(result.submissionId), 2000);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

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
        <h2 className="text-2xl font-bold text-gray-900">Submit Your Story PDF</h2>
        {onCancel && (
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
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
        {/* PDF Upload Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload PDF File *
          </label>
          <div
            className={`
              relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
              ${dragActive 
                ? 'border-blue-400 bg-blue-50' 
                : file 
                  ? 'border-green-400 bg-green-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }
            `}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="w-8 h-8 text-green-600" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="p-1 hover:bg-gray-200 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div>
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">
                  Drop your PDF here or click to browse
                </p>
                <p className="text-sm text-gray-500">
                  Maximum file size: 50MB • PDF format only
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Story Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-1" />
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
              Author Alias *
            </label>
            <input
              type="text"
              required
              value={formData.authorAlias}
              onChange={(e) => handleInputChange('authorAlias', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Author's name or pseudonym"
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
              Age Range
            </label>
            <select
              value={formData.ageRange}
              onChange={(e) => handleInputChange('ageRange', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select age range</option>
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Audience
          </label>
          <input
            type="text"
            value={formData.targetAudience}
            onChange={(e) => handleInputChange('targetAudience', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Who is this story for? (e.g., children learning about friendship)"
          />
        </div>

        {/* Copyright and Rights */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-yellow-600" />
            Copyright and Rights Confirmation
          </h3>
          
          <div className="space-y-3">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                required
                checked={formData.copyrightConfirmed}
                onChange={(e) => handleInputChange('copyrightConfirmed', e.target.checked)}
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                I confirm that I own the copyright to this work or have proper authorization to submit it. *
              </span>
            </label>

            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                required
                checked={formData.portraitRightsConfirmed}
                onChange={(e) => handleInputChange('portraitRightsConfirmed', e.target.checked)}
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                I have obtained necessary consent for any people depicted in this work. *
              </span>
            </label>

            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={formData.originalWork}
                onChange={(e) => handleInputChange('originalWork', e.target.checked)}
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                This is original work created by me or my collaborators.
              </span>
            </label>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              License Type
            </label>
            <select
              value={formData.licenseType}
              onChange={(e) => handleInputChange('licenseType', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="CC-BY">Creative Commons Attribution (CC BY)</option>
              <option value="CC-BY-SA">Creative Commons Attribution-ShareAlike (CC BY-SA)</option>
              <option value="CC-BY-NC">Creative Commons Attribution-NonCommercial (CC BY-NC)</option>
              <option value="ALL_RIGHTS_RESERVED">All Rights Reserved</option>
            </select>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Submission Process:</p>
              <ul className="space-y-1">
                <li>• Your PDF will be reviewed by our content team</li>
                <li>• Review typically takes 3-5 business days</li>
                <li>• You'll receive feedback via email</li>
                <li>• Approved stories will be published on the platform</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading || !file}
            className={`
              flex-1 px-6 py-3 rounded-lg font-semibold transition-all
              ${loading || !file
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
              } text-white
            `}
          >
            {loading ? 'Submitting...' : 'Submit PDF for Review'}
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