'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Heart, 
  Users, 
  Globe, 
  Award, 
  CheckCircle,
  Clock,
  TrendingUp,
  BookOpen,
  Palette,
  Languages,
  Star,
  Search,
  ChevronRight
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { UserRole } from '@prisma/client';

interface Project {
  id: string;
  title: string;
  type: 'translation' | 'illustration' | 'teaching' | 'review';
  status: 'available' | 'in_progress' | 'completed';
  deadline?: string;
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
  languages?: string[];
  description: string;
}

const mockProjects: Project[] = [
  {
    id: '1',
    title: 'Translate "The Magic Garden" to Spanish',
    type: 'translation',
    status: 'available',
    deadline: '2024-02-15',
    points: 50,
    difficulty: 'medium',
    languages: ['English', 'Spanish'],
    description: 'Help us reach Spanish-speaking children by translating this beloved story.'
  },
  {
    id: '2',
    title: 'Illustrate "Ocean Adventures" Chapter 3',
    type: 'illustration',
    status: 'available',
    deadline: '2024-02-20',
    points: 75,
    difficulty: 'hard',
    description: 'Create 5 illustrations for Chapter 3 depicting underwater scenes.'
  },
  {
    id: '3',
    title: 'Review Korean translations for accuracy',
    type: 'review',
    status: 'in_progress',
    points: 30,
    difficulty: 'easy',
    languages: ['Korean'],
    description: 'Review and verify Korean translations for cultural appropriateness.'
  },
  {
    id: '4',
    title: 'Teach reading session for beginners',
    type: 'teaching',
    status: 'available',
    deadline: '2024-02-10',
    points: 60,
    difficulty: 'medium',
    description: 'Conduct a 1-hour online reading session for beginner learners.'
  }
];

export default function VolunteerDashboard() {
  const { data: session, status } = useSession();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [projects, setProjects] = useState(mockProjects);

  // Redirect if not logged in or not a volunteer
  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!session || session.user.role !== UserRole.VOLUNTEER) {
    redirect('/dashboard');
  }

  const stats = {
    totalHours: 156,
    projectsCompleted: 23,
    peopleHelped: 1234,
    currentStreak: 15,
    totalPoints: 2450,
    rank: 'Gold Contributor'
  };

  const achievements = [
    { name: 'First Project', icon: Award, earned: true, description: 'Complete your first project' },
    { name: 'Translator Pro', icon: Languages, earned: true, description: 'Translate 10 stories' },
    { name: 'Artist Star', icon: Palette, earned: false, description: 'Illustrate 5 stories' },
    { name: 'Teaching Hero', icon: Users, earned: false, description: 'Teach 20 sessions' }
  ];

  const projectTypeIcons = {
    translation: Languages,
    illustration: Palette,
    teaching: Users,
    review: CheckCircle
  };

  const projectTypeColors = {
    translation: 'bg-blue-100 text-blue-800',
    illustration: 'bg-purple-100 text-purple-800',
    teaching: 'bg-green-100 text-green-800',
    review: 'bg-yellow-100 text-yellow-800'
  };

  const filteredProjects = projects.filter(project => {
    if (selectedFilter !== 'all' && project.type !== selectedFilter) return false;
    if (searchTerm && !project.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const acceptProject = (projectId: string) => {
    setProjects(prev => prev.map(p => 
      p.id === projectId ? { ...p, status: 'in_progress' as const } : p
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-2xl font-bold text-gray-900">Volunteer Hub</h1>
            <p className="text-sm text-gray-600 mt-1">
              Welcome back, {session.user.name || 'Volunteer'}! Thank you for making a difference.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <span className="text-xs text-green-600">+12h</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalHours}</p>
            <p className="text-xs text-gray-600">Hours Contributed</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-sm p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-xs text-green-600">+2</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.projectsCompleted}</p>
            <p className="text-xs text-gray-600">Projects Done</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-sm p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <Users className="w-5 h-5 text-purple-600" />
              <span className="text-xs text-green-600">+156</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.peopleHelped.toLocaleString()}</p>
            <p className="text-xs text-gray-600">People Helped</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow-sm p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-5 h-5 text-pink-600" />
              <span className="text-xs text-green-600">Active</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.currentStreak}</p>
            <p className="text-xs text-gray-600">Day Streak</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-lg shadow-sm p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <Star className="w-5 h-5 text-yellow-600" />
              <span className="text-xs text-green-600">+250</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalPoints.toLocaleString()}</p>
            <p className="text-xs text-gray-600">Total Points</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-lg shadow-sm p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <Award className="w-5 h-5 text-yellow-500" />
            </div>
            <p className="text-sm font-bold text-gray-900">{stats.rank}</p>
            <p className="text-xs text-gray-600">Current Rank</p>
          </motion.div>
        </div>

        {/* Available Projects Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Available Projects</h2>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="translation">Translation</option>
                <option value="illustration">Illustration</option>
                <option value="teaching">Teaching</option>
                <option value="review">Review</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => {
              const Icon = projectTypeIcons[project.type];
              const colorClass = projectTypeColors[project.type];
              
              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${colorClass}`}>
                        <Icon className="w-4 h-4" />
                        {project.type.charAt(0).toUpperCase() + project.type.slice(1)}
                      </div>
                      {project.status === 'in_progress' && (
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                          In Progress
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{project.title}</h3>
                    <p className="text-sm text-gray-600 mb-4">{project.description}</p>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Points:</span>
                        <span className="font-medium text-gray-900">{project.points}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Difficulty:</span>
                        <span className={`font-medium ${
                          project.difficulty === 'easy' ? 'text-green-600' :
                          project.difficulty === 'medium' ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {project.difficulty.charAt(0).toUpperCase() + project.difficulty.slice(1)}
                        </span>
                      </div>
                      {project.deadline && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Deadline:</span>
                          <span className="font-medium text-gray-900">
                            {new Date(project.deadline).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {project.languages && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Languages:</span>
                          <span className="font-medium text-gray-900">
                            {project.languages.join(' → ')}
                          </span>
                        </div>
                      )}
                    </div>

                    {project.status === 'available' ? (
                      <button
                        onClick={() => acceptProject(project.id)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Accept Project
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button className="w-full px-4 py-2 bg-gray-100 text-gray-600 rounded-lg cursor-not-allowed">
                        Already Accepted
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Achievements Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Your Achievements</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {achievements.map((achievement) => (
              <div
                key={achievement.name}
                className={`p-4 rounded-lg border-2 ${
                  achievement.earned 
                    ? 'border-yellow-400 bg-yellow-50' 
                    : 'border-gray-200 bg-gray-50 opacity-50'
                }`}
              >
                <achievement.icon className={`w-8 h-8 mb-2 ${
                  achievement.earned ? 'text-yellow-600' : 'text-gray-400'
                }`} />
                <h3 className="font-semibold text-sm text-gray-900">{achievement.name}</h3>
                <p className="text-xs text-gray-600 mt-1">{achievement.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Community Impact */}
        <div className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-8 text-white">
          <h2 className="text-2xl font-bold mb-4">Your Community Impact</h2>
          <p className="text-lg mb-6">
            Through your volunteer work, you&apos;ve helped make education accessible to children worldwide. 
            Your contributions have directly impacted {stats.peopleHelped} learners!
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
              <Globe className="w-8 h-8 mb-2" />
              <p className="font-semibold">12 Countries Reached</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
              <BookOpen className="w-8 h-8 mb-2" />
              <p className="font-semibold">23 Stories Shared</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
              <Heart className="w-8 h-8 mb-2" />
              <p className="font-semibold">156 Hours Given</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}