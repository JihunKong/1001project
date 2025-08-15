'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { UserRole, StorySubmissionStatus } from '@prisma/client';
import { motion } from 'framer-motion';
import {
  Globe,
  Search,
  Filter,
  Plus,
  Edit,
  Check,
  X,
  Clock,
  User,
  BookOpen,
  Languages,
  ArrowRight,
  Copy,
  Download,
  Upload,
} from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

interface Translation {
  id: string;
  originalStoryId: string;
  fromLanguage: string;
  toLanguage: string;
  translatedTitle?: string;
  translatedContent?: string;
  translatedSummary?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REVIEWED';
  assigneeId?: string;
  translatorNotes?: string;
  reviewerNotes?: string;
  completedAt?: string;
  createdAt: string;
  originalStory: {
    id: string;
    title: string;
    content: string;
    summary?: string;
    author: {
      name: string;
    };
  };
  assignee?: {
    id: string;
    name: string;
  };
}

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
];

const statusConfig = {
  PENDING: { label: 'Pending', color: 'bg-gray-100 text-gray-800', icon: Clock },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-blue-100 text-blue-800', icon: Edit },
  COMPLETED: { label: 'Completed', color: 'bg-green-100 text-green-800', icon: Check },
  REVIEWED: { label: 'Reviewed', color: 'bg-purple-100 text-purple-800', icon: Check },
};

export default function TranslationManagement() {
  const { data: session, status } = useSession();
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterLanguage, setFilterLanguage] = useState('');
  const [selectedTranslation, setSelectedTranslation] = useState<Translation | null>(null);
  const [showNewTranslationModal, setShowNewTranslationModal] = useState(false);
  const [editingTranslation, setEditingTranslation] = useState<Translation | null>(null);

  // Redirect if not admin
  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!session || session.user.role !== UserRole.ADMIN) {
    redirect('/dashboard');
  }

  const editor = useEditor({
    extensions: [StarterKit],
    content: editingTranslation?.translatedContent || '',
    onUpdate: ({ editor }) => {
      if (editingTranslation) {
        setEditingTranslation({
          ...editingTranslation,
          translatedContent: editor.getHTML(),
        });
      }
    },
  });

  useEffect(() => {
    fetchTranslations();
    fetchStories();
  }, []);

  useEffect(() => {
    if (editor && editingTranslation) {
      editor.commands.setContent(editingTranslation.translatedContent || '');
    }
  }, [editingTranslation, editor]);

  const fetchTranslations = async () => {
    try {
      setLoading(true);
      // Note: This would use the actual translation API endpoint
      // For now, using mock data since translation API isn't implemented yet
      const mockTranslations: Translation[] = [
        {
          id: '1',
          originalStoryId: 'story1',
          fromLanguage: 'en',
          toLanguage: 'ko',
          translatedTitle: '마법의 정원',
          translatedContent: '<p>옛날 옛적에 마법의 정원이 있었습니다...</p>',
          status: 'COMPLETED',
          createdAt: '2024-01-15T10:00:00Z',
          originalStory: {
            id: 'story1',
            title: 'The Magic Garden',
            content: '<p>Once upon a time there was a magic garden...</p>',
            summary: 'A story about friendship',
            author: { name: 'Sarah Kim' }
          }
        },
        {
          id: '2',
          originalStoryId: 'story2',
          fromLanguage: 'ko',
          toLanguage: 'en',
          status: 'PENDING',
          createdAt: '2024-01-14T10:00:00Z',
          originalStory: {
            id: 'story2',
            title: '우리 마을 이야기',
            content: '<p>우리 마을에는 특별한 이야기가 있습니다...</p>',
            author: { name: 'John Doe' }
          }
        }
      ];
      setTranslations(mockTranslations);
    } catch (error) {
      console.error('Error fetching translations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStories = async () => {
    try {
      const response = await fetch('/api/admin/stories?limit=100');
      if (response.ok) {
        const data = await response.json();
        setStories(data.stories);
      }
    } catch (error) {
      console.error('Error fetching stories:', error);
    }
  };

  const handleCreateTranslation = async (storyId: string, fromLang: string, toLang: string) => {
    try {
      // This would call the translation creation API
      console.log('Creating translation:', { storyId, fromLang, toLang });
      setShowNewTranslationModal(false);
      fetchTranslations(); // Refresh list
    } catch (error) {
      console.error('Error creating translation:', error);
    }
  };

  const handleSaveTranslation = async () => {
    if (!editingTranslation) return;

    try {
      // This would call the translation update API
      console.log('Saving translation:', editingTranslation);
      setEditingTranslation(null);
      fetchTranslations(); // Refresh list
    } catch (error) {
      console.error('Error saving translation:', error);
    }
  };

  const filteredTranslations = translations.filter(translation => {
    const matchesSearch = !searchTerm || 
      translation.originalStory.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (translation.translatedTitle && translation.translatedTitle.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = !filterStatus || translation.status === filterStatus;
    const matchesLanguage = !filterLanguage || 
      translation.fromLanguage === filterLanguage || 
      translation.toLanguage === filterLanguage;

    return matchesSearch && matchesStatus && matchesLanguage;
  });

  const getLanguageInfo = (code: string) => {
    return languages.find(lang => lang.code === code) || { code, name: code.toUpperCase(), flag: '🌐' };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Translation Management</h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage story translations and multilingual content
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowNewTranslationModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                New Translation
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search translations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              {Object.entries(statusConfig).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.label}
                </option>
              ))}
            </select>
            <select
              value={filterLanguage}
              onChange={(e) => setFilterLanguage(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Languages</option>
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Translation Cards */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredTranslations.map((translation) => {
              const statusInfo = statusConfig[translation.status];
              const StatusIcon = statusInfo.icon;
              const fromLang = getLanguageInfo(translation.fromLanguage);
              const toLang = getLanguageInfo(translation.toLanguage);

              return (
                <motion.div
                  key={translation.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {translation.originalStory.title}
                      </h3>
                      {translation.translatedTitle && (
                        <p className="text-sm text-gray-600 mb-2">
                          → {translation.translatedTitle}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <span>{fromLang.flag}</span>
                          <span>{fromLang.name}</span>
                        </div>
                        <ArrowRight className="w-4 h-4" />
                        <div className="flex items-center gap-1">
                          <span>{toLang.flag}</span>
                          <span>{toLang.name}</span>
                        </div>
                      </div>
                    </div>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusInfo.color}`}>
                      <StatusIcon className="w-3 h-3 inline mr-1" />
                      {statusInfo.label}
                    </span>
                  </div>

                  <div className="text-sm text-gray-600 mb-4">
                    <p>by {translation.originalStory.author.name}</p>
                    <p>Created {new Date(translation.createdAt).toLocaleDateString()}</p>
                    {translation.assignee && <p>Assigned to {translation.assignee.name}</p>}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedTranslation(translation)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                    >
                      <BookOpen className="w-4 h-4" />
                      View Details
                    </button>
                    <button
                      onClick={() => setEditingTranslation(translation)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* New Translation Modal */}
      {showNewTranslationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Create New Translation</h2>
              <button
                onClick={() => setShowNewTranslationModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Story
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="">Choose a story...</option>
                    {stories.map((story) => (
                      <option key={story.id} value={story.id}>
                        {story.title} ({story.language.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      From Language
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                      {languages.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.flag} {lang.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      To Language
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                      {languages.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.flag} {lang.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowNewTranslationModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Create Translation
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Translation Editor Modal */}
      {editingTranslation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Edit Translation</h2>
              <button
                onClick={() => setEditingTranslation(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Original Content */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Original ({getLanguageInfo(editingTranslation.fromLanguage).name})
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Title
                      </label>
                      <div className="p-3 bg-gray-50 rounded-lg text-sm">
                        {editingTranslation.originalStory.title}
                      </div>
                    </div>
                    {editingTranslation.originalStory.summary && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Summary
                        </label>
                        <div className="p-3 bg-gray-50 rounded-lg text-sm">
                          {editingTranslation.originalStory.summary}
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Content
                      </label>
                      <div className="p-3 bg-gray-50 rounded-lg prose prose-sm max-h-64 overflow-y-auto">
                        <div dangerouslySetInnerHTML={{ __html: editingTranslation.originalStory.content }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Translation */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Translation ({getLanguageInfo(editingTranslation.toLanguage).name})
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Translated Title
                      </label>
                      <input
                        type="text"
                        value={editingTranslation.translatedTitle || ''}
                        onChange={(e) => setEditingTranslation({
                          ...editingTranslation,
                          translatedTitle: e.target.value
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter translated title..."
                      />
                    </div>
                    {editingTranslation.originalStory.summary && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Translated Summary
                        </label>
                        <textarea
                          value={editingTranslation.translatedSummary || ''}
                          onChange={(e) => setEditingTranslation({
                            ...editingTranslation,
                            translatedSummary: e.target.value
                          })}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter translated summary..."
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Translated Content
                      </label>
                      <div className="border border-gray-300 rounded-lg overflow-hidden">
                        <div className="border-b border-gray-200 p-2 flex gap-1">
                          <button
                            onClick={() => editor?.chain().focus().toggleBold().run()}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <strong>B</strong>
                          </button>
                          <button
                            onClick={() => editor?.chain().focus().toggleItalic().run()}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <em>I</em>
                          </button>
                        </div>
                        <EditorContent
                          editor={editor}
                          className="prose prose-sm max-w-none p-4 min-h-[200px] focus:outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Translator Notes
                      </label>
                      <textarea
                        value={editingTranslation.translatorNotes || ''}
                        onChange={(e) => setEditingTranslation({
                          ...editingTranslation,
                          translatorNotes: e.target.value
                        })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Add any translation notes..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t mt-6">
                <button
                  onClick={() => setEditingTranslation(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveTranslation}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save Translation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Translation Detail Modal */}
      {selectedTranslation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Translation Details</h2>
              <button
                onClick={() => setSelectedTranslation(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Original */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Original</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900">{selectedTranslation.originalStory.title}</h4>
                      <div className="prose prose-sm mt-2" dangerouslySetInnerHTML={{ __html: selectedTranslation.originalStory.content }} />
                    </div>
                  </div>
                </div>
                
                {/* Translation */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Translation</h3>
                  {selectedTranslation.translatedTitle ? (
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900">{selectedTranslation.translatedTitle}</h4>
                        {selectedTranslation.translatedContent && (
                          <div className="prose prose-sm mt-2" dangerouslySetInnerHTML={{ __html: selectedTranslation.translatedContent }} />
                        )}
                      </div>
                      {selectedTranslation.translatorNotes && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                          <h5 className="font-medium text-blue-900 mb-2">Translator Notes</h5>
                          <p className="text-sm text-blue-800">{selectedTranslation.translatorNotes}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">Translation not yet started</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}