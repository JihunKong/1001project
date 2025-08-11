'use client';

import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  FileText, 
  Scale, 
  Shield, 
  Users,
  BookOpen,
  AlertCircle,
  CheckCircle,
  Calendar,
  Mail,
  Gavel
} from 'lucide-react';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service - 1001 Stories',
  description: 'Read our terms of service to understand your rights and responsibilities when using the 1001 Stories platform.',
  keywords: 'terms of service, legal, user agreement, platform rules, copyright',
  openGraph: {
    title: 'Terms of Service - 1001 Stories',
    description: 'Understand the terms and conditions for using our educational platform.',
    url: 'https://1001stories.org/terms',
    type: 'website',
  },
};

export default function Terms() {
  const { t } = useTranslation('common');

  const lastUpdated = 'December 1, 2024';
  const effectiveDate = 'December 1, 2024';

  const sections = [
    {
      id: 'acceptance',
      title: 'Acceptance of Terms',
      icon: CheckCircle,
      content: `By accessing or using the 1001 Stories platform, you agree to be bound by these Terms of Service and our Privacy Policy. 
      If you do not agree to these terms, please do not use our services. These terms apply to all users, including learners, teachers, 
      volunteers, institutions, and visitors to our platform.`
    },
    {
      id: 'description',
      title: 'Description of Service',
      icon: BookOpen,
      content: `1001 Stories is a global education platform that discovers, publishes, and shares stories from children in underserved 
      communities. Our services include digital library access, educational programs, volunteer coordination, mentorship opportunities, 
      and creative workshops. We aim to empower young voices and inspire learning through storytelling.`
    },
    {
      id: 'user-accounts',
      title: 'User Accounts and Registration',
      icon: Users,
      subsections: [
        {
          title: 'Account Creation',
          items: [
            'You must provide accurate and complete information when creating an account',
            'You are responsible for maintaining the security of your account credentials',
            'You must notify us immediately of any unauthorized use of your account',
            'One person may not maintain multiple accounts without our permission'
          ]
        },
        {
          title: 'Age Requirements',
          items: [
            'Children under 13 require parental consent to create accounts',
            'Users between 13-18 are considered minors and have additional protections',
            'Parents and guardians are responsible for supervising minor users',
            'We reserve the right to verify age and request parental consent'
          ]
        },
        {
          title: 'Account Termination',
          items: [
            'You may terminate your account at any time through your account settings',
            'We may suspend or terminate accounts that violate these terms',
            'Upon termination, you lose access to premium content and services',
            'We will retain certain information as required by law or for legitimate business purposes'
          ]
        }
      ]
    },
    {
      id: 'content-policy',
      title: 'Content and User Submissions',
      icon: FileText,
      subsections: [
        {
          title: 'User-Generated Content',
          items: [
            'Users retain ownership of original content they submit to our platform',
            'By submitting content, you grant us a license to use, display, and distribute it',
            'All submitted content must comply with our community guidelines',
            'We reserve the right to remove content that violates our policies'
          ]
        },
        {
          title: 'Content Standards',
          items: [
            'Content must be appropriate for children and educational purposes',
            'No content that promotes violence, hatred, or discrimination',
            'No sharing of personal information or contact details',
            'Content must respect intellectual property rights of others'
          ]
        },
        {
          title: 'Moderation',
          items: [
            'All user submissions are reviewed before publication',
            'We use both automated and human moderation systems',
            'Moderators may edit content for clarity and safety',
            'Users can report inappropriate content through our reporting system'
          ]
        }
      ]
    },
    {
      id: 'acceptable-use',
      title: 'Acceptable Use Policy',
      icon: Shield,
      subsections: [
        {
          title: 'Permitted Uses',
          items: [
            'Educational and non-commercial use of our platform and content',
            'Participating in community discussions and activities',
            'Sharing original stories and creative work',
            'Collaborating with other users on educational projects'
          ]
        },
        {
          title: 'Prohibited Activities',
          items: [
            'Using the platform for commercial purposes without permission',
            'Attempting to hack, disrupt, or compromise platform security',
            'Impersonating other users or providing false information',
            'Harassment, bullying, or inappropriate contact with minors'
          ]
        },
        {
          title: 'Educational Environment',
          items: [
            'Maintain respectful and constructive interactions',
            'Support fellow learners and contribute positively to the community',
            'Follow guidelines provided by teachers and mentors',
            'Report safety concerns to our support team immediately'
          ]
        }
      ]
    },
    {
      id: 'intellectual-property',
      title: 'Intellectual Property Rights',
      icon: Scale,
      subsections: [
        {
          title: 'Our Content',
          items: [
            '1001 Stories owns the platform, software, and original educational materials',
            'Our trademarks, logos, and branding are protected intellectual property',
            'Users may not copy, modify, or distribute our proprietary content without permission',
            'Educational use of our materials is permitted within the platform'
          ]
        },
        {
          title: 'User Content',
          items: [
            'Users retain ownership of their original stories and creative work',
            'By submitting content, users grant us rights necessary to operate the platform',
            'We respect copyright and will respond to valid DMCA takedown notices',
            'Users must not submit content that infringes on others\' rights'
          ]
        },
        {
          title: 'License to Use Platform',
          items: [
            'We grant users a limited, non-exclusive license to use our platform',
            'This license is for educational and non-commercial purposes only',
            'The license terminates when your account is closed or suspended',
            'Users may not sublicense or transfer their access rights'
          ]
        }
      ]
    },
    {
      id: 'privacy-safety',
      title: 'Privacy and Safety',
      icon: Shield,
      content: `Your privacy and safety are paramount to us. We have implemented comprehensive measures to protect personal information, 
      especially for children. Our platform includes content moderation, secure communication channels, and regular safety audits. 
      Please refer to our Privacy Policy for detailed information about how we collect, use, and protect your data.`
    },
    {
      id: 'disclaimers',
      title: 'Disclaimers and Limitations',
      icon: AlertCircle,
      subsections: [
        {
          title: 'Service Availability',
          items: [
            'We strive for 99.9% uptime but cannot guarantee uninterrupted service',
            'Scheduled maintenance may temporarily affect platform availability',
            'We are not liable for losses due to service interruptions',
            'Users should maintain backup copies of important work'
          ]
        },
        {
          title: 'Educational Outcomes',
          items: [
            'We provide educational resources but cannot guarantee specific learning outcomes',
            'Individual results may vary based on engagement and effort',
            'Our platform supplements but does not replace formal education',
            'Users are responsible for their own educational progress'
          ]
        },
        {
          title: 'Third-Party Content',
          items: [
            'We may include links to external educational resources',
            'We are not responsible for the content or availability of external sites',
            'Third-party content is subject to their own terms and policies',
            'Users should exercise caution when leaving our platform'
          ]
        }
      ]
    },
    {
      id: 'governing-law',
      title: 'Governing Law and Dispute Resolution',
      icon: Gavel,
      content: `These terms are governed by the laws of California, United States. Any disputes will be resolved through binding arbitration 
      in San Francisco, California, except for claims that may be brought in small claims court. We encourage users to contact us directly 
      to resolve any concerns before pursuing formal legal action.`
    },
    {
      id: 'changes',
      title: 'Changes to Terms',
      icon: Calendar,
      content: `We may update these Terms of Service periodically to reflect changes in our services, legal requirements, or business practices. 
      Material changes will be communicated to users through email and platform notifications at least 30 days before taking effect. 
      Continued use of our platform after changes become effective constitutes acceptance of the new terms.`
    }
  ];

  const keyPoints = [
    {
      icon: BookOpen,
      title: 'Educational Purpose',
      description: 'Our platform is designed for educational use and empowering young voices through storytelling'
    },
    {
      icon: Shield,
      title: 'Safety First',
      description: 'Child safety and privacy protection are our highest priorities'
    },
    {
      icon: Users,
      title: 'Community Guidelines',
      description: 'We maintain a respectful, inclusive environment for learners worldwide'
    },
    {
      icon: Scale,
      title: 'Fair Use',
      description: 'We respect intellectual property rights and expect users to do the same'
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
            <div className="inline-flex items-center justify-center w-20 h-20 mb-6 bg-blue-100 rounded-full">
              <FileText className="w-10 h-10 text-blue-600" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              <span className="gradient-text">Terms of Service</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              These terms govern your use of the 1001 Stories platform and outline the rights and responsibilities 
              for all members of our global education community.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Effective: {effectiveDate}</span>
              </div>
              <div className="hidden sm:block w-1 h-1 bg-gray-400 rounded-full"></div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Last updated: {lastUpdated}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Key Points */}
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
              Key Principles
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              These core principles guide our terms and your experience on our platform.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {keyPoints.map((point, index) => (
              <motion.div
                key={point.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-blue-100 rounded-full">
                  <point.icon className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {point.title}
                </h3>
                <p className="text-gray-600">
                  {point.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Terms Sections */}
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
                <div className="flex items-center gap-4 mb-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
                    <section.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {section.title}
                  </h2>
                </div>

                {section.content && (
                  <p className="text-gray-700 leading-relaxed mb-6">
                    {section.content}
                  </p>
                )}

                {section.subsections && (
                  <div className="space-y-6">
                    {section.subsections.map((subsection, index) => (
                      <div key={index}>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          {subsection.title}
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
                )}
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
                Agreement to Terms
              </h3>
              <p className="text-gray-700 mb-4">
                By using the 1001 Stories platform, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. 
                If you are under 18, your parent or guardian must agree to these terms on your behalf.
              </p>
              <p className="text-sm text-gray-600">
                If you do not agree with any part of these terms, please discontinue use of our platform.
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
              Questions About Our Terms?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              If you have questions about these Terms of Service or need clarification on any policies, 
              our legal and support teams are here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="mailto:legal@1001stories.org"
                className="inline-flex items-center gap-2 px-8 py-4 text-lg font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700 transition-all transform hover:scale-105"
              >
                <Mail className="w-5 h-5" />
                Contact Legal Team
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-8 py-4 text-lg font-medium text-blue-600 bg-white border-2 border-blue-600 rounded-full hover:bg-blue-50 transition-all"
              >
                General Support
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
              Related Information
            </h3>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/privacy"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Privacy Policy
              </Link>
              <Link
                href="/about"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                About 1001 Stories
              </Link>
              <Link
                href="/contact"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Contact Us
              </Link>
              <Link
                href="/volunteer"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Community Guidelines
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}