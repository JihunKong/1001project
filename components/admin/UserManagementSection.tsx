'use client';

import { useState, useEffect, useCallback } from 'react';
import { User, UserRole } from '@prisma/client';
import { Plus, Search, Filter, RefreshCw } from 'lucide-react';
import { UserTable } from './UserTable';
import { UserFormModal, UserFormData } from './UserFormModal';
import { UserDetailsModal } from './UserDetailsModal';
import { UserDeleteModal } from './UserDeleteModal';

interface UserWithProfile extends User {
  profile?: {
    firstName?: string | null;
    lastName?: string | null;
    bio?: string | null;
    organization?: string | null;
    phone?: string | null;
    location?: string | null;
  } | null;
  _count?: {
    sessions: number;
    submissions: number;
    enrolledClasses: number;
    teachingClasses?: number;
    readingProgress?: number;
  };
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function UserManagementSection() {
  const [users, setUsers] = useState<UserWithProfile[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'deleted' | ''>('active');
  const [sortBy, setSortBy] = useState<'createdAt' | 'name' | 'email' | 'updatedAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedUser, setSelectedUser] = useState<UserWithProfile | null>(null);

  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy,
        sortOrder
      });

      if (search) params.append('search', search);
      if (roleFilter) params.append('role', roleFilter);
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(`/api/admin/users?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, roleFilter, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreateUser = async (data: UserFormData) => {
    const response = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create user');
    }

    await fetchUsers();
  };

  const handleUpdateUser = async (data: UserFormData) => {
    if (!selectedUser) return;

    const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update user');
    }

    await fetchUsers();
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete user');
    }

    await fetchUsers();
  };

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination({ ...pagination, page: newPage });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage system users and their roles
          </p>
        </div>
        <button
          onClick={() => {
            setFormMode('create');
            setSelectedUser(null);
            setFormModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-soe-green-600 text-white rounded-lg hover:bg-soe-green-700"
        >
          <Plus className="h-5 w-5" />
          Create User
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-soe-green-500 focus:border-transparent"
              />
            </div>
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as UserRole | '')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-soe-green-500 focus:border-transparent"
          >
            <option value="">All Roles</option>
            <option value="LEARNER">Learner</option>
            <option value="TEACHER">Teacher</option>
            <option value="INSTITUTION">Institution</option>
            <option value="WRITER">Writer</option>
            <option value="STORY_MANAGER">Story Manager</option>
            <option value="BOOK_MANAGER">Book Manager</option>
            <option value="CONTENT_ADMIN">Content Admin</option>
            <option value="ADMIN">Admin</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'active' | 'deleted' | '')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-soe-green-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="deleted">Deleted</option>
          </select>

          <button
            onClick={fetchUsers}
            disabled={loading}
            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {loading && users.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Loading users...</p>
        </div>
      ) : (
        <>
          <UserTable
            users={users}
            onView={(user) => {
              setSelectedUser(user);
              setDetailsModalOpen(true);
            }}
            onEdit={(user) => {
              setSelectedUser(user);
              setFormMode('edit');
              setFormModalOpen(true);
            }}
            onDelete={(user) => {
              setSelectedUser(user);
              setDeleteModalOpen(true);
            }}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
          />

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-600">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} results
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <UserFormModal
        isOpen={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setSelectedUser(null);
        }}
        onSubmit={formMode === 'create' ? handleCreateUser : handleUpdateUser}
        user={selectedUser}
        mode={formMode}
      />

      <UserDetailsModal
        isOpen={detailsModalOpen}
        onClose={() => {
          setDetailsModalOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        onEdit={() => {
          setDetailsModalOpen(false);
          setFormMode('edit');
          setFormModalOpen(true);
        }}
      />

      <UserDeleteModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedUser(null);
        }}
        onConfirm={handleDeleteUser}
        user={selectedUser}
      />
    </div>
  );
}
