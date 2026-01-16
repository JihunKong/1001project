'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import {
  Users,
  BookOpen,
  Plus,
  Calendar,
  TrendingUp,
  CheckCircle,
  Clock,
  Award,
  Settings,
  MessageSquare,
  BarChart3,
  GraduationCap,
  Target,
  BookMarked,
  Star,
  Sparkles,
} from 'lucide-react';
import {
  DashboardLoadingState,
  DashboardErrorState,
  DashboardStatsCard,
  DashboardHeader,
  DashboardSection,
  DashboardProgressBar,
  DashboardEmptyState,
  DashboardTable,
  type Column
} from '@/components/dashboard';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface Class {
  id: string;
  code: string;
  name: string;
  subject: string;
  gradeLevel: string;
  studentCount: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

interface StudentProgress {
  id: string;
  name: string;
  booksAssigned: number;
  booksCompleted: number;
  averageProgress: number;
  lastActivity: string;
  readingStreak: number;
}

interface Assignment {
  id: string;
  title: string;
  book: {
    title: string;
    authorName: string;
  };
  className: string;
  dueDate: string;
  completionRate: number;
  studentsCompleted: number;
  totalStudents: number;
}

interface Stats {
  totalStudents: number;
  activeClasses: number;
  booksAssigned: number;
  averageClassProgress: number;
  totalReadingHours: number;
  completedAssignments: number;
}

interface VocabularyStudentStats {
  id: string;
  name: string;
  email: string;
  totalWords: number;
  avgMasteryLevel: number;
  masteredWords: number;
  wordsThisWeek: number;
}

interface VocabularySummary {
  totalStudents: number;
  totalWords: number;
  avgWordsPerStudent: number;
  avgMasteryLevel: number;
  topLearners: {
    id: string;
    name: string;
    totalWords: number;
    masteredWords: number;
  }[];
}

export default function TeacherDashboard() {
  const { t } = useTranslation();
  const { data: session, status } = useSession();
  const [classes, setClasses] = useState<Class[]>([]);
  const [recentProgress, setRecentProgress] = useState<StudentProgress[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [vocabularyStats, setVocabularyStats] = useState<VocabularyStudentStats[]>([]);
  const [vocabularySummary, setVocabularySummary] = useState<VocabularySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated or not a teacher
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      redirect('/login');
    }
    if (session.user?.role !== 'TEACHER') {
      redirect('/dashboard');
    }
  }, [session, status]);

  // Fetch dashboard data
  const fetchData = async () => {
    try {
      // These APIs would need to be implemented
      // For now, using mock data since APIs don't exist yet
      setClasses([
        {
          id: '1',
          code: 'ENG5A1',
          name: 'English Literature 5A',
          subject: 'English',
          gradeLevel: '5th Grade',
          studentCount: 28,
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
          isActive: true
        },
        {
          id: '2',
          code: 'ENG5B2',
          name: 'English Literature 5B',
          subject: 'English',
          gradeLevel: '5th Grade',
          studentCount: 25,
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
          isActive: true
        }
      ]);

      setRecentProgress([
        {
          id: '1',
          name: 'Alice Johnson',
          booksAssigned: 5,
          booksCompleted: 3,
          averageProgress: 78,
          lastActivity: new Date().toISOString(),
          readingStreak: 12
        },
        {
          id: '2',
          name: 'Bob Smith',
          booksAssigned: 5,
          booksCompleted: 4,
          averageProgress: 92,
          lastActivity: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          readingStreak: 8
        }
      ]);

      setAssignments([
        {
          id: '1',
          title: 'Read Chapters 1-3',
          book: { title: 'The Amazing Journey', authorName: 'Young Author' },
          className: 'English Literature 5A',
          dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          completionRate: 75,
          studentsCompleted: 21,
          totalStudents: 28
        }
      ]);

      setStats({
        totalStudents: 53,
        activeClasses: 2,
        booksAssigned: 15,
        averageClassProgress: 82,
        totalReadingHours: 2840,
        completedAssignments: 127
      });

      try {
        const vocabRes = await fetch('/api/teacher/vocabulary-stats');
        if (vocabRes.ok) {
          const vocabData = await vocabRes.json();
          setVocabularyStats(vocabData.students || []);
          setVocabularySummary(vocabData.summary || null);
        }
      } catch (vocabError) {
        console.error('Error fetching vocabulary stats:', vocabError);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.role === 'TEACHER') {
      fetchData();
    }
  }, [session]);

  if (status === 'loading' || loading) {
    return <DashboardLoadingState message={t('dashboard.common.loading')} />;
  }

  if (error) {
    return <DashboardErrorState error={error} onRetry={() => window.location.reload()} />;
  }

  const headerActions = (
    <>
      <button className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500">
        <Plus className="h-5 w-5" />
        {t('dashboard.teacher.createClass')}
      </button>
      <button className="w-full sm:w-auto bg-gradient-to-r from-soe-green-400 to-soe-green-500 hover:from-soe-green-500 hover:to-soe-green-600 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 focus:ring-2 focus:ring-offset-2 focus:ring-soe-green-400">
        <BookOpen className="h-5 w-5" />
        {t('dashboard.teacher.assignReading')}
      </button>
    </>
  );

  return (
    <div data-role="teacher" className="min-h-screen bg-gradient-to-br from-gray-50 to-soe-green-50">
      <DashboardHeader
        icon={GraduationCap}
        title={t('dashboard.teacher.title')}
        subtitle={t('dashboard.teacher.welcome', { name: session?.user?.name })}
        iconColor="from-emerald-500 to-emerald-600"
        actions={headerActions}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <DashboardStatsCard
              title={t('dashboard.teacher.stats.totalStudents')}
              value={stats.totalStudents}
              icon={Users}
              iconColor="text-soe-green-600"
              iconBgColor="from-soe-green-400 to-soe-green-500"
              trend={{ value: t('dashboard.teacher.stats.thisMonth'), isPositive: true }}
            />
            <DashboardStatsCard
              title={t('dashboard.teacher.stats.activeClasses')}
              value={stats.activeClasses}
              subValue={t('dashboard.teacher.stats.currentSemester')}
              icon={Calendar}
              iconColor="text-white"
              iconBgColor="from-emerald-500 to-emerald-600"
            />
            <DashboardStatsCard
              title={t('dashboard.teacher.stats.booksAssigned')}
              value={stats.booksAssigned}
              subValue={t('dashboard.teacher.stats.completed', { count: stats.completedAssignments })}
              icon={BookOpen}
              iconColor="text-white"
              iconBgColor="from-purple-500 to-purple-600"
            />
            <DashboardStatsCard
              title={t('dashboard.teacher.stats.avgProgress')}
              value={`${stats.averageClassProgress}%`}
              icon={BarChart3}
              iconColor="text-white"
              iconBgColor="from-orange-500 to-orange-600"
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8">
          <DashboardSection
            title={t('dashboard.teacher.myClasses.title')}
            icon={Users}
            badge={
              <span className="ml-auto bg-soe-green-100 text-soe-green-700 px-2 py-1 text-xs font-medium rounded-full">
                {classes.length} {classes.length === 1 ? t('dashboard.teacher.myClasses.class') : t('dashboard.teacher.myClasses.classes')}
              </span>
            }
            headerBgColor="bg-gradient-to-r from-soe-green-50 to-soe-green-100"
            className="rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-100"
          >
            {classes.length === 0 ? (
              <DashboardEmptyState
                icon={Users}
                iconColor="from-gray-100 to-gray-200"
                title={t('dashboard.teacher.myClasses.empty')}
                description={t('dashboard.teacher.myClasses.emptyDesc')}
                action={
                  <button className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 mx-auto shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500">
                    <Plus className="h-4 w-4" />
                    {t('dashboard.teacher.myClasses.createFirst')}
                  </button>
                }
              />
            ) : (
                <div className="space-y-4">
                  {classes.map((classItem) => (
                    <div key={classItem.id} className="group bg-gradient-to-r from-white to-gray-50 border border-gray-200 hover:border-soe-green-300 rounded-xl p-5 hover:shadow-md transition-all duration-200">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-soe-green-600 transition-colors">
                            {classItem.name}
                          </h3>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="bg-soe-green-100 text-soe-green-700 px-2 py-1 text-xs font-medium rounded-md">
                              {classItem.subject}
                            </span>
                            <span className="bg-purple-100 text-purple-700 px-2 py-1 text-xs font-medium rounded-md">
                              {classItem.gradeLevel}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                            classItem.isActive
                              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                              : 'bg-gray-100 text-gray-600 border border-gray-200'
                          }`}>
                            {classItem.isActive ? t('dashboard.teacher.myClasses.active') : t('dashboard.teacher.myClasses.inactive')}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-gray-600 text-xs mb-1">{t('dashboard.teacher.myClasses.classCode')}</p>
                          <p className="font-mono font-semibold text-lg text-gray-900">{classItem.code}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-gray-600 text-xs mb-1">{t('dashboard.teacher.myClasses.students')}</p>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-gray-500" />
                            <span className="font-semibold text-lg text-gray-900">{classItem.studentCount}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-3 border-t border-gray-100">
                        <button className="flex-1 bg-gradient-to-r from-soe-green-50 to-soe-green-100 hover:from-soe-green-100 hover:to-soe-green-200 text-soe-green-700 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 focus:ring-2 focus:ring-soe-green-400 focus:ring-offset-2">
                          {t('dashboard.teacher.myClasses.viewStudents')}
                        </button>
                        <button className="flex-1 bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 text-purple-700 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2">
                          {t('dashboard.teacher.myClasses.assignBooks')}
                        </button>
                        <button className="bg-gray-100 hover:bg-gray-200 text-gray-600 p-2 rounded-lg transition-all duration-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">
                          <Settings className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </DashboardSection>

          <DashboardSection
            title={t('dashboard.teacher.studentProgress.title')}
            icon={TrendingUp}
            badge={
              <span className="ml-auto bg-emerald-100 text-emerald-700 px-2 py-1 text-xs font-medium rounded-full">
                {t('dashboard.teacher.studentProgress.recentActivity')}
              </span>
            }
            headerBgColor="bg-gradient-to-r from-emerald-50 to-teal-50"
            className="rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-100"
          >
            {recentProgress.length === 0 ? (
              <DashboardEmptyState
                icon={TrendingUp}
                iconColor="from-emerald-100 to-emerald-200"
                title={t('dashboard.teacher.studentProgress.empty')}
                description={t('dashboard.teacher.studentProgress.emptyDesc')}
              />
            ) : (
                <div className="space-y-4">
                  {recentProgress.map((student) => (
                    <div key={student.id} className="group bg-gradient-to-r from-white to-gray-50 border border-gray-200 hover:border-emerald-300 rounded-xl p-5 hover:shadow-md transition-all duration-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-soe-green-400 to-soe-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {student.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors">
                              {student.name}
                            </h3>
                            <p className="text-xs text-gray-500">
                              {t('dashboard.teacher.studentProgress.activeAgo', { days: Math.floor((Date.now() - new Date(student.lastActivity).getTime()) / (1000 * 60 * 60 * 24)) })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-medium">
                            <Award className="h-3 w-3" />
                            {t('dashboard.teacher.studentProgress.dayStreak', { streak: student.readingStreak })}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-gradient-to-br from-soe-green-50 to-soe-green-100 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <CheckCircle className="h-4 w-4 text-soe-green-600" />
                            <p className="text-xs font-medium text-soe-green-700">{t('dashboard.teacher.studentProgress.booksCompleted')}</p>
                          </div>
                          <p className="text-2xl font-bold text-soe-green-900">{student.booksCompleted}<span className="text-sm text-soe-green-600">/{student.booksAssigned}</span></p>
                        </div>
                        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Target className="h-4 w-4 text-emerald-600" />
                            <p className="text-xs font-medium text-emerald-700">{t('dashboard.teacher.studentProgress.avgProgress')}</p>
                          </div>
                          <p className="text-2xl font-bold text-emerald-900">{student.averageProgress}%</p>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-3">
                        <DashboardProgressBar
                          label={t('dashboard.teacher.studentProgress.overallProgress')}
                          value={student.averageProgress}
                          showPercentage
                          colorScheme="custom"
                          customColor="bg-gradient-to-r from-emerald-400 to-emerald-500"
                          height="lg"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </DashboardSection>
        </div>

        {/* Vocabulary Learning Stats */}
        <DashboardSection
          title="Student Vocabulary Progress"
          icon={BookMarked}
          badge={
            vocabularySummary && (
              <span className="ml-auto bg-indigo-100 text-indigo-700 px-2 py-1 text-xs font-medium rounded-full">
                {vocabularySummary.totalWords} words learned
              </span>
            )
          }
          headerBgColor="bg-gradient-to-r from-indigo-50 to-purple-50"
          className="rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-100 mb-8"
        >
          {vocabularySummary && (
            <div className="mb-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-4 text-center">
                  <BookMarked className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-indigo-900">{vocabularySummary.avgWordsPerStudent}</p>
                  <p className="text-xs text-indigo-600">Avg Words/Student</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 text-center">
                  <Star className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-purple-900">{vocabularySummary.avgMasteryLevel}</p>
                  <p className="text-xs text-purple-600">Avg Mastery Level</p>
                </div>
                <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-4 text-center">
                  <Users className="w-6 h-6 text-pink-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-pink-900">{vocabularySummary.totalStudents}</p>
                  <p className="text-xs text-pink-600">Active Learners</p>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 text-center">
                  <Sparkles className="w-6 h-6 text-amber-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-amber-900">{vocabularySummary.totalWords}</p>
                  <p className="text-xs text-amber-600">Total Words</p>
                </div>
              </div>

              {vocabularySummary.topLearners.length > 0 && (
                <div className="bg-gradient-to-r from-gray-50 to-indigo-50 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-500" />
                    Top Vocabulary Learners
                  </h4>
                  <div className="space-y-2">
                    {vocabularySummary.topLearners.map((learner, index) => (
                      <div
                        key={learner.id}
                        className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-100"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            index === 0 ? 'bg-amber-100 text-amber-700' :
                            index === 1 ? 'bg-gray-200 text-gray-700' :
                            index === 2 ? 'bg-orange-100 text-orange-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {index + 1}
                          </div>
                          <span className="font-medium text-gray-900">{learner.name}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="text-right">
                            <span className="font-bold text-indigo-600">{learner.totalWords}</span>
                            <span className="text-gray-500 ml-1">words</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-green-600">{learner.masteredWords}</span>
                            <span className="text-gray-500 ml-1">mastered</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {vocabularyStats.length === 0 ? (
            <DashboardEmptyState
              icon={BookMarked}
              iconColor="from-indigo-100 to-indigo-200"
              title="No vocabulary data yet"
              description="Students will appear here once they start learning words from their readings."
            />
          ) : (
            <div className="space-y-3">
              {vocabularyStats.slice(0, 10).map((student) => (
                <div
                  key={student.id}
                  className="group bg-white border border-gray-200 hover:border-indigo-300 rounded-xl p-4 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {student.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                          {student.name}
                        </h4>
                        <p className="text-xs text-gray-500">{student.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-lg font-bold text-indigo-600">{student.totalWords}</p>
                        <p className="text-xs text-gray-500">Total</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-green-600">{student.masteredWords}</p>
                        <p className="text-xs text-gray-500">Mastered</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-purple-600">{student.wordsThisWeek}</p>
                        <p className="text-xs text-gray-500">This Week</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.round(student.avgMasteryLevel)
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DashboardSection>

        <DashboardSection
          title={t('dashboard.teacher.assignments.title')}
          icon={BookOpen}
          badge={
            <span className="bg-purple-100 text-purple-700 px-2 py-1 text-xs font-medium rounded-full">
              {t('dashboard.teacher.assignments.active', { count: assignments.length })}
            </span>
          }
          actions={
            <button className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1 shadow-sm hover:shadow-md transition-all duration-200">
              <Plus className="h-3 w-3" />
              {t('dashboard.teacher.assignments.newAssignment')}
            </button>
          }
          headerBgColor="bg-gradient-to-r from-purple-50 to-soe-green-100"
          className="rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-100"
          noPadding
        >

          <div className="block lg:hidden p-6">
            {assignments.length === 0 ? (
              <DashboardEmptyState
                icon={BookOpen}
                iconColor="from-purple-100 to-purple-200"
                title={t('dashboard.teacher.assignments.empty')}
                description={t('dashboard.teacher.assignments.emptyDesc')}
              />
            ) : (
              <div className="space-y-4">
                {assignments.map((assignment) => (
                  <div key={assignment.id} className="group bg-gradient-to-r from-white to-purple-50 border border-gray-200 hover:border-purple-300 rounded-xl p-5 hover:shadow-md transition-all duration-200">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm mb-1 group-hover:text-purple-600 transition-colors">
                          {assignment.title}
                        </h3>
                        <p className="text-sm text-gray-700 font-medium truncate">{assignment.book.title}</p>
                        <p className="text-xs text-gray-500">by {assignment.book.authorName}</p>
                      </div>
                      <div className="flex space-x-2 ml-3">
                        <button className="bg-gradient-to-r from-soe-green-50 to-soe-green-100 hover:from-soe-green-100 hover:to-soe-green-200 text-soe-green-700 px-3 py-2 text-xs font-medium rounded-lg transition-all duration-200 focus:ring-2 focus:ring-soe-green-400 focus:ring-offset-2">
                          {t('dashboard.common.actions.viewDetails')}
                        </button>
                        <button className="bg-gradient-to-r from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200 text-emerald-700 p-2 rounded-lg transition-all duration-200 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2">
                          <MessageSquare className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs font-medium text-gray-600 mb-1">{t('dashboard.common.table.class')}</p>
                        <p className="text-sm font-semibold text-gray-900 truncate">{assignment.className}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs font-medium text-gray-600 mb-1">{t('dashboard.common.table.dueDate')}</p>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-gray-500" />
                          <p className="text-sm font-semibold text-gray-900">
                            {new Date(assignment.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-3">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="font-medium text-gray-700">{t('dashboard.teacher.assignments.completionRate')}</span>
                        <span className="font-bold text-gray-900">
                          {assignment.studentsCompleted}/{assignment.totalStudents}
                        </span>
                      </div>
                      <DashboardProgressBar
                        value={assignment.completionRate}
                        showPercentage
                        colorScheme="custom"
                        customColor="bg-gradient-to-r from-purple-400 to-purple-500"
                        height="lg"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Enhanced Desktop view - table layout */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-purple-50 to-soe-green-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    {t('dashboard.teacher.assignments.assignment')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    {t('dashboard.teacher.assignments.bookDetails')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    {t('dashboard.common.table.class')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    {t('dashboard.common.table.dueDate')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    {t('dashboard.teacher.assignments.completionRate')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    {t('dashboard.common.table.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {assignments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12">
                      <DashboardEmptyState
                        icon={BookOpen}
                        iconColor="from-purple-100 to-purple-200"
                        title={t('dashboard.teacher.assignments.tableEmpty')}
                        description={t('dashboard.teacher.assignments.tableEmptyDesc')}
                        action={
                          <button className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-md hover:shadow-lg transition-all duration-200 mx-auto">
                            <Plus className="h-4 w-4" />
                            {t('dashboard.teacher.assignments.createFirst')}
                          </button>
                        }
                      />
                    </td>
                  </tr>
                ) : (
                  assignments.map((assignment) => (
                    <tr key={assignment.id} className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-purple-50 transition-colors duration-200">
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="font-semibold text-gray-900 mb-1">
                          {assignment.title}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="bg-purple-100 text-purple-700 px-2 py-1 text-xs font-medium rounded-md">
                            {t('dashboard.teacher.assignments.assignment')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-soe-green-400 to-soe-green-500 rounded-lg flex items-center justify-center">
                            <BookOpen className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{assignment.book.title}</div>
                            <div className="text-sm text-gray-500">by {assignment.book.authorName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="bg-soe-green-50 text-soe-green-700 px-3 py-2 rounded-lg text-sm font-medium">
                          {assignment.className}
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">
                            {new Date(assignment.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="w-32">
                          <div className="text-xs text-gray-600 mb-1">
                            {t('dashboard.teacher.assignments.studentsRatio', { completed: assignment.studentsCompleted, total: assignment.totalStudents })}
                          </div>
                          <DashboardProgressBar
                            value={assignment.completionRate}
                            showPercentage
                            colorScheme="custom"
                            customColor="bg-gradient-to-r from-purple-400 to-purple-500"
                            height="md"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button className="bg-gradient-to-r from-soe-green-50 to-soe-green-100 hover:from-soe-green-100 hover:to-soe-green-200 text-soe-green-700 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 focus:ring-2 focus:ring-soe-green-400 focus:ring-offset-2">
                            {t('dashboard.common.actions.viewDetails')}
                          </button>
                          <button className="bg-gradient-to-r from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200 text-emerald-700 p-2 rounded-lg transition-all duration-200 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2">
                            <MessageSquare className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </DashboardSection>
      </div>
    </div>
  );
}