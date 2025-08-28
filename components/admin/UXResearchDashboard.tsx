"use client"

import React, { useState, useEffect } from 'react'
import { 
  BarChart3, 
  Users, 
  MessageSquare, 
  TrendingUp, 
  AlertTriangle,
  Filter,
  Download,
  Eye,
  Calendar,
  Target,
  Zap,
  Clock,
  Star
} from 'lucide-react'

interface FeedbackSummary {
  totalFeedback: number
  roleMigrationFeedback: number
  bugReports: number
  avgRating: number
  sentimentBreakdown: Record<string, number>
}

interface AnalyticsSummary {
  totalSessions: number
  uniqueUsers: number
  avgEngagementScore: number
  avgSessionDuration: number
  bounceRate: number
}

interface FeatureUsageSummary {
  totalFeatures: number
  totalUsage: number
  uniqueUsers: number
  avgCompletionRate: number
}

interface DashboardData {
  feedback: FeedbackSummary
  analytics: AnalyticsSummary
  featureUsage: FeatureUsageSummary
  roleMigrations: Array<{
    fromRole: string
    toRole: string
    satisfactionRating: number
    count: number
  }>
  topIssues: Array<{
    issue: string
    count: number
    severity: string
  }>
}

export default function UXResearchDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState('7d')
  const [activeTab, setActiveTab] = useState('overview')
  
  useEffect(() => {
    fetchDashboardData()
  }, [timeframe])
  
  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const [feedbackRes, analyticsRes, featureUsageRes] = await Promise.all([
        fetch(`/api/feedback/analytics?timeframe=${timeframe}`),
        fetch(`/api/analytics/session?timeframe=${timeframe}`),
        fetch(`/api/analytics/feature-usage?timeframe=${timeframe}`)
      ])
      
      const [feedbackData, analyticsData, featureUsageData] = await Promise.all([
        feedbackRes.json(),
        analyticsRes.json(),
        featureUsageRes.json()
      ])
      
      // Combine and structure the data
      setData({
        feedback: {
          totalFeedback: feedbackData.summary?.totalFeedback || 0,
          roleMigrationFeedback: feedbackData.roleMigrationFeedback || 0,
          bugReports: feedbackData.bugReports || 0,
          avgRating: feedbackData.avgRating || 0,
          sentimentBreakdown: feedbackData.sentimentBreakdown || {}
        },
        analytics: analyticsData.data?.summary || {
          totalSessions: 0,
          uniqueUsers: 0,
          avgEngagementScore: 0,
          avgSessionDuration: 0,
          bounceRate: 0
        },
        featureUsage: featureUsageData.data?.summary || {
          totalFeatures: 0,
          totalUsage: 0,
          uniqueUsers: 0,
          avgCompletionRate: 0
        },
        roleMigrations: feedbackData.roleMigrations || [],
        topIssues: feedbackData.topIssues || []
      })
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const exportData = async (type: string) => {
    try {
      const response = await fetch(`/api/admin/export/${type}?timeframe=${timeframe}`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${type}-export-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export data:', error)
    }
  }
  
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  
  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Failed to load dashboard data</p>
        <button 
          onClick={fetchDashboardData}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    )
  }
  
  const MetricCard = ({ icon: Icon, title, value, subtitle, color = 'blue', change }: any) => (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-2xl font-bold text-${color}-600`}>{value}</p>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
        <div className={`p-3 bg-${color}-100 rounded-lg`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
      </div>
      {change && (
        <div className="mt-4 flex items-center">
          <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
          <span className="text-sm text-green-600">{change}</span>
        </div>
      )}
    </div>
  )
  
  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'feedback', label: 'User Feedback', icon: MessageSquare },
    { id: 'behavior', label: 'User Behavior', icon: Users },
    { id: 'features', label: 'Feature Usage', icon: Zap },
    { id: 'migrations', label: 'Role Migrations', icon: Target }
  ]
  
  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="1d">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => exportData('feedback')}
            className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
          
          <button
            onClick={fetchDashboardData}
            className="px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="border-b">
        <div className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>
      
      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              icon={MessageSquare}
              title="Total Feedback"
              value={data.feedback.totalFeedback}
              subtitle="User responses"
              color="blue"
            />
            <MetricCard
              icon={Users}
              title="Active Users"
              value={data.analytics.uniqueUsers}
              subtitle={`${data.analytics.totalSessions} sessions`}
              color="green"
            />
            <MetricCard
              icon={TrendingUp}
              title="Engagement Score"
              value={`${data.analytics.avgEngagementScore}/100`}
              subtitle="Average user engagement"
              color="purple"
            />
            <MetricCard
              icon={AlertTriangle}
              title="Critical Issues"
              value={data.topIssues.filter(issue => issue.severity === 'CRITICAL').length}
              subtitle="Requiring immediate attention"
              color="red"
            />
          </div>
          
          {/* Role Migration Impact */}
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Role System Migration Impact</h3>
              <span className="text-sm text-gray-500">Last {timeframe}</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{data.feedback.roleMigrationFeedback}</p>
                <p className="text-sm text-gray-600">Migration Feedback</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  {data.feedback.avgRating > 0 ? data.feedback.avgRating.toFixed(1) : 'N/A'}
                </p>
                <p className="text-sm text-gray-600">Average Rating</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">{data.analytics.bounceRate}%</p>
                <p className="text-sm text-gray-600">Bounce Rate</p>
              </div>
            </div>
          </div>
          
          {/* Top Issues */}
          {data.topIssues.length > 0 && (
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-medium mb-4">Top Issues Reported</h3>
              <div className="space-y-3">
                {data.topIssues.slice(0, 5).map((issue, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{issue.issue}</p>
                      <p className="text-sm text-gray-500">{issue.count} reports</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      issue.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                      issue.severity === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {issue.severity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {activeTab === 'feedback' && (
        <div className="space-y-6">
          {/* Feedback Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
              icon={MessageSquare}
              title="Bug Reports"
              value={data.feedback.bugReports}
              color="red"
            />
            <MetricCard
              icon={Star}
              title="Average Rating"
              value={data.feedback.avgRating > 0 ? data.feedback.avgRating.toFixed(1) : 'N/A'}
              subtitle="Out of 5 stars"
              color="yellow"
            />
            <MetricCard
              icon={Target}
              title="Role Migration"
              value={data.feedback.roleMigrationFeedback}
              subtitle="Specific feedback"
              color="purple"
            />
          </div>
          
          {/* Sentiment Analysis */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-medium mb-4">Sentiment Analysis</h3>
            <div className="space-y-3">
              {Object.entries(data.feedback.sentimentBreakdown).map(([sentiment, count]) => (
                <div key={sentiment} className="flex items-center justify-between">
                  <span className="capitalize">{sentiment.replace('_', ' ').toLowerCase()}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          sentiment.includes('POSITIVE') ? 'bg-green-500' :
                          sentiment.includes('NEGATIVE') ? 'bg-red-500' :
                          'bg-gray-400'
                        }`}
                        style={{ 
                          width: `${(count / Math.max(...Object.values(data.feedback.sentimentBreakdown))) * 100}%` 
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'behavior' && (
        <div className="space-y-6">
          {/* User Behavior Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <MetricCard
              icon={Users}
              title="Total Sessions"
              value={data.analytics.totalSessions}
              color="blue"
            />
            <MetricCard
              icon={Clock}
              title="Avg Session Time"
              value={`${Math.floor(data.analytics.avgSessionDuration / 60)}m`}
              subtitle={`${data.analytics.avgSessionDuration % 60}s`}
              color="green"
            />
            <MetricCard
              icon={TrendingUp}
              title="Engagement Score"
              value={data.analytics.avgEngagementScore}
              subtitle="Out of 100"
              color="purple"
            />
            <MetricCard
              icon={Eye}
              title="Bounce Rate"
              value={`${data.analytics.bounceRate}%`}
              color="orange"
            />
          </div>
        </div>
      )}
      
      {activeTab === 'features' && (
        <div className="space-y-6">
          {/* Feature Usage Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <MetricCard
              icon={Zap}
              title="Total Features"
              value={data.featureUsage.totalFeatures}
              color="blue"
            />
            <MetricCard
              icon={Target}
              title="Total Usage"
              value={data.featureUsage.totalUsage}
              color="green"
            />
            <MetricCard
              icon={Users}
              title="Active Users"
              value={data.featureUsage.uniqueUsers}
              color="purple"
            />
            <MetricCard
              icon={TrendingUp}
              title="Completion Rate"
              value={`${data.featureUsage.avgCompletionRate}%`}
              color="orange"
            />
          </div>
        </div>
      )}
      
      {activeTab === 'migrations' && (
        <div className="space-y-6">
          {/* Role Migration Summary */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-medium mb-4">Role Migration Summary</h3>
            {data.roleMigrations.length > 0 ? (
              <div className="space-y-4">
                {data.roleMigrations.map((migration, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">
                        {migration.fromRole} → {migration.toRole}
                      </p>
                      <p className="text-sm text-gray-600">{migration.count} users migrated</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-600">
                        {migration.satisfactionRating}/5
                      </p>
                      <p className="text-sm text-gray-500">Satisfaction</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No role migrations in selected timeframe</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}