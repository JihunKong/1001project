'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  BookOpen, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Eye,
  Loader2,
  Star,
  Send
} from 'lucide-react';
import Link from 'next/link';
import TextSubmissionForm from '@/components/shared/TextSubmissionForm';

interface SubmissionData {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  wordCount: number;
  revisionCount: number;
  latestFeedback?: {
    customMessage?: string;
    reviewer?: {
      name: string;
      role: string;
    };
    createdAt: string;
  };
}

interface UserSubmissions {
  submissions: SubmissionData[];
  stats: {
    total: number;
    draft: number;
    submitted: number;
    in_review: number;
    editing: number;
    approved: number;
    published: number;
    rejected: number;
  };
}

export default function LearnerSubmitPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [submissions, setSubmissions] = useState<UserSubmissions | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated or not a learner
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session?.user?.role && session.user.role !== 'LEARNER') {
      router.push('/dashboard');
    }
  }, [session, status, router]);

  // Fetch user's submissions
  useEffect(() => {
    if (session?.user) {
      fetchSubmissions();
    }
  }, [session]);

  const fetchSubmissions = async () => {
    try {
      const response = await fetch('/api/writer/submissions');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setSubmissions(result.data);
        }
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
    }
  };

  const handleSaveDraft = async (data: any) => {
    try {
      const response = await fetch('/api/writer/drafts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: data.title,
          content: data.content,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save draft');
      }

      return await response.json();
    } catch (error) {
      console.error('Error saving draft:', error);
      throw error;
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      setIsLoading(true);
      setError(null);

      const submissionData = {
        title: data.title,
        content: data.content,
        summary: data.summary,
        category: data.category,
        ageGroup: data.ageGroup,
        language: data.language,
        termsAccepted: {
          personalInfoAck: true,
          respectfulLangAck: true,
        }
      };

      const response = await fetch('/api/writer/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setShowSuccess(true);
        fetchSubmissions(); // Refresh submissions list
        
        // Auto-redirect after 3 seconds
        setTimeout(() => {
          router.push('/dashboard/learner');
        }, 3000);
      } else {
        throw new Error(result.error || 'Failed to submit story');
      }
    } catch (error) {
      console.error('Submission error:', error);
      setError(error instanceof Error ? error.message : 'Failed to submit story');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-700';
      case 'SUBMITTED': return 'bg-blue-100 text-blue-700';
      case 'IN_REVIEW': return 'bg-yellow-100 text-yellow-700';
      case 'EDITING': return 'bg-orange-100 text-orange-700';
      case 'APPROVED': return 'bg-green-100 text-green-700';
      case 'PUBLISHED': return 'bg-purple-100 text-purple-700';
      case 'REJECTED': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUBMITTED': return Clock;
      case 'IN_REVIEW': return Eye;
      case 'EDITING': return AlertCircle;
      case 'APPROVED': return CheckCircle;
      case 'PUBLISHED': return Star;
      case 'REJECTED': return AlertCircle;
      default: return BookOpen;
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-md mx-auto p-8"
        >
          <div className="bg-green-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Story Submitted Successfully!
          </h1>
          <p className="text-gray-600 mb-6">
            Thank you for sharing your creativity! Your story has been submitted for review. 
            You'll receive notifications about the review progress.
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Redirecting to your dashboard in a few seconds...
          </p>
          <Link
            href="/dashboard/learner"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/dashboard/learner"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </Link>
          </div>
          
          <div className="flex items-center gap-3 mb-2">
            <Send className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Share Your Story</h1>
          </div>
          <p className="text-gray-600">
            Write and submit your own story to share with readers around the world!
          </p>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2"
          >
            <AlertCircle className="w-5 h-5" />
            {error}
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content - Submission Form */}
          <div className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <TextSubmissionForm
                onSaveDraft={handleSaveDraft}
                onSubmit={handleSubmit}
                userRole="LEARNER"
                allowClassroomSubmission={false}
                isLoading={isLoading}
                mode="create"
              />
            </motion.div>
          </div>

          {/* Sidebar - Your Submissions */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="sticky top-8"
            >
              {submissions && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Your Stories
                  </h3>
                  
                  {submissions.submissions.length === 0 ? (
                    <div className="text-center py-6">
                      <BookOpen className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">
                        This will be your first story submission!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {submissions.submissions.slice(0, 3).map((submission) => {
                        const StatusIcon = getStatusIcon(submission.status);
                        return (
                          <div
                            key={submission.id}
                            className="p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-medium text-sm text-gray-900 line-clamp-2">
                                {submission.title}
                              </h4>
                              <StatusIcon className="w-4 h-4 text-gray-500 flex-shrink-0 ml-2" />
                            </div>
                            <div className="flex items-center justify-between">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(submission.status)}`}>
                                {submission.status.toLowerCase().replace('_', ' ')}
                              </span>
                              <span className="text-xs text-gray-500">
                                {submission.wordCount} words
                              </span>
                            </div>
                            {submission.latestFeedback && (
                              <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                                <p className="text-blue-800 font-medium">Latest feedback:</p>
                                <p className="text-blue-700 line-clamp-2">
                                  {submission.latestFeedback.customMessage || 'Under review'}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      
                      {submissions.submissions.length > 3 && (
                        <p className="text-xs text-gray-500 text-center pt-2 border-t border-gray-100">
                          +{submissions.submissions.length - 3} more stories
                        </p>
                      )}
                    </div>
                  )}
                  
                  {/* Quick Stats */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div>
                        <p className="text-lg font-bold text-blue-600">{submissions.stats.total}</p>
                        <p className="text-xs text-gray-500">Total Stories</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-green-600">{submissions.stats.published}</p>
                        <p className="text-xs text-gray-500">Published</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Encouragement Card */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 mt-6">
                <div className="text-center">
                  <Star className="w-8 h-8 text-yellow-500 mx-auto mb-3" />
                  <h4 className="font-semibold text-gray-900 mb-2">Share Your World</h4>
                  <p className="text-sm text-gray-600">
                    Every story matters! Your experiences and imagination can inspire 
                    readers around the world.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}