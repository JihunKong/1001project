'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface Step {
  number: number;
  label: string;
  description?: string;
}

interface FormStepIndicatorProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export default function FormStepIndicator({
  steps,
  currentStep,
  className
}: FormStepIndicatorProps) {
  return (
    <nav
      aria-label="Form progress"
      className={cn('w-full', className)}
    >
      <ol className="flex items-center justify-between">
        {steps.map((step, index) => {
          const stepNumber = step.number;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          const isUpcoming = stepNumber > currentStep;

          return (
            <li
              key={step.number}
              className="flex-1 relative"
              aria-current={isCurrent ? 'step' : undefined}
            >
              <div className="flex flex-col items-center">
                {/* Step Circle */}
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 z-10',
                    isCompleted && 'bg-[#874FFF] text-white',
                    isCurrent && 'bg-figma-black text-white border-2 border-figma-black',
                    isUpcoming && 'bg-white border-2 border-figma-gray-border text-figma-gray-inactive'
                  )}
                  aria-label={`Step ${stepNumber}: ${step.label}${isCompleted ? ' (completed)' : ''}${isCurrent ? ' (current)' : ''}`}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" aria-hidden="true" />
                  ) : (
                    <span className="text-base font-medium">{stepNumber}</span>
                  )}
                </div>

                {/* Step Label */}
                <div className="mt-3 text-center">
                  <p
                    className={cn(
                      'text-sm font-medium transition-colors',
                      (isCompleted || isCurrent) && 'text-figma-black',
                      isUpcoming && 'text-figma-gray-inactive'
                    )}
                  >
                    {step.label}
                  </p>
                  {step.description && (
                    <p className="text-xs text-figma-gray-inactive mt-1">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className="absolute top-5 left-1/2 w-full h-0.5 -z-10"
                  aria-hidden="true"
                >
                  <div
                    className={cn(
                      'h-full transition-all duration-300',
                      isCompleted ? 'bg-[#874FFF]' : 'bg-figma-gray-border'
                    )}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {/* Screen reader progress announcement */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        Step {currentStep} of {steps.length}: {steps.find(s => s.number === currentStep)?.label}
      </div>
    </nav>
  );
}
