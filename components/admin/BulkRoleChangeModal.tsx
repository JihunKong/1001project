'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Crown,
  BookOpen,
  Clock,
  AlertCircle,
  Shield,
  User
} from 'lucide-react';
import { UserRole } from '@prisma/client';

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

interface BulkRoleChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedUsers: User[];
  onRoleChange: (newRole: UserRole) => Promise<void>;
  isLoading: boolean;
}

const roleConfig = {
  CUSTOMER: {
    label: 'Customer',
    icon: User,
    color: 'bg-gray-100 text-gray-800',
    description: 'Basic platform access with purchase capabilities'
  },
  LEARNER: {
    label: 'Learner',
    icon: BookOpen,
    color: 'bg-blue-100 text-blue-800',
    description: 'Full learning platform access'
  },
  TEACHER: {
    label: 'Teacher',
    icon: Users,
    color: 'bg-green-100 text-green-800',
    description: 'Educator access with class management'
  },
  INSTITUTION: {
    label: 'Institution',
    icon: Shield,
    color: 'bg-purple-100 text-purple-800',
    description: 'Organizational account with bulk management'
  },
  VOLUNTEER: {
    label: 'Volunteer',
    icon: CheckCircle,
    color: 'bg-yellow-100 text-yellow-800',
    description: 'Content contributor and community helper'
  },
  EDITOR: {
    label: 'Editor',
    icon: BookOpen,
    color: 'bg-purple-100 text-purple-800',
    description: 'Review and edit story submissions'
  },
  PUBLISHER: {
    label: 'Publisher',
    icon: CheckCircle,
    color: 'bg-emerald-100 text-emerald-800',
    description: 'Approve stories for publication'
  },
  ADMIN: {
    label: 'Administrator',
    icon: Crown,
    color: 'bg-red-100 text-red-800',
    description: 'Full system access and user management'
  }
};

export default function BulkRoleChangeModal({
  isOpen,
  onClose,
  selectedUsers,
  onRoleChange,
  isLoading
}: BulkRoleChangeModalProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setShowConfirmation(true);
  };

  const handleConfirm = async () => {
    if (selectedRole) {
      await onRoleChange(selectedRole);
      setShowConfirmation(false);
      setSelectedRole(null);
    }
  };

  const handleCancel = () => {
    setShowConfirmation(false);
    setSelectedRole(null);
  };

  const handleClose = () => {
    handleCancel();
    onClose();
  };

  // Group users by current role for better visualization
  const usersByRole = selectedUsers.reduce((acc, user) => {
    const role = user.role;
    if (!acc[role]) acc[role] = [];
    acc[role].push(user);
    return acc;
  }, {} as Record<UserRole, User[]>);

  // Check for admin users in selection
  const adminUsers = selectedUsers.filter(user => user.role === 'ADMIN');
  const hasAdminUsers = adminUsers.length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users className="w-6 h-6 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900">
                    Bulk Role Change
                  </h2>
                </div>
                <button
                  onClick={handleClose}
                  disabled={isLoading}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {!showConfirmation ? (
                <>
                  {/* Selected Users Summary */}
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">
                      Selected Users ({selectedUsers.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-40 overflow-y-auto bg-gray-50 p-4 rounded-lg">
                      {Object.entries(usersByRole).map(([role, users]) => {
                        const config = roleConfig[role as UserRole];
                        const RoleIcon = config.icon;
                        return (
                          <div key={role} className="flex items-center gap-2 text-sm">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
                              <RoleIcon className="w-3 h-3" />
                              {config.label}
                            </span>
                            <span className="text-gray-600">({users.length})</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Admin Warning */}
                  {hasAdminUsers && (
                    <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                        <div>
                          <h4 className="text-amber-800 font-medium">Administrator Warning</h4>
                          <p className="text-amber-700 text-sm mt-1">
                            You have selected {adminUsers.length} administrator(s). 
                            Changing their role will remove their admin privileges. 
                            Make sure at least one admin remains in the system.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Role Selection */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Select New Role
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(roleConfig).map(([role, config]) => {
                        const RoleIcon = config.icon;
                        return (
                          <button
                            key={role}
                            onClick={() => handleRoleSelect(role as UserRole)}
                            disabled={isLoading}
                            className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <div className="flex items-center gap-3 mb-2">
                              <RoleIcon className="w-5 h-5 text-gray-600" />
                              <span className="font-medium text-gray-900">{config.label}</span>
                            </div>
                            <p className="text-sm text-gray-600">{config.description}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
                /* Confirmation Dialog */
                <div className="text-center">
                  <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <AlertCircle className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Confirm Role Change
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Are you sure you want to change the role of {selectedUsers.length} user(s) to{' '}
                    <span className="font-medium text-gray-900">
                      {selectedRole && roleConfig[selectedRole].label}
                    </span>?
                  </p>

                  {/* Role Change Preview */}
                  <div className="bg-gray-50 p-4 rounded-lg mb-6 text-left">
                    <h4 className="font-medium text-gray-900 mb-3">Changes Preview:</h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {selectedUsers.map(user => {
                        const oldConfig = roleConfig[user.role];
                        const newConfig = selectedRole ? roleConfig[selectedRole] : null;
                        if (!newConfig) return null;

                        return (
                          <div key={user.id} className="flex items-center justify-between text-sm">
                            <span className="text-gray-900">{user.name || user.email}</span>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded text-xs ${oldConfig.color}`}>
                                {oldConfig.label}
                              </span>
                              <span className="text-gray-400">→</span>
                              <span className={`px-2 py-1 rounded text-xs ${newConfig.color}`}>
                                {newConfig.label}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={handleCancel}
                      disabled={isLoading}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirm}
                      disabled={isLoading}
                      className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Confirm Change
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}