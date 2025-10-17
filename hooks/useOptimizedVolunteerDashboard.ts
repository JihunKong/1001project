import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import type { TextSubmission, VolunteerStats } from '@/types/api';
import { apiCall } from '@/lib/api-utils';
import { useErrorHandler } from '@/lib/error-handling';

interface UseVolunteerDashboardResult {
  submissions: TextSubmission[];
  stats: VolunteerStats | null;
  loading: boolean;
  error: string | null;
  refetchData: () => Promise<void>;
  filteredSubmissions: TextSubmission[];
  setSearchTerm: (term: string) => void;
  setStatusFilter: (status: string) => void;
  sortBy: (field: keyof TextSubmission, direction: 'asc' | 'desc') => void;
}

interface UseVolunteerDashboardOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  enableCaching?: boolean;
  cacheTimeout?: number;
}

// Cache implementation
class DashboardCache {
  private static cache = new Map<string, { data: unknown; timestamp: number }>();
  private static readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  static set(key: string, data: unknown, ttl = this.DEFAULT_TTL): void {
    this.cache.set(key, { data, timestamp: Date.now() + ttl });
  }

  static get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry || Date.now() > entry.timestamp) {
      this.cache.delete(key);
      return null;
    }
    return entry.data as T;
  }

  static clear(): void {
    this.cache.clear();
  }
}

export function useOptimizedVolunteerDashboard(
  options: UseVolunteerDashboardOptions = {}
): UseVolunteerDashboardResult {
  const {
    autoRefresh = false,
    refreshInterval = 30000, // 30 seconds
    enableCaching = true,
    cacheTimeout = 5 * 60 * 1000, // 5 minutes
  } = options;

  const { data: session } = useSession();
  const { logError, handleAsyncError } = useErrorHandler();

  // State management
  const [submissions, setSubmissions] = useState<TextSubmission[]>([]);
  const [stats, setStats] = useState<VolunteerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState<{
    field: keyof TextSubmission;
    direction: 'asc' | 'desc';
  }>({ field: 'createdAt', direction: 'desc' });

  // Cache keys
  const submissionsCacheKey = `submissions_${session?.user?.id || 'anonymous'}`;
  const statsCacheKey = `stats_${session?.user?.id || 'anonymous'}`;

  // Memoized filtered and sorted submissions
  const filteredSubmissions = useMemo(() => {
    let filtered = submissions;

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (submission) =>
          submission.title.toLowerCase().includes(searchLower) ||
          submission.summary.toLowerCase().includes(searchLower) ||
          (submission.authorAlias?.toLowerCase().includes(searchLower) ?? false)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((submission) => submission.status === statusFilter);
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      const aValue = a[sortConfig.field];
      const bValue = b[sortConfig.field];

      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      let comparison = 0;

      if (sortConfig.field === 'createdAt' || sortConfig.field === 'updatedAt') {
        comparison = new Date(aValue as string).getTime() - new Date(bValue as string).getTime();
      } else if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      }

      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [submissions, searchTerm, statusFilter, sortConfig]);

  // Optimized data fetching function
  const fetchData = useCallback(async () => {
    if (!session?.user || session.user.role !== 'WRITER') {
      return;
    }

    const userId = session.user.id;
    setError(null);

    try {
      // Check cache first if enabled
      let cachedSubmissions: TextSubmission[] | null = null;
      let cachedStats: VolunteerStats | null = null;

      if (enableCaching) {
        cachedSubmissions = DashboardCache.get<TextSubmission[]>(submissionsCacheKey);
        cachedStats = DashboardCache.get<VolunteerStats>(statsCacheKey);

        if (cachedSubmissions && cachedStats) {
          setSubmissions(cachedSubmissions);
          setStats(cachedStats);
          setLoading(false);
          return;
        }
      }

      // Fetch fresh data if cache miss or disabled
      const [submissionsResult, statsResult] = await Promise.all([
        apiCall<{ submissions: TextSubmission[] }>('/api/text-submissions'),
        apiCall<VolunteerStats>('/api/writer/stats'),
      ]);

      if (submissionsResult.error || statsResult.error) {
        throw new Error(submissionsResult.error || statsResult.error || 'Failed to fetch data');
      }

      const newSubmissions = submissionsResult.data?.submissions || [];
      const newStats = statsResult.data;

      // Update state
      setSubmissions(newSubmissions);
      setStats(newStats || null);

      // Cache the results if enabled
      if (enableCaching) {
        DashboardCache.set(submissionsCacheKey, newSubmissions, cacheTimeout);
        if (newStats) {
          DashboardCache.set(statsCacheKey, newStats, cacheTimeout);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      logError(err instanceof Error ? err : new Error(errorMessage), {
        userId,
        context: 'volunteer_dashboard_fetch',
      });
    } finally {
      setLoading(false);
    }
  }, [session, enableCaching, submissionsCacheKey, statsCacheKey, cacheTimeout, logError]);

  // Wrapped refetch function with error handling
  const refetchData = useCallback(async () => {
    setLoading(true);
    await handleAsyncError(fetchData);
  }, [fetchData, handleAsyncError]);

  // Sort function
  const sortBy = useCallback((field: keyof TextSubmission, direction: 'asc' | 'desc') => {
    setSortConfig({ field, direction });
  }, []);

  // Initial data fetch
  useEffect(() => {
    if (session?.user?.role === 'WRITER') {
      void fetchData();
    }
  }, [fetchData, session]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh || !session?.user || session.user.role !== 'WRITER') {
      return;
    }

    const interval = setInterval(() => {
      void handleAsyncError(fetchData);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchData, handleAsyncError, session]);

  // Cleanup cache on unmount
  useEffect(() => {
    return () => {
      if (enableCaching) {
        // Optional: Clear cache on unmount to prevent memory leaks
        // DashboardCache.clear();
      }
    };
  }, [enableCaching]);

  return {
    submissions,
    stats,
    loading,
    error,
    refetchData,
    filteredSubmissions,
    setSearchTerm,
    setStatusFilter,
    sortBy,
  };
}