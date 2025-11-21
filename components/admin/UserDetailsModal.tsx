'use client';

import { User, UserRole } from '@prisma/client';
import {
  X,
  Mail,
  Calendar,
  Shield,
  CheckCircle,
  XCircle,
  User as UserIcon,
  Building,
  Phone,
  MapPin,
  FileText,
  BookOpen,
  Users
} from 'lucide-react';

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

interface UserDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserWithProfile | null;
  onEdit?: () => void;
}

export function UserDetailsModal({
  isOpen,
  onClose,
  user,
  onEdit
}: UserDetailsModalProps) {
  if (!isOpen || !user) return null;

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

  const InfoRow = ({
    icon: Icon,
    label,
    value
  }: {
    icon: React.ElementType;
    label: string;
    value: React.ReactNode;
  }) => (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      <Icon className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="text-sm text-gray-900 mt-1 break-words">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">User Details</h2>
            <p className="text-sm text-gray-500 mt-1">
              {user.deletedAt ? 'Deleted Account' : 'Active Account'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4 pb-6 border-b border-gray-200">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-soe-green-400 to-soe-green-600 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900">{user.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(
                    user.role
                  )}`}
                >
                  {user.role}
                </span>
                {user.deletedAt ? (
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                    Deleted
                  </span>
                ) : (
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                    Active
                  </span>
                )}
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              Basic Information
            </h4>
            <div className="space-y-1">
              <InfoRow icon={Mail} label="Email" value={user.email} />
              <InfoRow
                icon={user.emailVerified ? CheckCircle : XCircle}
                label="Email Verified"
                value={
                  <span
                    className={
                      user.emailVerified ? 'text-green-600' : 'text-red-600'
                    }
                  >
                    {user.emailVerified ? 'Verified' : 'Not Verified'}
                  </span>
                }
              />
              <InfoRow icon={Shield} label="Role" value={user.role} />
              <InfoRow
                icon={Calendar}
                label="Created At"
                value={new Date(user.createdAt).toLocaleString()}
              />
              <InfoRow
                icon={Calendar}
                label="Updated At"
                value={new Date(user.updatedAt).toLocaleString()}
              />
              {user.deletedAt && (
                <InfoRow
                  icon={Calendar}
                  label="Deleted At"
                  value={new Date(user.deletedAt).toLocaleString()}
                />
              )}
            </div>
          </div>

          {user.profile && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                Profile Information
              </h4>
              <div className="space-y-1">
                {(user.profile.firstName || user.profile.lastName) && (
                  <InfoRow
                    icon={UserIcon}
                    label="Full Name"
                    value={[user.profile.firstName, user.profile.lastName]
                      .filter(Boolean)
                      .join(' ')}
                  />
                )}
                {user.profile.organization && (
                  <InfoRow
                    icon={Building}
                    label="Organization"
                    value={user.profile.organization}
                  />
                )}
                {user.profile.phone && (
                  <InfoRow
                    icon={Phone}
                    label="Phone"
                    value={user.profile.phone}
                  />
                )}
                {user.profile.location && (
                  <InfoRow
                    icon={MapPin}
                    label="Location"
                    value={user.profile.location}
                  />
                )}
                {user.profile.bio && (
                  <InfoRow
                    icon={FileText}
                    label="Bio"
                    value={user.profile.bio}
                  />
                )}
              </div>
            </div>
          )}

          {user._count && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                Activity Statistics
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <Users className="h-4 w-4" />
                    <span className="text-xs">Sessions</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {user._count.sessions}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <FileText className="h-4 w-4" />
                    <span className="text-xs">Submissions</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {user._count.submissions}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <BookOpen className="h-4 w-4" />
                    <span className="text-xs">Classes</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {user._count.enrolledClasses +
                      (user._count.teachingClasses || 0)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          {onEdit && !user.deletedAt && (
            <button
              onClick={onEdit}
              className="px-4 py-2 text-sm font-medium text-white bg-soe-green-600 rounded-lg hover:bg-soe-green-700"
            >
              Edit User
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
