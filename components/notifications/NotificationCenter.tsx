'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Filter,
  RefreshCw,
  FileText,
  Clock,
  Award,
  AlertCircle,
  Settings,
  Eye,
  EyeOff
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'SYSTEM' | 'WRITER' | 'ASSIGNMENT' | 'ACHIEVEMENT';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  data?: {
    submissionId?: string;
    submissionTitle?: string;
    feedback?: string;
    nextSteps?: string[];
    [key: string]: any;
  };
}

interface NotificationCenterProps {
  className?: string;
}

export default function NotificationCenter({ className = '' }: NotificationCenterProps) {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Fetch notifications
  const fetchNotifications = async (pageNum = 1, append = false) => {
    if (!session?.user?.id) return;

    setLoading(pageNum === 1);
    try {
      const response = await fetch(`/api/notifications?page=${pageNum}&limit=20`);
      if (response.ok) {
        const data = await response.json();
        const newNotifications = data.notifications || [];

        if (append) {
          setNotifications(prev => [...prev, ...newNotifications]);
        } else {
          setNotifications(newNotifications);
        }

        setHasMore(newNotifications.length === 20);
        setPage(pageNum);
      }
    } catch (error) {
      // Failed to fetch notifications - will show empty state
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  useEffect(() => {
    let filtered = notifications;

    // Apply read/unread filter
    if (filter === 'unread') {
      filtered = filtered.filter(n => !n.read);
    } else if (filter === 'read') {
      filtered = filtered.filter(n => n.read);
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(n => n.type === typeFilter);
    }

    setFilteredNotifications(filtered);
  }, [notifications, filter, typeFilter]);

  // Load more notifications
  const loadMore = () => {
    if (!loading && hasMore) {
      fetchNotifications(page + 1, true);
    }
  };

  // Mark notification as read/unread
  const toggleRead = async (notificationId: string, read: boolean) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read })
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(notif =>
            notif.id === notificationId ? { ...notif, read } : notif
          )
        );
      }
    } catch (error) {
      // Failed to toggle read status
    }
  };

  // Bulk mark as read
  const bulkMarkAsRead = async (ids: string[]) => {
    try {
      const response = await fetch('/api/notifications/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, read: true })
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(notif =>
            ids.includes(notif.id) ? { ...notif, read: true } : notif
          )
        );
        setSelectedIds(new Set());
      }
    } catch (error) {
      // Failed to bulk mark as read
    }
  };

  // Delete notifications
  const deleteNotifications = async (ids: string[]) => {
    if (!confirm(`Delete ${ids.length} notification${ids.length !== 1 ? 's' : ''}?`)) return;

    try {
      const response = await fetch('/api/notifications/bulk-delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(notif => !ids.includes(notif.id)));
        setSelectedIds(new Set());
      }
    } catch (error) {
      // Failed to delete notifications
    }
  };

  // Toggle selection
  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // Select all filtered
  const selectAllFiltered = () => {
    const allIds = filteredNotifications.map(n => n.id);
    setSelectedIds(new Set(allIds));
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  // Initialize
  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  // Get notification icon and color
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'WRITER':
        return { icon: <FileText className="w-5 h-5" />, color: 'text-blue-600 bg-blue-50' };
      case 'ASSIGNMENT':
        return { icon: <Clock className="w-5 h-5" />, color: 'text-orange-600 bg-orange-50' };
      case 'ACHIEVEMENT':
        return { icon: <Award className="w-5 h-5" />, color: 'text-yellow-600 bg-yellow-50' };
      default:
        return { icon: <AlertCircle className="w-5 h-5" />, color: 'text-gray-600 bg-gray-50' };
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className={`bg-white rounded-xl border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-50 rounded-lg">
              <Bell className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
              <p className="text-sm text-gray-600">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchNotifications(1)}
              disabled={loading}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <a
              href="/profile/notifications"
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              title="Notification settings"
            >
              <Settings className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All notifications</option>
              <option value="unread">Unread only</option>
              <option value="read">Read only</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All types</option>
              <option value="WRITER">Story updates</option>
              <option value="ASSIGNMENT">Assignments</option>
              <option value="ACHIEVEMENT">Achievements</option>
              <option value="SYSTEM">System</option>
            </select>
          </div>

          {/* Bulk Actions */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {selectedIds.size} selected
              </span>
              <button
                onClick={() => bulkMarkAsRead(Array.from(selectedIds))}
                className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-1"
              >
                <Check className="w-4 h-4" />
                Mark read
              </button>
              <button
                onClick={() => deleteNotifications(Array.from(selectedIds))}
                className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
              <button
                onClick={clearSelection}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
              >
                Clear
              </button>
            </div>
          )}

          {/* Select All */}
          {selectedIds.size === 0 && filteredNotifications.length > 0 && (
            <button
              onClick={selectAllFiltered}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Select all
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="divide-y divide-gray-100">
        {loading && notifications.length === 0 ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
            <p className="text-gray-500 mt-3">Loading notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
            <p className="text-gray-500">
              {filter === 'unread'
                ? "You're all caught up! No unread notifications."
                : "No notifications match your current filters."
              }
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => {
            const { icon, color } = getNotificationIcon(notification.type);
            const isSelected = selectedIds.has(notification.id);

            return (
              <div
                key={notification.id}
                className={`px-6 py-4 hover:bg-gray-50 transition-colors ${
                  isSelected ? 'bg-primary-50' : !notification.read ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelection(notification.id)}
                    className="mt-1 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />

                  {/* Icon */}
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${color}`}>
                    {icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className={`text-base font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                          {notification.title}
                        </h3>
                        <p className="text-gray-600 mt-1 text-sm leading-relaxed">
                          {notification.message}
                        </p>

                        {/* Additional data */}
                        {notification.data?.submissionTitle && (
                          <div className="mt-2 text-sm">
                            <span className="text-gray-500">Story: </span>
                            <span className="font-medium text-gray-700">
                              {notification.data.submissionTitle}
                            </span>
                          </div>
                        )}

                        {notification.data?.feedback && (
                          <div className="mt-2 p-3 bg-blue-50 border-l-4 border-blue-200 rounded">
                            <p className="text-sm text-blue-700 italic">
                              &ldquo;{notification.data.feedback}&rdquo;
                            </p>
                          </div>
                        )}

                        {notification.data?.nextSteps && notification.data.nextSteps.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm font-medium text-gray-700 mb-1">Next steps:</p>
                            <ul className="text-sm text-gray-600 space-y-1">
                              {notification.data.nextSteps.map((step, index) => (
                                <li key={index} className="flex items-start gap-2">
                                  <span className="text-primary-500 mt-0.5">•</span>
                                  {step}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Links */}
                        {notification.data?.submissionId && (
                          <div className="mt-3">
                            <a
                              href={`/dashboard/writer/story/${notification.data.submissionId}`}
                              className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700 font-medium"
                            >
                              View story →
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Actions & Time */}
                      <div className="flex items-start gap-2 flex-shrink-0">
                        <span className="text-sm text-gray-400">
                          {formatDate(notification.createdAt)}
                        </span>
                        <button
                          onClick={() => toggleRead(notification.id, !notification.read)}
                          className="p-1 text-gray-400 hover:text-gray-600 rounded"
                          title={notification.read ? 'Mark as unread' : 'Mark as read'}
                        >
                          {notification.read ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Load More */}
      {hasMore && filteredNotifications.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 text-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-4 py-2 text-sm text-primary-600 hover:text-primary-700 font-medium disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Load more notifications'}
          </button>
        </div>
      )}
    </div>
  );
}