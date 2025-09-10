'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  QrCode, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  ArrowRight,
  BookOpen,
  GraduationCap,
  Shield,
  Camera
} from 'lucide-react';
import Link from 'next/link';

interface ClassInfo {
  id: string;
  name: string;
  subject: string;
  gradeLevel: string;
  teacher: {
    id: string;
    name: string;
    email: string;
  };
  startDate: string;
  endDate: string;
}

export default function JoinClassPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [classCode, setClassCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [joinedClass, setJoinedClass] = useState<ClassInfo | null>(null);
  const [showQRScanner, setShowQRScanner] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login?callbackUrl=/learn/join');
      return;
    }
  }, [session, status, router]);

  const handleCodeInput = (value: string) => {
    // Remove any non-alphanumeric characters and convert to uppercase
    const cleanCode = value.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    
    // Limit to 6 characters
    if (cleanCode.length <= 6) {
      setClassCode(cleanCode);
      setError('');
    }
  };

  const validateCode = (code: string): boolean => {
    // Check if code is exactly 6 characters and alphanumeric
    return /^[A-Z0-9]{6}$/.test(code);
  };

  const handleJoinClass = async () => {
    if (!validateCode(classCode)) {
      setError('Please enter a valid 6-character class code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/classes/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: classCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join class');
      }

      setSuccess(true);
      setJoinedClass(data.enrollment.class);
      
      // Redirect to dashboard after a delay
      setTimeout(() => {
        router.push('/learn');
      }, 3000);

    } catch (error) {
      console.error('Error joining class:', error);
      setError(error instanceof Error ? error.message : 'Failed to join class');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQRScan = (scannedCode: string) => {
    // Extract code from QR data (could be URL or just the code)
    const codeMatch = scannedCode.match(/[A-Z0-9]{6}/i);
    if (codeMatch) {
      handleCodeInput(codeMatch[0]);
      setShowQRScanner(false);
    } else {
      setError('Invalid QR code format');
    }
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

  if (success && joinedClass) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle className="w-8 h-8 text-green-600" />
          </motion.div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome to Your Class!
          </h1>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h2 className="font-semibold text-gray-800 mb-2">{joinedClass.name}</h2>
            <p className="text-sm text-gray-600 mb-1">
              <strong>Subject:</strong> {joinedClass.subject}
            </p>
            <p className="text-sm text-gray-600 mb-1">
              <strong>Grade:</strong> {joinedClass.gradeLevel}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Teacher:</strong> {joinedClass.teacher.name}
            </p>
          </div>

          <p className="text-gray-600 mb-6">
            You've successfully joined the class! You'll be redirected to your learning dashboard in a moment.
          </p>

          <Link
            href="/learn"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Go to Dashboard
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Join Your Class
            </h1>
            <p className="text-gray-600">
              Enter the 6-character class code provided by your teacher
            </p>
          </motion.div>

          {/* Main Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-lg p-8"
          >
            {/* Class Code Input */}
            <div className="mb-6">
              <label 
                htmlFor="classCode" 
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Class Code
              </label>
              <div className="relative">
                <input
                  id="classCode"
                  type="text"
                  value={classCode}
                  onChange={(e) => handleCodeInput(e.target.value)}
                  placeholder="ABC123"
                  className="w-full px-4 py-4 text-center text-2xl font-mono tracking-widest border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                  maxLength={6}
                  autoComplete="off"
                  style={{ letterSpacing: '0.3em' }}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <Users className="w-5 h-5 text-gray-400" />
                </div>
              </div>
              
              {/* Code Format Helper */}
              <div className="mt-2 flex items-center justify-center space-x-1">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-8 h-2 rounded-full ${
                      classCode.length > i ? 'bg-blue-500' : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
              
              <p className="text-xs text-gray-500 text-center mt-2">
                {classCode.length}/6 characters
              </p>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center"
                >
                  <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
                  <span className="text-red-700 text-sm">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleJoinClass}
                disabled={!validateCode(classCode) || isLoading}
                className="w-full flex items-center justify-center px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Joining Class...
                  </>
                ) : (
                  <>
                    <BookOpen className="w-5 h-5 mr-2" />
                    Join Class
                  </>
                )}
              </button>

              {/* QR Code Scanner Button */}
              <button
                onClick={() => setShowQRScanner(true)}
                className="w-full flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                <QrCode className="w-5 h-5 mr-2" />
                Scan QR Code
              </button>
            </div>

            {/* Help Section */}
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-800 mb-2 flex items-center">
                <Shield className="w-5 h-5 mr-2 text-blue-500" />
                Need Help?
              </h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Ask your teacher for the 6-character class code</li>
                <li>• Codes are case-insensitive (ABC123 = abc123)</li>
                <li>• Use the QR scanner if your teacher provides a QR code</li>
                <li>• Contact support if you continue having issues</li>
              </ul>
            </div>
          </motion.div>

          {/* Navigation */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center mt-6"
          >
            <Link
              href="/learn"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              ← Back to Learning Dashboard
            </Link>
          </motion.div>
        </div>
      </div>

      {/* QR Scanner Modal */}
      <AnimatePresence>
        {showQRScanner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-md w-full"
            >
              <div className="text-center">
                <Camera className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  QR Code Scanner
                </h3>
                <p className="text-gray-600 mb-4">
                  QR code scanning feature coming soon! For now, please enter the class code manually.
                </p>
                <button
                  onClick={() => setShowQRScanner(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}