'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Upload, 
  X,
  User,
  Building,
  Clock,
  Heart,
  FileText,
  Shield
} from 'lucide-react';
import Link from 'next/link';

// Form step definitions
const STEPS = [
  { id: 'program', title: 'Program Selection', icon: Heart },
  { id: 'profile', title: 'Personal Profile', icon: User },
  { id: 'affiliation', title: 'Affiliation', icon: Building },
  { id: 'availability', title: 'Availability', icon: Clock },
  { id: 'motivation', title: 'Motivation & Goals', icon: Heart },
  { id: 'attachments', title: 'Documents', icon: FileText },
  { id: 'consent', title: 'Agreements', icon: Shield }
];

const PROGRAM_TYPES = [
  {
    id: 'PARTNERSHIP_NETWORK',
    title: 'Partnership Network',
    description: 'Connect with schools, NGOs, companies, and universities worldwide',
    requirements: ['Educational institution or organization', 'Partnership goals', 'Resource sharing capacity']
  },
  {
    id: 'ENGLISH_EDUCATION', 
    title: 'English Education',
    description: 'ESL programs for teachers, students, and mentors',
    requirements: ['English proficiency', 'Teaching or learning experience', 'Commitment to program']
  },
  {
    id: 'MENTORSHIP',
    title: 'Mentorship Program', 
    description: 'Connect professionals across various expertise domains',
    requirements: ['Professional experience', 'Mentoring commitment', 'Communication skills']
  }
];

const COUNTRIES = [
  'United States', 'Canada', 'United Kingdom', 'Australia', 'Germany', 
  'France', 'Spain', 'Italy', 'Netherlands', 'Sweden', 'Norway', 'Denmark',
  'Japan', 'South Korea', 'Singapore', 'India', 'Pakistan', 'Bangladesh',
  'Nigeria', 'Kenya', 'South Africa', 'Egypt', 'Morocco', 'Brazil', 
  'Argentina', 'Chile', 'Mexico', 'Colombia', 'Peru', 'Other'
];

const LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 
  'Dutch', 'Swedish', 'Norwegian', 'Danish', 'Japanese', 'Korean', 
  'Chinese (Mandarin)', 'Chinese (Cantonese)', 'Hindi', 'Urdu', 
  'Bengali', 'Arabic', 'Swahili', 'Amharic', 'Other'
];

const ORGANIZATION_TYPES = [
  'School', 'University', 'NGO', 'Non-profit', 'Company', 'Government', 
  'Individual', 'Other'
];

const DAYS_OF_WEEK = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

interface FormData {
  // Program selection
  programType: string;
  
  // Personal profile
  fullName: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  timezone: string;
  languages: string[];
  
  // Affiliation
  organizationName: string;
  organizationType: string;
  jobTitle: string;
  experienceYears: number;
  
  // Availability
  weeklyHours: number;
  availableDays: string[];
  timeWindows: any;
  
  // Personal information
  interests: string[];
  skills: string[];
  languageProficiency: any;
  goals: string;
  motivation: string;
  preferredModality: string;
  
  // Program-specific data
  programSpecificData: any;
  
  // Consent
  dataProcessingConsent: boolean;
  codeOfConductAccepted: boolean;
  backgroundCheckConsent: boolean;
}

function ProgramApplicationContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    programType: '',
    fullName: '',
    email: '',
    phone: '',
    country: '',
    city: '',
    timezone: '',
    languages: [],
    organizationName: '',
    organizationType: '',
    jobTitle: '',
    experienceYears: 0,
    weeklyHours: 0,
    availableDays: [],
    timeWindows: {},
    interests: [],
    skills: [],
    languageProficiency: {},
    goals: '',
    motivation: '',
    preferredModality: 'online',
    programSpecificData: {},
    dataProcessingConsent: false,
    codeOfConductAccepted: false,
    backgroundCheckConsent: false
  });
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-save draft every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (session?.user && Object.keys(formData).some(key => formData[key as keyof FormData])) {
        // Save draft to localStorage or API
        localStorage.setItem(`programApplication_${session.user.id}`, JSON.stringify(formData));
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [formData, session]);

  // Load draft on mount
  useEffect(() => {
    if (session?.user) {
      const savedDraft = localStorage.getItem(`programApplication_${session.user.id}`);
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          setFormData(prev => ({ ...prev, ...parsed }));
        } catch (error) {
          console.error('Failed to parse saved draft:', error);
        }
      }
    }
  }, [session]);

  // Set program type from URL params
  useEffect(() => {
    const programParam = searchParams.get('program');
    if (programParam && PROGRAM_TYPES.find(p => p.id === programParam)) {
      setFormData(prev => ({ ...prev, programType: programParam }));
    }
  }, [searchParams]);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/programs/apply');
    }
  }, [status, router]);

  // Pre-fill user data
  useEffect(() => {
    if (session?.user) {
      setFormData(prev => ({
        ...prev,
        fullName: session.user.name || '',
        email: session.user.email || ''
      }));
    }
  }, [session]);

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateCurrentStep = () => {
    const step = STEPS[currentStep];
    const newErrors: Record<string, string> = {};

    switch (step.id) {
      case 'program':
        if (!formData.programType) {
          newErrors.programType = 'Please select a program';
        }
        break;
      case 'profile':
        if (!formData.fullName) newErrors.fullName = 'Full name is required';
        if (!formData.email) newErrors.email = 'Email is required';
        if (!formData.country) newErrors.country = 'Country is required';
        if (!formData.city) newErrors.city = 'City is required';
        if (formData.languages.length === 0) newErrors.languages = 'At least one language is required';
        break;
      case 'affiliation':
        // Organization fields are optional for individuals
        break;
      case 'availability':
        if (!formData.weeklyHours || formData.weeklyHours < 1) {
          newErrors.weeklyHours = 'Please specify available hours per week';
        }
        if (formData.availableDays.length === 0) {
          newErrors.availableDays = 'Please select at least one available day';
        }
        break;
      case 'motivation':
        if (!formData.goals) newErrors.goals = 'Please describe your goals';
        if (!formData.motivation) newErrors.motivation = 'Please explain your motivation';
        break;
      case 'attachments':
        // Attachments are optional but recommended
        break;
      case 'consent':
        if (!formData.dataProcessingConsent) {
          newErrors.dataProcessingConsent = 'Data processing consent is required';
        }
        if (!formData.codeOfConductAccepted) {
          newErrors.codeOfConductAccepted = 'Code of conduct acceptance is required';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateCurrentStep() && currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const submitApplication = async () => {
    if (!validateCurrentStep()) return;

    setIsSubmitting(true);
    try {
      const formDataToSubmit = new FormData();
      
      // Add form data
      formDataToSubmit.append('applicationData', JSON.stringify(formData));
      
      // Add attachments
      attachments.forEach((file, index) => {
        formDataToSubmit.append(`attachment_${index}`, file);
      });

      const response = await fetch('/api/programs/applications', {
        method: 'POST',
        body: formDataToSubmit
      });

      if (response.ok) {
        // Clear draft
        if (session?.user) {
          localStorage.removeItem(`programApplication_${session.user.id}`);
        }
        
        router.push('/programs/apply/success');
      } else {
        throw new Error('Failed to submit application');
      }
    } catch (error) {
      console.error('Failed to submit application:', error);
      setErrors({ submit: 'Failed to submit application. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/programs" className="inline-flex items-center text-brand-primary hover:text-brand-primary/80 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Programs
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Program Application</h1>
          <p className="text-gray-600 mt-2">Join our global community of educators and changemakers</p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const StepIcon = step.icon;
              const isCompleted = index < currentStep;
              const isCurrent = index === currentStep;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    isCompleted 
                      ? 'bg-brand-primary border-brand-primary text-white' 
                      : isCurrent
                        ? 'border-brand-primary text-brand-primary'
                        : 'border-gray-300 text-gray-400'
                  }`}>
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <StepIcon className="w-5 h-5" />
                    )}
                  </div>
                  <div className="ml-3 hidden sm:block">
                    <div className={`text-sm font-medium ${
                      isCurrent ? 'text-brand-primary' : isCompleted ? 'text-gray-900' : 'text-gray-400'
                    }`}>
                      {step.title}
                    </div>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={`hidden sm:block w-16 h-0.5 ml-4 ${
                      isCompleted ? 'bg-brand-primary' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Render step content based on currentStep */}
              {STEPS[currentStep].id === 'program' && (
                <ProgramSelectionStep 
                  formData={formData} 
                  updateFormData={updateFormData} 
                  errors={errors}
                />
              )}
              {STEPS[currentStep].id === 'profile' && (
                <PersonalProfileStep 
                  formData={formData} 
                  updateFormData={updateFormData} 
                  errors={errors}
                />
              )}
              {STEPS[currentStep].id === 'affiliation' && (
                <AffiliationStep 
                  formData={formData} 
                  updateFormData={updateFormData} 
                  errors={errors}
                />
              )}
              {STEPS[currentStep].id === 'availability' && (
                <AvailabilityStep 
                  formData={formData} 
                  updateFormData={updateFormData} 
                  errors={errors}
                />
              )}
              {STEPS[currentStep].id === 'motivation' && (
                <MotivationStep 
                  formData={formData} 
                  updateFormData={updateFormData} 
                  errors={errors}
                />
              )}
              {STEPS[currentStep].id === 'attachments' && (
                <AttachmentsStep 
                  attachments={attachments}
                  setAttachments={setAttachments}
                  errors={errors}
                />
              )}
              {STEPS[currentStep].id === 'consent' && (
                <ConsentStep 
                  formData={formData} 
                  updateFormData={updateFormData} 
                  errors={errors}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8 pt-8 border-t border-gray-200">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </button>

            <div className="text-sm text-gray-500">
              Step {currentStep + 1} of {STEPS.length}
            </div>

            {currentStep === STEPS.length - 1 ? (
              <button
                onClick={submitApplication}
                disabled={isSubmitting}
                className="inline-flex items-center px-6 py-2 text-sm font-medium text-white bg-brand-primary rounded-lg hover:bg-brand-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Application
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={nextStep}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-brand-primary rounded-lg hover:bg-brand-primary/90"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            )}
          </div>

          {errors.submit && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{errors.submit}</p>
            </div>
          )}
        </div>

        {/* Auto-save indicator */}
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            Your progress is automatically saved every 10 seconds
          </p>
        </div>
      </div>
    </div>
  );
}

// Step Components
function ProgramSelectionStep({ formData, updateFormData, errors }: any) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Select a Program</h2>
      <p className="text-gray-600 mb-8">
        Choose the program that best matches your interests and goals.
      </p>

      <div className="grid md:grid-cols-3 gap-6">
        {PROGRAM_TYPES.map((program) => (
          <div
            key={program.id}
            onClick={() => updateFormData('programType', program.id)}
            className={`p-6 border-2 rounded-xl cursor-pointer transition-all ${
              formData.programType === program.id
                ? 'border-brand-primary bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <h3 className="text-lg font-semibold mb-3">{program.title}</h3>
            <p className="text-gray-600 mb-4">{program.description}</p>
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Requirements:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                {program.requirements.map((req, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="w-3 h-3 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {errors.programType && (
        <p className="text-red-600 text-sm mt-4">{errors.programType}</p>
      )}
    </div>
  );
}

function PersonalProfileStep({ formData, updateFormData, errors }: any) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Personal Profile</h2>
      <p className="text-gray-600 mb-8">
        Tell us about yourself so we can match you with the right opportunities.
      </p>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name *
          </label>
          <input
            type="text"
            value={formData.fullName}
            onChange={(e) => updateFormData('fullName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            placeholder="Your full name"
          />
          {errors.fullName && <p className="text-red-600 text-sm mt-1">{errors.fullName}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address *
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => updateFormData('email', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            placeholder="your@email.com"
          />
          {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => updateFormData('phone', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            placeholder="+1 (555) 123-4567"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Country *
          </label>
          <select
            value={formData.country}
            onChange={(e) => updateFormData('country', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
          >
            <option value="">Select country</option>
            {COUNTRIES.map((country) => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>
          {errors.country && <p className="text-red-600 text-sm mt-1">{errors.country}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            City *
          </label>
          <input
            type="text"
            value={formData.city}
            onChange={(e) => updateFormData('city', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            placeholder="Your city"
          />
          {errors.city && <p className="text-red-600 text-sm mt-1">{errors.city}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Timezone
          </label>
          <input
            type="text"
            value={formData.timezone}
            onChange={(e) => updateFormData('timezone', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            placeholder="UTC-5, EST, etc."
          />
        </div>
      </div>

      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Languages You Speak *
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {LANGUAGES.map((language) => (
            <label key={language} className="flex items-center">
              <input
                type="checkbox"
                checked={formData.languages.includes(language)}
                onChange={(e) => {
                  const newLanguages = e.target.checked
                    ? [...formData.languages, language]
                    : formData.languages.filter((l: string) => l !== language);
                  updateFormData('languages', newLanguages);
                }}
                className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
              />
              <span className="ml-2 text-sm text-gray-700">{language}</span>
            </label>
          ))}
        </div>
        {errors.languages && <p className="text-red-600 text-sm mt-1">{errors.languages}</p>}
      </div>
    </div>
  );
}

function AffiliationStep({ formData, updateFormData, errors }: any) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Organization & Experience</h2>
      <p className="text-gray-600 mb-8">
        Share details about your current role and organization (optional for individual applicants).
      </p>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Organization Name
          </label>
          <input
            type="text"
            value={formData.organizationName}
            onChange={(e) => updateFormData('organizationName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            placeholder="Your organization"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Organization Type
          </label>
          <select
            value={formData.organizationType}
            onChange={(e) => updateFormData('organizationType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
          >
            <option value="">Select type</option>
            {ORGANIZATION_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Job Title / Role
          </label>
          <input
            type="text"
            value={formData.jobTitle}
            onChange={(e) => updateFormData('jobTitle', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            placeholder="Your current role"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Years of Experience
          </label>
          <input
            type="number"
            min="0"
            max="50"
            value={formData.experienceYears}
            onChange={(e) => updateFormData('experienceYears', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            placeholder="0"
          />
        </div>
      </div>
    </div>
  );
}

function AvailabilityStep({ formData, updateFormData, errors }: any) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Availability</h2>
      <p className="text-gray-600 mb-8">
        Help us understand when you're available to participate in the program.
      </p>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hours Available Per Week *
          </label>
          <input
            type="number"
            min="1"
            max="40"
            value={formData.weeklyHours}
            onChange={(e) => updateFormData('weeklyHours', parseInt(e.target.value) || 0)}
            className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            placeholder="5"
          />
          <span className="ml-2 text-gray-600">hours per week</span>
          {errors.weeklyHours && <p className="text-red-600 text-sm mt-1">{errors.weeklyHours}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Available Days *
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {DAYS_OF_WEEK.map((day) => (
              <label key={day} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.availableDays.includes(day)}
                  onChange={(e) => {
                    const newDays = e.target.checked
                      ? [...formData.availableDays, day]
                      : formData.availableDays.filter((d: string) => d !== day);
                    updateFormData('availableDays', newDays);
                  }}
                  className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                />
                <span className="ml-2 text-sm text-gray-700">{day}</span>
              </label>
            ))}
          </div>
          {errors.availableDays && <p className="text-red-600 text-sm mt-1">{errors.availableDays}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preferred Meeting Mode
          </label>
          <div className="flex gap-4">
            {['online', 'in-person', 'hybrid'].map((mode) => (
              <label key={mode} className="flex items-center">
                <input
                  type="radio"
                  name="preferredModality"
                  value={mode}
                  checked={formData.preferredModality === mode}
                  onChange={(e) => updateFormData('preferredModality', e.target.value)}
                  className="border-gray-300 text-brand-primary focus:ring-brand-primary"
                />
                <span className="ml-2 text-sm text-gray-700 capitalize">{mode}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MotivationStep({ formData, updateFormData, errors }: any) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Motivation & Goals</h2>
      <p className="text-gray-600 mb-8">
        Share your motivation for joining this program and what you hope to achieve.
      </p>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What are your goals in this program? *
          </label>
          <textarea
            value={formData.goals}
            onChange={(e) => updateFormData('goals', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            placeholder="Describe what you hope to achieve through this program..."
          />
          {errors.goals && <p className="text-red-600 text-sm mt-1">{errors.goals}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Why are you interested in this program? *
          </label>
          <textarea
            value={formData.motivation}
            onChange={(e) => updateFormData('motivation', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            placeholder="Share your motivation and what draws you to this program..."
          />
          {errors.motivation && <p className="text-red-600 text-sm mt-1">{errors.motivation}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Interests & Skills
          </label>
          <input
            type="text"
            value={formData.interests.join(', ')}
            onChange={(e) => updateFormData('interests', e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            placeholder="Teaching, technology, languages, arts, etc. (comma-separated)"
          />
          <p className="text-sm text-gray-500 mt-1">
            List your interests and skills separated by commas
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Professional Skills
          </label>
          <input
            type="text"
            value={formData.skills.join(', ')}
            onChange={(e) => updateFormData('skills', e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            placeholder="Project management, communication, curriculum design, etc."
          />
          <p className="text-sm text-gray-500 mt-1">
            List your professional skills separated by commas
          </p>
        </div>
      </div>
    </div>
  );
}

function AttachmentsStep({ attachments, setAttachments, errors }: any) {
  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;

    const validFiles = Array.from(files).filter(file => {
      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/png',
        'image/jpeg',
        'image/jpg'
      ];
      
      // Validate file size (10MB max)
      const maxSize = 10 * 1024 * 1024;
      
      return allowedTypes.includes(file.type) && file.size <= maxSize;
    });

    if (attachments.length + validFiles.length > 5) {
      alert('Maximum 5 files allowed');
      return;
    }

    setAttachments((prev: File[]) => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setAttachments((prev: File[]) => prev.filter((_, i) => i !== index));
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Supporting Documents</h2>
      <p className="text-gray-600 mb-8">
        Upload supporting documents (optional but recommended). Maximum 5 files, 10MB each.
      </p>

      <div className="space-y-6">
        {/* File Upload Area */}
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
          onClick={() => document.getElementById('file-input')?.click()}
          onDrop={(e) => {
            e.preventDefault();
            handleFileUpload(e.dataTransfer.files);
          }}
          onDragOver={(e) => e.preventDefault()}
        >
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-900 mb-2">Upload Documents</p>
          <p className="text-gray-600 mb-4">
            Drag and drop files here, or click to browse
          </p>
          <p className="text-sm text-gray-500">
            Accepted formats: PDF, DOC, DOCX, PNG, JPG (max 10MB each)
          </p>
          <input
            id="file-input"
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
            onChange={(e) => handleFileUpload(e.target.files)}
            className="hidden"
          />
        </div>

        {/* File List */}
        {attachments.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Uploaded Files</h3>
            <div className="space-y-3">
              {attachments.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <FileText className="w-5 h-5 text-gray-500 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* File Type Suggestions */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Recommended Documents:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• CV/Resume</li>
            <li>• Portfolio or work samples</li>
            <li>• Teaching certificates (for education programs)</li>
            <li>• Recommendation letters</li>
            <li>• Relevant transcripts or certifications</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function ConsentStep({ formData, updateFormData, errors }: any) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Agreements & Consent</h2>
      <p className="text-gray-600 mb-8">
        Please review and accept the following agreements to complete your application.
      </p>

      <div className="space-y-6">
        <div className="border border-gray-200 rounded-lg p-6">
          <label className="flex items-start">
            <input
              type="checkbox"
              checked={formData.dataProcessingConsent}
              onChange={(e) => updateFormData('dataProcessingConsent', e.target.checked)}
              className="mt-1 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
            />
            <div className="ml-3">
              <span className="text-sm font-medium text-gray-900">
                Data Processing Consent *
              </span>
              <p className="text-sm text-gray-600 mt-1">
                I consent to the processing of my personal data for the purpose of this program application 
                and related communications. I understand that I can withdraw this consent at any time.
              </p>
            </div>
          </label>
          {errors.dataProcessingConsent && (
            <p className="text-red-600 text-sm mt-2">{errors.dataProcessingConsent}</p>
          )}
        </div>

        <div className="border border-gray-200 rounded-lg p-6">
          <label className="flex items-start">
            <input
              type="checkbox"
              checked={formData.codeOfConductAccepted}
              onChange={(e) => updateFormData('codeOfConductAccepted', e.target.checked)}
              className="mt-1 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
            />
            <div className="ml-3">
              <span className="text-sm font-medium text-gray-900">
                Code of Conduct *
              </span>
              <p className="text-sm text-gray-600 mt-1">
                I agree to abide by the 1001 Stories Code of Conduct, which includes maintaining 
                professional behavior, respecting all participants, and contributing positively 
                to the program community.
              </p>
              <Link href="/terms" target="_blank" className="text-brand-primary hover:underline text-sm">
                View Code of Conduct
              </Link>
            </div>
          </label>
          {errors.codeOfConductAccepted && (
            <p className="text-red-600 text-sm mt-2">{errors.codeOfConductAccepted}</p>
          )}
        </div>

        <div className="border border-gray-200 rounded-lg p-6">
          <label className="flex items-start">
            <input
              type="checkbox"
              checked={formData.backgroundCheckConsent}
              onChange={(e) => updateFormData('backgroundCheckConsent', e.target.checked)}
              className="mt-1 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
            />
            <div className="ml-3">
              <span className="text-sm font-medium text-gray-900">
                Background Check Consent
              </span>
              <p className="text-sm text-gray-600 mt-1">
                I consent to a background check if required for this program. This may be 
                necessary for certain roles involving direct interaction with minors or 
                access to sensitive educational resources.
              </p>
            </div>
          </label>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-green-800">
            <strong>Next Steps:</strong> After submitting your application, you'll receive a 
            confirmation email. Our program team will review your application and contact you 
            within 5-7 business days with next steps.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ProgramApplicationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
      </div>
    }>
      <ProgramApplicationContent />
    </Suspense>
  );
}