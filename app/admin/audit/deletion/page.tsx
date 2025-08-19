'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'

/**
 * Admin Dashboard for GDPR Deletion Audit Monitoring
 * 
 * Provides comprehensive monitoring and management capabilities
 * for deletion audit logs and security alerts.
 */

interface AuditLog {
  id: string
  deletionRequestId: string
  action: string
  performedBy?: string
  performedByRole?: string
  performedByType: string
  actionDetails?: string
  ipAddress?: string
  userAgent?: string
  createdAt: string
  user?: {
    id: string
    email: string
    role: string
  }
  deletionStatus?: string
}

interface Alert {
  id: string
  ruleId: string
  ruleName: string
  severity: string
  title: string
  description: string
  triggeredAt: string
  resolved: boolean
}

interface AuditStatistics {
  totalRequests: number
  actionBreakdown: Record<string, number>
  statusBreakdown: Record<string, number>
  totalAlerts?: number
  activeAlerts?: number
  resolvedAlerts?: number
}

export default function DeletionAuditDashboard() {
  const { data: session, status } = useSession()
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [statistics, setStatistics] = useState<AuditStatistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTab, setSelectedTab] = useState<'logs' | 'alerts' | 'stats'>('alerts')
  const [filters, setFilters] = useState({
    action: '',
    status: '',
    timeRange: '24h',
    search: ''
  })

  // Redirect non-admin users
  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user?.role !== 'ADMIN') {
      redirect('/dashboard')
    }
  }, [session, status])

  // Fetch audit data
  const fetchAuditData = async () => {
    try {
      setLoading(true)
      
      const [logsResponse, alertsResponse] = await Promise.all([
        fetch(`/api/admin/audit/deletion?${new URLSearchParams({
          limit: '50',
          page: '1',
          includeMetadata: 'false',
          ...filters
        })}`),
        fetch('/api/admin/audit/alerts?view=active')
      ])

      if (!logsResponse.ok || !alertsResponse.ok) {
        throw new Error('Failed to fetch audit data')
      }

      const [logsData, alertsData] = await Promise.all([
        logsResponse.json(),
        alertsResponse.json()
      ])

      setAuditLogs(logsData.data || [])
      setAlerts(alertsData.data?.alerts || [])
      setStatistics(alertsData.data?.statistics || null)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  // Auto-refresh every 30 seconds
  useEffect(() => {
    fetchAuditData()
    const interval = setInterval(fetchAuditData, 30000)
    return () => clearInterval(interval)
  }, [filters])

  // Resolve alert
  const resolveAlert = async (alertId: string) => {
    try {
      const response = await fetch('/api/admin/audit/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resolve',
          alertId,
          notes: 'Resolved by admin'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to resolve alert')
      }

      // Refresh alerts
      fetchAuditData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve alert')
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading audit dashboard...</p>
        </div>
      </div>
    )
  }

  if (!session || session.user?.role !== 'ADMIN') {
    return null
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200'
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'LOW': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'REQUEST_CREATED': return 'bg-blue-100 text-blue-800'
      case 'PARENTAL_CONSENT_GRANTED': return 'bg-green-100 text-green-800'
      case 'PARENTAL_CONSENT_DENIED': return 'bg-red-100 text-red-800'
      case 'SOFT_DELETE_EXECUTED': return 'bg-orange-100 text-orange-800'
      case 'HARD_DELETE_EXECUTED': return 'bg-red-100 text-red-800'
      case 'ACCOUNT_RECOVERED': return 'bg-green-100 text-green-800'
      case 'SYSTEM_ERROR': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  GDPR Deletion Audit Dashboard
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Monitor deletion requests, audit logs, and security alerts
                </p>
              </div>
              
              <div className="flex items-center space-x-3">
                <span className="flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                <span className="text-sm text-green-600 font-medium">Live Monitoring</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setSelectedTab('alerts')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === 'alerts'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Security Alerts
              {alerts.length > 0 && (
                <span className="ml-2 bg-red-100 text-red-600 py-0.5 px-2 rounded-full text-xs">
                  {alerts.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setSelectedTab('logs')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === 'logs'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Audit Logs
            </button>
            <button
              onClick={() => setSelectedTab('stats')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === 'stats'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Statistics
            </button>
          </nav>
        </div>

        {/* Security Alerts Tab */}
        {selectedTab === 'alerts' && (
          <div className="space-y-4">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Active Security Alerts
                </h3>
                
                {alerts.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No active alerts</h3>
                    <p className="mt-1 text-sm text-gray-500">All systems are operating normally.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {alerts.map((alert) => (
                      <div key={alert.id} className={`border rounded-lg p-4 ${getSeverityColor(alert.severity)}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                                {alert.severity}
                              </span>
                              <h4 className="ml-3 text-sm font-medium text-gray-900">
                                {alert.title}
                              </h4>
                            </div>
                            <p className="mt-1 text-sm text-gray-700">
                              {alert.description}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              Triggered: {new Date(alert.triggeredAt).toLocaleString()}
                            </p>
                          </div>
                          <button
                            onClick={() => resolveAlert(alert.id)}
                            className="ml-4 bg-white hover:bg-gray-50 border border-gray-300 rounded-md px-3 py-1 text-xs font-medium text-gray-700"
                          >
                            Resolve
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {statistics && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Total Alerts (24h)
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">
                            {statistics.totalAlerts || 0}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-red-100 rounded-md flex items-center justify-center">
                          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Active Alerts
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">
                            {statistics.activeAlerts || 0}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Resolved Alerts
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">
                            {statistics.resolvedAlerts || 0}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Audit Logs Tab */}
        {selectedTab === 'logs' && (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Recent Audit Logs
              </h3>
              
              <div className="flow-root">
                <ul className="-mb-8">
                  {auditLogs.map((log, idx) => (
                    <li key={log.id}>
                      <div className="relative pb-8">
                        {idx !== auditLogs.length - 1 && (
                          <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" />
                        )}
                        <div className="relative flex space-x-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                                {log.action.replace(/_/g, ' ')}
                              </span>
                              <span className="text-xs text-gray-500">
                                {log.performedByType}
                              </span>
                              <time className="text-xs text-gray-500">
                                {new Date(log.createdAt).toLocaleString()}
                              </time>
                            </div>
                            <div className="mt-1">
                              <p className="text-sm text-gray-900">{log.actionDetails}</p>
                              {log.user && (
                                <p className="text-xs text-gray-500 mt-1">
                                  User: {log.user.email} ({log.user.role})
                                </p>
                              )}
                              {log.ipAddress && (
                                <p className="text-xs text-gray-500">
                                  IP: {log.ipAddress}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Statistics Tab */}
        {selectedTab === 'stats' && statistics && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Action Breakdown
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(statistics.actionBreakdown || {}).map(([action, count]) => (
                      <div key={action} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{action.replace(/_/g, ' ')}</span>
                        <span className="text-sm font-medium text-gray-900">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Status Distribution
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(statistics.statusBreakdown || {}).map(([status, count]) => (
                      <div key={status} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{status.replace(/_/g, ' ')}</span>
                        <span className="text-sm font-medium text-gray-900">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}