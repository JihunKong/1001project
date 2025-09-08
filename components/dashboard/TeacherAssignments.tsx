'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ClipboardList, 
  CheckCircle, 
  Clock,
  AlertCircle,
  ChevronRight,
  BookOpen,
  PenTool,
  MessageSquare
} from 'lucide-react';
import Link from 'next/link';

interface Assignment {
  id: string;
  title: string;
  description: string;
  type: 'reading' | 'quiz' | 'writing' | 'discussion';
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  bookId?: string;
  bookTitle?: string;
  progress?: number;
  teacherName: string;
}

export default function TeacherAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const response = await fetch('/api/learn/assignments');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setAssignments(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'reading':
        return BookOpen;
      case 'quiz':
        return CheckCircle;
      case 'writing':
        return PenTool;
      case 'discussion':
        return MessageSquare;
      default:
        return ClipboardList;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'in_progress':
        return 'text-blue-600 bg-blue-50';
      case 'overdue':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-yellow-600 bg-yellow-50';
    }
  };

  const formatDueDate = (date: string) => {
    const dueDate = new Date(date);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Due Today';
    if (diffDays === 1) return 'Due Tomorrow';
    return `Due in ${diffDays} days`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-100 rounded"></div>
            <div className="h-20 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Use actual assignments from API, no fallback data
  const displayAssignments = assignments;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-white rounded-xl shadow-sm border border-gray-100"
    >
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ClipboardList className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Teacher Assignments
            </h2>
          </div>
          <span className="text-sm text-gray-500">
            {displayAssignments.filter(a => a.status === 'pending').length} pending
          </span>
        </div>
      </div>
      
      <div className="p-6">
        <div className="space-y-4">
          {displayAssignments.map((assignment, index) => {
            const TypeIcon = getTypeIcon(assignment.type);
            return (
              <motion.div
                key={assignment.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className="flex items-start space-x-4 p-4 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
              >
                <div className={`p-2 rounded-lg ${getStatusColor(assignment.status)}`}>
                  <TypeIcon className="w-5 h-5" />
                </div>
                
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{assignment.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{assignment.description}</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className="text-xs text-gray-500">
                      From: {assignment.teacherName}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatDueDate(assignment.dueDate)}
                    </span>
                  </div>
                  {assignment.progress !== undefined && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-blue-600 h-full rounded-full"
                          style={{ width: `${assignment.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                <Link
                  href={assignment.bookId ? `/books/${assignment.bookId}/read` : `/learn/assignments/${assignment.id}`}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </Link>
              </motion.div>
            );
          })}
        </div>
        
        {displayAssignments.length === 0 && (
          <div className="text-center py-8">
            <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No assignments yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Your teacher will assign tasks here
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}