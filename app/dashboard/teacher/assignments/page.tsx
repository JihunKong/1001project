'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import {
  DashboardHeader,
  DashboardStatsCard,
  DashboardSection,
  DashboardLoadingState,
  DashboardErrorState,
  DashboardEmptyState
} from '@/components/dashboard';
import { ClipboardList, BookOpen, Users, Clock, Plus } from 'lucide-react';

interface Assignment {
  id: string;
  title: string;
  book: { title: string; authorName: string };
  class: { name: string };
  dueDate: string;
  status: string;
  submissionCount: number;
  totalStudents: number;
}

export default function TeacherAssignmentsPage() {
  const { data: session, status } = useSession();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      redirect('/login');
      return;
    }
    if (session.user?.role !== 'TEACHER') {
      redirect('/dashboard');
      return;
    }

    fetchAssignments();
  }, [session, status]);

  const fetchAssignments = async () => {
    try {
      setAssignments([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return <DashboardLoadingState message="Loading assignments..." />;
  }

  if (error) {
    return <DashboardErrorState error={error} onRetry={fetchAssignments} />;
  }

  const activeAssignments = assignments.filter(a => new Date(a.dueDate) > new Date());
  const uniqueBooks = new Set(assignments.map(a => a.book?.title)).size;
  const totalStudents = assignments.reduce((acc, a) => acc + (a.totalStudents || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <DashboardHeader
          title="Book Assignments"
          subtitle="Manage reading assignments for your classes"
          icon={ClipboardList}
          iconColor="from-emerald-500 to-emerald-600"
          actions={
            <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors">
              <Plus className="w-4 h-4" />
              Assign Book
            </button>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <DashboardStatsCard
            title="Total Assignments"
            value={assignments.length}
            icon={ClipboardList}
            iconColor="emerald"
          />
          <DashboardStatsCard
            title="Active"
            value={activeAssignments.length}
            icon={Clock}
            iconColor="blue"
          />
          <DashboardStatsCard
            title="Books Used"
            value={uniqueBooks}
            icon={BookOpen}
            iconColor="purple"
          />
          <DashboardStatsCard
            title="Students Assigned"
            value={totalStudents}
            icon={Users}
            iconColor="orange"
          />
        </div>

        <DashboardSection title="All Assignments" icon={ClipboardList}>
          {assignments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-3 px-4 font-medium text-gray-600">Title</th>
                    <th className="py-3 px-4 font-medium text-gray-600">Book</th>
                    <th className="py-3 px-4 font-medium text-gray-600">Class</th>
                    <th className="py-3 px-4 font-medium text-gray-600">Due Date</th>
                    <th className="py-3 px-4 font-medium text-gray-600">Submissions</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((assignment) => (
                    <tr key={assignment.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{assignment.title}</td>
                      <td className="py-3 px-4">{assignment.book?.title}</td>
                      <td className="py-3 px-4">{assignment.class?.name}</td>
                      <td className="py-3 px-4">
                        {new Date(assignment.dueDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        {assignment.submissionCount}/{assignment.totalStudents}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <DashboardEmptyState
              icon={ClipboardList}
              title="No assignments yet"
              description="Create your first book assignment for your classes"
              action={
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  Assign Book
                </button>
              }
            />
          )}
        </DashboardSection>
      </div>
    </div>
  );
}
