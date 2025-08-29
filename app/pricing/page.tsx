'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Check, 
  X, 
  Crown, 
  BookOpen, 
  Users, 
  Building, 
  Star,
  ArrowRight,
  Mail,
  Shield,
  Zap,
  Heart,
  Globe,
  Clock,
  Download
} from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  period: string;
  description: string;
  icon: any;
  color: string;
  bgColor: string;
  popular?: boolean;
  features: {
    included: string[];
    excluded: string[];
  };
  limits: {
    downloads: string;
    students: string;
    classes: string;
    storage: string;
  };
  cta: {
    text: string;
    variant: 'primary' | 'secondary';
  };
}

const plans: PricingPlan[] = [
  {
    id: 'free',
    name: 'Customer',
    price: 0,
    period: 'forever',
    description: 'Perfect for getting started with 1001 Stories',
    icon: BookOpen,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    features: {
      included: [
        'Access to free stories',
        'Preview premium content (20%)',
        'Basic community features',
        'Mobile app access',
        'Email support'
      ],
      excluded: [
        'Full premium stories',
        'Download content',
        'Advanced features',
        'Priority support',
        'Class management'
      ]
    },
    limits: {
      downloads: '0',
      students: '0',
      classes: '0',
      storage: '100MB'
    },
    cta: {
      text: 'Get Started Free',
      variant: 'secondary'
    }
  },
  {
    id: 'learner',
    name: 'Learner Plus',
    price: 9.99,
    period: 'month',
    description: 'Enhanced learning experience with premium access',
    icon: Star,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    features: {
      included: [
        'All free features',
        'Full access to premium stories',
        'Download stories for offline reading',
        'Ad-free experience',
        'Priority email support',
        'Early access to new content'
      ],
      excluded: [
        'Class management',
        'Student progress tracking',
        'Bulk user management',
        'Custom branding',
        'Advanced analytics'
      ]
    },
    limits: {
      downloads: '20/month',
      students: '0',
      classes: '0',
      storage: '1GB'
    },
    cta: {
      text: 'Upgrade to Learner',
      variant: 'primary'
    }
  },
  {
    id: 'teacher',
    name: 'Educator Pro',
    price: 19.99,
    period: 'month',
    description: 'Comprehensive tools for educators and trainers',
    icon: Users,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    popular: true,
    features: {
      included: [
        'All Learner Plus features',
        'Class management tools',
        'Student progress tracking',
        'Assignment creation',
        'Bulk content sharing',
        'Detailed analytics',
        'Priority phone support'
      ],
      excluded: [
        'Multi-school management',
        'Advanced reporting',
        'Custom integrations',
        'Dedicated account manager',
        'White-label options'
      ]
    },
    limits: {
      downloads: '50/month',
      students: '100',
      classes: '10',
      storage: '5GB'
    },
    cta: {
      text: 'Perfect for Teachers',
      variant: 'primary'
    }
  },
  {
    id: 'institution',
    name: 'Institution',
    price: 99.99,
    period: 'month',
    description: 'Enterprise-grade solution for schools and organizations',
    icon: Building,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    features: {
      included: [
        'All Educator Pro features',
        'Multi-school management',
        'Advanced reporting & analytics',
        'Custom integrations (API)',
        'Dedicated account manager',
        'White-label options',
        'Custom content uploads',
        'SSO integration',
        '24/7 priority support'
      ],
      excluded: []
    },
    limits: {
      downloads: 'Unlimited',
      students: 'Unlimited',
      classes: 'Unlimited',
      storage: '50GB'
    },
    cta: {
      text: 'Contact Sales',
      variant: 'primary'
    }
  }
];

const faqs = [
  {
    question: 'How does the free plan work?',
    answer: 'The Customer plan gives you access to our free story collection and 20% preview of premium content. You can upgrade anytime to access the full library.'
  },
  {
    question: 'Can I change plans anytime?',
    answer: 'Yes! You can upgrade, downgrade, or cancel your subscription at any time. Changes take effect at the next billing cycle.'
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards, PayPal, and bank transfers for institutional accounts. Payment processing is powered by Stripe for security.'
  },
  {
    question: 'Is there a discount for annual subscriptions?',
    answer: 'Yes! Annual subscriptions receive a 20% discount. This option will be available once our payment system goes live.'
  },
  {
    question: 'What happens to my content if I cancel?',
    answer: 'Downloaded content remains accessible for 30 days after cancellation. Your account data is preserved for 90 days in case you want to reactivate.'
  }
];

export default function PricingPage() {
  const { data: session } = useSession();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    organization: '',
    message: ''
  });

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement contact form submission
    alert('Thank you for your interest! We\'ll contact you within 24 hours.');
    setContactForm({ name: '', email: '', organization: '', message: '' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-4"
            >
              <Zap className="w-4 h-4" />
              Coming Soon: Stripe Integration
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
            >
              Choose Your Learning Journey
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-gray-600 max-w-3xl mx-auto"
            >
              Unlock the power of storytelling with plans designed for every learner, educator, and institution.
              Join thousands of users already transforming education worldwide.
            </motion.p>
          </div>
        </div>
      </div>

      {/* Billing Toggle */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center mb-8">
          <div className="bg-white p-1 rounded-lg shadow-sm border">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingCycle === 'monthly'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors relative ${
                billingCycle === 'annual'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Annual
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                20% off
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            const finalPrice = billingCycle === 'annual' && plan.price > 0 
              ? Math.round(plan.price * 0.8 * 100) / 100 
              : plan.price;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative bg-white rounded-2xl shadow-lg overflow-hidden ${
                  plan.popular ? 'ring-2 ring-blue-600' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className={`${plan.bgColor} p-6 text-center`}>
                  <Icon className={`w-12 h-12 ${plan.color} mx-auto mb-4`} />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-900">
                      ${finalPrice}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-gray-600">
                        /{billingCycle === 'annual' ? 'year' : plan.period}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm">{plan.description}</p>
                </div>

                <div className="p-6">
                  {/* Key Limits */}
                  <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                    <div className="text-center">
                      <div className="font-semibold text-gray-900">{plan.limits.downloads}</div>
                      <div className="text-gray-600">Downloads</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-gray-900">{plan.limits.students}</div>
                      <div className="text-gray-600">Students</div>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-3 mb-6">
                    {plan.features.included.slice(0, 5).map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                    
                    {plan.features.excluded.slice(0, 2).map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-3 opacity-50">
                        <X className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-500">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <button
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                      plan.cta.variant === 'primary'
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    } ${!session ? 'opacity-75 cursor-not-allowed' : ''}`}
                    disabled={!session}
                    onClick={() => {
                      if (!session) {
                        alert('Please sign up or log in to choose a plan');
                        return;
                      }
                      if (plan.id === 'institution') {
                        document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' });
                      } else {
                        alert('Payment integration coming soon! You\'ll be notified when it\'s available.');
                      }
                    }}
                  >
                    {!session ? 'Sign Up First' : plan.cta.text}
                  </button>

                  {plan.id === 'free' && session && (
                    <div className="mt-3 text-center">
                      <Link href="/dashboard" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                        Go to Dashboard →
                      </Link>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Feature Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-16 bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          <div className="p-6 bg-gray-50 border-b">
            <h2 className="text-2xl font-bold text-gray-900 text-center">Feature Comparison</h2>
            <p className="text-gray-600 text-center mt-2">See what's included in each plan</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Features</th>
                  {plans.map(plan => (
                    <th key={plan.id} className="px-6 py-4 text-center text-sm font-medium text-gray-900">
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-900">Monthly Downloads</td>
                  {plans.map(plan => (
                    <td key={plan.id} className="px-6 py-4 text-center text-sm text-gray-600">
                      {plan.limits.downloads}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-900">Student Management</td>
                  {plans.map(plan => (
                    <td key={plan.id} className="px-6 py-4 text-center">
                      {plan.limits.students === '0' ? (
                        <X className="w-5 h-5 text-gray-400 mx-auto" />
                      ) : (
                        <Check className="w-5 h-5 text-green-600 mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-900">Premium Content</td>
                  {plans.map(plan => (
                    <td key={plan.id} className="px-6 py-4 text-center">
                      {plan.id === 'free' ? (
                        <span className="text-yellow-600 text-sm">Preview Only</span>
                      ) : (
                        <Check className="w-5 h-5 text-green-600 mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-900">Priority Support</td>
                  {plans.map(plan => (
                    <td key={plan.id} className="px-6 py-4 text-center">
                      {['teacher', 'institution'].includes(plan.id) ? (
                        <Check className="w-5 h-5 text-green-600 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-gray-400 mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Contact Form for Enterprise */}
        <motion.div
          id="contact-form"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-16 bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          <div className="p-6 bg-purple-50 border-b">
            <h2 className="text-2xl font-bold text-gray-900 text-center">Need a Custom Solution?</h2>
            <p className="text-gray-600 text-center mt-2">Get in touch for enterprise pricing and custom features</p>
          </div>

          <form onSubmit={handleContactSubmit} className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={contactForm.name}
                  onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={contactForm.email}
                  onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Organization
              </label>
              <input
                type="text"
                value={contactForm.organization}
                onChange={(e) => setContactForm({...contactForm, organization: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <textarea
                rows={4}
                value={contactForm.message}
                onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Tell us about your needs..."
              />
            </div>

            <div className="mt-6 text-center">
              <button
                type="submit"
                className="bg-purple-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors"
              >
                Send Message
              </button>
            </div>
          </form>
        </motion.div>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="mt-16 bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          <div className="p-6 bg-gray-50 border-b">
            <h2 className="text-2xl font-bold text-gray-900 text-center">Frequently Asked Questions</h2>
          </div>

          <div className="p-8">
            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <div key={index} className="border-b border-gray-200 pb-6 last:border-b-0">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{faq.question}</h3>
                  <p className="text-gray-600">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="mt-16 text-center"
        >
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl p-8">
            <h2 className="text-3xl font-bold mb-4">Ready to Transform Education?</h2>
            <p className="text-xl text-blue-100 mb-6 max-w-2xl mx-auto">
              Join thousands of educators and learners who are already using 1001 Stories to create impactful learning experiences.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!session ? (
                <>
                  <Link href="/signup" className="bg-white text-blue-600 px-8 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors">
                    Start Free Today
                  </Link>
                  <Link href="/demo" className="border border-white text-white px-8 py-3 rounded-lg font-medium hover:bg-white/10 transition-colors">
                    Try Demo First
                  </Link>
                </>
              ) : (
                <Link href="/dashboard" className="bg-white text-blue-600 px-8 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors">
                  Go to Dashboard
                </Link>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}