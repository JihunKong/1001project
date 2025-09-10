'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Plus,
  Users,
  BookOpen,
  Calendar,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import Link from 'next/link';

export default function CreateClassPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [classData, setClassData] = useState({
    name: '',
    subject: '',
    gradeLevel: '',
    description: '',
    maxStudents: 30
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setClassData(prev => ({
      ...prev,
      [name]: name === 'maxStudents' ? parseInt(value) || 30 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/teacher/classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(classData),
      });

      if (!response.ok) {
        throw new Error('Failed to create class');
      }

      const result = await response.json();

      if (result.success) {
        setSuccess(true);
        // Redirect to teacher dashboard after 2 seconds
        setTimeout(() => {
          router.push('/dashboard/teacher?tab=students');
        }, 2000);
      } else {
        throw new Error(result.error || 'Failed to create class');
      }
    } catch (err) {
      console.error('Error creating class:', err);
      setError(err instanceof Error ? err.message : 'Failed to create class');
    } finally {
      setLoading(false);
    }
  };

  const subjects = [
    'English',
    'Mathematics',
    'Science',
    'Social Studies',
    'Language Arts',
    'Literature',
    'Reading',
    'Writing',
    'History',
    'Geography',
    'Other'
  ];

  const gradeLevels = [
    'Kindergarten',
    'Grade 1',
    'Grade 2',
    'Grade 3',
    'Grade 4',
    'Grade 5',
    'Grade 6',
    'Grade 7',
    'Grade 8',
    'Grade 9',
    'Grade 10',
    'Grade 11',
    'Grade 12',
    'Mixed Grades'
  ];

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl shadow-sm p-8 max-w-md w-full mx-4"
        >
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Class Created!</h2>
            <p className="text-gray-600 mb-6">
              Your class has been successfully created. You'll be redirected to your dashboard shortly.
            </p>
            <div className="flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            href="/dashboard/teacher"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Class</h1>
          <p className="text-gray-600">Set up a new class for your students</p>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto"
        >
          <div className="bg-white rounded-xl shadow-sm p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Class Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Class Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={classData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., English Literature 101"
                />
              </div>

              {/* Subject and Grade Level */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    Subject *
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={classData.subject}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Subject</option>
                    {subjects.map((subject) => (
                      <option key={subject} value={subject}>
                        {subject}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="gradeLevel" className="block text-sm font-medium text-gray-700 mb-2">
                    Grade Level *
                  </label>
                  <select
                    id="gradeLevel"
                    name="gradeLevel"
                    value={classData.gradeLevel}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Grade Level</option>
                    {gradeLevels.map((grade) => (
                      <option key={grade} value={grade}>
                        {grade}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Max Students */}
              <div>
                <label htmlFor="maxStudents" className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Students
                </label>
                <input
                  type="number"
                  id="maxStudents"
                  name="maxStudents"
                  value={classData.maxStudents}
                  onChange={handleInputChange}
                  min="1"
                  max="50"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Maximum number of students that can join this class (1-50)
                </p>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={classData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Brief description of the class, objectives, or special instructions..."
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4 pt-6">
                <Link
                  href="/dashboard/teacher"
                  className="flex-1 px-6 py-3 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-center font-medium"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Create Class
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 pt-8 border-t border-gray-200">
              <div className="text-center p-4">
                <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <h3 className="font-medium text-gray-900 mb-1">Unique Class Code</h3>
                <p className="text-sm text-gray-600">
                  A 6-character code will be generated for students to join
                </p>
              </div>
              <div className="text-center p-4">
                <BookOpen className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <h3 className="font-medium text-gray-900 mb-1">Assign Books</h3>
                <p className="text-sm text-gray-600">
                  Choose from our library to assign reading materials
                </p>
              </div>
              <div className="text-center p-4">
                <Calendar className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                <h3 className="font-medium text-gray-900 mb-1">Track Progress</h3>
                <p className="text-sm text-gray-600">
                  Monitor student reading progress and engagement
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}