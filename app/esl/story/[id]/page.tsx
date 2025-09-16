'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  BookOpen, 
  MessageSquare,
  User,
  Clock,
  Globe,
  Loader2,
  AlertCircle
} from 'lucide-react';
import TextReader from '@/components/esl/TextReader';

interface Story {
  id: string;
  title: string;
  authorName: string;
  authorAge?: number;
  authorLocation?: string;
  language: string;
  readingLevel?: string;
  category: string[];
  tags: string[];
  content: string;
  summary?: string;
  estimatedReadingTime: number;
  wordCount: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export default function ESLStoryPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const storyId = params.id as string;

  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [readingProgress, setReadingProgress] = useState(0);

  useEffect(() => {
    if (storyId) {
      fetchStory();
    }
  }, [storyId]);

  const fetchStory = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to fetch from Books table first (published text stories)
      const bookResponse = await fetch(`/api/library/books/${storyId}`);
      
      if (bookResponse.ok) {
        const bookData = await bookResponse.json();
        
        // Check if this book has text content
        if (bookData.content || bookData.TextSubmission?.contentMd) {
          const content = bookData.content || bookData.TextSubmission?.contentMd || '';
          const summary = bookData.summary || bookData.TextSubmission?.summary || '';
          
          // Calculate word count if not available
          let wordCount = bookData.wordCount;
          if (!wordCount && content) {
            wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
          }
          
          // Calculate estimated reading time if not available
          let estimatedReadingTime = bookData.estimatedReadingTime;
          if (!estimatedReadingTime && wordCount) {
            estimatedReadingTime = Math.ceil(wordCount / 200);
          }

          // Determine difficulty based on reading level
          let difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate';
          if (bookData.readingLevel) {
            const level = bookData.readingLevel.toLowerCase();
            if (level.includes('grade 1') || level.includes('grade 2') || level.includes('grade 3') || 
                level.includes('elementary') || level.includes('beginner')) {
              difficulty = 'beginner';
            } else if (level.includes('grade 7') || level.includes('grade 8') || level.includes('grade 9') ||
                       level.includes('high') || level.includes('advanced') || level.includes('college')) {
              difficulty = 'advanced';
            }
          }

          setStory({
            id: bookData.id,
            title: bookData.title,
            authorName: bookData.authorName,
            authorAge: bookData.authorAge,
            authorLocation: bookData.authorLocation,
            language: bookData.language,
            readingLevel: bookData.readingLevel,
            category: bookData.category || [],
            tags: bookData.tags || [],
            content: content,
            summary: summary,
            estimatedReadingTime: estimatedReadingTime || 5,
            wordCount: wordCount || 0,
            difficulty
          });
        } else {
          setError('This story does not have text content available for ESL reading.');
        }
      } else {
        setError('Story not found');
      }
    } catch (err) {
      console.error('Error fetching story:', err);
      setError('Failed to load story');
    } finally {
      setLoading(false);
    }
  };

  const handleProgressUpdate = (progress: number) => {
    setReadingProgress(progress);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading story...</p>
        </div>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Story Not Available</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/esl"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to ESL Stories
            </Link>
            <Link
              href="/library"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              Browse Library
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/esl"
                className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to ESL Stories
              </Link>
              <div className="text-sm text-gray-400">|</div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-gray-600">ESL Reading</span>
              </div>
            </div>
            
            {session && (
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  Progress: {Math.round(readingProgress)}%
                </div>
                <Link
                  href="/dashboard/learner"
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  My Dashboard
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Story Metadata */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <div className="flex items-start gap-3 mb-4">
                <User className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <div className="font-medium text-gray-900">{story.authorName}</div>
                  <div className="text-sm text-gray-600">
                    {story.authorAge && `Age ${story.authorAge}`}
                    {story.authorLocation && ` • ${story.authorLocation}`}
                  </div>
                </div>
              </div>
              
              {story.summary && (
                <p className="text-gray-700 leading-relaxed">{story.summary}</p>
              )}
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>{story.estimatedReadingTime} min read</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Globe className="w-4 h-4" />
                <span>{story.language === 'en' ? 'English' : story.language}</span>
              </div>
              
              {story.readingLevel && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Level:</span> {story.readingLevel}
                </div>
              )}
              
              <div className="text-sm text-gray-600">
                <span className="font-medium">Words:</span> {story.wordCount.toLocaleString()}
              </div>
            </div>
          </div>
          
          {/* Tags */}
          {story.tags.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex flex-wrap gap-2">
                {story.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="py-8">
        <TextReader
          content={story.content}
          title={story.title}
          authorName={story.authorName}
          language={story.language}
          initialDifficulty={story.difficulty}
          onProgressUpdate={handleProgressUpdate}
        />
      </div>

      {/* Footer Actions */}
      <div className="bg-white border-t">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Enjoying this story? Check out more in our{' '}
              <Link href="/esl" className="text-blue-600 hover:text-blue-700">
                ESL collection
              </Link>
            </div>
            
            <div className="flex items-center gap-3">
              <Link
                href={`/esl/story/${story.id}/discuss`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                Discuss
              </Link>
              
              {session && (
                <Link
                  href="/dashboard/learner/vocabulary"
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  View Saved Words
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}