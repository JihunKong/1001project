'use client';

import { Shield, Eye, Lock, Users, Database, Mail } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/useTranslation';

export default function PrivacyPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 rounded-full mb-6">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{t('privacy.title')}</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t('privacy.description')}
            </p>
            <p className="text-sm text-gray-500 mt-4">
              {t('privacy.lastUpdated')}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Quick Overview */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('privacy.overview.title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <Lock className="h-5 w-5 text-blue-600 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">{t('privacy.overview.secure.title')}</h3>
                <p className="text-sm text-gray-600">{t('privacy.overview.secure.description')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Eye className="h-5 w-5 text-blue-600 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">{t('privacy.overview.transparent.title')}</h3>
                <p className="text-sm text-gray-600">{t('privacy.overview.transparent.description')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-blue-600 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">{t('privacy.overview.control.title')}</h3>
                <p className="text-sm text-gray-600">{t('privacy.overview.control.description')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="prose prose-lg max-w-none">
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('privacy.section1.title')}</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-4">Personal Information</h3>
            <ul className="list-disc list-inside text-gray-600 space-y-2 mb-6">
              <li>Account information (name, email address, role)</li>
              <li>Profile information (cultural background, languages, preferences)</li>
              <li>Educational information (institution, grade level for students)</li>
              <li>Communication records (messages, support requests)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-4">Usage Information</h3>
            <ul className="list-disc list-inside text-gray-600 space-y-2 mb-6">
              <li>Reading progress and learning analytics</li>
              <li>Platform usage patterns and preferences</li>
              <li>Device and browser information</li>
              <li>IP address and location data (city/country level only)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-4">Content You Create</h3>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Stories and submissions</li>
              <li>Comments and reviews</li>
              <li>Assignments and class materials (for educators)</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('privacy.section2.title')}</h2>
            <div className="space-y-4 text-gray-600">
              <p>We use your information to:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Provide and improve our educational platform</li>
                <li>Personalize your learning experience</li>
                <li>Enable communication between users (teachers, students, writers)</li>
                <li>Ensure platform security and prevent abuse</li>
                <li>Send important updates and notifications</li>
                <li>Comply with legal requirements</li>
              </ul>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('privacy.section3.title')}</h2>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-yellow-600 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">{t('privacy.section3.noSell.title')}</h3>
                  <p className="text-sm text-gray-600">
                    {t('privacy.section3.noSell.description')}
                  </p>
                </div>
              </div>
            </div>

            <p className="text-gray-600 mb-4">We may share your information only in these limited circumstances:</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>With your explicit consent</li>
              <li>To comply with legal obligations</li>
              <li>To protect the safety of our users</li>
              <li>With service providers who help us operate the platform (all bound by strict confidentiality)</li>
              <li>In case of a business transfer (you would be notified)</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('privacy.section4.title')}</h2>
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <p className="text-gray-600 mb-4">
                We take special care to protect children&apos;s privacy:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Parental consent is required for users under 13</li>
                <li>Children&apos;s data is minimized and specially protected</li>
                <li>No behavioral advertising to children</li>
                <li>Parents can review and delete their child&apos;s information</li>
                <li>Educational use only - no commercial purposes</li>
              </ul>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('privacy.section5.title')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Lock className="h-5 w-5 text-gray-600" />
                  <h3 className="font-semibold text-gray-900">Technical Measures</h3>
                </div>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>End-to-end encryption</li>
                  <li>Secure data centers</li>
                  <li>Regular security audits</li>
                  <li>Access controls</li>
                </ul>
              </div>
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Database className="h-5 w-5 text-gray-600" />
                  <h3 className="font-semibold text-gray-900">Operational Practices</h3>
                </div>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>Data minimization</li>
                  <li>Regular backups</li>
                  <li>Staff training</li>
                  <li>Incident response plan</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('privacy.section6.title')}</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <p className="text-gray-600 mb-4">Under GDPR and other privacy laws, you have the right to:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-2">
                  <li>Access your personal data</li>
                  <li>Correct inaccurate information</li>
                  <li>Delete your account and data</li>
                  <li>Export your data</li>
                </ul>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-2">
                  <li>Restrict processing</li>
                  <li>Object to processing</li>
                  <li>Withdraw consent</li>
                  <li>Lodge complaints</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('privacy.section7.title')}</h2>
            <div className="bg-gray-50 rounded-lg p-6">
              <p className="text-gray-600 mb-4">
                If you have questions about this privacy policy or want to exercise your rights:
              </p>
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-gray-600 mt-1" />
                <div>
                  <p className="font-medium text-gray-900">Email Us</p>
                  <a href="mailto:privacy@1001stories.org" className="text-blue-600 hover:text-blue-700">
                    privacy@1001stories.org
                  </a>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('privacy.section8.title')}</h2>
            <p className="text-gray-600 mb-4">
              We may update this privacy policy from time to time. When we do, we&apos;ll:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 mb-6">
              <li>Update the &quot;Last updated&quot; date at the top</li>
              <li>Notify you via email or platform notification</li>
              <li>Give you time to review changes before they take effect</li>
              <li>Highlight significant changes clearly</li>
            </ul>
          </section>
        </div>

        {/* Footer Actions */}
        <div className="mt-16 pt-8 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t('privacy.footer.contactPrivacyTeam')}
            </Link>
            <Link
              href="/terms"
              className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              {t('privacy.footer.viewTerms')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}