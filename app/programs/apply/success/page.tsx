'use client';

import { motion } from 'framer-motion';
import { CheckCircle, Clock, Mail, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function ApplicationSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-yellow-50">
      <div className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto text-center"
        >
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-8"
          >
            <CheckCircle className="w-10 h-10 text-green-600" />
          </motion.div>

          {/* Success Message */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-4xl font-bold text-gray-900 mb-4"
          >
            Application Submitted Successfully!
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-xl text-gray-600 mb-8"
          >
            Thank you for applying to our programs. We're excited to review your application 
            and connect you with our global community of changemakers.
          </motion.p>

          {/* Next Steps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8"
          >
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">What Happens Next?</h2>
            
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-brand-primary rounded-full flex items-center justify-center text-white text-sm font-medium">
                  1
                </div>
                <div className="ml-4">
                  <h3 className="font-semibold text-gray-900">Confirmation Email</h3>
                  <p className="text-gray-600">
                    You'll receive a confirmation email within the next few minutes with your application details.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-brand-primary rounded-full flex items-center justify-center text-white text-sm font-medium">
                  2
                </div>
                <div className="ml-4">
                  <h3 className="font-semibold text-gray-900">Application Review</h3>
                  <p className="text-gray-600">
                    Our program team will carefully review your application and supporting documents.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-brand-primary rounded-full flex items-center justify-center text-white text-sm font-medium">
                  3
                </div>
                <div className="ml-4">
                  <h3 className="font-semibold text-gray-900">Response & Next Steps</h3>
                  <p className="text-gray-600">
                    We'll contact you within 5-7 business days with the review outcome and next steps.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="bg-blue-50 rounded-xl p-6 mb-8"
          >
            <div className="flex items-center justify-center mb-4">
              <Clock className="w-6 h-6 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-blue-900">Expected Timeline</h3>
            </div>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="font-medium text-blue-900">Today</div>
                <div className="text-blue-700">Application received</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-blue-900">3-5 Days</div>
                <div className="text-blue-700">Initial review</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-blue-900">5-7 Days</div>
                <div className="text-blue-700">Response sent</div>
              </div>
            </div>
          </motion.div>

          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="bg-gray-50 rounded-xl p-6 mb-8"
          >
            <div className="flex items-center justify-center mb-4">
              <Mail className="w-6 h-6 text-gray-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Questions?</h3>
            </div>
            <p className="text-gray-600 mb-4">
              If you have any questions about your application or our programs, feel free to reach out to us.
            </p>
            <Link 
              href="/contact" 
              className="inline-flex items-center text-brand-primary hover:text-brand-primary/80 font-medium"
            >
              Contact Our Team
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              href="/programs"
              className="btn-brand-secondary"
            >
              View All Programs
            </Link>
            <Link
              href="/dashboard"
              className="btn-brand-primary"
            >
              Go to Dashboard
            </Link>
          </motion.div>

          {/* Footer Note */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1 }}
            className="mt-12"
          >
            <p className="text-sm text-gray-500">
              Your application reference number and detailed status updates will be available in your dashboard.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}