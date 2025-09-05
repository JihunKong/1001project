'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { 
  UserPlus, 
  Mail, 
  BookOpen,
  ArrowRight,
  Chrome,
  Facebook,
  Apple,
  GraduationCap,
  School,
  Heart,
  Check,
  Calendar,
  AlertTriangle,
  Info
} from 'lucide-react';
import Link from 'next/link';
import { isValidDateOfBirth, verifyAge, checkCOPPACompliance } from '@/lib/coppa';

export default function SignUp() {
  const [step, setStep] = useState(1); // 1: Role Selection, 2: Form
  const [selectedRole, setSelectedRole] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    organization: '',
    dateOfBirth: '',
    parentEmail: '',
    parentName: '',
    agreeToTerms: false,
    subscribeNewsletter: true,
    parentalConsentAcknowledged: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [ageVerification, setAgeVerification] = useState<{
    isMinor: boolean;
    age: number;
    requiresParentalConsent: boolean;
    isValid: boolean;
  } | null>(null);
  const [showParentalConsentInfo, setShowParentalConsentInfo] = useState(false);

  const roles = [
    {
      id: 'learner',
      title: 'Learner',
      description: 'Access stories, improve your skills, and join learning communities',
      icon: GraduationCap,
      color: 'bg-blue-500',
      benefits: ['Access to story library', 'Progress tracking', 'Community discussions']
    },
    {
      id: 'teacher',
      title: 'Teacher',
      description: 'Manage classrooms, assign content, and track student progress',
      icon: BookOpen,
      color: 'bg-green-500',
      benefits: ['Classroom management', 'Student analytics', 'Curriculum resources']
    },
    {
      id: 'institution',
      title: 'School/Institution',
      description: 'Partner with us for programs and connect with volunteers',
      icon: School,
      color: 'bg-purple-500',
      benefits: ['Program partnerships', 'Volunteer connections', 'Impact reports']
    },
    {
      id: 'volunteer',
      title: 'Volunteer',
      description: 'Share your talents in translation, illustration, or teaching',
      icon: Heart,
      color: 'bg-red-500',
      benefits: ['Flexible projects', 'Skill development', 'Global impact']
    }
  ];

  const socialLogins = [
    { name: 'Google', icon: Chrome, color: 'bg-red-500 hover:bg-red-600', provider: 'google' },
    { name: 'Facebook', icon: Facebook, color: 'bg-blue-600 hover:bg-blue-700', provider: 'facebook' },
    { name: 'Apple', icon: Apple, color: 'bg-gray-900 hover:bg-black', provider: 'apple' }
  ];

  const handleOAuthSignUp = async (provider: string) => {
    setIsLoading(true);
    try {
      // Store the selected role in localStorage to use after OAuth callback
      localStorage.setItem('pendingUserRole', selectedRole);
      await signIn(provider, { callbackUrl: '/dashboard' });
    } catch (error) {
      console.error(`${provider} sign up error:`, error);
      toast.error(`Failed to sign up with ${provider}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId);
    setStep(2);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle date of birth change and verify age
  useEffect(() => {
    if (formData.dateOfBirth) {
      const dateOfBirth = new Date(formData.dateOfBirth);
      
      if (isValidDateOfBirth(dateOfBirth)) {
        const verification = verifyAge(dateOfBirth);
        setAgeVerification({
          isMinor: verification.isMinor,
          age: verification.age,
          requiresParentalConsent: verification.requiresParentalConsent,
          isValid: true
        });
        
        if (verification.isMinor) {
          setShowParentalConsentInfo(true);
        } else {
          setShowParentalConsentInfo(false);
          setFormData(prev => ({
            ...prev,
            parentEmail: '',
            parentName: '',
            parentalConsentAcknowledged: false
          }));
        }
      } else {
        setAgeVerification({
          isMinor: false,
          age: 0,
          requiresParentalConsent: false,
          isValid: false
        });
        setShowParentalConsentInfo(false);
      }
    } else {
      setAgeVerification(null);
      setShowParentalConsentInfo(false);
    }
  }, [formData.dateOfBirth]);

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.agreeToTerms) {
      toast.error('Please agree to the terms and conditions');
      return;
    }

    if (!formData.dateOfBirth) {
      toast.error('Please enter your date of birth');
      return;
    }

    // Age verification
    if (!ageVerification?.isValid) {
      toast.error('Please enter a valid date of birth');
      return;
    }

    // COPPA compliance check
    const dateOfBirth = new Date(formData.dateOfBirth);
    const complianceCheck = checkCOPPACompliance(dateOfBirth);
    
    if (complianceCheck.requiresParentalConsent) {
      if (!formData.parentEmail || !formData.parentName) {
        toast.error('Parent/guardian email and name are required for users under 13');
        return;
      }
      
      if (!formData.parentalConsentAcknowledged) {
        toast.error('Please acknowledge the parental consent requirement');
        return;
      }
    }

    setIsLoading(true);
    
    try {
      // First, create the user account via API
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          name: `${formData.firstName} ${formData.lastName}`,
          role: selectedRole,
          organization: formData.organization,
          subscribeNewsletter: formData.subscribeNewsletter,
          dateOfBirth: formData.dateOfBirth,
          parentEmail: formData.parentEmail,
          parentName: formData.parentName,
          ageVerification,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create account');
      }

      const result = await response.json();
      
      if (ageVerification.isMinor) {
        toast.success('Account created! A parental consent email has been sent to your parent/guardian.');
        router.push('/parental-consent-pending');
      } else {
        // Send magic link for email verification
        const signInResult = await signIn('email', {
          email: formData.email,
          redirect: false,
          callbackUrl: '/dashboard',
        });

        if (signInResult?.error) {
          throw new Error('Failed to send verification email');
        }

        toast.success('Account created! Check your email to verify.');
        router.push('/verify-email');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 1) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <Link href="/" className="inline-flex items-center space-x-2 mb-8">
              <BookOpen className="h-10 w-10 text-blue-600" />
              <span className="text-2xl font-bold gradient-text">1001 Stories</span>
            </Link>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Role</h1>
            <p className="text-xl text-gray-600">Select how you&apos;d like to engage with our platform</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {roles.map((role, index) => (
              <motion.div
                key={role.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                onClick={() => handleRoleSelect(role.id)}
                className="cursor-pointer bg-white rounded-xl shadow-lg p-8 hover:shadow-xl hover:scale-105 transition-all group"
              >
                <div className={`inline-flex items-center justify-center w-16 h-16 mb-6 ${role.color} rounded-lg text-white group-hover:scale-110 transition-transform`}>
                  <role.icon className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  {role.title}
                </h3>
                <p className="text-gray-600 mb-6">
                  {role.description}
                </p>
                <div className="space-y-2">
                  {role.benefits.map(benefit => (
                    <div key={benefit} className="flex items-center gap-2 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-green-500" />
                      {benefit}
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex items-center text-blue-600 font-medium group-hover:text-blue-700">
                  Get Started as {role.title}
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full space-y-8"
      >
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center space-x-2 mb-8">
            <BookOpen className="h-10 w-10 text-blue-600" />
            <span className="text-2xl font-bold gradient-text">1001 Stories</span>
          </Link>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Create Your Account
          </h2>
          <p className="text-gray-600">
            Signing up as: <span className="font-medium text-blue-600 capitalize">{selectedRole}</span>
          </p>
          <button
            onClick={() => setStep(1)}
            className="text-sm text-blue-600 hover:text-blue-500 mt-2"
          >
            Change role
          </button>
        </div>

        {/* Social Signup */}
        <div className="space-y-3">
          {socialLogins.map((social) => (
            <button
              key={social.name}
              onClick={() => handleOAuthSignUp(social.provider)}
              disabled={isLoading}
              className={`w-full flex items-center justify-center gap-3 px-4 py-3 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${social.color}`}
            >
              <social.icon className="w-5 h-5" />
              Continue with {social.name}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-50 text-gray-500">Or create account with email</span>
          </div>
        </div>

        {/* Signup Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white dark:bg-white dark:text-gray-900"
                  style={{ 
                    color: 'rgb(17, 24, 39)', 
                    backgroundColor: 'rgb(255, 255, 255)',
                    WebkitTextFillColor: 'rgb(17, 24, 39)',
                    caretColor: 'rgb(17, 24, 39)'
                  }}
                  placeholder="John"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white dark:bg-white dark:text-gray-900"
                  style={{ 
                    color: 'rgb(17, 24, 39)', 
                    backgroundColor: 'rgb(255, 255, 255)',
                    WebkitTextFillColor: 'rgb(17, 24, 39)',
                    caretColor: 'rgb(17, 24, 39)'
                  }}
                  placeholder="Doe"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white dark:bg-white dark:text-gray-900"
                  style={{ 
                    color: 'rgb(17, 24, 39)', 
                    backgroundColor: 'rgb(255, 255, 255)',
                    WebkitTextFillColor: 'rgb(17, 24, 39)',
                    caretColor: 'rgb(17, 24, 39)'
                  }}
                  placeholder="john@example.com"
                />
              </div>
            </div>

            {(selectedRole === 'teacher' || selectedRole === 'institution') && (
              <div>
                <label htmlFor="organization" className="block text-sm font-medium text-gray-700 mb-1">
                  {selectedRole === 'teacher' ? 'School/Institution' : 'Organization Name'}
                </label>
                <input
                  id="organization"
                  name="organization"
                  type="text"
                  value={formData.organization}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white dark:bg-white dark:text-gray-900"
                  style={{ 
                    color: 'rgb(17, 24, 39)', 
                    backgroundColor: 'rgb(255, 255, 255)',
                    WebkitTextFillColor: 'rgb(17, 24, 39)',
                    caretColor: 'rgb(17, 24, 39)'
                  }}
                  placeholder={selectedRole === 'teacher' ? 'Your school name' : 'Your organization name'}
                />
              </div>
            )}

            {/* Date of Birth Field */}
            <div>
              <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="dateOfBirth"
                  name="dateOfBirth"
                  type="date"
                  required
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  max={new Date().toISOString().split('T')[0]}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white dark:bg-white dark:text-gray-900"
                  style={{ 
                    color: 'rgb(17, 24, 39)', 
                    backgroundColor: 'rgb(255, 255, 255)',
                    WebkitTextFillColor: 'rgb(17, 24, 39)',
                    caretColor: 'rgb(17, 24, 39)'
                  }}
                />
              </div>
              
              {/* Age verification feedback */}
              {ageVerification && (
                <div className={`mt-2 text-sm ${ageVerification.isValid ? 'text-green-600' : 'text-red-600'}`}>
                  {ageVerification.isValid ? (
                    ageVerification.isMinor ? (
                      <div className="flex items-center gap-1">
                        <Info className="h-4 w-4" />
                        Age: {ageVerification.age} years (Parental consent required)
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <Check className="h-4 w-4" />
                        Age: {ageVerification.age} years
                      </div>
                    )
                  ) : (
                    <div className="flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4" />
                      Please enter a valid date of birth
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Parental Consent Section for Minors */}
            {showParentalConsentInfo && ageVerification?.isMinor && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3 }}
                className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4"
              >
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Parental Consent Required</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Since you are under 13 years old, we need permission from your parent or guardian 
                      to create your account, as required by COPPA (Children&apos;s Online Privacy Protection Act).
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label htmlFor="parentName" className="block text-sm font-medium text-gray-700 mb-1">
                      Parent/Guardian Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="parentName"
                      name="parentName"
                      type="text"
                      required={ageVerification?.isMinor}
                      value={formData.parentName}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white dark:bg-white dark:text-gray-900"
                      style={{ 
                        color: 'rgb(17, 24, 39)', 
                        backgroundColor: 'rgb(255, 255, 255)',
                        WebkitTextFillColor: 'rgb(17, 24, 39)',
                        caretColor: 'rgb(17, 24, 39)'
                      }}
                      placeholder="Parent or guardian's full name"
                    />
                  </div>

                  <div>
                    <label htmlFor="parentEmail" className="block text-sm font-medium text-gray-700 mb-1">
                      Parent/Guardian Email <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="parentEmail"
                        name="parentEmail"
                        type="email"
                        required={ageVerification?.isMinor}
                        value={formData.parentEmail}
                        onChange={handleInputChange}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white dark:bg-white dark:text-gray-900"
                        style={{ 
                          color: 'rgb(17, 24, 39)', 
                          backgroundColor: 'rgb(255, 255, 255)',
                          WebkitTextFillColor: 'rgb(17, 24, 39)',
                          caretColor: 'rgb(17, 24, 39)'
                        }}
                        placeholder="parent@example.com"
                      />
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      We will send a consent email to this address for approval.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

          </div>

          {/* Checkboxes */}
          <div className="space-y-4">
            {/* Parental Consent Acknowledgment for Minors */}
            {ageVerification?.isMinor && (
              <div className="flex items-start">
                <input
                  id="parentalConsentAcknowledged"
                  name="parentalConsentAcknowledged"
                  type="checkbox"
                  required={ageVerification?.isMinor}
                  checked={formData.parentalConsentAcknowledged}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                />
                <label htmlFor="parentalConsentAcknowledged" className="ml-2 block text-sm text-gray-700">
                  I understand that parental consent is required and that an email will be sent to 
                  my parent/guardian for approval before my account can be activated.
                </label>
              </div>
            )}

            <div className="flex items-start">
              <input
                id="agreeToTerms"
                name="agreeToTerms"
                type="checkbox"
                required
                checked={formData.agreeToTerms}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
              />
              <label htmlFor="agreeToTerms" className="ml-2 block text-sm text-gray-700">
                I agree to the{' '}
                <Link href="/terms" className="text-blue-600 hover:text-blue-500">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-blue-600 hover:text-blue-500">
                  Privacy Policy
                </Link>
                {ageVerification?.isMinor && (
                  <span className="text-blue-600">
                    {' '}(with parental consent)
                  </span>
                )}
              </label>
            </div>

            <div className="flex items-center">
              <input
                id="subscribeNewsletter"
                name="subscribeNewsletter"
                type="checkbox"
                checked={formData.subscribeNewsletter && !ageVerification?.isMinor}
                onChange={handleInputChange}
                disabled={ageVerification?.isMinor}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="subscribeNewsletter" className={`ml-2 block text-sm ${ageVerification?.isMinor ? 'text-gray-400' : 'text-gray-700'}`}>
                Subscribe to our newsletter for updates and new stories
                {ageVerification?.isMinor && (
                  <span className="block text-xs text-gray-500 mt-1">
                    (Not available for users under 13 due to COPPA regulations)
                  </span>
                )}
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <UserPlus className="h-5 w-5 mr-2" />
                Create Account
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </motion.div>
    </div>
  );
}