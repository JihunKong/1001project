'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function TeacherDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login?callbackUrl=/programs/english-education/teacher');
    }
    // Check if user is actually a teacher
    if (session && session.user?.role !== 'TEACHER' && session.user?.role !== 'ADMIN') {
      router.push('/programs/english-education');
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session || (session.user?.role !== 'TEACHER' && session.user?.role !== 'ADMIN')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  Teacher Dashboard
                </h1>
                <p className="text-gray-600">
                  Welcome, {session.user?.name || 'Teacher'}!
                </p>
              </div>
              <Link href="/programs/english-education" 
                className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Link>
            </div>

            {/* Navigation Tabs */}
            <div className="mt-6 border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'overview'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('classes')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'classes'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  My Classes
                </button>
                <button
                  onClick={() => setActiveTab('materials')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'materials'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Materials Library
                </button>
                <button
                  onClick={() => setActiveTab('assignments')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'assignments'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Assignments
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'analytics'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Analytics
                </button>
              </nav>
            </div>
          </div>

          {/* Content Area */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            {activeTab === 'overview' && (
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">Dashboard Overview</h2>
                
                {/* Stats Cards */}
                <div className="grid md:grid-cols-4 gap-6 mb-8">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-blue-600 text-3xl font-bold">3</div>
                    <div className="text-gray-600">Active Classes</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-green-600 text-3xl font-bold">45</div>
                    <div className="text-gray-600">Total Students</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="text-purple-600 text-3xl font-bold">12</div>
                    <div className="text-gray-600">Active Assignments</div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4">
                    <div className="text-orange-600 text-3xl font-bold">89%</div>
                    <div className="text-gray-600">Avg. Completion</div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                      <button className="w-full text-left px-4 py-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                        <div className="flex items-center">
                          <svg className="w-5 h-5 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          <span>Create New Assignment</span>
                        </div>
                      </button>
                      <button className="w-full text-left px-4 py-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                        <div className="flex items-center">
                          <svg className="w-5 h-5 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <span>Upload Reading Material</span>
                        </div>
                      </button>
                      <button className="w-full text-left px-4 py-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                        <div className="flex items-center">
                          <svg className="w-5 h-5 text-purple-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          <span>View Class Analytics</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                        <span className="text-gray-600">Sarah completed "Chapter 3 Quiz"</span>
                        <span className="ml-auto text-gray-400">10m ago</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                        <span className="text-gray-600">New submission: "Essay Assignment"</span>
                        <span className="ml-auto text-gray-400">1h ago</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                        <span className="text-gray-600">5 students joined Class B</span>
                        <span className="ml-auto text-gray-400">3h ago</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'classes' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold text-gray-800">My Classes</h2>
                  <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                    + Create New Class
                  </button>
                </div>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    { name: 'Beginner English A', students: 15, level: 'Beginner', active: true },
                    { name: 'Intermediate B', students: 18, level: 'Intermediate', active: true },
                    { name: 'Advanced Reading', students: 12, level: 'Advanced', active: true },
                  ].map((cls, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="font-semibold text-gray-800">{cls.name}</h3>
                        <span className={`px-2 py-1 text-xs rounded ${
                          cls.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {cls.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mb-4">
                        <p>Level: {cls.level}</p>
                        <p>{cls.students} Students</p>
                      </div>
                      <div className="flex space-x-2">
                        <button className="flex-1 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm">
                          View
                        </button>
                        <button className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm">
                          Manage
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'materials' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold text-gray-800">Reading Materials Library</h2>
                  <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                    + Upload PDF
                  </button>
                </div>
                
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Title
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Level
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {[
                        { title: 'The Little Prince', level: 'Intermediate', type: 'Novel', status: 'Processed' },
                        { title: 'Short Stories Collection', level: 'Beginner', type: 'Stories', status: 'Processed' },
                        { title: 'Science Articles', level: 'Advanced', type: 'Non-fiction', status: 'Processing' },
                      ].map((material, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {material.title}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {material.level}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {material.type}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              material.status === 'Processed' 
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {material.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button className="text-blue-600 hover:text-blue-900 mr-3">View</button>
                            <button className="text-green-600 hover:text-green-900 mr-3">Assign</button>
                            <button className="text-red-600 hover:text-red-900">Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    💡 Upload PDFs to automatically process them with AI for different reading levels. 
                    The system will extract text and generate age-appropriate adaptations.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'assignments' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold text-gray-800">Assignments</h2>
                  <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                    + Create Assignment
                  </button>
                </div>
                
                <div className="space-y-4">
                  {[
                    { title: 'Chapter 5 Vocabulary Quiz', class: 'Beginner A', dueDate: '2024-09-10', submissions: '12/15' },
                    { title: 'Reading Comprehension Test', class: 'Intermediate B', dueDate: '2024-09-08', submissions: '18/18' },
                    { title: 'Essay: Character Analysis', class: 'Advanced', dueDate: '2024-09-15', submissions: '5/12' },
                  ].map((assignment, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-800">{assignment.title}</h3>
                          <p className="text-sm text-gray-500">Class: {assignment.class} | Due: {assignment.dueDate}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600 mb-2">
                            Submissions: {assignment.submissions}
                          </div>
                          <div className="space-x-2">
                            <button className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors">
                              Review
                            </button>
                            <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition-colors">
                              Edit
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">Class Analytics</h2>
                
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="border border-gray-200 rounded-lg p-6">
                    <h3 className="font-semibold text-gray-800 mb-4">Student Progress Overview</h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Average Reading Level</span>
                          <span className="font-medium">Intermediate</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Assignment Completion Rate</span>
                          <span className="font-medium text-gray-900">89%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full" style={{ width: '89%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Average Quiz Score</span>
                          <span className="font-medium text-gray-900">78%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-purple-500 h-2 rounded-full" style={{ width: '78%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-6">
                    <h3 className="font-semibold text-gray-800 mb-4">Top Performing Students</h3>
                    <div className="space-y-2">
                      {[
                        { name: 'Sarah Johnson', score: 95 },
                        { name: 'Michael Chen', score: 92 },
                        { name: 'Emily Davis', score: 88 },
                        { name: 'James Wilson', score: 85 },
                      ].map((student, index) => (
                        <div key={index} className="flex justify-between items-center py-2">
                          <span className="text-sm text-gray-700">{student.name}</span>
                          <span className="text-sm font-medium text-green-600">{student.score}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-800 mb-4">Vocabulary Progress</h3>
                  <div className="h-64 bg-gray-50 rounded flex items-center justify-center text-gray-400">
                    Chart Visualization Coming Soon
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}