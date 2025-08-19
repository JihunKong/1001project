'use client';

import { useState, useEffect } from 'react';

// Force dynamic rendering due to client-side search params
export const dynamic = 'force-dynamic';
import { motion } from 'framer-motion';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { 
  Shield, 
  BookOpen, 
  Check, 
  X, 
  Info, 
  AlertTriangle,
  Heart,
  Users,
  Eye
} from 'lucide-react';

export default function ParentalConsent() {
  const [token, setToken] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  
  // Client-side only hook execution
  useEffect(() => {
    setIsClient(true);
    const urlParams = new URLSearchParams(window.location.search);
    setToken(urlParams.get('token'));
  }, []);
  
  const [isLoading, setIsLoading] = useState(false);
  const [consentData, setConsentData] = useState<{
    childName: string;
    childEmail: string;
    childAge: number;
    isValid: boolean;
    requestDate?: string;
    expiryDate?: string;
    isMinor?: boolean;
    parentEmail?: string;
    parentName?: string;
  } | null>(null);

  // Detect if this is a deletion request based on presence of requestDate
  const isDeletionRequest = consentData?.requestDate;
  const [decision, setDecision] = useState<'approve' | 'deny' | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Verify token on component mount
  useEffect(() => {
    if (token) {
      verifyToken();
    }
  }, [token]);

  const verifyToken = async () => {
    try {
      const response = await fetch('/api/parental-consent/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (response.ok) {
        const data = await response.json();
        setConsentData(data);
      } else {
        toast.error('Invalid or expired consent link');
      }
    } catch (error) {
      console.error('Token verification error:', error);
      toast.error('Failed to verify consent link');
    }
  };

  const handleDecision = async (approved: boolean) => {
    if (!token || !consentData) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/parental-consent/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token, 
          approved,
          timestamp: new Date().toISOString()
        }),
      });

      if (response.ok) {
        setDecision(approved ? 'approve' : 'deny');
        toast.success(
          approved 
            ? (isDeletionRequest 
                ? 'Consent granted! Your child\'s account deletion will proceed.' 
                : 'Consent granted! Your child can now access their account.')
            : (isDeletionRequest 
                ? 'Consent denied. Your child\'s account deletion has been cancelled.' 
                : 'Consent denied. The account will remain inactive.')
        );
      } else {
        throw new Error('Failed to process consent');
      }
    } catch (error) {
      console.error('Consent processing error:', error);
      toast.error('Failed to process your decision. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading until client-side hydration
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Link</h2>
          <p className="text-gray-600">This parental consent link is invalid or missing.</p>
        </div>
      </div>
    );
  }

  if (decision) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center"
        >
          <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-6 ${
            decision === 'approve' ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {decision === 'approve' ? (
              <Check className="h-8 w-8 text-green-600" />
            ) : (
              <X className="h-8 w-8 text-red-600" />
            )}
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {decision === 'approve' 
              ? (isDeletionRequest ? 'Deletion Approved' : 'Consent Granted')
              : (isDeletionRequest ? 'Deletion Cancelled' : 'Consent Denied')
            }
          </h2>
          
          <p className="text-gray-600 mb-6">
            {decision === 'approve' 
              ? (isDeletionRequest
                  ? `${consentData?.childName}'s account deletion has been approved and will proceed. All data will be permanently removed within 30 days.`
                  : `${consentData?.childName}'s account has been activated. They will receive an email confirmation and can now start using 1001 Stories.`
                )
              : (isDeletionRequest
                  ? `${consentData?.childName}'s account deletion has been cancelled. Their account remains active and they will be notified.`
                  : `${consentData?.childName}'s account will remain inactive. They will be notified of your decision.`
                )
            }
          </p>
          
          <Link 
            href="/"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <BookOpen className="h-5 w-5 mr-2" />
            Visit 1001 Stories
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-6">
            <BookOpen className="h-10 w-10 text-blue-600" />
            <span className="text-2xl font-bold gradient-text">1001 Stories</span>
          </Link>
          
          <div className="mb-6">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Parental Consent Required
            </h1>
            <p className="text-gray-600">
              {isDeletionRequest 
                ? "Your child has requested to delete their 1001 Stories account"
                : "Your child wants to create an account with 1001 Stories"
              }
            </p>
          </div>
        </div>

        {consentData ? (
          <div className="space-y-6">
            {/* Child Information */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {isDeletionRequest ? "Account Deletion Request Details" : "Account Request Details"}
              </h2>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Child&apos;s Name:</span>
                  <span className="font-medium text-gray-900">{consentData.childName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email Address:</span>
                  <span className="font-medium text-gray-900">{consentData.childEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Age:</span>
                  <span className="font-medium text-gray-900">{consentData.childAge} years old</span>
                </div>
                {isDeletionRequest && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Request Date:</span>
                      <span className="font-medium text-gray-900">
                        {new Date(consentData.requestDate!).toLocaleDateString()}
                      </span>
                    </div>
                    {consentData.expiryDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Expires:</span>
                        <span className="font-medium text-gray-900">
                          {new Date(consentData.expiryDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* COPPA Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-start gap-3 mb-4">
                <Info className="h-6 w-6 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">About COPPA Protection</h3>
                  <p className="text-sm text-blue-800">
                    The Children&apos;s Online Privacy Protection Act (COPPA) requires websites to obtain 
                    parental consent before collecting personal information from children under 13 years old. 
                    This protects your child&apos;s privacy and safety online.
                  </p>
                </div>
              </div>
            </div>

            {/* Platform Information */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">About 1001 Stories</h3>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <BookOpen className="h-6 w-6 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-gray-900">Educational Content</h4>
                    <p className="text-sm text-gray-600">
                      Stories from children around the world, designed to promote literacy and cultural understanding.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Shield className="h-6 w-6 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-gray-900">Safe Environment</h4>
                    <p className="text-sm text-gray-600">
                      Age-appropriate content with moderated community features and strict privacy protection.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Users className="h-6 w-6 text-purple-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-gray-900">Global Community</h4>
                    <p className="text-sm text-gray-600">
                      Connect with young readers and storytellers from around the world in a safe, supervised environment.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowDetails(!showDetails)}
                className="mt-4 text-sm text-blue-600 hover:text-blue-500 flex items-center gap-1"
              >
                <Eye className="h-4 w-4" />
                {showDetails ? 'Hide' : 'View'} data collection details
              </button>

              {showDetails && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 p-4 bg-gray-50 rounded-lg text-sm text-gray-700"
                >
                  <h5 className="font-medium text-gray-900 mb-2">Information We Collect for Children Under 13:</h5>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Account creation information (name, email)</li>
                    <li>Reading progress and preferences</li>
                    <li>Educational activities and achievements</li>
                  </ul>
                  <p className="mt-2 text-xs text-gray-600">
                    We do NOT collect behavioral tracking data, location information, or share data with third parties for children under 13.
                  </p>
                </motion.div>
              )}
            </div>

            {/* Decision Buttons */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Decision</h3>
              <p className="text-gray-600 mb-6">
                {isDeletionRequest
                  ? `Do you give permission for ${consentData.childName}'s account to be permanently deleted from 1001 Stories?`
                  : `Do you give permission for ${consentData.childName} to create an account with 1001 Stories?`
                }
              </p>

              <div className="flex gap-4">
                <button
                  onClick={() => handleDecision(true)}
                  disabled={isLoading}
                  className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  <Check className="h-5 w-5" />
                  {isLoading 
                    ? 'Processing...' 
                    : (isDeletionRequest ? 'Approve Deletion' : 'Grant Permission')
                  }
                </button>

                <button
                  onClick={() => handleDecision(false)}
                  disabled={isLoading}
                  className="flex-1 bg-red-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  <X className="h-5 w-5" />
                  {isLoading 
                    ? 'Processing...' 
                    : (isDeletionRequest ? 'Cancel Deletion' : 'Deny Permission')
                  }
                </button>
              </div>

              <p className="text-xs text-gray-500 mt-4 text-center">
                This decision can be changed later by contacting our support team.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Verifying consent request...</p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Heart className="h-4 w-4 text-red-500" />
            <span>Protecting children&apos;s privacy and safety is our priority</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}