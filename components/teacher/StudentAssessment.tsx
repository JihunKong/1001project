'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  BookOpen,
  Star,
  MessageSquare,
  TrendingUp,
  Clock,
  CheckCircle,
  Award
} from 'lucide-react';

interface Student {
  id: string;
  name: string;
  email: string;
  progress: {
    booksRead: number;
    currentBook?: string;
    completionRate: number;
    lastActive: string;
  };
}

interface Assessment {
  studentId: string;
  bookId: string;
  rating: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  createdAt: string;
}

export default function StudentAssessment() {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [assessment, setAssessment] = useState({
    rating: 5,
    feedback: '',
    strengths: [] as string[],
    improvements: [] as string[]
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch students (mock data for now)
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/teacher/students');
      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }
      const data = await response.json();
      
      // Transform the data to match the Student interface
      const transformedStudents: Student[] = data.students.map((student: any) => ({
        id: student.id,
        name: student.name || 'Student',
        email: student.email,
        progress: {
          booksRead: student.booksRead || 0,
          currentBook: student.currentBook || null,
          completionRate: student.completionRate || 0,
          lastActive: student.lastActive || 'Never'
        }
      }));
      
      setStudents(transformedStudents);
    } catch (error) {
      console.error('Error fetching students:', error);
      // For development, show empty state instead of mock data
      setStudents([]);
    }
  };

  const handleAssessmentSubmit = async () => {
    if (!selectedStudent) return;
    
    setLoading(true);
    try {
      // In production, this would submit to API
      console.log('Submitting assessment:', {
        studentId: selectedStudent.id,
        ...assessment
      });
      
      // Show success message
      alert(`Assessment submitted for ${selectedStudent.name}`);
      
      // Reset form
      setAssessment({
        rating: 5,
        feedback: '',
        strengths: [],
        improvements: []
      });
      setSelectedStudent(null);
    } catch (error) {
      console.error('Error submitting assessment:', error);
      alert('Failed to submit assessment');
    } finally {
      setLoading(false);
    }
  };

  const toggleStrength = (strength: string) => {
    setAssessment(prev => ({
      ...prev,
      strengths: prev.strengths.includes(strength)
        ? prev.strengths.filter(s => s !== strength)
        : [...prev.strengths, strength]
    }));
  };

  const toggleImprovement = (improvement: string) => {
    setAssessment(prev => ({
      ...prev,
      improvements: prev.improvements.includes(improvement)
        ? prev.improvements.filter(i => i !== improvement)
        : [...prev.improvements, improvement]
    }));
  };

  const strengthOptions = [
    'Reading Comprehension',
    'Vocabulary',
    'Critical Thinking',
    'Creativity',
    'Engagement',
    'Discussion Participation'
  ];

  const improvementOptions = [
    'Reading Speed',
    'Focus',
    'Note Taking',
    'Question Asking',
    'Time Management',
    'Assignment Completion'
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Student Assessment</h2>
      
      {/* Student List */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Select Student</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.map(student => (
            <motion.div
              key={student.id}
              whileHover={{ scale: 1.02 }}
              onClick={() => setSelectedStudent(student)}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedStudent?.id === student.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{student.name}</p>
                  <p className="text-sm text-gray-600">{student.email}</p>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Books Read:</span>
                  <span className="font-medium text-gray-900">{student.progress.booksRead}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Completion:</span>
                  <span className="font-medium text-gray-900">{student.progress.completionRate}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Last Active:</span>
                  <span className="text-xs text-gray-500">{student.progress.lastActive}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Assessment Form */}
      {selectedStudent && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-t pt-6"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Assessment for {selectedStudent.name}
          </h3>
          
          {/* Rating */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Overall Rating
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(rating => (
                <button
                  key={rating}
                  onClick={() => setAssessment(prev => ({ ...prev, rating }))}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center font-medium transition-all ${
                    assessment.rating === rating
                      ? 'bg-yellow-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {rating}
                </button>
              ))}
            </div>
          </div>

          {/* Strengths */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Strengths
            </label>
            <div className="flex flex-wrap gap-2">
              {strengthOptions.map(strength => (
                <button
                  key={strength}
                  onClick={() => toggleStrength(strength)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                    assessment.strengths.includes(strength)
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <CheckCircle className="inline w-3 h-3 mr-1" />
                  {strength}
                </button>
              ))}
            </div>
          </div>

          {/* Areas for Improvement */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Areas for Improvement
            </label>
            <div className="flex flex-wrap gap-2">
              {improvementOptions.map(improvement => (
                <button
                  key={improvement}
                  onClick={() => toggleImprovement(improvement)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                    assessment.improvements.includes(improvement)
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <TrendingUp className="inline w-3 h-3 mr-1" />
                  {improvement}
                </button>
              ))}
            </div>
          </div>

          {/* Feedback */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Detailed Feedback
            </label>
            <textarea
              value={assessment.feedback}
              onChange={(e) => setAssessment(prev => ({ ...prev, feedback: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              placeholder="Provide detailed feedback for the student..."
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setSelectedStudent(null);
                setAssessment({
                  rating: 5,
                  feedback: '',
                  strengths: [],
                  improvements: []
                });
              }}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAssessmentSubmit}
              disabled={loading || !assessment.feedback}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Submitting...
                </>
              ) : (
                <>
                  <Award className="w-4 h-4" />
                  Submit Assessment
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}