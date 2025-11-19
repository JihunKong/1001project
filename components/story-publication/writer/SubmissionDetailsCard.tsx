'use client';

import { StatusBadge } from '../shared';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface SubmissionDetailsCardProps {
  status?: string;
  submittedAt?: Date | string | null;
  updatedAt?: Date | string | null;
  createdAt?: Date | string | null;
  wordCount?: number;
}

export default function SubmissionDetailsCard({
  status = 'DRAFT',
  submittedAt,
  updatedAt,
  createdAt,
  wordCount = 0,
}: SubmissionDetailsCardProps) {
  const { t } = useTranslation();
  const formatDate = (date?: Date | string | null) => {
    if (!date) return t('dashboard.writer.details.notSaved');
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-white border border-[#E5E5EA] rounded-lg p-6 flex flex-col gap-[11px]">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <h3
              className="text-[#141414]"
              style={{
                fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                fontSize: '20px',
                fontWeight: 500,
                lineHeight: '1.221'
              }}
            >
              {t('dashboard.writer.details.title')}
            </h3>
          </div>

          <div className="flex justify-between items-center gap-2">
            <span
              className="text-[#8E8E93]"
              style={{
                fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                fontSize: '16px',
                fontWeight: 400,
                lineHeight: '1.193',
                width: '81px'
              }}
            >
              {t('dashboard.writer.details.status')}
            </span>
            <StatusBadge status={status} />
          </div>

          <div className="flex justify-between items-center gap-2">
            <span
              className="text-[#8E8E93]"
              style={{
                fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                fontSize: '16px',
                fontWeight: 400,
                lineHeight: '1.193'
              }}
            >
              {t('dashboard.writer.details.lastSaved')}
            </span>
            <span
              className="text-[#141414]"
              style={{
                fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                fontSize: '14px',
                fontWeight: 500,
                lineHeight: '1.221'
              }}
            >
              {formatDate(updatedAt || createdAt)}
            </span>
          </div>

          <div className="flex justify-between items-center gap-2">
            <span
              className="text-[#8E8E93]"
              style={{
                fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                fontSize: '16px',
                fontWeight: 400,
                lineHeight: '1.193'
              }}
            >
              {t('dashboard.writer.details.wordCount')}
            </span>
            <span
              className="text-[#141414]"
              style={{
                fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                fontSize: '14px',
                fontWeight: 500,
                lineHeight: '1.221'
              }}
            >
              {wordCount}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
