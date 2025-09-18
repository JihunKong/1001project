'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  TrendingUp, 
  BookOpen, 
  Target,
  Sparkles,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

interface AIBriefingProps {
  dashboardType?: 'learner' | 'teacher' | 'admin';
  className?: string;
}

interface BriefingData {
  briefing: string;
  userData: {
    totalActivities: number;
    completedBooks: number;
    currentStreak: number;
  };
}

export default function AIBriefing({ 
  dashboardType = 'learner',
  className = ''
}: AIBriefingProps) {
  const [briefingData, setBriefingData] = useState<BriefingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchBriefing();
  }, [dashboardType]);

  const fetchBriefing = async () => {
    try {
      setError(null);
      const response = await fetch(`/api/ai/briefing?type=${dashboardType}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch briefing');
      }

      const data = await response.json();
      setBriefingData(data);
    } catch (err) {
      setError('Unable to load AI briefing');
      console.error('Error fetching AI briefing:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchBriefing();
    setRefreshing(false);
  };

  const getDashboardIcon = () => {
    switch (dashboardType) {
      case 'teacher':
        return <Target className="w-5 h-5 text-green-600" />;
      case 'admin':
        return <TrendingUp className="w-5 h-5 text-purple-600" />;
      default:
        return <BookOpen className="w-5 h-5 text-blue-600" />;
    }
  };

  const getDashboardTitle = () => {
    switch (dashboardType) {
      case 'teacher':
        return 'Teaching Insights';
      case 'admin':
        return 'Platform Overview';
      default:
        return 'Learning Progress';
    }
  };

  if (loading) {
    return (
      <div className={`bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="animate-pulse">
            <Brain className="w-5 h-5 text-gray-400" />
          </div>
          <div className="animate-pulse bg-gray-200 h-4 w-32 rounded"></div>
        </div>
        <div className="animate-pulse space-y-2">
          <div className="bg-gray-200 h-4 w-full rounded"></div>
          <div className="bg-gray-200 h-4 w-3/4 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !briefingData) {
    return (
      <div className={`bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <h3 className="font-medium text-red-900">AI Briefing Unavailable</h3>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <p className="text-red-700 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-100 ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg shadow-sm">
            <Brain className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              AI {getDashboardTitle()}
              <Sparkles className="w-4 h-4 text-yellow-500" />
            </h3>
            <p className="text-xs text-gray-600">Powered by AI insights</p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 text-gray-600 hover:bg-white hover:shadow-sm rounded-lg transition-all disabled:opacity-50"
          title="Refresh briefing"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* AI Briefing */}
      <div className="mb-4 p-4 bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="flex items-start gap-3">
          <div className="p-1 bg-blue-100 rounded">
            {getDashboardIcon()}
          </div>
          <div className="flex-1">
            <p className="text-gray-800 font-medium leading-relaxed">
              {briefingData.briefing}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white/70 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-blue-600">
            {briefingData.userData.currentStreak}
          </div>
          <div className="text-xs text-gray-600">day streak</div>
        </div>
        <div className="bg-white/70 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-green-600">
            {briefingData.userData.completedBooks}
          </div>
          <div className="text-xs text-gray-600">books read</div>
        </div>
        <div className="bg-white/70 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-purple-600">
            {briefingData.userData.totalActivities}
          </div>
          <div className="text-xs text-gray-600">activities</div>
        </div>
      </div>

      {/* Motivation Footer */}
      <div className="mt-4 pt-3 border-t border-gray-200 text-center">
        <p className="text-xs text-gray-600 italic">
          Keep up the great work! 🌟
        </p>
      </div>
    </motion.div>
  );
}