'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AccountType } from '@prisma/client';

import OnboardingLayout from '@/components/onboarding/OnboardingLayout';
import OnboardingWelcome from '@/components/onboarding/OnboardingWelcome';
import Step1AccountType from '@/components/onboarding/Step1AccountType';
import Step2AgeGroup from '@/components/onboarding/Step2AgeGroup';
import Step3Location from '@/components/onboarding/Step3Location';
import Step4Interests from '@/components/onboarding/Step4Interests';

export default function OnboardingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [showWelcome, setShowWelcome] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    accountType: null as AccountType | null,
    ageGroup: null as string | null,
    country: null as string | null,
    language: null as string | null,
    interests: [] as string[],
  });

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  const handleStart = () => {
    setShowWelcome(false);
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = async () => {
    if (!formData.interests || formData.interests.length === 0) {
      alert('Please select at least one interest before finishing.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to complete onboarding');
      }

      router.push('/dashboard/learner');
    } catch (error) {
      alert('Failed to complete onboarding. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showWelcome) {
    return <OnboardingWelcome onStart={handleStart} />;
  }

  const canGoNext = () => {
    switch (currentStep) {
      case 1:
        return formData.accountType !== null;
      case 2:
        return formData.ageGroup !== null;
      case 3:
        return formData.country !== null && formData.language !== null;
      case 4:
        return formData.interests.length > 0;
      default:
        return false;
    }
  };

  return (
    <OnboardingLayout
      currentStep={currentStep}
      totalSteps={4}
      onNext={handleNext}
      onBack={handleBack}
      onFinish={handleFinish}
      canGoNext={canGoNext()}
      canGoBack={currentStep > 1}
      isLastStep={currentStep === 4}
      showSkip={currentStep !== 4}
    >
      {currentStep === 1 && (
        <Step1AccountType
          selectedType={formData.accountType}
          onSelect={(type) => setFormData({ ...formData, accountType: type })}
        />
      )}

      {currentStep === 2 && (
        <Step2AgeGroup
          selectedAge={formData.ageGroup}
          onSelect={(age) => setFormData({ ...formData, ageGroup: age })}
        />
      )}

      {currentStep === 3 && (
        <Step3Location
          selectedCountry={formData.country}
          selectedLanguage={formData.language}
          onCountryChange={(country) =>
            setFormData({ ...formData, country })
          }
          onLanguageChange={(language) =>
            setFormData({ ...formData, language })
          }
        />
      )}

      {currentStep === 4 && (
        <Step4Interests
          selectedInterests={formData.interests}
          onInterestsChange={(interests) =>
            setFormData({ ...formData, interests })
          }
        />
      )}

      {isSubmitting && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-2xl">
          <div className="text-lg text-gray-600">Saving your preferences...</div>
        </div>
      )}
    </OnboardingLayout>
  );
}
