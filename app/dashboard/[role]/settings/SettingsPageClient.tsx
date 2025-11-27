'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SettingsLayout, ProfileSettingsForm } from '@/components/settings';
import toast from 'react-hot-toast';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface ProfileData {
  name: string;
  bio: string;
  tags: string[];
  avatarUrl: string | null;
  firstName: string;
  lastName: string;
}

interface SettingsPageClientProps {
  role: string;
  initialData: ProfileData;
}

export function SettingsPageClient({ role, initialData }: SettingsPageClientProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (data: Partial<ProfileData>) => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/profile/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save profile');
      }

      toast.success(t('settings.saveSuccess'));
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('settings.saveFailed'));
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.push(`/dashboard/${role}/profile`);
  };

  return (
    <SettingsLayout role={role}>
      <ProfileSettingsForm
        initialData={initialData}
        onSave={handleSave}
        onCancel={handleCancel}
        isSaving={isSaving}
      />
    </SettingsLayout>
  );
}
