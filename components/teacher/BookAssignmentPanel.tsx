'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Users,
  Calendar,
  Clock,
  CheckSquare,
  Square,
  Search,
  Filter,
  X,
  Plus,
  Edit,
  Trash2,
  Eye,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';

interface Book {
  id: string;
  title: string;
  authorName: string;
  coverImage: string | null;
  summary: string | null;
  category: string | null;
  language: string;
  pageCount: number | null;
  isPremium: boolean;
}

interface Student {
  id: string;
  name: string;
  email: string;
}

interface Class {
  id: string;
  name: string;
  code: string;
  subject: string | null;
  gradeLevel: string | null;
  studentCount: number;
  students: Student[];
}

interface BookAssignment {
  id: string;
  bookTitle: string;
  bookAuthor: string;
  assignedAt: string;
  dueDate: string | null;
  student: Student | null;
  class: Class | null;
  isRequired: boolean;
}

interface BookAssignmentPanelProps {
  books?: Book[];
  students?: Student[];
  classes?: Class[];
  existingAssignments?: BookAssignment[];
}

interface AssignmentFormData {
  bookId: string;
  assignTo: 'student' | 'class';
  studentIds: string[];
  classIds: string[];
  dueDate: string;
  instructions: string;
  isRequired: boolean;
  allowDiscussion: boolean;
}

export default function BookAssignmentPanel({
  books: propBooks = [],
  students: propStudents = [],
  classes: propClasses = [],
  existingAssignments: propExistingAssignments = []
}: BookAssignmentPanelProps) {
  const [books, setBooks] = useState<Book[]>(propBooks);
  const [students, setStudents] = useState<Student[]>(propStudents);
  const [classes, setClasses] = useState<Class[]>(propClasses);
  const [assignments, setAssignments] = useState<BookAssignment[]>(propExistingAssignments);
  
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [showAssignmentsList, setShowAssignmentsList] = useState(false);
  
  const [formData, setFormData] = useState<AssignmentFormData>({
    bookId: '',
    assignTo: 'student',
    studentIds: [],
    classIds: [],
    dueDate: '',
    instructions: '',
    isRequired: true,
    allowDiscussion: true
  });
  
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  // Fetch data on component mount
  useEffect(() => {
    if (propBooks.length === 0) {
      fetchAssignmentData();
    }
  }, []);

  const fetchAssignmentData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/teacher/assign-book');
      
      if (!response.ok) {
        throw new Error('Failed to fetch assignment data');
      }
      
      const result = await response.json();
      
      if (result.success) {
        setBooks(result.data.books || []);
        setStudents(result.data.students || []);
        setClasses(result.data.classes || []);
        setAssignments(result.data.recentAssignments || []);
      }
    } catch (error) {
      console.error('Error fetching assignment data:', error);
      setSubmitStatus({
        type: 'error',
        message: 'Failed to load assignment data'
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter books based on search and category
  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         book.authorName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || book.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = ['all', ...new Set(books.map(book => book.category).filter(Boolean))];

  const handleBookSelect = (book: Book) => {
    setSelectedBook(book);
    setFormData(prev => ({ ...prev, bookId: book.id }));
    setShowAssignmentForm(true);
  };

  const handleStudentToggle = (studentId: string) => {
    setFormData(prev => ({
      ...prev,
      studentIds: prev.studentIds.includes(studentId)
        ? prev.studentIds.filter(id => id !== studentId)
        : [...prev.studentIds, studentId]
    }));
  };

  const handleClassToggle = (classId: string) => {
    setFormData(prev => ({
      ...prev,
      classIds: prev.classIds.includes(classId)
        ? prev.classIds.filter(id => id !== classId)
        : [...prev.classIds, classId]
    }));
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];
    
    if (!formData.bookId) {
      errors.push('Please select a book');
    }
    
    if (formData.assignTo === 'student' && formData.studentIds.length === 0) {
      errors.push('Please select at least one student');
    }
    
    if (formData.assignTo === 'class' && formData.classIds.length === 0) {
      errors.push('Please select at least one class');
    }
    
    if (formData.dueDate && new Date(formData.dueDate) < new Date()) {
      errors.push('Due date cannot be in the past');
    }
    
    return errors;
  };

  const handleSubmitAssignment = async () => {
    const errors = validateForm();
    
    if (errors.length > 0) {
      setFormErrors(errors);
      return;
    }
    
    try {
      setLoading(true);
      setFormErrors([]);
      setSubmitStatus({ type: null, message: '' });
      
      const response = await fetch('/api/teacher/assign-book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        setSubmitStatus({
          type: 'success',
          message: result.message
        });
        
        // Reset form
        setFormData({
          bookId: '',
          assignTo: 'student',
          studentIds: [],
          classIds: [],
          dueDate: '',
          instructions: '',
          isRequired: true,
          allowDiscussion: true
        });
        setSelectedBook(null);
        setShowAssignmentForm(false);
        
        // Refresh assignments
        await fetchAssignmentData();
      } else {
        setSubmitStatus({
          type: 'error',
          message: result.error || 'Failed to create assignment'
        });
      }
    } catch (error) {
      console.error('Error creating assignment:', error);
      setSubmitStatus({
        type: 'error',
        message: 'Failed to create assignment'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to delete this assignment?')) {
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await fetch('/api/teacher/assign-book', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ assignmentIds: [assignmentId] })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setSubmitStatus({
          type: 'success',
          message: 'Assignment deleted successfully'
        });
        
        // Remove from local state
        setAssignments(prev => prev.filter(a => a.id !== assignmentId));
      } else {
        setSubmitStatus({
          type: 'error',
          message: result.error || 'Failed to delete assignment'
        });
      }
    } catch (error) {
      console.error('Error deleting assignment:', error);
      setSubmitStatus({
        type: 'error',
        message: 'Failed to delete assignment'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && books.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading assignment data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Book Assignments</h1>
          <p className="text-gray-600">Assign books to students and manage existing assignments</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => setShowAssignmentsList(!showAssignmentsList)}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Eye className="w-4 h-4" />
            View Assignments ({assignments.length})
          </button>
        </div>
      </div>

      {/* Status Messages */}
      <AnimatePresence>
        {submitStatus.type && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-lg flex items-center gap-2 ${
              submitStatus.type === 'success' 
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {submitStatus.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{submitStatus.message}</span>
            <button
              onClick={() => setSubmitStatus({ type: null, message: '' })}
              className="ml-auto text-current hover:opacity-70"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Book Selection */}
      {!showAssignmentForm && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Select a Book to Assign</h2>
            
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search books..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="pl-9 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category === 'all' ? 'All Categories' : category}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          {/* Books Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBooks.map((book) => (
              <motion.div
                key={book.id}
                whileHover={{ scale: 1.02 }}
                className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-md transition-all"
                onClick={() => handleBookSelect(book)}
              >
                <div className="aspect-[3/4] bg-gray-100 rounded-lg mb-3 overflow-hidden">
                  {book.coverImage ? (
                    <img
                      src={book.coverImage}
                      alt={book.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                </div>
                
                <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{book.title}</h3>
                <p className="text-sm text-gray-600 mb-2">by {book.authorName}</p>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{book.category || 'General'}</span>
                  {book.pageCount && <span>{book.pageCount} pages</span>}
                </div>
                
                {book.isPremium && (
                  <div className="mt-2">
                    <span className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                      Premium
                    </span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
          
          {filteredBooks.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No books found</h3>
              <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
            </div>
          )}
        </div>
      )}

      {/* Assignment Form */}
      <AnimatePresence>
        {showAssignmentForm && selectedBook && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Assign "{selectedBook.title}"
                </h2>
                <p className="text-gray-600">by {selectedBook.authorName}</p>
              </div>
              <button
                onClick={() => {
                  setShowAssignmentForm(false);
                  setSelectedBook(null);
                  setFormErrors([]);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Form Errors */}
            {formErrors.length > 0 && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <h3 className="font-medium text-red-800">Please fix the following errors:</h3>
                </div>
                <ul className="list-disc list-inside text-sm text-red-700">
                  {formErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Assignment Type */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Assign To
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="assignTo"
                    value="student"
                    checked={formData.assignTo === 'student'}
                    onChange={(e) => setFormData(prev => ({ ...prev, assignTo: e.target.value as 'student' | 'class' }))}
                    className="mr-2"
                  />
                  Individual Students
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="assignTo"
                    value="class"
                    checked={formData.assignTo === 'class'}
                    onChange={(e) => setFormData(prev => ({ ...prev, assignTo: e.target.value as 'student' | 'class' }))}
                    className="mr-2"
                  />
                  Entire Classes
                </label>
              </div>
            </div>
            
            {/* Student/Class Selection */}
            {formData.assignTo === 'student' ? (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Students ({formData.studentIds.length} selected)
                </label>
                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {students.map((student) => (
                      <label
                        key={student.id}
                        className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formData.studentIds.includes(student.id)}
                          onChange={() => handleStudentToggle(student.id)}
                          className="mr-3"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{student.name}</p>
                          <p className="text-xs text-gray-600">{student.email}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Classes ({formData.classIds.length} selected)
                </label>
                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  <div className="space-y-2">
                    {classes.map((cls) => (
                      <label
                        key={cls.id}
                        className="flex items-center p-3 hover:bg-gray-50 rounded cursor-pointer border border-gray-100"
                      >
                        <input
                          type="checkbox"
                          checked={formData.classIds.includes(cls.id)}
                          onChange={() => handleClassToggle(cls.id)}
                          className="mr-3"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900">{cls.name}</p>
                              <p className="text-xs text-gray-600">
                                Code: {cls.code} • {cls.studentCount} students
                              </p>
                              {cls.subject && cls.gradeLevel && (
                                <p className="text-xs text-gray-500">
                                  {cls.subject} - Grade {cls.gradeLevel}
                                </p>
                              )}
                            </div>
                            <Users className="w-5 h-5 text-gray-400" />
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* Due Date */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date (Optional)
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="datetime-local"
                  value={formData.dueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="pl-9 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            {/* Instructions */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Instructions (Optional)
              </label>
              <textarea
                value={formData.instructions}
                onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                placeholder="Add any specific instructions for this assignment..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
            </div>
            
            {/* Assignment Options */}
            <div className="mb-6 space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isRequired}
                  onChange={(e) => setFormData(prev => ({ ...prev, isRequired: e.target.checked }))}
                  className="mr-3"
                />
                <span className="text-sm text-gray-700">This is a required assignment</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.allowDiscussion}
                  onChange={(e) => setFormData(prev => ({ ...prev, allowDiscussion: e.target.checked }))}
                  className="mr-3"
                />
                <span className="text-sm text-gray-700">Allow student discussions</span>
              </label>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleSubmitAssignment}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating Assignment...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Create Assignment
                  </>
                )}
              </button>
              
              <button
                onClick={() => {
                  setShowAssignmentForm(false);
                  setSelectedBook(null);
                  setFormErrors([]);
                }}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Existing Assignments List */}
      <AnimatePresence>
        {showAssignmentsList && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Existing Assignments ({assignments.length})
              </h2>
              <button
                onClick={() => setShowAssignmentsList(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {assignments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left p-4 font-medium text-gray-900">Book</th>
                      <th className="text-left p-4 font-medium text-gray-900">Assigned To</th>
                      <th className="text-left p-4 font-medium text-gray-900">Due Date</th>
                      <th className="text-left p-4 font-medium text-gray-900">Status</th>
                      <th className="text-left p-4 font-medium text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.map((assignment) => (
                      <tr key={assignment.id} className="border-b hover:bg-gray-50">
                        <td className="p-4">
                          <div>
                            <p className="font-medium text-gray-900">{assignment.bookTitle}</p>
                            <p className="text-sm text-gray-600">by {assignment.bookAuthor}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          {assignment.student ? (
                            <div>
                              <p className="font-medium text-gray-900">{assignment.student.name}</p>
                              <p className="text-sm text-gray-600">{assignment.student.email}</p>
                            </div>
                          ) : assignment.class ? (
                            <div>
                              <p className="font-medium text-gray-900">{assignment.class.name}</p>
                              <p className="text-sm text-gray-600">Class • Code: {assignment.class.code}</p>
                            </div>
                          ) : (
                            <span className="text-gray-500">Unknown</span>
                          )}
                        </td>
                        <td className="p-4">
                          {assignment.dueDate ? (
                            <div>
                              <p className="text-sm text-gray-900">
                                {new Date(assignment.dueDate).toLocaleDateString()}
                              </p>
                              <p className="text-xs text-gray-600">
                                {new Date(assignment.dueDate).toLocaleTimeString()}
                              </p>
                            </div>
                          ) : (
                            <span className="text-gray-500">No due date</span>
                          )}
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                            assignment.isRequired
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {assignment.isRequired ? 'Required' : 'Optional'}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleDeleteAssignment(assignment.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete assignment"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments yet</h3>
                <p className="text-gray-600">Create your first book assignment to get started.</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}