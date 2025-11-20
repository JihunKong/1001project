'use client';

import { useTranslation } from '@/lib/i18n/useTranslation';

interface PasswordRequirementsProps {
  requirements: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
  };
  show: boolean;
}

export default function PasswordRequirements({ requirements, show }: PasswordRequirementsProps) {
  const { t } = useTranslation();

  if (!show) return null;

  return (
    <div className="mt-2 p-3 bg-gray-50 rounded border border-gray-200">
      <p className="text-xs font-medium text-gray-700 mb-2">
        {t('auth.common.form.password.requirements.title')}
      </p>
      <ul className="space-y-1">
        <RequirementItem
          met={requirements.minLength}
          text={t('auth.common.form.password.requirements.minLength')}
        />
        <RequirementItem
          met={requirements.hasUppercase}
          text={t('auth.common.form.password.requirements.uppercase')}
        />
        <RequirementItem
          met={requirements.hasLowercase}
          text={t('auth.common.form.password.requirements.lowercase')}
        />
        <RequirementItem
          met={requirements.hasNumber}
          text={t('auth.common.form.password.requirements.number')}
        />
      </ul>
    </div>
  );
}

interface RequirementItemProps {
  met: boolean;
  text: string;
}

function RequirementItem({ met, text }: RequirementItemProps) {
  return (
    <li className="flex items-center text-xs">
      <span className={`mr-2 ${met ? 'text-green-500' : 'text-gray-400'}`}>
        {met ? '✓' : '✗'}
      </span>
      <span className={met ? 'text-green-700' : 'text-gray-600'}>
        {text}
      </span>
    </li>
  );
}
