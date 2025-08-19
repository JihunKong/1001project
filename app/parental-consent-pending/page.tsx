'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Clock, 
  Mail, 
  BookOpen, 
  ArrowLeft, 
  CheckCircle, 
  Info,
  Heart
} from 'lucide-react';

export default function ParentalConsentPending() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full space-y-8"
      >
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center space-x-2 mb-8">
            <BookOpen className="h-10 w-10 text-blue-600" />
            <span className="text-2xl font-bold gradient-text">1001 Stories</span>
          </Link>
          
          <div className="mb-6">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-4">
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Waiting for Parental Consent
            </h2>
            <p className="text-gray-600">
              Your account has been created and is pending approval from your parent or guardian.
            </p>
          </div>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <Mail className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Email Sent to Parent/Guardian
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                We&apos;ve sent a consent email to your parent or guardian. They need to:
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-blue-600">1</span>
                  </div>
                  <span className="text-sm text-gray-700">Check their email inbox</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-blue-600">2</span>
                  </div>
                  <span className="text-sm text-gray-700">Click the consent link</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-blue-600">3</span>
                  </div>
                  <span className="text-sm text-gray-700">Approve your account creation</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900 mb-1">COPPA Compliance</h4>
                <p className="text-sm text-gray-600">
                  This process is required by law (COPPA) to protect children under 13 online. 
                  Your account will be activated once your parent or guardian gives permission.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* What Happens Next */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-900 mb-1">What happens next?</h4>
              <p className="text-sm text-green-700">
                Once your parent/guardian approves, you&apos;ll receive an email confirmation 
                and can start exploring stories and learning with 1001 Stories!
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Haven&apos;t received the email? Ask your parent/guardian to check their spam folder.
            </p>
            
            <div className="flex flex-col space-y-3">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Need Help? Contact Support
              </Link>
              
              <Link
                href="/"
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Return to Homepage
              </Link>
            </div>
          </div>
        </div>

        {/* Footer Message */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Heart className="h-4 w-4 text-red-500" />
            <span>Thank you for joining our community of young storytellers!</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}