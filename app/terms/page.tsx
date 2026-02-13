'use client';

import { FileText, Users, Shield, AlertTriangle, Check, Mail, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/useTranslation';

export default function TermsPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-50 to-indigo-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{t('common.backToHome')}</span>
          </Link>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-500 rounded-full mb-6">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{t('terms.title')}</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t('terms.description')}
            </p>
            <p className="text-sm text-gray-500 mt-4">
              {t('terms.lastUpdated')}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Quick Summary */}
        <div className="bg-green-50 border border-green-200 rounded-2xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('terms.summary.title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                {t('terms.summary.canDo.title')}
              </h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• {t('terms.summary.canDo.item1')}</li>
                <li>• {t('terms.summary.canDo.item2')}</li>
                <li>• {t('terms.summary.canDo.item3')}</li>
                <li>• {t('terms.summary.canDo.item4')}</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                {t('terms.summary.cannotDo.title')}
              </h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• {t('terms.summary.cannotDo.item1')}</li>
                <li>• {t('terms.summary.cannotDo.item2')}</li>
                <li>• {t('terms.summary.cannotDo.item3')}</li>
                <li>• {t('terms.summary.cannotDo.item4')}</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="prose prose-lg max-w-none text-gray-900">
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('terms.section1.title')}</h2>
            <p className="text-gray-600 mb-4">
              {t('terms.section1.agreement')}
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-gray-600">
                {t('terms.section1.minorsWarning')}
              </p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('terms.section2.title')}</h2>
            <p className="text-gray-600 mb-4">
              {t('terms.section2.intro')}
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
              <li>{t('terms.section2.purpose1')}</li>
              <li>{t('terms.section2.purpose2')}</li>
              <li>{t('terms.section2.purpose3')}</li>
              <li>{t('terms.section2.purpose4')}</li>
            </ul>
            <p className="text-gray-600">
              {t('terms.section2.operator')}
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('terms.section3.title')}</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-3">{t('terms.section3.educationalRoles.title')}</h3>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• {t('terms.section3.educationalRoles.students')}</li>
                  <li>• {t('terms.section3.educationalRoles.teachers')}</li>
                  <li>• {t('terms.section3.educationalRoles.institutions')}</li>
                </ul>
              </div>
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-3">{t('terms.section3.contentRoles.title')}</h3>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• {t('terms.section3.contentRoles.writers')}</li>
                  <li>• {t('terms.section3.contentRoles.managers')}</li>
                  <li>• {t('terms.section3.contentRoles.admins')}</li>
                </ul>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">{t('terms.section3.accountSecurity.title')}</h3>
              <p className="text-sm text-gray-600">
                {t('terms.section3.accountSecurity.content')}
              </p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('terms.section4.title')}</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-4">{t('terms.section4.acceptableContent.title')}</h3>
            <ul className="list-disc list-inside text-gray-600 space-y-2 mb-6">
              <li>{t('terms.section4.acceptableContent.item1')}</li>
              <li>{t('terms.section4.acceptableContent.item2')}</li>
              <li>{t('terms.section4.acceptableContent.item3')}</li>
              <li>{t('terms.section4.acceptableContent.item4')}</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-4">{t('terms.section4.prohibitedContent.title')}</h3>
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>{t('terms.section4.prohibitedContent.item1')}</li>
                <li>{t('terms.section4.prohibitedContent.item2')}</li>
                <li>{t('terms.section4.prohibitedContent.item3')}</li>
                <li>{t('terms.section4.prohibitedContent.item4')}</li>
                <li>{t('terms.section4.prohibitedContent.item5')}</li>
                <li>{t('terms.section4.prohibitedContent.item6')}</li>
              </ul>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('terms.section5.title')}</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-4">{t('terms.section5.yourContent.title')}</h3>
            <p className="text-gray-600 mb-4">
              {t('terms.section5.yourContent.intro')}
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 mb-6">
              <li>{t('terms.section5.yourContent.license1')}</li>
              <li>{t('terms.section5.yourContent.license2')}</li>
              <li>{t('terms.section5.yourContent.license3')}</li>
              <li>{t('terms.section5.yourContent.license4')}</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-4">{t('terms.section5.ourContent.title')}</h3>
            <p className="text-gray-600 mb-4">
              {t('terms.section5.ourContent.description')}
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('terms.section6.title')}</h2>
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-3">{t('terms.section6.permittedUses.title')}</h3>
              <ul className="text-sm text-gray-600 space-y-2 mb-4">
                <li>• {t('terms.section6.permittedUses.item1')}</li>
                <li>• {t('terms.section6.permittedUses.item2')}</li>
                <li>• {t('terms.section6.permittedUses.item3')}</li>
                <li>• {t('terms.section6.permittedUses.item4')}</li>
              </ul>
              <p className="text-sm text-gray-600">
                {t('terms.section6.permittedUses.attribution')}
              </p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('terms.section7.title')}</h2>
            <p className="text-gray-600 mb-4">
              {t('terms.section7.intro')} <Link href="/privacy" className="text-blue-600 hover:text-blue-700 underline">Privacy Policy</Link>
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-gray-600">
                {t('terms.section7.coppaCompliance')}
              </p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('terms.section8.title')}</h2>
            <p className="text-gray-600 mb-4">
              {t('terms.section8.intro')}
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
              <li>{t('terms.section8.limitation1')}</li>
              <li>{t('terms.section8.limitation2')}</li>
              <li>{t('terms.section8.limitation3')}</li>
            </ul>
            <p className="text-gray-600">
              {t('terms.section8.disclaimer')}
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('terms.section9.title')}</h2>
            <div className="bg-gray-50 border border-gray-300 rounded-lg p-6">
              <p className="text-gray-600 mb-4">
                {t('terms.section9.intro')}
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>{t('terms.section9.liability1')}</li>
                <li>{t('terms.section9.liability2')}</li>
                <li>{t('terms.section9.liability3')}</li>
                <li>{t('terms.section9.liability4')}</li>
              </ul>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('terms.section10.title')}</h2>
            <p className="text-gray-600 mb-4">
              {t('terms.section10.intro')}
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
              <li>{t('terms.section10.you')}</li>
              <li>{t('terms.section10.us')}</li>
            </ul>
            <p className="text-gray-600">
              {t('terms.section10.afterTermination')}
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('terms.section11.title')}</h2>
            <p className="text-gray-600 mb-4">
              {t('terms.section11.intro')}
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
              <li>{t('terms.section11.reason1')}</li>
              <li>{t('terms.section11.reason2')}</li>
              <li>{t('terms.section11.reason3')}</li>
              <li>{t('terms.section11.reason4')}</li>
            </ul>
            <p className="text-gray-600">
              {t('terms.section11.notification')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('terms.section12.title')}</h2>
            <div className="bg-gray-50 rounded-lg p-6">
              <p className="text-gray-600 mb-4">
                {t('terms.section12.intro')}
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-900">{t('terms.section12.legal.label')}</p>
                    <a href="mailto:legal@1001stories.org" className="text-blue-600 hover:text-blue-700">
                      {t('terms.section12.legal.email')}
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-900">{t('terms.section12.support.label')}</p>
                    <a href="mailto:support@1001stories.org" className="text-blue-600 hover:text-blue-700">
                      {t('terms.section12.support.email')}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Footer Actions */}
        <div className="mt-16 pt-8 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
            >
              {t('terms.footer.contactLegalTeam')}
            </Link>
            <Link
              href="/privacy"
              className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              {t('terms.footer.viewPrivacyPolicy')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}