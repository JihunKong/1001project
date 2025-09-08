'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, Clock, Star, Download, CheckCircle } from 'lucide-react';
import Link from 'next/link';

interface Material {
  id: string;
  title: string;
  author: string;
  content: string;
  level: string;
  category: string;
  topics: string[];
  vocabulary: string[];
  questions: string[];
  pdfUrl?: string;
}

export default function MaterialViewerPage() {
  const params = useParams();
  const router = useRouter();
  const [material, setMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    loadMaterial();
  }, [params.id]);

  const loadMaterial = async () => {
    try {
      setLoading(true);
      
      // Load from sample materials for now
      const response = await fetch('/books/english-education/sample-materials.json');
      const data = await response.json();
      
      const foundMaterial = data.materials.find((m: Material) => m.id === params.id);
      
      if (foundMaterial) {
        setMaterial(foundMaterial);
      } else {
        // Try to load from books database
        const bookResponse = await fetch(`/api/library/books/${params.id}`);
        if (bookResponse.ok) {
          const book = await bookResponse.json();
          setMaterial({
            id: book.id,
            title: book.title,
            author: book.authorName,
            content: book.summary || 'PDF content available for reading.',
            level: book.readingLevel || 'Intermediate',
            category: book.category?.[0] || 'General',
            topics: book.category || [],
            vocabulary: book.tags || [],
            questions: [],
            pdfUrl: book.pdfKey
          });
        } else {
          setError('Material not found');
        }
      }
    } catch (err) {
      console.error('Error loading material:', err);
      setError('Failed to load material');
    } finally {
      setLoading(false);
    }
  };

  const handleQuizSubmit = () => {
    setShowResults(true);
    // Update progress
    const newProgress = 100;
    setProgress(newProgress);
    
    // Save progress to backend
    if (material) {
      fetch('/api/learn/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId: material.id,
          contentType: 'material',
          progress: newProgress,
          completed: true,
          timeSpent: 10
        })
      });
    }
  };

  const handleMarkComplete = () => {
    setProgress(100);
    if (material) {
      fetch('/api/learn/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId: material.id,
          contentType: 'material',
          progress: 100,
          completed: true,
          timeSpent: 5
        })
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading material...</p>
        </div>
      </div>
    );
  }

  if (error || !material) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Material not found'}</p>
          <Link
            href="/learn"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Learning
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/learn"
              className="inline-flex items-center text-blue-600 hover:text-blue-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Learning
            </Link>
            
            {progress === 100 && (
              <span className="flex items-center text-green-600">
                <CheckCircle className="w-5 h-5 mr-1" />
                Completed
              </span>
            )}
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{material.title}</h1>
          <p className="text-lg text-gray-600 mb-4">by {material.author}</p>
          
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="flex items-center text-gray-500">
              <BookOpen className="w-4 h-4 mr-1" />
              Level: {material.level}
            </span>
            <span className="flex items-center text-gray-500">
              <Clock className="w-4 h-4 mr-1" />
              Category: {material.category}
            </span>
            {material.pdfUrl && (
              <a
                href={material.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-blue-600 hover:text-blue-700"
              >
                <Download className="w-4 h-4 mr-1" />
                Download PDF
              </a>
            )}
          </div>
          
          {/* Progress Bar */}
          {progress > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              {material.pdfUrl ? (
                <div className="space-y-4">
                  <div className="prose max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {material.content}
                    </p>
                  </div>
                  
                  <div className="border-t pt-4">
                    <iframe
                      src={`${material.pdfUrl}#view=FitH`}
                      className="w-full h-[600px] border rounded-lg"
                      title={material.title}
                    />
                  </div>
                </div>
              ) : (
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {material.content}
                  </p>
                </div>
              )}
              
              {progress < 100 && (
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleMarkComplete}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Mark as Complete
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Vocabulary */}
            {material.vocabulary && material.vocabulary.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
                  Key Vocabulary
                </h3>
                <div className="flex flex-wrap gap-2">
                  {material.vocabulary.map((word, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                    >
                      {word}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Topics */}
            {material.topics && material.topics.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="font-semibold text-gray-900 mb-3">Topics Covered</h3>
                <div className="space-y-2">
                  {material.topics.map((topic, index) => (
                    <div key={index} className="flex items-center text-sm text-gray-600">
                      <Star className="w-4 h-4 mr-2 text-yellow-500" />
                      {topic}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comprehension Questions */}
            {material.questions && material.questions.length > 0 && !showQuiz && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="font-semibold text-gray-900 mb-3">Ready to Test?</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Answer comprehension questions to test your understanding
                </p>
                <button
                  onClick={() => setShowQuiz(true)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Take Quiz
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quiz Modal */}
        {showQuiz && material.questions && material.questions.length > 0 && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
              <h2 className="text-2xl font-bold mb-6 text-gray-900">Comprehension Quiz</h2>
              
              <div className="space-y-6">
                {material.questions.map((question, index) => (
                  <div key={index} className="border-b pb-4">
                    <p className="font-medium mb-3 text-gray-900">{index + 1}. {question}</p>
                    <textarea
                      className="w-full p-3 border rounded-lg resize-none text-gray-900"
                      rows={3}
                      placeholder="Type your answer here..."
                      value={quizAnswers[index] || ''}
                      onChange={(e) => setQuizAnswers({
                        ...quizAnswers,
                        [index]: e.target.value
                      })}
                      disabled={showResults}
                    />
                  </div>
                ))}
              </div>
              
              <div className="mt-6 flex justify-between">
                <button
                  onClick={() => {
                    setShowQuiz(false);
                    setShowResults(false);
                    setQuizAnswers({});
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
                
                {!showResults ? (
                  <button
                    onClick={handleQuizSubmit}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Submit Answers
                  </button>
                ) : (
                  <div className="text-green-600 font-semibold flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Quiz Completed!
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}