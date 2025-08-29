'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Download,
  UserPlus,
  Shield,
  BookOpen,
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  History
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { UserRole } from '@prisma/client';
import UserFormModal from '@/components/admin/UserFormModal';
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal';
import BulkRoleChangeModal from '@/components/admin/BulkRoleChangeModal';
import RoleHistoryModal from '@/components/admin/RoleHistoryModal';
import { useSecureFetch } from '@/lib/csrf-context';

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
  profile?: {
    firstName: string;
    lastName: string;
  };
  subscription?: {
    status: string;
    plan: string;
  };
  _count: {
    stories: number;
    orders: number;
  };
}

interface UserStats {
  totalUsers: number;
  totalCustomers: number;
  totalLearners: number;
  totalAdmins: number;
  totalVolunteers: number;
}

const roleConfig = {
  CUSTOMER: { label: 'Customer', color: 'bg-indigo-100 text-indigo-800', icon: Users },
  LEARNER: { label: 'Learner', color: 'bg-blue-100 text-blue-800', icon: BookOpen },
  TEACHER: { label: 'Teacher', color: 'bg-orange-100 text-orange-800', icon: CheckCircle },
  INSTITUTION: { label: 'Institution', color: 'bg-gray-100 text-gray-800', icon: AlertTriangle },
  VOLUNTEER: { label: 'Volunteer', color: 'bg-green-100 text-green-800', icon: Clock },
  ADMIN: { label: 'Admin', color: 'bg-purple-100 text-purple-800', icon: Shield },
};

export default function UsersPage() {
  const { data: session, status } = useSession();
  const secureFetch = useSecureFetch();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    totalCustomers: 0,
    totalLearners: 0,
    totalAdmins: 0,
    totalVolunteers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(20);
  
  // Modal states
  const [isUserFormModalOpen, setIsUserFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBulkRoleChangeModalOpen, setIsBulkRoleChangeModalOpen] = useState(false);
  const [isRoleHistoryModalOpen, setIsRoleHistoryModalOpen] = useState(false);
  const [historyUserId, setHistoryUserId] = useState<string | null>(null);
  const [historyUserName, setHistoryUserName] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [usersToDelete, setUsersToDelete] = useState<User[]>([]);
  const [isOperationLoading, setIsOperationLoading] = useState(false);

  // Redirect if not admin
  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!session || session.user.role !== UserRole.ADMIN) {
    redirect('/dashboard');
  }

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await secureFetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
        setStats({
          totalUsers: data.users?.length || 0,
          totalCustomers: data.users?.filter((u: User) => u.role === 'CUSTOMER').length || 0,
          totalLearners: data.users?.filter((u: User) => u.role === 'LEARNER').length || 0,
          totalAdmins: data.users?.filter((u: User) => u.role === 'ADMIN').length || 0,
          totalVolunteers: data.users?.filter((u: User) => u.role === 'VOLUNTEER').length || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // CRUD Operations
  const handleCreateUser = async (userData: any) => {
    setIsOperationLoading(true);
    try {
      const response = await secureFetch('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        await fetchUsers();
        setIsUserFormModalOpen(false);
        setEditingUser(null);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Failed to create user. Please try again.');
    } finally {
      setIsOperationLoading(false);
    }
  };

  const handleUpdateUser = async (userData: any) => {
    if (!editingUser) return;
    
    setIsOperationLoading(true);
    try {
      const response = await secureFetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        await fetchUsers();
        setIsUserFormModalOpen(false);
        setEditingUser(null);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user. Please try again.');
    } finally {
      setIsOperationLoading(false);
    }
  };

  const handleDeleteUsers = async () => {
    if (usersToDelete.length === 0) return;

    setIsOperationLoading(true);
    try {
      const deletePromises = usersToDelete.map(user =>
        secureFetch(`/api/admin/users/${user.id}`, {
          method: 'DELETE',
        })
      );

      const results = await Promise.all(deletePromises);
      const failed = results.filter(response => !response.ok);

      if (failed.length > 0) {
        throw new Error(`Failed to delete ${failed.length} user(s)`);
      }

      await fetchUsers();
      setIsDeleteModalOpen(false);
      setUsersToDelete([]);
      setSelectedUsers([]);
    } catch (error) {
      console.error('Error deleting users:', error);
      alert('Failed to delete user(s). Please try again.');
    } finally {
      setIsOperationLoading(false);
    }
  };

  const handleBulkRoleChange = async (newRole: UserRole) => {
    if (selectedUsers.length === 0) return;

    setIsOperationLoading(true);
    try {
      const response = await secureFetch('/api/admin/users/bulk-update', {
        method: 'POST',
        body: JSON.stringify({
          userIds: selectedUsers,
          newRole: newRole,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        await fetchUsers();
        setIsBulkRoleChangeModalOpen(false);
        setSelectedUsers([]);
        
        // Show success message with details
        let message = result.message || `Successfully updated ${result.updatedCount} user(s)`;
        if (result.errors && result.errors.length > 0) {
          message += `\n\nWarnings:\n${result.errors.join('\n')}`;
        }
        alert(message);
      } else {
        throw new Error(result.error || 'Failed to update user roles');
      }
    } catch (error) {
      console.error('Error updating user roles:', error);
      alert('Failed to update user roles. Please try again.');
    } finally {
      setIsOperationLoading(false);
    }
  };

  // Modal handlers
  const openCreateModal = () => {
    setEditingUser(null);
    setIsUserFormModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setIsUserFormModalOpen(true);
  };

  const openDeleteModal = (users: User[]) => {
    setUsersToDelete(users);
    setIsDeleteModalOpen(true);
  };

  const openBulkRoleChangeModal = () => {
    setIsBulkRoleChangeModalOpen(true);
  };

  const openRoleHistoryModal = (userId?: string, userName?: string) => {
    setHistoryUserId(userId || null);
    setHistoryUserName(userName || null);
    setIsRoleHistoryModalOpen(true);
  };

  const closeModals = () => {
    setIsUserFormModalOpen(false);
    setIsDeleteModalOpen(false);
    setIsBulkRoleChangeModalOpen(false);
    setIsRoleHistoryModalOpen(false);
    setHistoryUserId(null);
    setHistoryUserName(null);
    setEditingUser(null);
    setUsersToDelete([]);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'ALL' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const statsDisplay = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'bg-blue-500' },
    { label: 'Customers', value: stats.totalCustomers, icon: Users, color: 'bg-indigo-500' },
    { label: 'Learners', value: stats.totalLearners, icon: BookOpen, color: 'bg-green-500' },
    { label: 'Volunteers', value: stats.totalVolunteers, icon: Clock, color: 'bg-purple-500' },
    { label: 'Admins', value: stats.totalAdmins, icon: Shield, color: 'bg-red-500' },
  ];

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllUsers = () => {
    if (selectedUsers.length === paginatedUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(paginatedUsers.map(user => user.id));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
              <p className="text-sm text-gray-600 mt-1">Manage platform users and their roles</p>
            </div>
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Download className="w-4 h-4" />
                Export
              </button>
              <button 
                onClick={() => openRoleHistoryModal()}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <History className="w-4 h-4" />
                Role History
              </button>
              <button 
                onClick={openCreateModal}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                Add User
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsDisplay.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg text-white`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">All Roles</option>
              <option value="CUSTOMER">Customers</option>
              <option value="LEARNER">Learners</option>
              <option value="TEACHER">Teachers</option>
              <option value="INSTITUTION">Institutions</option>
              <option value="VOLUNTEER">Volunteers</option>
              <option value="ADMIN">Admins</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <input
                  type="checkbox"
                  checked={selectedUsers.length === paginatedUsers.length && paginatedUsers.length > 0}
                  onChange={selectAllUsers}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">
                  {selectedUsers.length} of {filteredUsers.length} users selected
                </span>
              </div>
              {selectedUsers.length > 0 && (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={openBulkRoleChangeModal}
                    className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Change Role
                  </button>
                  <button 
                    onClick={() => {
                      const usersToDelete = paginatedUsers.filter(user => selectedUsers.includes(user.id));
                      openDeleteModal(usersToDelete);
                    }}
                    className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                  >
                    Delete Selected
                  </button>
                </div>
              )}
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading users...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stories
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Orders
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedUsers.map((user) => {
                    const config = roleConfig[user.role];
                    const RoleIcon = config.icon;
                    
                    return (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={selectedUsers.includes(user.id)}
                              onChange={() => toggleUserSelection(user.id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700">
                                {user.name?.[0]?.toUpperCase() || 'U'}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{user.name || 'Unnamed User'}</p>
                              <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                            <RoleIcon className="w-3 h-3" />
                            {config.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user._count?.stories || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user._count?.orders || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              className="text-blue-600 hover:text-blue-900"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => openEditModal(user)}
                              className="text-gray-600 hover:text-gray-900"
                              title="Edit User"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => openRoleHistoryModal(user.id, user.name)}
                              className="text-purple-600 hover:text-purple-900"
                              title="View Role History"
                            >
                              <History className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => openDeleteModal([user])}
                              className="text-red-600 hover:text-red-900"
                              title="Delete User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <button className="text-gray-600 hover:text-gray-900">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Showing {(currentPage - 1) * usersPerPage + 1} to {Math.min(currentPage * usersPerPage, filteredUsers.length)} of {filteredUsers.length} users
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <UserFormModal
        isOpen={isUserFormModalOpen}
        onClose={closeModals}
        onSubmit={editingUser ? handleUpdateUser : handleCreateUser}
        user={editingUser}
        isLoading={isOperationLoading}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={closeModals}
        onConfirm={handleDeleteUsers}
        users={usersToDelete}
        isLoading={isOperationLoading}
      />

      <BulkRoleChangeModal
        isOpen={isBulkRoleChangeModalOpen}
        onClose={closeModals}
        selectedUsers={users.filter(user => selectedUsers.includes(user.id))}
        onRoleChange={handleBulkRoleChange}
        isLoading={isOperationLoading}
      />

      <RoleHistoryModal
        isOpen={isRoleHistoryModalOpen}
        onClose={closeModals}
        userId={historyUserId}
        userName={historyUserName ?? undefined}
      />
    </div>
  );
}