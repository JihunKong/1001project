'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Search,
  Filter,
  UserCheck,
  UserX,
  Calendar,
  BookOpen,
  TrendingUp,
  Award,
  Clock,
  Target,
  MoreVertical,
  Mail,
  MessageSquare,
  Loader2,
  AlertCircle,
  Download
} from 'lucide-react';

interface Student {
  id: string;
  name: string;
  email: string;
  enrolledAt: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  lastActive?: string;
  progress: {
    booksRead: number;
    currentBooks: number;
    avgProgress: number;
    readingStreak: number;
    sessionLength: number; // in minutes
    difficultyLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  };
  assignments: {
    total: number;
    completed: number;
    pending: number;
    overdue: number;
  };
  classId: string;
  className: string;
}

interface ClassInfo {
  id: string;
  name: string;
  code: string;
  studentCount: number;
}

export default function StudentRoster() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch classes and students in parallel
      const [classesResponse, studentsResponse] = await Promise.all([
        fetch('/api/teacher/classes'),
        fetch('/api/teacher/students')
      ]);

      if (!classesResponse.ok || !studentsResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const [classesResult, studentsResult] = await Promise.all([
        classesResponse.json(),
        studentsResponse.json()
      ]);

      if (classesResult.success && studentsResult.success) {
        setClasses(classesResult.data.classes || []);
        setStudents(studentsResult.data.students || []);
      } else {
        throw new Error('Failed to load data');
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const updateStudentStatus = async (studentId: string, status: 'ACTIVE' | 'INACTIVE') => {
    try {
      setError(null);
      
      const response = await fetch(`/api/teacher/students/${studentId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update student status');
      }

      const result = await response.json();
      
      if (result.success) {
        await fetchData(); // Refresh the data
      } else {
        throw new Error(result.error || 'Failed to update status');
      }
    } catch (err) {
      console.error('Error updating student status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update student status');
    }
  };

  const sendMessage = async (studentId: string, subject: string, message: string) => {
    try {
      setError(null);
      
      const response = await fetch('/api/teacher/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientId: studentId,
          subject,
          message
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      // Show success notification
      alert('Message sent successfully!');
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
    }
  };

  const exportStudentData = () => {
    const filteredStudents = getFilteredStudents();
    const csvData = [
      ['Name', 'Email', 'Class', 'Status', 'Enrolled Date', 'Books Read', 'Current Progress', 'Reading Streak', 'Assignments Completed'],
      ...filteredStudents.map(student => [
        student.name,
        student.email,
        student.className,
        student.status,
        new Date(student.enrolledAt).toLocaleDateString(),
        student.progress.booksRead.toString(),
        `${student.progress.avgProgress}%`,
        `${student.progress.readingStreak} days`,
        `${student.assignments.completed}/${student.assignments.total}`
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getFilteredStudents = () => {
    return students.filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           student.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesClass = selectedClass === 'all' || student.classId === selectedClass;
      const matchesStatus = statusFilter === 'all' || student.status === statusFilter;
      
      return matchesSearch && matchesClass && matchesStatus;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'text-green-700 bg-green-100';
      case 'INACTIVE': return 'text-gray-700 bg-gray-100';
      case 'PENDING': return 'text-yellow-700 bg-yellow-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'BEGINNER': return 'text-blue-700 bg-blue-100';
      case 'INTERMEDIATE': return 'text-orange-700 bg-orange-100';
      case 'ADVANCED': return 'text-red-700 bg-red-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const filteredStudents = getFilteredStudents();

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading students...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Student Roster</h2>
          <p className="text-gray-600">Manage your students and track their progress</p>
        </div>
        <button
          onClick={exportStudentData}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export Data
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Classes</option>
          {classes.map(cls => (
            <option key={cls.id} value={cls.id}>
              {cls.name} ({cls.studentCount} students)
            </option>
          ))}
        </select>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="PENDING">Pending</option>
        </select>
      </div>

      {/* Statistics Overview */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <Users className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-bold text-blue-900">{filteredStudents.length}</span>
          </div>
          <p className="text-blue-700 font-medium">Total Students</p>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <UserCheck className="w-8 h-8 text-green-600" />
            <span className="text-2xl font-bold text-green-900">
              {filteredStudents.filter(s => s.status === 'ACTIVE').length}
            </span>
          </div>
          <p className="text-green-700 font-medium">Active Students</p>
        </div>
        
        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <BookOpen className="w-8 h-8 text-orange-600" />
            <span className="text-2xl font-bold text-orange-900">
              {filteredStudents.reduce((sum, s) => sum + s.progress.booksRead, 0)}
            </span>
          </div>
          <p className="text-orange-700 font-medium">Books Read</p>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <TrendingUp className="w-8 h-8 text-purple-600" />
            <span className="text-2xl font-bold text-purple-900">
              {filteredStudents.length > 0 
                ? Math.round(filteredStudents.reduce((sum, s) => sum + s.progress.avgProgress, 0) / filteredStudents.length)
                : 0}%
            </span>
          </div>
          <p className="text-purple-700 font-medium">Avg Progress</p>
        </div>
      </div>

      {/* Students Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-900">Student</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">Class</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">Progress</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">Streak</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">Level</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student, index) => (
              <motion.tr
                key={student.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border-b border-gray-100 hover:bg-gray-50"
              >
                <td className="py-4 px-4">
                  <div>
                    <p className="font-medium text-gray-900">{student.name}</p>
                    <p className="text-sm text-gray-700">{student.email}</p>
                    <p className="text-xs text-gray-600">
                      Joined {new Date(student.enrolledAt).toLocaleDateString()}
                    </p>
                  </div>
                </td>
                
                <td className="py-4 px-4">
                  <span className="text-sm font-medium text-gray-900">{student.className}</span>
                </td>
                
                <td className="py-4 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(student.status)}`}>
                    {student.status}
                  </span>
                </td>
                
                <td className="py-4 px-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${student.progress.avgProgress}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-700">{student.progress.avgProgress}%</span>
                    </div>
                    <p className="text-xs text-gray-600">
                      {student.progress.booksRead} books • {student.progress.currentBooks} current
                    </p>
                  </div>
                </td>
                
                <td className="py-4 px-4">
                  <div className="flex items-center gap-1">
                    <Award className="w-4 h-4 text-orange-500" />
                    <span className="text-sm font-medium text-gray-900">{student.progress.readingStreak}</span>
                    <span className="text-xs text-gray-600">days</span>
                  </div>
                </td>
                
                <td className="py-4 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(student.progress.difficultyLevel)}`}>
                    {student.progress.difficultyLevel}
                  </span>
                </td>
                
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => sendMessage(student.id, 'Check-in', 'Hi! How is your reading going?')}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Send message"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => updateStudentStatus(
                        student.id, 
                        student.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
                      )}
                      className={`p-1 transition-colors ${
                        student.status === 'ACTIVE' 
                          ? 'text-red-400 hover:text-red-600' 
                          : 'text-green-400 hover:text-green-600'
                      }`}
                      title={student.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    >
                      {student.status === 'ACTIVE' ? (
                        <UserX className="w-4 h-4" />
                      ) : (
                        <UserCheck className="w-4 h-4" />
                      )}
                    </button>
                    
                    <button
                      onClick={() => setSelectedStudent(student)}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      title="View details"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        
        {filteredStudents.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== 'all' || selectedClass !== 'all'
                ? 'Try adjusting your filters to see more students.'
                : 'Students will appear here once they join your classes.'}
            </p>
          </div>
        )}
      </div>

      {/* Student Detail Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-96 overflow-y-auto shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">{selectedStudent.name}</h3>
              <button
                onClick={() => setSelectedStudent(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900">Contact Info</h4>
                <p className="text-sm text-gray-700">Email: {selectedStudent.email}</p>
                <p className="text-sm text-gray-700">
                  Last Active: {selectedStudent.lastActive 
                    ? new Date(selectedStudent.lastActive).toLocaleDateString()
                    : 'Never'
                  }
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900">Reading Stats</h4>
                <p className="text-sm text-gray-700">Books Read: {selectedStudent.progress.booksRead}</p>
                <p className="text-sm text-gray-700">Reading Streak: {selectedStudent.progress.readingStreak} days</p>
                <p className="text-sm text-gray-700">Avg Session: {selectedStudent.progress.sessionLength} min</p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900">Assignments</h4>
                <p className="text-sm text-gray-700">Completed: {selectedStudent.assignments.completed}</p>
                <p className="text-sm text-gray-700">Pending: {selectedStudent.assignments.pending}</p>
                <p className="text-sm text-gray-700">Overdue: {selectedStudent.assignments.overdue}</p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900">Progress</h4>
                <p className="text-sm text-gray-700">Overall: {selectedStudent.progress.avgProgress}%</p>
                <p className="text-sm text-gray-700">Level: {selectedStudent.progress.difficultyLevel}</p>
                <p className="text-sm text-gray-700">Current Books: {selectedStudent.progress.currentBooks}</p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}