'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Clock,
  Flame,
  Target,
  Users,
  BookOpen,
  Award,
  BarChart3,
  Calendar,
  Filter,
  Download,
  User,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  Star,
  Trophy,
  Activity
} from 'lucide-react';

interface StudentKPI {
  studentId: string;
  studentName: string;
  className: string;
  readingStreak: number; // 연속 읽기일 (consecutive days)
  avgSessionLength: number; // 평균 세션 길이 (minutes)
  difficultyProgression: number; // 난이도 변화 (0-100 scale)
  lastActive: string;
  booksCompleted: number;
  currentLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  weeklyProgress: {
    week: string;
    readingDays: number;
    avgSession: number;
    progressPoints: number;
  }[];
}

interface ClassKPI {
  classId: string;
  className: string;
  studentCount: number;
  avgReadingStreak: number;
  avgSessionLength: number;
  avgDifficultyProgression: number;
  activeStudents: number;
  topPerformers: {
    name: string;
    metric: string;
    value: number;
  }[];
}

interface OverallKPI {
  totalStudents: number;
  totalActiveStudents: number;
  overallAvgStreak: number;
  overallAvgSession: number;
  overallAvgProgression: number;
  trendData: {
    week: string;
    avgStreak: number;
    avgSession: number;
    avgProgression: number;
  }[];
}

export default function ProgressTracker() {
  const [studentKPIs, setStudentKPIs] = useState<StudentKPI[]>([]);
  const [classKPIs, setClassKPIs] = useState<ClassKPI[]>([]);
  const [overallKPI, setOverallKPI] = useState<OverallKPI | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [timeFrame, setTimeFrame] = useState<'week' | 'month' | 'quarter'>('month');
  const [sortBy, setSortBy] = useState<'streak' | 'session' | 'progression'>('streak');
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);

  useEffect(() => {
    fetchKPIData();
  }, [timeFrame, selectedClass]);

  const fetchKPIData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/teacher/progress/kpi?timeFrame=${timeFrame}&classId=${selectedClass}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch KPI data');
      }
      
      const result = await response.json();
      
      if (result.success) {
        setStudentKPIs(result.data.studentKPIs || []);
        setClassKPIs(result.data.classKPIs || []);
        setOverallKPI(result.data.overallKPI || null);
      } else {
        throw new Error(result.error || 'Failed to load KPI data');
      }
    } catch (err) {
      console.error('Error fetching KPI data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load KPI data');
    } finally {
      setLoading(false);
    }
  };

  const exportKPIData = () => {
    const csvData = [
      ['Student Name', 'Class', 'Reading Streak (days)', 'Avg Session (min)', 'Difficulty Progression', 'Books Completed', 'Current Level', 'Last Active'],
      ...studentKPIs.map(student => [
        student.studentName,
        student.className,
        student.readingStreak.toString(),
        student.avgSessionLength.toString(),
        student.difficultyProgression.toString(),
        student.booksCompleted.toString(),
        student.currentLevel,
        new Date(student.lastActive).toLocaleDateString()
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `student_kpi_${timeFrame}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getSortedStudents = () => {
    return [...studentKPIs].sort((a, b) => {
      switch (sortBy) {
        case 'streak':
          return b.readingStreak - a.readingStreak;
        case 'session':
          return b.avgSessionLength - a.avgSessionLength;
        case 'progression':
          return b.difficultyProgression - a.difficultyProgression;
        default:
          return 0;
      }
    });
  };

  const getKPIColor = (value: number, type: 'streak' | 'session' | 'progression') => {
    switch (type) {
      case 'streak':
        return value >= 7 ? 'text-green-600' : value >= 3 ? 'text-yellow-600' : 'text-red-600';
      case 'session':
        return value >= 20 ? 'text-green-600' : value >= 10 ? 'text-yellow-600' : 'text-red-600';
      case 'progression':
        return value >= 70 ? 'text-green-600' : value >= 40 ? 'text-yellow-600' : 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getProgressionBadge = (value: number) => {
    if (value >= 80) return { label: 'Excellent', color: 'bg-green-100 text-green-800' };
    if (value >= 60) return { label: 'Good', color: 'bg-blue-100 text-blue-800' };
    if (value >= 40) return { label: 'Fair', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'Needs Support', color: 'bg-red-100 text-red-800' };
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading progress data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Progress Tracking Dashboard</h2>
            <p className="text-gray-600">Monitor the three key learning indicators from your students</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={timeFrame}
              onChange={(e) => setTimeFrame(e.target.value as 'week' | 'month' | 'quarter')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="week">Past Week</option>
              <option value="month">Past Month</option>
              <option value="quarter">Past Quarter</option>
            </select>
            <button
              onClick={exportKPIData}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Overall KPI Cards */}
        {overallKPI && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-lg border border-orange-200"
            >
              <div className="flex items-center justify-between mb-2">
                <Flame className="w-8 h-8 text-orange-600" />
                <span className="text-2xl font-bold text-orange-900">
                  {overallKPI.overallAvgStreak.toFixed(1)}
                </span>
              </div>
              <h3 className="font-semibold text-orange-900">연속 읽기일</h3>
              <p className="text-sm text-orange-700">Reading Streak (days)</p>
              <div className="mt-2 text-xs text-orange-600">
                {overallKPI.totalActiveStudents} active students
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200"
            >
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-8 h-8 text-blue-600" />
                <span className="text-2xl font-bold text-blue-900">
                  {overallKPI.overallAvgSession.toFixed(1)}m
                </span>
              </div>
              <h3 className="font-semibold text-blue-900">평균 세션 길이</h3>
              <p className="text-sm text-blue-700">Avg Session Length</p>
              <div className="mt-2 text-xs text-blue-600">
                Per reading session
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200"
            >
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-8 h-8 text-green-600" />
                <span className="text-2xl font-bold text-green-900">
                  {overallKPI.overallAvgProgression.toFixed(1)}%
                </span>
              </div>
              <h3 className="font-semibold text-green-900">난이도 변화</h3>
              <p className="text-sm text-green-700">Difficulty Progression</p>
              <div className="mt-2 text-xs text-green-600">
                Reading level advancement
              </div>
            </motion.div>
          </div>
        )}
      </div>

      {/* Class Performance Overview */}
      {classKPIs.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Class Performance Overview</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {classKPIs.map((classKPI, index) => (
              <motion.div
                key={classKPI.classId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">{classKPI.className}</h4>
                  <span className="text-sm text-gray-600">{classKPI.studentCount} students</span>
                </div>
                
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-orange-50 p-2 rounded">
                    <div className={`text-lg font-bold ${getKPIColor(classKPI.avgReadingStreak, 'streak')}`}>
                      {classKPI.avgReadingStreak.toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-600">Avg Streak</div>
                  </div>
                  <div className="bg-blue-50 p-2 rounded">
                    <div className={`text-lg font-bold ${getKPIColor(classKPI.avgSessionLength, 'session')}`}>
                      {classKPI.avgSessionLength.toFixed(1)}m
                    </div>
                    <div className="text-xs text-gray-600">Avg Session</div>
                  </div>
                  <div className="bg-green-50 p-2 rounded">
                    <div className={`text-lg font-bold ${getKPIColor(classKPI.avgDifficultyProgression, 'progression')}`}>
                      {classKPI.avgDifficultyProgression.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-600">Progression</div>
                  </div>
                </div>

                {classKPI.topPerformers.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="text-xs text-gray-600 mb-1">Top Performers:</div>
                    <div className="space-y-1">
                      {classKPI.topPerformers.slice(0, 2).map((performer, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <span className="text-gray-700">{performer.name}</span>
                          <span className="font-medium text-blue-600">
                            {performer.metric}: {performer.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Individual Student KPIs */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Individual Student Progress</h3>
          <div className="flex items-center gap-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'streak' | 'session' | 'progression')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="streak">Sort by Reading Streak</option>
              <option value="session">Sort by Session Length</option>
              <option value="progression">Sort by Progression</option>
            </select>
          </div>
        </div>

        <div className="space-y-3">
          {getSortedStudents().map((student, index) => {
            const progressionBadge = getProgressionBadge(student.difficultyProgression);
            
            return (
              <motion.div
                key={student.studentId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-gray-600" />
                    <div>
                      <h4 className="font-semibold text-gray-900">{student.studentName}</h4>
                      <p className="text-sm text-gray-600">{student.className}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${progressionBadge.color}`}>
                      {progressionBadge.label}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => setExpandedStudent(
                      expandedStudent === student.studentId ? null : student.studentId
                    )}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    {expandedStudent === student.studentId ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>
                
                {/* KPI Row */}
                <div className="grid grid-cols-3 gap-4 mb-2">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Flame className="w-4 h-4 text-orange-500" />
                      <span className={`text-lg font-bold ${getKPIColor(student.readingStreak, 'streak')}`}>
                        {student.readingStreak}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600">days streak</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Clock className="w-4 h-4 text-blue-500" />
                      <span className={`text-lg font-bold ${getKPIColor(student.avgSessionLength, 'session')}`}>
                        {student.avgSessionLength.toFixed(1)}m
                      </span>
                    </div>
                    <div className="text-xs text-gray-600">avg session</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span className={`text-lg font-bold ${getKPIColor(student.difficultyProgression, 'progression')}`}>
                        {student.difficultyProgression.toFixed(1)}%
                      </span>
                    </div>
                    <div className="text-xs text-gray-600">progression</div>
                  </div>
                </div>
                
                {/* Additional Info */}
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center gap-4">
                    <span>{student.booksCompleted} books completed</span>
                    <span>Level: {student.currentLevel}</span>
                  </div>
                  <span>Last active: {new Date(student.lastActive).toLocaleDateString()}</span>
                </div>
                
                {/* Expanded Details */}
                {expandedStudent === student.studentId && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 pt-4 border-t border-gray-100"
                  >
                    <h5 className="font-medium text-gray-900 mb-3">Weekly Progress Trend</h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {student.weeklyProgress.slice(-3).map((week, idx) => (
                        <div key={idx} className="bg-gray-50 p-3 rounded">
                          <div className="text-sm font-medium text-gray-900 mb-2">
                            Week of {week.week}
                          </div>
                          <div className="space-y-1 text-xs text-gray-600">
                            <div>Reading days: {week.readingDays}/7</div>
                            <div>Avg session: {week.avgSession.toFixed(1)}m</div>
                            <div>Progress points: {week.progressPoints}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
        
        {studentKPIs.length === 0 && (
          <div className="text-center py-12">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No progress data available</h3>
            <p className="text-gray-600">
              Progress data will appear here once students start reading and completing assignments.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}