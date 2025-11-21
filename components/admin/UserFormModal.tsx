'use client';

import { useState, useEffect } from 'react';
import { User, UserRole } from '@prisma/client';
import { X, AlertCircle } from 'lucide-react';

interface UserWithProfile extends User {
  profile?: {
    firstName?: string | null;
    lastName?: string | null;
    bio?: string | null;
    organization?: string | null;
    phone?: string | null;
    location?: string | null;
  } | null;
}

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UserFormData) => Promise<void>;
  user?: UserWithProfile | null;
  mode: 'create' | 'edit';
}

export interface UserFormData {
  email: string;
  name: string;
  role: UserRole;
  password?: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    bio?: string;
    organization?: string;
    phone?: string;
    location?: string;
  };
}

const USER_ROLES: { value: UserRole; label: string; description: string }[] = [
  { value: 'LEARNER', label: 'Learner', description: 'Student with reading access' },
  { value: 'TEACHER', label: 'Teacher', description: 'Manages classes and assigns books' },
  { value: 'INSTITUTION', label: 'Institution', description: 'Manages teachers and institution' },
  { value: 'WRITER', label: 'Writer', description: 'Submits stories for publishing' },
  { value: 'STORY_MANAGER', label: 'Story Manager', description: 'Reviews and approves stories' },
  { value: 'BOOK_MANAGER', label: 'Book Manager', description: 'Manages publication pipeline' },
  { value: 'CONTENT_ADMIN', label: 'Content Admin', description: 'Final content approval' },
  { value: 'ADMIN', label: 'Admin', description: 'Full system administration' }
];

export function UserFormModal({
  isOpen,
  onClose,
  onSubmit,
  user,
  mode
}: UserFormModalProps) {
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    name: '',
    role: 'LEARNER',
    password: '',
    profile: {
      firstName: '',
      lastName: '',
      bio: '',
      organization: '',
      phone: '',
      location: ''
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && user && mode === 'edit') {
      setFormData({
        email: user.email || '',
        name: user.name || '',
        role: user.role,
        password: '',
        profile: {
          firstName: user.profile?.firstName || '',
          lastName: user.profile?.lastName || '',
          bio: user.profile?.bio || '',
          organization: user.profile?.organization || '',
          phone: user.profile?.phone || '',
          location: user.profile?.location || ''
        }
      });
    } else if (isOpen && mode === 'create') {
      setFormData({
        email: '',
        name: '',
        role: 'LEARNER',
        password: '',
        profile: {
          firstName: '',
          lastName: '',
          bio: '',
          organization: '',
          phone: '',
          location: ''
        }
      });
    }
    setError(null);
  }, [isOpen, user, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const submitData: UserFormData = {
        email: formData.email,
        name: formData.name,
        role: formData.role
      };

      if (formData.password && formData.password.trim() !== '') {
        submitData.password = formData.password;
      }

      const hasProfileData = Object.values(formData.profile || {}).some(
        (value) => value && value.trim() !== ''
      );

      if (hasProfileData) {
        submitData.profile = Object.entries(formData.profile || {}).reduce(
          (acc, [key, value]) => {
            if (value && value.trim() !== '') {
              acc[key as keyof typeof acc] = value;
            }
            return acc;
          },
          {} as NonNullable<UserFormData['profile']>
        );
      }

      await onSubmit(submitData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {mode === 'create' ? 'Create New User' : 'Edit User'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">Error</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-soe-green-500 focus:border-transparent"
                placeholder="user@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-soe-green-500 focus:border-transparent"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value as UserRole })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-soe-green-500 focus:border-transparent"
              >
                {USER_ROLES.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label} - {role.description}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password {mode === 'create' && <span className="text-red-500">*</span>}
                {mode === 'edit' && <span className="text-gray-500">(leave blank to keep current)</span>}
              </label>
              <input
                type="password"
                required={mode === 'create'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-soe-green-500 focus:border-transparent"
                placeholder={mode === 'create' ? 'Min 8 characters' : 'Leave blank to keep current'}
                minLength={8}
              />
            </div>
          </div>

          <div className="space-y-4 border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900">Profile Information (Optional)</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  value={formData.profile?.firstName || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      profile: { ...formData.profile, firstName: e.target.value }
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-soe-green-500 focus:border-transparent"
                  placeholder="John"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={formData.profile?.lastName || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      profile: { ...formData.profile, lastName: e.target.value }
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-soe-green-500 focus:border-transparent"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization
              </label>
              <input
                type="text"
                value={formData.profile?.organization || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    profile: { ...formData.profile, organization: e.target.value }
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-soe-green-500 focus:border-transparent"
                placeholder="Organization name"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.profile?.phone || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      profile: { ...formData.profile, phone: e.target.value }
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-soe-green-500 focus:border-transparent"
                  placeholder="+1234567890"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.profile?.location || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      profile: { ...formData.profile, location: e.target.value }
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-soe-green-500 focus:border-transparent"
                  placeholder="City, Country"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bio
              </label>
              <textarea
                value={formData.profile?.bio || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    profile: { ...formData.profile, bio: e.target.value }
                  })
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-soe-green-500 focus:border-transparent"
                placeholder="Brief biography..."
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-soe-green-600 rounded-lg hover:bg-soe-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : mode === 'create' ? 'Create User' : 'Update User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
