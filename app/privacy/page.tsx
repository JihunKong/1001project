'use client';

import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  Shield, 
  Eye, 
  Lock, 
  UserCheck,
  Globe,
  Settings,
  Mail,
  Calendar,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - 1001 Stories',
  description: 'Learn about how we collect, use, and protect your personal information. Your privacy and security are our top priorities.',
  keywords: 'privacy policy, data protection, security, GDPR, children safety',
  openGraph: {
    title: 'Privacy Policy - 1001 Stories',
    description: 'Understand how we protect your personal information and respect your privacy.',
    url: 'https://1001stories.org/privacy',
    type: 'website',
  },
};

export default function Privacy() {
  const { t } = useTranslation('common');

  const lastUpdated = 'December 1, 2024';

  const sections = [
    {
      id: 'information-we-collect',
      title: 'Information We Collect',
      icon: UserCheck,
      content: [
        {
          subtitle: 'Personal Information',
          items: [
            'Name and contact information (email address, phone number)',
            'Demographic information (age, location, language preferences)',
            'Account credentials (username, encrypted password)',
            'Profile information (bio, interests, educational background)'
          ]
        },
        {
          subtitle: 'Educational Data',
          items: [
            'Learning progress and achievements',
            'Story submissions and creative work',
            'Course enrollment and completion data',
            'Interaction with educational content'
          ]
        },
        {
          subtitle: 'Technical Information',
          items: [
            'Device information (browser type, operating system)',
            'Usage analytics (pages visited, time spent, features used)',
            'Cookies and similar tracking technologies',
            'IP address and general location data'
          ]
        }
      ]
    },
    {
      id: 'how-we-use-information',
      title: 'How We Use Your Information',
      icon: Settings,
      content: [
        {
          subtitle: 'Educational Services',
          items: [
            'Provide personalized learning experiences',
            'Track learning progress and provide feedback',
            'Match learners with appropriate content and mentors',
            'Issue certificates and recognition for achievements'
          ]
        },
        {
          subtitle: 'Platform Improvement',
          items: [
            'Analyze usage patterns to improve our services',
            'Develop new features and educational content',
            'Ensure platform security and prevent abuse',
            'Provide customer support and technical assistance'
          ]
        },
        {
          subtitle: 'Communication',
          items: [
            'Send educational updates and program information',
            'Notify about new stories, courses, and opportunities',
            'Respond to inquiries and provide support',
            'Share impact reports and community updates'
          ]
        }
      ]
    },
    {
      id: 'information-sharing',
      title: 'Information Sharing and Disclosure',
      icon: Eye,
      content: [
        {
          subtitle: 'We Never Sell Your Data',
          items: [
            'We do not sell, rent, or trade personal information',
            'Your educational progress remains confidential',
            'Story submissions are shared only with explicit consent',
            'Personal information is not used for commercial advertising'
          ]
        },
        {
          subtitle: 'Limited Sharing Scenarios',
          items: [
            'With educational partners (schools, teachers) for program delivery',
            'With service providers who help operate our platform',
            'When required by law or to protect safety',
            'In anonymized form for research and impact measurement'
          ]
        },
        {
          subtitle: 'International Transfers',
          items: [
            'Data may be processed in countries where we operate',
            'We ensure adequate protection through appropriate safeguards',
            'EU residents receive specific protections under GDPR',
            'We maintain data processing agreements with all partners'
          ]
        }
      ]
    },
    {
      id: 'children-privacy',
      title: 'Children\'s Privacy Protection',
      icon: Shield,
      content: [
        {
          subtitle: 'Special Protections for Minors',
          items: [
            'Enhanced privacy controls for users under 18',
            'Parental consent required for children under 13 (COPPA compliance)',
            'Limited data collection focused on educational purposes',
            'Regular review of children\'s accounts and permissions'
          ]
        },
        {
          subtitle: 'Content Safety',
          items: [
            'All user-generated content is moderated before publication',
            'Children cannot share personal contact information publicly',
            'Private messaging is restricted and monitored for safety',
            'Community guidelines enforce appropriate interactions'
          ]
        },
        {
          subtitle: 'Educational Focus',
          items: [
            'Data collection limited to legitimate educational interests',
            'No behavioral advertising to children',
            'Learning analytics used only to improve educational outcomes',
            'Regular deletion of unnecessary personal information'
          ]
        }
      ]
    },
    {
      id: 'data-security',
      title: 'Data Security and Protection',
      icon: Lock,
      content: [
        {
          subtitle: 'Technical Safeguards',
          items: [
            'Industry-standard encryption for data transmission and storage',
            'Regular security audits and vulnerability assessments',
            'Multi-factor authentication for sensitive accounts',
            'Secure cloud infrastructure with backup and recovery systems'
          ]
        },
        {
          subtitle: 'Access Controls',
          items: [
            'Role-based access to personal information',
            'Regular staff training on data protection',
            'Background checks for team members handling sensitive data',
            'Audit logs for all access to personal information'
          ]
        },
        {
          subtitle: 'Incident Response',
          items: [
            '24/7 monitoring for security threats',
            'Established procedures for data breach response',
            'Notification protocols for affected users and authorities',
            'Regular backup and disaster recovery testing'
          ]
        }
      ]
    },
    {
      id: 'your-rights',
      title: 'Your Privacy Rights',
      icon: UserCheck,
      content: [
        {
          subtitle: 'Access and Control',
          items: [
            'View and download all personal information we hold',
            'Update or correct inaccurate information',
            'Delete your account and associated data',
            'Control communication preferences and privacy settings'
          ]
        },
        {
          subtitle: 'GDPR Rights (EU Residents)',
          items: [
            'Right to portability of your educational data',
            'Right to restrict processing in certain circumstances',
            'Right to object to processing based on legitimate interests',
            'Right to lodge complaints with data protection authorities'
          ]
        },
        {
          subtitle: 'Exercising Your Rights',
          items: [
            'Contact our privacy team at privacy@1001stories.org',
            'Use the privacy controls in your account settings',
            'Submit requests through our online privacy portal',
            'Response within 30 days for most requests'
          ]
        }
      ]
    }
  ];

  const principles = [
    {
      icon: Shield,
      title: 'Privacy by Design',
      description: 'We build privacy protections into every feature from the ground up'
    },
    {
      icon: Eye,
      title: 'Transparency',
      description: 'We clearly explain what data we collect and how we use it'
    },
    {
      icon: Lock,
      title: 'Security First',
      description: 'Your data is protected with enterprise-grade security measures'
    },
    {
      icon: UserCheck,
      title: 'Your Control',
      description: 'You have complete control over your personal information'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-purple-50 py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 mb-6 bg-green-100 rounded-full">
              <Shield className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              <span className="gradient-text">Privacy Policy</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Your privacy and the protection of your personal information are fundamental to our mission. 
              This policy explains how we collect, use, and safeguard your data.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>Last updated: {lastUpdated}</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Privacy Principles */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Our Privacy Principles
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              These core principles guide how we handle your personal information.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {principles.map((principle, index) => (
              <motion.div
                key={principle.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-blue-100 rounded-full">
                  <principle.icon className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {principle.title}
                </h3>
                <p className="text-gray-600">
                  {principle.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Policy Sections */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="space-y-12">
            {sections.map((section, sectionIndex) => (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: sectionIndex * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-xl shadow-lg p-8"
              >
                <div className="flex items-center gap-4 mb-8">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
                    <section.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {section.title}
                  </h2>
                </div>

                <div className="space-y-8">
                  {section.content.map((subsection, index) => (
                    <div key={index}>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        {subsection.subtitle}
                      </h3>
                      <ul className="space-y-3">
                        {subsection.items.map((item, itemIndex) => (
                          <li key={itemIndex} className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Important Notice */}
      <section className="py-16 bg-yellow-50 border-y border-yellow-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="flex items-start gap-4 p-6 bg-white rounded-lg border border-yellow-300"
          >
            <AlertCircle className="w-8 h-8 text-yellow-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Changes to This Policy
              </h3>
              <p className="text-gray-700 mb-4">
                We may update this privacy policy from time to time to reflect changes in our practices or legal requirements. 
                When we make material changes, we will notify you by email and through our platform.
              </p>
              <p className="text-sm text-gray-600">
                We encourage you to review this policy periodically to stay informed about how we protect your information.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Questions About Privacy?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Our privacy team is here to help. If you have questions about this policy or how we handle your information, 
              please don't hesitate to reach out.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="mailto:privacy@1001stories.org"
                className="inline-flex items-center gap-2 px-8 py-4 text-lg font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700 transition-all transform hover:scale-105"
              >
                <Mail className="w-5 h-5" />
                Contact Privacy Team
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-8 py-4 text-lg font-medium text-blue-600 bg-white border-2 border-blue-600 rounded-full hover:bg-blue-50 transition-all"
              >
                General Contact
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Related Links */}
      <section className="py-16 bg-gray-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              Related Policies
            </h3>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/terms"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Terms of Service
              </Link>
              <Link
                href="/about"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                About 1001 Stories
              </Link>
              <Link
                href="/mission"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Our Mission
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}