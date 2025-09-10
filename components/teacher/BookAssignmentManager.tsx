'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Plus,
  Calendar,
  Users,
  User,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertTriangle,
  MoreVertical,
  Edit,
  Trash2,
  Target,
  BookMarked,
  Loader2,
  AlertCircle,
  Star,
  FileText
} from 'lucide-react';

interface Book {
  id: string;
  title: string;
  authorName: string; // Changed from 'author' to match API
  summary?: string; // Changed from 'description' to match API
  difficulty?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'; // Made optional
  pageCount?: number; // Changed from 'pages' to match API
  coverImage?: string; // Changed from 'thumbnail' to match API
  category: string[]; // Changed from 'categories' to match API
  language: string;
  isPremium: boolean;
  price?: number;
  currency?: string;
}

interface Assignment {
  id: string;
  bookId: string;
  book: Book;
  classId?: string;
  className?: string;
  studentId?: string;
  studentName?: string;
  assignedAt: string;
  dueDate?: string;
  instructions?: string;
  isRequired: boolean;
  allowDiscussion: boolean;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
  progress?: number;
  submissions?: number;
  totalStudents?: number;
}

interface Student {
  id: string;
  name: string;
  email: string;
  classId: string;
  readingLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
}

interface ClassInfo {
  id: string;
  name: string;
  studentCount: number;
}

export default function BookAssignmentManager() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  
  const [newAssignment, setNewAssignment] = useState({
    bookId: '',
    assignmentType: 'class' as 'class' | 'individual',
    classId: '',
    studentIds: [] as string[],
    dueDate: '',
    instructions: '',
    isRequired: true,
    allowDiscussion: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [assignmentsRes, booksRes, classesRes, studentsRes] = await Promise.all([
        fetch('/api/teacher/assignments'),
        fetch('/api/books'),
        fetch('/api/teacher/classes'),
        fetch('/api/teacher/students')
      ]);

      if (!assignmentsRes.ok || !booksRes.ok || !classesRes.ok || !studentsRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const [assignmentsData, booksData, classesData, studentsData] = await Promise.all([
        assignmentsRes.json(),
        booksRes.json(),
        classesRes.json(),
        studentsRes.json()
      ]);

      if (assignmentsData.success) setAssignments(assignmentsData.data.assignments || []);
      if (booksData.success) setBooks(booksData.books || []);
      if (classesData.success) setClasses(classesData.data.classes || []);
      if (studentsData.success) setStudents(studentsData.data.students || []);

    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const createAssignment = async () => {
    if (!newAssignment.bookId || (!newAssignment.classId && newAssignment.studentIds.length === 0)) {
      setError('Please select a book and target (class or students)');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/teacher/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newAssignment),
      });

      if (!response.ok) {
        throw new Error('Failed to create assignment');
      }

      const result = await response.json();
      
      if (result.success) {
        await fetchData();
        setShowCreateForm(false);
        setNewAssignment({
          bookId: '',
          assignmentType: 'class',
          classId: '',
          studentIds: [],
          dueDate: '',
          instructions: '',
          isRequired: true,
          allowDiscussion: true
        });
      } else {
        throw new Error(result.error || 'Failed to create assignment');
      }
    } catch (err) {
      console.error('Error creating assignment:', err);
      setError(err instanceof Error ? err.message : 'Failed to create assignment');
    } finally {
      setLoading(false);
    }
  };

  const deleteAssignment = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to delete this assignment?')) return;

    try {
      setError(null);
      
      const response = await fetch(`/api/teacher/assignments/${assignmentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete assignment');
      }

      const result = await response.json();
      
      if (result.success) {
        await fetchData();
      } else {
        throw new Error(result.error || 'Failed to delete assignment');
      }
    } catch (err) {
      console.error('Error deleting assignment:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete assignment');
    }
  };

  const getFilteredAssignments = () => {
    return assignments.filter(assignment => {
      const matchesSearch = assignment.book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (assignment.book.authorName || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || assignment.status === statusFilter;
      const matchesClass = selectedClass === 'all' || assignment.classId === selectedClass;
      
      return matchesSearch && matchesStatus && matchesClass;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'text-yellow-700 bg-yellow-100';
      case 'IN_PROGRESS': return 'text-blue-700 bg-blue-100';
      case 'COMPLETED': return 'text-green-700 bg-green-100';
      case 'OVERDUE': return 'text-red-700 bg-red-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'BEGINNER': return 'text-blue-700 bg-blue-100';
      case 'INTERMEDIATE': return 'text-orange-700 bg-orange-100';
      case 'ADVANCED': return 'text-red-700 bg-red-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const filteredAssignments = getFilteredAssignments();

  if (loading && assignments.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading assignments...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Book Assignments</h2>
          <p className="text-gray-600">Assign books to your students and track their progress</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Assignment
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Create Assignment Form */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-6 border border-gray-200 rounded-lg bg-gray-50"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Assignment</h3>
            
            <div className="space-y-4">
              {/* Book Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Book *
                </label>
                <select
                  value={newAssignment.bookId}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, bookId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Choose a book...</option>
                  {books.map(book => (
                    <option key={book.id} value={book.id}>
                      {book.title} by {book.authorName} {book.difficulty ? `(${book.difficulty})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Assignment Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assignment Type
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="class"
                      checked={newAssignment.assignmentType === 'class'}
                      onChange={(e) => setNewAssignment(prev => ({ 
                        ...prev, 
                        assignmentType: e.target.value as 'class' | 'individual',
                        studentIds: []
                      }))}
                      className="mr-2"
                    />
                    Assign to Class
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="individual"
                      checked={newAssignment.assignmentType === 'individual'}
                      onChange={(e) => setNewAssignment(prev => ({ 
                        ...prev, 
                        assignmentType: e.target.value as 'class' | 'individual',
                        classId: ''
                      }))}
                      className="mr-2"
                    />
                    Assign to Individual Students
                  </label>
                </div>
              </div>

              {/* Class or Student Selection */}
              {newAssignment.assignmentType === 'class' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Class *
                  </label>
                  <select
                    value={newAssignment.classId}
                    onChange={(e) => setNewAssignment(prev => ({ ...prev, classId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Choose a class...</option>
                    {classes.map(cls => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} ({cls.studentCount} students)
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Students *
                  </label>
                  <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-2">
                    {students.map(student => (
                      <label key={student.id} className="flex items-center p-2 hover:bg-gray-50 rounded">
                        <input
                          type="checkbox"
                          checked={newAssignment.studentIds.includes(student.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewAssignment(prev => ({ 
                                ...prev, 
                                studentIds: [...prev.studentIds, student.id]
                              }));
                            } else {
                              setNewAssignment(prev => ({ 
                                ...prev, 
                                studentIds: prev.studentIds.filter(id => id !== student.id)
                              }));
                            }
                          }}
                          className="mr-3"
                        />
                        <div className="flex-grow">
                          <p className="text-sm font-medium text-gray-900">{student.name}</p>
                          <p className="text-xs text-gray-600">{student.email} • {student.readingLevel}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Due Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={newAssignment.dueDate}
                    onChange={(e) => setNewAssignment(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Options */}
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newAssignment.isRequired}
                      onChange={(e) => setNewAssignment(prev => ({ ...prev, isRequired: e.target.checked }))}
                      className="mr-2"
                    />
                    Required Assignment
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newAssignment.allowDiscussion}
                      onChange={(e) => setNewAssignment(prev => ({ ...prev, allowDiscussion: e.target.checked }))}
                      className="mr-2"
                    />
                    Allow Discussion
                  </label>
                </div>
              </div>

              {/* Instructions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instructions
                </label>
                <textarea
                  value={newAssignment.instructions}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, instructions: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Provide instructions for this assignment..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setNewAssignment({
                    bookId: '',
                    assignmentType: 'class',
                    classId: '',
                    studentIds: [],
                    dueDate: '',
                    instructions: '',
                    isRequired: true,
                    allowDiscussion: true
                  });
                }}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createAssignment}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Create Assignment
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search books..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="OVERDUE">Overdue</option>
        </select>
        
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Classes</option>
          {classes.map(cls => (
            <option key={cls.id} value={cls.id}>{cls.name}</option>
          ))}
        </select>
      </div>

      {/* Assignments List */}
      <div className="space-y-4">
        {filteredAssignments.length > 0 ? (
          filteredAssignments.map((assignment, index) => (
            <motion.div
              key={assignment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-grow">
                  <div className="flex items-center gap-3 mb-2">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">{assignment.book.title}</h3>
                    {assignment.book.difficulty && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(assignment.book.difficulty)}`}>
                        {assignment.book.difficulty}
                      </span>
                    )}
                    {assignment.isRequired && (
                      <Star className="w-4 h-4 text-yellow-500" title="Required" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600">by {assignment.book.authorName || 'Unknown Author'}</p>
                  {assignment.book.summary && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{assignment.book.summary}</p>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(assignment.status)}`}>
                    {assignment.status.replace('_', ' ')}
                  </span>
                  <button
                    onClick={() => deleteAssignment(assignment.id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete assignment"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {assignment.instructions && (
                <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Instructions</span>
                  </div>
                  <p className="text-sm text-gray-600">{assignment.instructions}</p>
                </div>
              )}
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 text-gray-600">
                    {assignment.classId ? (
                      <>
                        <Users className="w-4 h-4" />
                        <span>{assignment.className} ({assignment.totalStudents} students)</span>
                      </>
                    ) : (
                      <>
                        <User className="w-4 h-4" />
                        <span>{assignment.studentName}</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>Assigned {new Date(assignment.assignedAt).toLocaleDateString()}</span>
                  </div>
                  {assignment.dueDate && (
                    <div className="flex items-center gap-1 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>Due {new Date(assignment.dueDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
                
                {assignment.classId && (
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${(assignment.submissions || 0) / (assignment.totalStudents || 1) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600">
                      {assignment.submissions || 0}/{assignment.totalStudents || 0} completed
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== 'all' || selectedClass !== 'all'
                ? 'Try adjusting your filters to see more assignments.'
                : 'Create your first book assignment to get started.'}
            </p>
            {(!searchTerm && statusFilter === 'all' && selectedClass === 'all') && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Your First Assignment
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}