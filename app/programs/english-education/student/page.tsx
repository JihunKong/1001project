'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Material {
  id: string;
  title: string;
  author: string;
  level: string;
  category: string;
  content: string;
  vocabulary: string[];
  questions: string[];
  source?: string;
  topics?: string[];
}

interface AdaptedText {
  adaptedText: string;
  readingLevel: string;
  vocabulary: string[];
  estimatedReadingTime: number;
}

export default function StudentDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('materials');
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [adaptedContent, setAdaptedContent] = useState<AdaptedText | null>(null);
  const [loading, setLoading] = useState(false);
  const [ageLevel, setAgeLevel] = useState('middle');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login?callbackUrl=/programs/english-education/student');
    } else {
      fetchMaterials();
    }
  }, [session, status, router]);

  const fetchMaterials = async () => {
    try {
      const response = await fetch('/api/education/materials');
      if (response.ok) {
        const data = await response.json();
        setMaterials(data.materials || []);
      }
    } catch (error) {
      console.error('Error fetching materials:', error);
    }
  };

  const adaptText = async (material: Material) => {
    setLoading(true);
    try {
      const response = await fetch('/api/education/adapt-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: material.content,
          targetAge: ageLevel,
          title: material.title
        })
      });
      if (response.ok) {
        const data = await response.json();
        setAdaptedContent(data);
      }
    } catch (error) {
      console.error('Error adapting text:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReadMaterial = async (material: Material) => {
    setSelectedMaterial(material);
    setActiveTab('reading');
    await adaptText(material);
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  Student Learning Portal
                </h1>
                <p className="text-gray-600">
                  Welcome back, {session.user?.name || 'Student'}!
                </p>
              </div>
              <Link href="/programs/english-education" 
                className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Link>
            </div>

            {/* Navigation Tabs */}
            <div className="mt-6 border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('materials')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'materials'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Reading Materials
                </button>
                <button
                  onClick={() => setActiveTab('assignments')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'assignments'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Assignments
                </button>
                <button
                  onClick={() => setActiveTab('ai-tutor')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'ai-tutor'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  AI Tutor
                </button>
                <button
                  onClick={() => setActiveTab('progress')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'progress'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  My Progress
                </button>
              </nav>
            </div>
          </div>

          {/* Content Area */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            {activeTab === 'materials' && (
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">Reading Materials</h2>
                
                {/* Age Level Selector and Upload Button */}
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <label className="text-gray-700 font-medium">Select Reading Level:</label>
                    <select 
                      value={ageLevel} 
                      onChange={(e) => setAgeLevel(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="elementary">Elementary (Ages 6-11)</option>
                      <option value="middle">Middle School (Ages 12-14)</option>
                      <option value="high">High School (Ages 15-18)</option>
                      <option value="adult">Adult</option>
                    </select>
                  </div>
                  <label className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Upload PDF
                    <input 
                      type="file" 
                      accept=".pdf"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        
                        const formData = new FormData();
                        formData.append('file', file);
                        formData.append('processType', 'adapt');
                        formData.append('targetAge', ageLevel);
                        
                        try {
                          setLoading(true);
                          const response = await fetch('/api/education/parse-pdf', {
                            method: 'POST',
                            body: formData
                          });
                          
                          if (response.ok) {
                            const result = await response.json();
                            // Add to materials list
                            setMaterials(prev => [{
                              id: String(Date.now()),
                              title: result.title,
                              author: result.author,
                              content: result.adaptedText || result.content,
                              level: ageLevel === 'elementary' ? 'Beginner' : 
                                     ageLevel === 'middle' ? 'Intermediate' : 'Advanced',
                              category: 'Uploaded',
                              topics: [],
                              vocabulary: result.vocabulary || [],
                              questions: result.questions || []
                            }, ...prev]);
                          }
                        } catch (error) {
                          console.error('Error uploading PDF:', error);
                        } finally {
                          setLoading(false);
                        }
                      }}
                    />
                  </label>
                </div>
                
                {/* Actual Reading Materials from API */}
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading materials...</p>
                  </div>
                ) : materials.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p className="text-lg mb-4">No materials available yet</p>
                    <p className="text-sm">Upload a PDF to get started!</p>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-gray-600 mb-4">Total materials available: {materials.length}</p>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {materials.map((material) => (
                        <div key={material.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
                          <div className="mb-3">
                            <h3 className="font-semibold text-gray-800 line-clamp-2">{material.title}</h3>
                            <p className="text-sm text-gray-600">by {material.author}</p>
                            <span className="text-sm text-gray-500">Level: {material.level}</span>
                          </div>
                          
                          {/* Category and Source Badges */}
                          <div className="mb-3 flex flex-wrap gap-1">
                            <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                              {material.category}
                            </span>
                            {material.source && (
                              <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                Source: {material.source}
                              </span>
                            )}
                          </div>
                          
                          {/* Topics if available */}
                          {material.topics && material.topics.length > 0 && (
                            <div className="mb-3">
                              <p className="text-xs text-gray-600 mb-1">Topics:</p>
                              <div className="flex flex-wrap gap-1">
                                {material.topics.slice(0, 3).map((topic, idx) => (
                                  <span key={idx} className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                                    {topic}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Vocabulary Preview */}
                          {material.vocabulary && material.vocabulary.length > 0 && (
                            <div className="mb-3">
                              <p className="text-xs text-gray-600 mb-1">Key vocabulary:</p>
                              <div className="flex flex-wrap gap-1">
                                {material.vocabulary.slice(0, 3).map((word, idx) => (
                                  <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">
                                    {word}
                                  </span>
                                ))}
                                {material.vocabulary.length > 3 && (
                                  <span className="text-xs text-gray-500">+{material.vocabulary.length - 3} more</span>
                                )}
                              </div>
                            </div>
                          )}
                          
                          <button 
                            onClick={() => handleReadMaterial(material)}
                            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition-colors"
                          >
                            Start Reading
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                
                <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                  <p className="text-gray-700">
                    📚 Select any reading material to start. The text will be automatically adapted to your chosen reading level using AI!
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    All features are completely free - no premium subscription needed!
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'assignments' && (
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">Your Assignments</h2>
                
                <div className="space-y-4">
                  {[
                    { title: 'Chapter 5 Vocabulary Quiz', dueDate: '2024-09-10', status: 'pending' },
                    { title: 'Reading Comprehension: The Little Prince', dueDate: '2024-09-08', status: 'submitted' },
                    { title: 'Essay: My Favorite Character', dueDate: '2024-09-15', status: 'pending' },
                  ].map((assignment, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold text-gray-800">{assignment.title}</h3>
                        <p className="text-sm text-gray-500">Due: {assignment.dueDate}</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          assignment.status === 'submitted' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {assignment.status === 'submitted' ? 'Submitted' : 'Pending'}
                        </span>
                        <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
                          {assignment.status === 'submitted' ? 'Review' : 'Start'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'ai-tutor' && (
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">AI Tutor Assistant</h2>
                
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">How can I help you today?</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <button className="bg-white p-4 rounded-lg hover:shadow-md transition-shadow text-left">
                      <div className="text-purple-600 mb-2">💬</div>
                      <h4 className="font-medium text-gray-800">Vocabulary Practice</h4>
                      <p className="text-sm text-gray-600">Learn new words with context</p>
                    </button>
                    <button className="bg-white p-4 rounded-lg hover:shadow-md transition-shadow text-left">
                      <div className="text-blue-600 mb-2">📖</div>
                      <h4 className="font-medium text-gray-800">Reading Comprehension</h4>
                      <p className="text-sm text-gray-600">Discuss stories and characters</p>
                    </button>
                    <button className="bg-white p-4 rounded-lg hover:shadow-md transition-shadow text-left">
                      <div className="text-green-600 mb-2">✏️</div>
                      <h4 className="font-medium text-gray-800">Grammar Help</h4>
                      <p className="text-sm text-gray-600">Get explanations and examples</p>
                    </button>
                    <button className="bg-white p-4 rounded-lg hover:shadow-md transition-shadow text-left">
                      <div className="text-orange-600 mb-2">🎯</div>
                      <h4 className="font-medium text-gray-800">Pronunciation Practice</h4>
                      <p className="text-sm text-gray-600">Listen and repeat with TTS</p>
                    </button>
                  </div>
                </div>
                
                {/* Chat Interface Preview */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="h-64 bg-gray-50 rounded mb-4 flex items-center justify-center text-gray-400">
                    AI Chat Interface Coming Soon
                  </div>
                  <div className="flex space-x-2">
                    <input 
                      type="text" 
                      placeholder="Type your question here..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled
                    />
                    <button className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors" disabled>
                      Send
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'reading' && selectedMaterial && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold text-gray-800">{selectedMaterial.title}</h2>
                  <button 
                    onClick={() => setActiveTab('materials')}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    ← Back to Materials
                  </button>
                </div>
                
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    <span className="ml-3 text-gray-600">Adapting text to your level...</span>
                  </div>
                ) : adaptedContent ? (
                  <div>
                    {/* Reading Info */}
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-600">Author: {selectedMaterial.author}</p>
                        <p className="text-sm text-gray-600">Reading Level: {adaptedContent.readingLevel}</p>
                        <p className="text-sm text-gray-600">Estimated Time: {adaptedContent.estimatedReadingTime} minutes</p>
                      </div>
                      <div className="flex gap-2">
                        <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                          🔊 Listen (TTS)
                        </button>
                        <select 
                          value={ageLevel} 
                          onChange={(e) => {
                            setAgeLevel(e.target.value);
                            adaptText(selectedMaterial);
                          }}
                          className="px-3 py-2 border border-gray-300 rounded"
                        >
                          <option value="elementary">Elementary</option>
                          <option value="middle">Middle School</option>
                          <option value="high">High School</option>
                          <option value="adult">Adult</option>
                        </select>
                      </div>
                    </div>
                    
                    {/* Adapted Text */}
                    <div className="prose max-w-none mb-8">
                      <div className="bg-white p-8 rounded-lg border border-gray-200">
                        <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                          {adaptedContent.adaptedText}
                        </p>
                      </div>
                    </div>
                    
                    {/* Vocabulary Section */}
                    {adaptedContent.vocabulary && adaptedContent.vocabulary.length > 0 && (
                      <div className="mb-8">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">Key Vocabulary</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          {adaptedContent.vocabulary.map((word, idx) => (
                            <div key={idx} className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                              <span className="font-medium text-gray-800">{word}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Questions Section */}
                    {selectedMaterial.questions && selectedMaterial.questions.length > 0 && (
                      <div className="mb-8">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">Comprehension Questions</h3>
                        <div className="space-y-3">
                          {selectedMaterial.questions.map((question, idx) => (
                            <div key={idx} className="p-4 bg-blue-50 rounded-lg">
                              <p className="text-gray-800">{idx + 1}. {question}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600">Loading content...</p>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'progress' && (
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">My Learning Progress</h2>
                
                {/* Stats Overview */}
                <div className="grid md:grid-cols-4 gap-6 mb-8">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-blue-600 text-2xl font-bold">15</div>
                    <div className="text-gray-600 text-sm">Books Read</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-green-600 text-2xl font-bold">250</div>
                    <div className="text-gray-600 text-sm">New Words</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="text-purple-600 text-2xl font-bold">85%</div>
                    <div className="text-gray-600 text-sm">Quiz Average</div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4">
                    <div className="text-orange-600 text-2xl font-bold">12</div>
                    <div className="text-gray-600 text-sm">Assignments Done</div>
                  </div>
                </div>
                
                {/* Recent Activity */}
                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-800 mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      <span className="text-gray-600">Completed Chapter 5 of "The Little Prince"</span>
                      <span className="ml-auto text-gray-400">2 hours ago</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                      <span className="text-gray-600">Practiced 20 new vocabulary words</span>
                      <span className="ml-auto text-gray-400">Yesterday</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                      <span className="text-gray-600">Submitted reading comprehension quiz</span>
                      <span className="ml-auto text-gray-400">2 days ago</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}