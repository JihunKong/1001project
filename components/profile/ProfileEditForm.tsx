'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { useTranslation } from '@/lib/i18n/useTranslation';

const profileEditSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  avatarUrl: z.string().url('Must be a valid URL').optional().nullable()
});

type ProfileEditFormData = z.infer<typeof profileEditSchema>;

interface ProfileEditFormProps {
  user: {
    id: string;
    name: string | null;
    email: string;
    image?: string | null;
    profile?: {
      bio?: string | null;
      tags?: string[];
      avatarUrl?: string | null;
    } | null;
  };
}

export function ProfileEditForm({ user }: ProfileEditFormProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tags, setTags] = useState<string[]>(user.profile?.tags || []);
  const [newTag, setNewTag] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    user.profile?.avatarUrl || user.image || null
  );

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<ProfileEditFormData>({
    resolver: zodResolver(profileEditSchema),
    defaultValues: {
      name: user.name || '',
      bio: user.profile?.bio || '',
      avatarUrl: user.profile?.avatarUrl || user.image || ''
    }
  });

  const handleAddTag = () => {
    if (!newTag.trim()) return;
    if (tags.length >= 10) {
      alert(t('profile.edit.maxTags'));
      return;
    }

    const tagWithHash = newTag.startsWith('#') ? newTag : `#${newTag}`;
    if (!tags.includes(tagWithHash)) {
      setTags([...tags, tagWithHash]);
    }
    setNewTag('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const onSubmit = async (data: ProfileEditFormData) => {
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/profile/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...data,
          tags
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      alert(t('profile.edit.success'));
      router.push('/profile');
      router.refresh();
    } catch (error) {
      alert(t('profile.edit.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAvatarUrlChange = (url: string) => {
    setValue('avatarUrl', url);
    setAvatarPreview(url);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="space-y-6">
        <div>
          <label
            htmlFor="avatar"
            className="block text-[#141414] font-medium mb-4"
            style={{ fontSize: '18px' }}
          >
            {t('profile.edit.avatar')}
          </label>
          <div className="flex items-center gap-6">
            <div className="w-[100px] h-[100px] rounded-full bg-[#E5E5EA] flex items-center justify-center overflow-hidden">
              {avatarPreview ? (
                <Image
                  src={avatarPreview}
                  alt={user.name || 'Profile'}
                  width={100}
                  height={100}
                  className="object-cover"
                />
              ) : (
                <span className="text-4xl text-[#8E8E93]">
                  {user.name?.[0]?.toUpperCase() || 'U'}
                </span>
              )}
            </div>
            <div className="flex-1">
              <input
                type="text"
                placeholder={t('profile.edit.avatarUrlPlaceholder')}
                onChange={(e) => handleAvatarUrlChange(e.target.value)}
                className="w-full px-4 py-2 border border-[#E5E5EA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                style={{ fontSize: '16px' }}
              />
              {errors.avatarUrl && (
                <p className="text-red-600 text-sm mt-1">{errors.avatarUrl.message}</p>
              )}
            </div>
          </div>
        </div>

        <div>
          <label
            htmlFor="name"
            className="block text-[#141414] font-medium mb-2"
            style={{ fontSize: '18px' }}
          >
            {t('profile.edit.name')}
          </label>
          <input
            {...register('name')}
            type="text"
            id="name"
            className="w-full px-4 py-2 border border-[#E5E5EA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
            style={{ fontSize: '16px' }}
          />
          {errors.name && (
            <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="bio"
            className="block text-[#141414] font-medium mb-2"
            style={{ fontSize: '18px' }}
          >
            {t('profile.edit.bio')}
          </label>
          <textarea
            {...register('bio')}
            id="bio"
            rows={4}
            className="w-full px-4 py-2 border border-[#E5E5EA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
            style={{ fontSize: '16px' }}
          />
          {errors.bio && (
            <p className="text-red-600 text-sm mt-1">{errors.bio.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="tags"
            className="block text-[#141414] font-medium mb-2"
            style={{ fontSize: '18px' }}
          >
            {t('profile.edit.tags')}
          </label>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E5E5EA] text-[#141414]"
                  style={{ fontSize: '14px' }}
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-red-600 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              placeholder={t('profile.edit.tagPlaceholder')}
              className="flex-1 px-4 py-2 border border-[#E5E5EA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
              style={{ fontSize: '16px' }}
            />
            <button
              type="button"
              onClick={handleAddTag}
              disabled={tags.length >= 10}
              className="px-4 py-2 bg-[#16A34A] text-white rounded-lg hover:bg-[#15803D] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              style={{ fontSize: '16px', fontWeight: 500 }}
            >
              {t('profile.edit.addTag')}
            </button>
          </div>
          <p className="text-[#8E8E93] text-sm mt-1">
            {tags.length} / 10 tags
          </p>
        </div>
      </div>

      <div className="flex gap-4 pt-6 border-t border-[#E5E5EA]">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-3 bg-[#16A34A] text-white rounded-lg hover:bg-[#15803D] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          style={{ fontSize: '16px', fontWeight: 500 }}
        >
          {isSubmitting ? t('profile.edit.saving') : t('profile.edit.save')}
        </button>
        <button
          type="button"
          onClick={() => router.push('/profile')}
          className="px-6 py-3 border border-[#E5E5EA] text-[#141414] rounded-lg hover:bg-[#F2F2F7] transition-colors"
          style={{ fontSize: '16px', fontWeight: 500 }}
        >
          {t('profile.edit.cancel')}
        </button>
      </div>
    </form>
  );
}
