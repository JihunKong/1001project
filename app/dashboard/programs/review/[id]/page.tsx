'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { UserRole } from '@prisma/client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft,
  User,
  Building,
  Clock,
  Heart,
  FileText,
  Shield,
  Download,
  Mail,
  Phone,
  Globe,
  MapPin,
  Briefcase,
  Calendar,
  Star,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Save,
  Send
} from 'lucide-react';
import Link from 'next/link';

interface ApplicationDetails {
  id: string;
  programType: string;
  fullName: string;
  email: string;
  phone?: string;
  country: string;
  city: string;
  timezone?: string;
  languages: string[];
  organizationName?: string;
  organizationType?: string;
  jobTitle?: string;
  experienceYears?: number;
  weeklyHours?: number;
  availableDays: string[];
  timeWindows?: any;
  interests: string[];
  skills: string[];
  languageProficiency?: any;
  goals?: string;
  motivation?: string;
  preferredModality?: string;
  programSpecificData?: any;
  status: string;
  priority: number;
  matchScore?: number;
  internalNotes?: string;
  createdAt: string;
  submittedAt?: string;
  reviewedAt?: string;
  decidedAt?: string;
  dataProcessingConsent: boolean;
  codeOfConductAccepted: boolean;
  backgroundCheckConsent: boolean;
  applicant: {
    id: string;
    name: string;
    email: string;
    image?: string;
    role: string;
  };
  assignedReviewer?: {
    id: string;
    name: string;
    email: string;
  };
  attachments: {
    id: string;
    filename: string;
    originalName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    attachmentType: string;
    uploadedAt: string;
  }[];
  reviews: {
    id: string;
    status: string;
    score?: number;
    strengths?: string;
    concerns?: string;
    recommendations?: string;
    decision?: string;
    completedAt?: string;
    reviewer: {
      id: string;
      name: string;
      email: string;
    };
  }[];
  statusHistory: {
    id: string;
    fromStatus?: string;
    toStatus: string;
    changedAt: string;
    reason?: string;
    changedBy?: {
      id: string;
      name: string;
    };
  }[];
}

const PROGRAM_TYPE_LABELS = {
  PARTNERSHIP_NETWORK: 'Partnership Network',
  ENGLISH_EDUCATION: 'English Education',
  MENTORSHIP: 'Mentorship'
};

const STATUS_COLORS = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SUBMITTED: 'bg-blue-100 text-blue-800',
  UNDER_REVIEW: 'bg-yellow-100 text-yellow-800',
  ADDITIONAL_INFO_REQUESTED: 'bg-orange-100 text-orange-800',
  INTERVIEW_SCHEDULED: 'bg-purple-100 text-purple-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  WAITLISTED: 'bg-indigo-100 text-indigo-800',
  WITHDRAWN: 'bg-gray-100 text-gray-800'
};

interface ApplicationReviewPageProps {
  params: Promise<{ id: string }>;
}

export default async function ApplicationReviewPage({ params }: ApplicationReviewPageProps) {
  const { id } = await params;
  const { data: session, status } = useSession();
  const [application, setApplication] = useState<ApplicationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewData, setReviewData] = useState({
    score: '',
    strengths: '',
    concerns: '',
    recommendations: '',
    decision: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Check authentication and authorization
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      redirect('/login');
      return;
    }

    const userRole = session.user?.role;
    if (userRole !== UserRole.PROGRAM_LEAD && userRole !== UserRole.ADMIN) {
      redirect('/dashboard');
      return;
    }
  }, [session, status]);

  // Fetch application details
  useEffect(() => {
    if (id) {
      fetchApplication();
    }
  }, [id]);

  const fetchApplication = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/programs/applications/${id}`);
      if (!response.ok) throw new Error('Failed to fetch application');
      
      const data = await response.json();
      setApplication(data.application);

      // Pre-fill existing review if user has one
      const userReview = data.application.reviews.find((r: any) => r.reviewer.id === session?.user?.id);
      if (userReview) {
        setReviewData({
          score: userReview.score?.toString() || '',
          strengths: userReview.strengths || '',
          concerns: userReview.concerns || '',
          recommendations: userReview.recommendations || '',
          decision: userReview.decision || ''
        });
      }
    } catch (error) {
      console.error('Failed to fetch application:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitReview = async () => {
    if (!application) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/programs/applications/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'review',
          applicationId: application.id,
          score: reviewData.score ? parseInt(reviewData.score) : undefined,
          strengths: reviewData.strengths,
          concerns: reviewData.concerns,
          recommendations: reviewData.recommendations,
          decision: reviewData.decision
        })
      });

      if (!response.ok) throw new Error('Failed to submit review');

      await fetchApplication(); // Refresh data
    } catch (error) {
      console.error('Failed to submit review:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  if (!session || !application) return null;

  const canReview = application.assignedReviewer?.id === session.user.id || session.user.role === UserRole.ADMIN;
  const hasSubmittedReview = application.reviews.some(r => r.reviewer.id === session.user.id && r.completedAt);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/dashboard/programs" 
            className="inline-flex items-center text-brand-primary hover:text-brand-primary/80 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Applications
          </Link>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {application.fullName}'s Application
              </h1>
              <p className="text-gray-600">
                {PROGRAM_TYPE_LABELS[application.programType as keyof typeof PROGRAM_TYPE_LABELS]} Program
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                STATUS_COLORS[application.status as keyof typeof STATUS_COLORS]
              }`}>
                {application.status.replace(/_/g, ' ')}
              </span>
              
              {application.priority < 3 && (
                <div className="flex items-center text-yellow-600">
                  <Star className="w-4 h-4 mr-1" />
                  <span className="text-sm font-medium">Priority</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Personal Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-6">
                <User className="w-5 h-5 text-brand-primary mr-2" />
                <h2 className="text-xl font-semibold">Personal Information</h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <p className="text-gray-900">{application.fullName}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 text-gray-400 mr-2" />
                    <a href={`mailto:${application.email}`} className="text-brand-primary hover:underline">
                      {application.email}
                    </a>
                  </div>
                </div>
                
                {application.phone && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-gray-900">{application.phone}</span>
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-gray-900">{application.city}, {application.country}</span>
                  </div>
                </div>
                
                {application.timezone && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-gray-900">{application.timezone}</span>
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Languages</label>
                  <div className="flex flex-wrap gap-2">
                    {application.languages.map((lang, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-6">
                <Building className="w-5 h-5 text-brand-primary mr-2" />
                <h2 className="text-xl font-semibold">Professional Background</h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                {application.organizationName && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Organization</label>
                    <p className="text-gray-900">{application.organizationName}</p>
                  </div>
                )}
                
                {application.organizationType && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Organization Type</label>
                    <p className="text-gray-900">{application.organizationType}</p>
                  </div>
                )}
                
                {application.jobTitle && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                    <div className="flex items-center">
                      <Briefcase className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-gray-900">{application.jobTitle}</span>
                    </div>
                  </div>
                )}
                
                {application.experienceYears !== undefined && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Experience</label>
                    <p className="text-gray-900">{application.experienceYears} years</p>
                  </div>
                )}
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
                  <div className="flex flex-wrap gap-2">
                    {application.skills.map((skill, index) => (
                      <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Interests</label>
                  <div className="flex flex-wrap gap-2">
                    {application.interests.map((interest, index) => (
                      <span key={index} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Availability */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-6">
                <Calendar className="w-5 h-5 text-brand-primary mr-2" />
                <h2 className="text-xl font-semibold">Availability</h2>
              </div>
              
              <div className="grid md:grid-cols-3 gap-6">
                {application.weeklyHours && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Weekly Hours</label>
                    <p className="text-gray-900">{application.weeklyHours} hours/week</p>
                  </div>
                )}
                
                {application.preferredModality && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Mode</label>
                    <p className="text-gray-900 capitalize">{application.preferredModality}</p>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Available Days</label>
                  <div className="flex flex-wrap gap-1">
                    {application.availableDays.map((day, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                        {day.slice(0, 3)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Motivation & Goals */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-6">
                <Heart className="w-5 h-5 text-brand-primary mr-2" />
                <h2 className="text-xl font-semibold">Motivation & Goals</h2>
              </div>
              
              <div className="space-y-6">
                {application.goals && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Goals</label>
                    <p className="text-gray-900 leading-relaxed">{application.goals}</p>
                  </div>
                )}
                
                {application.motivation && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Motivation</label>
                    <p className="text-gray-900 leading-relaxed">{application.motivation}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Attachments */}
            {application.attachments.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center mb-6">
                  <FileText className="w-5 h-5 text-brand-primary mr-2" />
                  <h2 className="text-xl font-semibold">Attachments</h2>
                </div>
                
                <div className="space-y-3">
                  {application.attachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center">
                        <FileText className="w-4 h-4 text-gray-500 mr-3" />
                        <div>
                          <div className="font-medium text-gray-900">{attachment.originalName}</div>
                          <div className="text-sm text-gray-500">
                            {attachment.attachmentType.replace(/_/g, ' ')} • {(attachment.fileSize / 1024 / 1024).toFixed(2)} MB
                          </div>
                        </div>
                      </div>
                      <a
                        href={attachment.filePath}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-600 hover:text-brand-primary rounded transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Application Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4">Application Summary</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Submitted</label>
                  <p className="text-sm text-gray-900">
                    {new Date(application.submittedAt || application.createdAt).toLocaleString()}
                  </p>
                </div>
                
                {application.assignedReviewer && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Reviewer</label>
                    <p className="text-sm text-gray-900">{application.assignedReviewer.name}</p>
                  </div>
                )}
                
                {application.matchScore && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Match Score</label>
                    <div className="flex items-center">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-brand-primary h-2 rounded-full"
                          style={{ width: `${application.matchScore * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{Math.round(application.matchScore * 100)}%</span>
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Consents</label>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      {application.dataProcessingConsent ? (
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500 mr-2" />
                      )}
                      <span className="text-sm">Data Processing</span>
                    </div>
                    <div className="flex items-center">
                      {application.codeOfConductAccepted ? (
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500 mr-2" />
                      )}
                      <span className="text-sm">Code of Conduct</span>
                    </div>
                    <div className="flex items-center">
                      {application.backgroundCheckConsent ? (
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-yellow-500 mr-2" />
                      )}
                      <span className="text-sm">Background Check</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Review Form */}
            {canReview && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4">
                  {hasSubmittedReview ? 'Update Review' : 'Submit Review'}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Score (1-10)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={reviewData.score}
                      onChange={(e) => setReviewData(prev => ({ ...prev, score: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Strengths
                    </label>
                    <textarea
                      value={reviewData.strengths}
                      onChange={(e) => setReviewData(prev => ({ ...prev, strengths: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                      placeholder="What are the applicant's strengths?"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Concerns
                    </label>
                    <textarea
                      value={reviewData.concerns}
                      onChange={(e) => setReviewData(prev => ({ ...prev, concerns: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                      placeholder="Any concerns or areas for improvement?"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Recommendations
                    </label>
                    <textarea
                      value={reviewData.recommendations}
                      onChange={(e) => setReviewData(prev => ({ ...prev, recommendations: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                      placeholder="Your recommendations for this application"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Decision
                    </label>
                    <select
                      value={reviewData.decision}
                      onChange={(e) => setReviewData(prev => ({ ...prev, decision: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                    >
                      <option value="">Select decision...</option>
                      <option value="accept">Accept</option>
                      <option value="reject">Reject</option>
                      <option value="request_info">Request More Info</option>
                      <option value="interview">Schedule Interview</option>
                    </select>
                  </div>
                  
                  <button
                    onClick={submitReview}
                    disabled={submitting}
                    className="w-full px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Submit Review
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Previous Reviews */}
            {application.reviews.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4">Previous Reviews</h3>
                
                <div className="space-y-4">
                  {application.reviews.map((review) => (
                    <div key={review.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{review.reviewer.name}</span>
                        {review.score && (
                          <span className="text-sm font-medium text-brand-primary">
                            {review.score}/10
                          </span>
                        )}
                      </div>
                      
                      {review.decision && (
                        <div className="mb-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            review.decision === 'accept' ? 'bg-green-100 text-green-800' :
                            review.decision === 'reject' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {review.decision.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                      )}
                      
                      {review.strengths && (
                        <div className="mb-2">
                          <div className="text-sm font-medium text-gray-700">Strengths:</div>
                          <div className="text-sm text-gray-600">{review.strengths}</div>
                        </div>
                      )}
                      
                      {review.concerns && (
                        <div className="mb-2">
                          <div className="text-sm font-medium text-gray-700">Concerns:</div>
                          <div className="text-sm text-gray-600">{review.concerns}</div>
                        </div>
                      )}
                      
                      {review.recommendations && (
                        <div className="mb-2">
                          <div className="text-sm font-medium text-gray-700">Recommendations:</div>
                          <div className="text-sm text-gray-600">{review.recommendations}</div>
                        </div>
                      )}
                      
                      {review.completedAt && (
                        <div className="text-xs text-gray-500 mt-2">
                          Completed: {new Date(review.completedAt).toLocaleString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Status History */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4">Status History</h3>
              
              <div className="space-y-3">
                {application.statusHistory.map((entry, index) => (
                  <div key={entry.id} className="flex items-start">
                    <div className="flex-shrink-0 w-2 h-2 bg-brand-primary rounded-full mt-2 mr-3"></div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {entry.toStatus.replace(/_/g, ' ')}
                      </div>
                      {entry.reason && (
                        <div className="text-sm text-gray-600">{entry.reason}</div>
                      )}
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(entry.changedAt).toLocaleString()}
                        {entry.changedBy && ` by ${entry.changedBy.name}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}