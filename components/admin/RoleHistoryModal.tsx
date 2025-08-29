'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  History, 
  ArrowRight,
  Calendar,
  User,
  Shield,
  BookOpen,
  Clock,
  CheckCircle,
  AlertTriangle,
  Crown,
  Users,
  ChevronLeft,
  ChevronRight,
  Eye,
  MessageSquare
} from 'lucide-react';
import { UserRole } from '@prisma/client';
import { useSecureFetch } from '@/lib/csrf-context';

interface RoleMigration {
  id: string;
  userId: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
  fromRole: UserRole;
  toRole: UserRole;
  migrationType: string;
  migrationReason: string | null;
  status: string;
  initiatedAt: string;
  completedAt: string | null;
  notificationSent: boolean;
  userAcknowledged: boolean;
  satisfactionRating: number | null;
  feedbackProvided: boolean;
}

interface RoleHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string | null; // If provided, show history for specific user
  userName?: string; // Display name for specific user
}

const roleConfig = {
  CUSTOMER: {
    label: 'Customer',
    icon: User,
    color: 'bg-gray-100 text-gray-800'
  },
  LEARNER: {
    label: 'Learner',
    icon: BookOpen,
    color: 'bg-blue-100 text-blue-800'
  },
  TEACHER: {
    label: 'Teacher',
    icon: Users,
    color: 'bg-green-100 text-green-800'
  },
  INSTITUTION: {
    label: 'Institution',
    icon: Shield,
    color: 'bg-purple-100 text-purple-800'
  },
  VOLUNTEER: {
    label: 'Volunteer',
    icon: CheckCircle,
    color: 'bg-yellow-100 text-yellow-800'
  },
  ADMIN: {
    label: 'Administrator',
    icon: Crown,
    color: 'bg-red-100 text-red-800'
  }
};

const statusConfig = {
  IN_PROGRESS: { label: 'In Progress', color: 'bg-yellow-100 text-yellow-800' },
  COMPLETED: { label: 'Completed', color: 'bg-green-100 text-green-800' },
  FAILED: { label: 'Failed', color: 'bg-red-100 text-red-800' },
  CANCELLED: { label: 'Cancelled', color: 'bg-gray-100 text-gray-800' },
  REVERSED: { label: 'Reversed', color: 'bg-orange-100 text-orange-800' }
};

const migrationTypeConfig = {
  SYSTEM_MIGRATION: { label: 'System Migration', icon: Shield },
  USER_REQUESTED: { label: 'User Requested', icon: User },
  ADMIN_ASSIGNED: { label: 'Admin Assigned', icon: Crown },
  AUTOMATIC_UPGRADE: { label: 'Automatic Upgrade', icon: ArrowRight }
};

export default function RoleHistoryModal({
  isOpen,
  onClose,
  userId = null,
  userName
}: RoleHistoryModalProps) {
  const secureFetch = useSecureFetch();
  const [migrations, setMigrations] = useState<RoleMigration[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedMigration, setSelectedMigration] = useState<RoleMigration | null>(null);

  const fetchMigrations = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });
      
      if (userId) {
        params.append('userId', userId);
      }

      const response = await secureFetch(`/api/admin/role-migrations?${params}`);
      const data = await response.json();

      if (response.ok) {
        setMigrations(data.migrations);
        setTotalPages(data.pagination.totalPages);
        setCurrentPage(page);
      } else {
        console.error('Failed to fetch role migrations:', data.error);
      }
    } catch (error) {
      console.error('Error fetching role migrations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMigrations(1);
    }
  }, [isOpen, userId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getRoleIcon = (role: UserRole) => {
    const config = roleConfig[role];
    return config ? config.icon : User;
  };

  const getRoleConfig = (role: UserRole) => {
    return roleConfig[role] || { label: role, icon: User, color: 'bg-gray-100 text-gray-800' };
  };

  if (selectedMigration) {
    return (
      <AnimatePresence>
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setSelectedMigration(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-semibold text-gray-900">Migration Details</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* User Info */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">User Information</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Name: <span className="text-gray-900">{selectedMigration.user.name}</span></p>
                  <p className="text-sm text-gray-600">Email: <span className="text-gray-900">{selectedMigration.user.email}</span></p>
                </div>
              </div>

              {/* Role Change */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Role Change</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {(() => {
                      const fromConfig = getRoleConfig(selectedMigration.fromRole);
                      const FromIcon = fromConfig.icon;
                      return (
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${fromConfig.color}`}>
                          <FromIcon className="w-4 h-4" />
                          {fromConfig.label}
                        </span>
                      );
                    })()}
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                  <div className="flex items-center gap-2">
                    {(() => {
                      const toConfig = getRoleConfig(selectedMigration.toRole);
                      const ToIcon = toConfig.icon;
                      return (
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${toConfig.color}`}>
                          <ToIcon className="w-4 h-4" />
                          {toConfig.label}
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Migration Details */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Migration Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Type</p>
                    <p className="text-sm text-gray-900">{migrationTypeConfig[selectedMigration.migrationType as keyof typeof migrationTypeConfig]?.label || selectedMigration.migrationType}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Status</p>
                    <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${statusConfig[selectedMigration.status as keyof typeof statusConfig]?.color || 'bg-gray-100 text-gray-800'}`}>
                      {statusConfig[selectedMigration.status as keyof typeof statusConfig]?.label || selectedMigration.status}
                    </span>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Initiated</p>
                    <p className="text-sm text-gray-900">{formatDate(selectedMigration.initiatedAt)}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Completed</p>
                    <p className="text-sm text-gray-900">
                      {selectedMigration.completedAt ? formatDate(selectedMigration.completedAt) : 'Not completed'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Reason */}
              {selectedMigration.migrationReason && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Reason</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-900">{selectedMigration.migrationReason}</p>
                  </div>
                </div>
              )}

              {/* User Interaction */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">User Interaction</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${selectedMigration.notificationSent ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="text-sm text-gray-900">Notification Sent</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${selectedMigration.userAcknowledged ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="text-sm text-gray-900">User Acknowledged</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${selectedMigration.feedbackProvided ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="text-sm text-gray-900">Feedback Provided</span>
                  </div>
                  {selectedMigration.satisfactionRating && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Rating:</span>
                      <span className="text-sm text-gray-900">{selectedMigration.satisfactionRating}/5</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <History className="w-6 h-6 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900">
                    {userId ? `Role History - ${userName}` : 'Role Change History'}
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Loading history...</span>
                </div>
              ) : migrations.length === 0 ? (
                <div className="text-center py-8">
                  <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No role changes found</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {migrations.map((migration) => {
                      const fromConfig = getRoleConfig(migration.fromRole);
                      const toConfig = getRoleConfig(migration.toRole);
                      const FromIcon = fromConfig.icon;
                      const ToIcon = toConfig.icon;
                      
                      return (
                        <div
                          key={migration.id}
                          className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => setSelectedMigration(migration)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              {!userId && (
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{migration.user.name}</p>
                                  <p className="text-xs text-gray-600">{migration.user.email}</p>
                                </div>
                              )}
                              
                              <div className="flex items-center gap-3">
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${fromConfig.color}`}>
                                  <FromIcon className="w-3 h-3" />
                                  {fromConfig.label}
                                </span>
                                <ArrowRight className="w-4 h-4 text-gray-400" />
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${toConfig.color}`}>
                                  <ToIcon className="w-3 h-3" />
                                  {toConfig.label}
                                </span>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <p className="text-xs text-gray-600">{formatDate(migration.initiatedAt)}</p>
                              <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${statusConfig[migration.status as keyof typeof statusConfig]?.color || 'bg-gray-100 text-gray-800'}`}>
                                {statusConfig[migration.status as keyof typeof statusConfig]?.label || migration.status}
                              </span>
                            </div>
                          </div>
                          
                          {migration.migrationReason && (
                            <p className="text-xs text-gray-600 mt-2 italic">{migration.migrationReason}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-600">
                        Page {currentPage} of {totalPages}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => fetchMigrations(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => fetchMigrations(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}