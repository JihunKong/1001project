'use client';

import { useTranslation } from '@/lib/i18n/useTranslation';

interface PublishingStatusCardProps {
  currentStatus: string;
}

const WORKFLOW_STEPS = [
  { number: 1, key: 'step1', statuses: ['DRAFT', 'PENDING'] },
  { number: 2, key: 'step2', statuses: ['STORY_REVIEW', 'NEEDS_REVISION', 'STORY_APPROVED'] },
  { number: 3, key: 'step3', statuses: ['FORMAT_REVIEW', 'CONTENT_REVIEW', 'APPROVED'] },
  { number: 4, key: 'step4', statuses: ['PUBLISHED'] },
];

function getWorkflowStep(status: string): number {
  for (const step of WORKFLOW_STEPS) {
    if (step.statuses.includes(status)) {
      return step.number;
    }
  }
  return 1;
}

function StepCircle({ number, isActive }: { number: number; isActive: boolean }) {
  return (
    <div
      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
        isActive ? 'bg-[#141414]' : 'bg-[#D1D1D6]'
      }`}
    >
      <span
        className="text-white"
        style={{
          fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
          fontSize: '24px',
          fontWeight: 500,
          lineHeight: '1.221',
        }}
      >
        {number}
      </span>
    </div>
  );
}

export default function PublishingStatusCard({ currentStatus }: PublishingStatusCardProps) {
  const { t } = useTranslation();
  const currentStep = getWorkflowStep(currentStatus);

  const getStatusMessage = (status: string): string => {
    const messageKey = `dashboard.writer.publishingStatus.message.${status}`;
    const message = t(messageKey);
    return message !== messageKey ? message : '';
  };

  return (
    <div className="bg-white border border-[#E5E5EA] rounded-lg p-6">
      <div className="flex flex-col gap-10">
        <h3
          className="text-[#141414]"
          style={{
            fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
            fontSize: '24px',
            fontWeight: 500,
            lineHeight: '1.221',
          }}
        >
          {t('dashboard.writer.publishingStatus.title')}
        </h3>

        <div className="relative">
          {WORKFLOW_STEPS.map((step, index) => {
            const isActive = currentStep >= step.number;
            const isCurrent = currentStep === step.number;
            const isLast = index === WORKFLOW_STEPS.length - 1;

            return (
              <div key={step.number} className="relative">
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <StepCircle number={step.number} isActive={isActive} />
                    {!isLast && (
                      <div
                        className={`absolute left-1/2 -translate-x-1/2 top-10 w-0 h-[44px] border-l border-dashed ${
                          isActive ? 'border-[#141414]' : 'border-[#D1D1D6]'
                        }`}
                      />
                    )}
                  </div>

                  <div className="flex flex-col gap-2 pt-2">
                    <span
                      style={{
                        fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                        fontSize: '20px',
                        fontWeight: 500,
                        lineHeight: '1.221',
                        color: isActive ? '#141414' : '#C7C7CC',
                      }}
                    >
                      {t(`dashboard.writer.publishingStatus.${step.key}.label`)}
                    </span>

                    {isCurrent && (
                      <p
                        className="max-w-[400px]"
                        style={{
                          fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
                          fontSize: '16px',
                          fontWeight: 400,
                          lineHeight: '1.193',
                          color: '#8E8E93',
                        }}
                      >
                        {getStatusMessage(currentStatus)}
                      </p>
                    )}
                  </div>
                </div>

                {!isLast && <div className="h-[44px]" />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
