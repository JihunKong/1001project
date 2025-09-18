'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Copy,
  RefreshCw,
  Plus,
  Users,
  Calendar,
  AlertCircle,
  CheckCircle,
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react';

interface ClassData {
  id: string;
  name: string;
  code: string;
  description?: string;
  studentCount: number;
  maxStudents: number;
  isActive: boolean;
  createdAt: string;
  subject: string;
  gradeLevel: string;
}

export default function ClassCodeManager() {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [regeneratingCode, setRegeneratingCode] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [newClass, setNewClass] = useState({
    name: '',
    description: '',
    subject: '',
    gradeLevel: '',
    maxStudents: 30
  });

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/teacher/classes');
      
      if (!response.ok) {
        throw new Error('Failed to fetch classes');
      }
      
      const result = await response.json();
      
      if (result.success) {
        setClasses(result.data.classes || []);
      } else {
        throw new Error(result.error || 'Failed to load classes');
      }
    } catch (err) {
      console.error('Error fetching classes:', err);
      setError(err instanceof Error ? err.message : 'Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const generateClassCode = () => {
    // Generate 6-digit alphanumeric code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const createClass = async () => {
    if (!newClass.name.trim() || !newClass.subject.trim() || !newClass.gradeLevel.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const classData = {
        ...newClass,
        code: generateClassCode()
      };
      
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
        await fetchClasses(); // Refresh the list
        setShowCreateForm(false);
        setNewClass({
          name: '',
          description: '',
          subject: '',
          gradeLevel: '',
          maxStudents: 30
        });
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

  const regenerateCode = async (classId: string) => {
    try {
      setRegeneratingCode(classId);
      setError(null);
      
      const response = await fetch(`/api/teacher/classes/${classId}/regenerate-code`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to regenerate code');
      }
      
      const result = await response.json();
      
      if (result.success) {
        await fetchClasses(); // Refresh the list
      } else {
        throw new Error(result.error || 'Failed to regenerate code');
      }
    } catch (err) {
      console.error('Error regenerating code:', err);
      setError(err instanceof Error ? err.message : 'Failed to regenerate code');
    } finally {
      setRegeneratingCode(null);
    }
  };

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const toggleClassStatus = async (classId: string, isActive: boolean) => {
    try {
      setError(null);
      
      const response = await fetch(`/api/teacher/classes/${classId}/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !isActive }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update class status');
      }
      
      const result = await response.json();
      
      if (result.success) {
        await fetchClasses(); // Refresh the list
      } else {
        throw new Error(result.error || 'Failed to update class status');
      }
    } catch (err) {
      console.error('Error updating class status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update class status');
    }
  };

  if (loading && classes.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading classes...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Class Management</h2>
          <p className="text-gray-600">Manage your classes and share join codes with students</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Class
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Create Class Form */}
      {showCreateForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Class</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Class Name *
              </label>
              <input
                type="text"
                value={newClass.name}
                onChange={(e) => setNewClass(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., English Literature 101"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject *
              </label>
              <input
                type="text"
                value={newClass.subject}
                onChange={(e) => setNewClass(prev => ({ ...prev, subject: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., English"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grade Level *
              </label>
              <input
                type="text"
                value={newClass.gradeLevel}
                onChange={(e) => setNewClass(prev => ({ ...prev, gradeLevel: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Grade 5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Students
              </label>
              <input
                type="number"
                value={newClass.maxStudents}
                onChange={(e) => setNewClass(prev => ({ ...prev, maxStudents: parseInt(e.target.value) || 30 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
                max="50"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={newClass.description}
                onChange={(e) => setNewClass(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Brief description of the class..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={createClass}
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
                  Create Class
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}

      {/* Classes List */}
      <div className="space-y-4">
        {classes.length > 0 ? (
          classes.map((classItem) => (
            <motion.div
              key={classItem.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex-grow">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900">{classItem.name}</h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleClassStatus(classItem.id, classItem.isActive)}
                        className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                          classItem.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {classItem.isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        {classItem.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    {classItem.subject} • {classItem.gradeLevel}
                  </p>
                  {classItem.description && (
                    <p className="text-sm text-gray-500 mt-1">{classItem.description}</p>
                  )}
                </div>
                
                {/* Class Code Section */}
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Class Code</p>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-mono font-bold text-blue-600 tracking-wider">
                        {classItem.code}
                      </span>
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => copyToClipboard(classItem.code)}
                          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                          title="Copy code"
                        >
                          {copiedCode === classItem.code ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => regenerateCode(classItem.id)}
                          disabled={regeneratingCode === classItem.id}
                          className="p-1 text-gray-400 hover:text-gray-600 transition-colors disabled:animate-spin"
                          title="Regenerate code"
                        >
                          <RefreshCw className={`w-4 h-4 ${regeneratingCode === classItem.id ? 'animate-spin' : ''}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Class Stats */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>{classItem.studentCount}/{classItem.maxStudents} students</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>Created {new Date(classItem.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    classItem.studentCount / classItem.maxStudents > 0.8 
                      ? 'bg-red-500' 
                      : classItem.studentCount / classItem.maxStudents > 0.6
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`} />
                  <span className="text-xs text-gray-500">
                    {Math.round((classItem.studentCount / classItem.maxStudents) * 100)}% full
                  </span>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-12">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No classes yet</h3>
            <p className="text-gray-600 mb-4">Create your first class to get started</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Your First Class
            </button>
          </div>
        )}
      </div>
    </div>
  );
}