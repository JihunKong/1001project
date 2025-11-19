'use client';

import { useTranslation } from '@/lib/i18n/useTranslation';

interface WorkflowStage {
  number: number;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'pending';
}

interface PublishingStatusTimelineProps {
  currentStatus: string;
}

const getWorkflowStages = (currentStatus: string, t: (key: string) => string): WorkflowStage[] => {
  let currentStage = 1;

  switch (currentStatus) {
    case 'DRAFT':
      currentStage = 0;
      break;
    case 'PENDING':
    case 'STORY_REVIEW':
    case 'NEEDS_REVISION':
      currentStage = 2;
      break;
    case 'BOOK_REVIEW':
      currentStage = 3;
      break;
    case 'APPROVED':
    case 'PUBLISHED':
      currentStage = 4;
      break;
    default:
      currentStage = 1;
  }

  return [
    {
      number: 1,
      title: t('dashboard.writer.timeline.stages.submission.title'),
      description: t('dashboard.writer.timeline.stages.submission.description'),
      status: currentStage >= 1 ? 'completed' : 'pending'
    },
    {
      number: 2,
      title: t('dashboard.writer.timeline.stages.review.title'),
      description: t('dashboard.writer.timeline.stages.review.description'),
      status: currentStage === 2 ? 'current' : currentStage > 2 ? 'completed' : 'pending'
    },
    {
      number: 3,
      title: t('dashboard.writer.timeline.stages.approval.title'),
      description: '',
      status: currentStage === 3 ? 'current' : currentStage > 3 ? 'completed' : 'pending'
    },
    {
      number: 4,
      title: t('dashboard.writer.timeline.stages.publishing.title'),
      description: '',
      status: currentStage === 4 ? 'current' : currentStage > 4 ? 'completed' : 'pending'
    }
  ];
};

export default function PublishingStatusTimeline({ currentStatus }: PublishingStatusTimelineProps) {
  const { t } = useTranslation();
  const stages = getWorkflowStages(currentStatus, t);

  return (
    <div className="bg-white border border-[#E5E5EA] rounded-lg p-6 w-[610px]">
      <div className="space-y-10">
        <h3
          className="text-[#141414]"
          style={{
            fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
            fontSize: '24px',
            fontWeight: 500,
            lineHeight: '1.221'
          }}
        >
          {t('dashboard.writer.timeline.title')}
        </h3>

        <div className="relative">
          {stages.map((stage, index) => {
            const isCompleted = stage.status === 'completed';
            const isCurrent = stage.status === 'current';
            const isPending = stage.status === 'pending';
            const showLine = index < stages.length - 1;

            return (
              <div key={stage.number} className="relative">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isCompleted || isCurrent
                          ? 'bg-[#141414]'
                          : 'bg-white border border-[#D1D1D6]'
                      }`}
                    >
                      <span
                        style={{
                          fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                          fontSize: '24px',
                          fontWeight: 500,
                          lineHeight: '1.221',
                          color: isCompleted || isCurrent ? '#FFFFFF' : '#D1D1D6'
                        }}
                      >
                        {stage.number}
                      </span>
                    </div>

                    {showLine && (
                      <div className="w-0 flex-1 mt-1">
                        <div
                          className={`w-0 h-[50px] border-l ${
                            isCompleted ? 'border-[#141414]' : 'border-[#D1D1D6]'
                          }`}
                          style={{
                            borderWidth: '1px',
                            borderStyle: 'dashed'
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <div className={`flex-1 ${showLine ? 'pb-4' : ''}`}>
                    <h4
                      className={isCompleted || isCurrent ? 'text-[#141414]' : 'text-[#C7C7CC]'}
                      style={{
                        fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                        fontSize: '20px',
                        fontWeight: 500,
                        lineHeight: '1.221'
                      }}
                    >
                      {stage.title}
                    </h4>

                    {isCurrent && stage.description && (
                      <p
                        className="text-[#8E8E93] mt-2"
                        style={{
                          fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                          fontSize: '16px',
                          fontWeight: 400,
                          lineHeight: '1.193'
                        }}
                      >
                        {stage.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
