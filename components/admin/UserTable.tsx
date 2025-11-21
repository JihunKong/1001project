'use client';

import { useState } from 'react';
import { User, UserRole } from '@prisma/client';
import {
  Eye,
  Edit,
  Trash2,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown
} from 'lucide-react';
import { DashboardStatusBadge } from '@/components/dashboard';

interface UserWithProfile extends User {
  profile?: {
    firstName?: string | null;
    lastName?: string | null;
    organization?: string | null;
    phone?: string | null;
    location?: string | null;
  } | null;
  _count?: {
    sessions: number;
    submissions: number;
    enrolledClasses: number;
  };
}

interface UserTableProps {
  users: UserWithProfile[];
  onView: (user: UserWithProfile) => void;
  onEdit: (user: UserWithProfile) => void;
  onDelete: (user: UserWithProfile) => void;
  sortBy: 'createdAt' | 'name' | 'email' | 'updatedAt';
  sortOrder: 'asc' | 'desc';
  onSort: (field: 'createdAt' | 'name' | 'email' | 'updatedAt') => void;
}

export function UserTable({
  users,
  onView,
  onEdit,
  onDelete,
  sortBy,
  sortOrder,
  onSort
}: UserTableProps) {
  const getRoleBadgeColor = (role: UserRole): string => {
    const colors: Record<UserRole, string> = {
      ADMIN: 'bg-red-100 text-red-800',
      CONTENT_ADMIN: 'bg-purple-100 text-purple-800',
      BOOK_MANAGER: 'bg-blue-100 text-blue-800',
      STORY_MANAGER: 'bg-green-100 text-green-800',
      WRITER: 'bg-yellow-100 text-yellow-800',
      TEACHER: 'bg-indigo-100 text-indigo-800',
      LEARNER: 'bg-gray-100 text-gray-800',
      INSTITUTION: 'bg-orange-100 text-orange-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const SortIcon = ({ field }: { field: typeof sortBy }) => {
    if (sortBy !== field) {
      return <ChevronsUpDown className="h-4 w-4 text-gray-400" />;
    }
    return sortOrder === 'asc' ? (
      <ChevronUp className="h-4 w-4 text-soe-green-600" />
    ) : (
      <ChevronDown className="h-4 w-4 text-soe-green-600" />
    );
  };

  if (users.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
        <p className="text-gray-500">No users found</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => onSort('name')}
              >
                <div className="flex items-center gap-2">
                  Name
                  <SortIcon field="name" />
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => onSort('email')}
              >
                <div className="flex items-center gap-2">
                  Email
                  <SortIcon field="email" />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => onSort('createdAt')}
              >
                <div className="flex items-center gap-2">
                  Created
                  <SortIcon field="createdAt" />
                </div>
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <div className="text-sm font-medium text-gray-900">
                      {user.name}
                    </div>
                    {user.profile && (user.profile.firstName || user.profile.lastName) && (
                      <div className="text-xs text-gray-500">
                        {[user.profile.firstName, user.profile.lastName]
                          .filter(Boolean)
                          .join(' ')}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{user.email}</div>
                  {user.emailVerified && (
                    <div className="text-xs text-green-600">Verified</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(
                      user.role
                    )}`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {user.deletedAt ? (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                      Deleted
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                      Active
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onView(user)}
                      className="text-soe-green-600 hover:text-soe-green-900 p-1 rounded hover:bg-soe-green-50"
                      title="View details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onEdit(user)}
                      className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                      title="Edit user"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDelete(user)}
                      className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                      title="Delete user"
                      disabled={!!user.deletedAt}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
