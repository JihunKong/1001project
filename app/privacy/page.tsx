'use client';

import { Shield, Eye, Lock, Users, Database, Mail, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/useTranslation';

export default function PrivacyPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{t('common.backToHome')}</span>
          </Link>
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
        <div className="prose prose-lg max-w-none text-gray-900">
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('privacy.section1.title')}</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-4">{t('privacy.section1.personalInfo.title')}</h3>
            <ul className="list-disc list-inside text-gray-600 space-y-2 mb-6">
              <li>{t('privacy.section1.personalInfo.item1')}</li>
              <li>{t('privacy.section1.personalInfo.item2')}</li>
              <li>{t('privacy.section1.personalInfo.item3')}</li>
              <li>{t('privacy.section1.personalInfo.item4')}</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-4">{t('privacy.section1.usageInfo.title')}</h3>
            <ul className="list-disc list-inside text-gray-600 space-y-2 mb-6">
              <li>{t('privacy.section1.usageInfo.item1')}</li>
              <li>{t('privacy.section1.usageInfo.item2')}</li>
              <li>{t('privacy.section1.usageInfo.item3')}</li>
              <li>{t('privacy.section1.usageInfo.item4')}</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-4">{t('privacy.section1.contentCreate.title')}</h3>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>{t('privacy.section1.contentCreate.item1')}</li>
              <li>{t('privacy.section1.contentCreate.item2')}</li>
              <li>{t('privacy.section1.contentCreate.item3')}</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('privacy.section2.title')}</h2>
            <div className="space-y-4 text-gray-600">
              <p>{t('privacy.section2.intro')}</p>
              <ul className="list-disc list-inside space-y-2">
                <li>{t('privacy.section2.item1')}</li>
                <li>{t('privacy.section2.item2')}</li>
                <li>{t('privacy.section2.item3')}</li>
                <li>{t('privacy.section2.item4')}</li>
                <li>{t('privacy.section2.item5')}</li>
                <li>{t('privacy.section2.item6')}</li>
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

            <p className="text-gray-600 mb-4">{t('privacy.section3.intro')}</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>{t('privacy.section3.item1')}</li>
              <li>{t('privacy.section3.item2')}</li>
              <li>{t('privacy.section3.item3')}</li>
              <li>{t('privacy.section3.item4')}</li>
              <li>{t('privacy.section3.item5')}</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('privacy.section4.title')}</h2>
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <p className="text-gray-600 mb-4">
                {t('privacy.section4.intro')}
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>{t('privacy.section4.item1')}</li>
                <li>{t('privacy.section4.item2')}</li>
                <li>{t('privacy.section4.item3')}</li>
                <li>{t('privacy.section4.item4')}</li>
                <li>{t('privacy.section4.item5')}</li>
              </ul>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('privacy.section5.title')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Lock className="h-5 w-5 text-gray-600" />
                  <h3 className="font-semibold text-gray-900">{t('privacy.section5.technicalMeasures.title')}</h3>
                </div>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>{t('privacy.section5.technicalMeasures.item1')}</li>
                  <li>{t('privacy.section5.technicalMeasures.item2')}</li>
                  <li>{t('privacy.section5.technicalMeasures.item3')}</li>
                  <li>{t('privacy.section5.technicalMeasures.item4')}</li>
                </ul>
              </div>
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Database className="h-5 w-5 text-gray-600" />
                  <h3 className="font-semibold text-gray-900">{t('privacy.section5.operationalPractices.title')}</h3>
                </div>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>{t('privacy.section5.operationalPractices.item1')}</li>
                  <li>{t('privacy.section5.operationalPractices.item2')}</li>
                  <li>{t('privacy.section5.operationalPractices.item3')}</li>
                  <li>{t('privacy.section5.operationalPractices.item4')}</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('privacy.section6.title')}</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <p className="text-gray-600 mb-4">{t('privacy.section6.intro')}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-2">
                  <li>{t('privacy.section6.item1')}</li>
                  <li>{t('privacy.section6.item2')}</li>
                  <li>{t('privacy.section6.item3')}</li>
                  <li>{t('privacy.section6.item4')}</li>
                </ul>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-2">
                  <li>{t('privacy.section6.item5')}</li>
                  <li>{t('privacy.section6.item6')}</li>
                  <li>{t('privacy.section6.item7')}</li>
                  <li>{t('privacy.section6.item8')}</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('privacy.section7.title')}</h2>
            <div className="bg-gray-50 rounded-lg p-6">
              <p className="text-gray-600 mb-4">
                {t('privacy.section7.intro')}
              </p>
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-gray-600 mt-1" />
                <div>
                  <p className="font-medium text-gray-900">{t('privacy.section7.emailLabel')}</p>
                  <a href="mailto:privacy@1001stories.org" className="text-blue-600 hover:text-blue-700">
                    {t('privacy.section7.email')}
                  </a>
                </div>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('privacy.section8.title')}</h2>
            <p className="text-gray-600 mb-4">
              {t('privacy.section8.intro')}
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 mb-6">
              <li>{t('privacy.section8.item1')}</li>
              <li>{t('privacy.section8.item2')}</li>
              <li>{t('privacy.section8.item3')}</li>
              <li>{t('privacy.section8.item4')}</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('privacy.aiServices.title')}</h2>
            <p className="text-gray-600 mb-4">{t('privacy.aiServices.intro')}</p>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">{t('privacy.aiServices.openai.title')}</h3>
              <p className="text-sm text-gray-600 mb-2">{t('privacy.aiServices.openai.description')}</p>
              <p className="text-sm text-gray-600 mb-2"><strong>Data processed:</strong> {t('privacy.aiServices.openai.dataProcessed')}</p>
              <p className="text-sm text-gray-600"><strong>Retention:</strong> {t('privacy.aiServices.openai.retention')}</p>
            </div>

            <p className="text-gray-600 mb-4">{t('privacy.aiServices.purpose')}</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
              <li>{t('privacy.aiServices.purpose1')}</li>
              <li>{t('privacy.aiServices.purpose2')}</li>
              <li>{t('privacy.aiServices.purpose3')}</li>
              <li>{t('privacy.aiServices.purpose4')}</li>
            </ul>
            <p className="text-sm text-gray-500 italic">{t('privacy.aiServices.optOut')}</p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('privacy.dataRetention.title')}</h2>
            <p className="text-gray-600 mb-4">{t('privacy.dataRetention.intro')}</p>

            <div className="bg-gray-50 rounded-lg p-6 mb-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 pr-4 font-semibold text-gray-900">{t('privacy.dataRetention.table.dataType')}</th>
                      <th className="text-left py-2 font-semibold text-gray-900">{t('privacy.dataRetention.table.retentionPeriod')}</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-600">
                    <tr className="border-b border-gray-100">
                      <td className="py-2 pr-4">Reading Progress</td>
                      <td className="py-2">24 months</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-2 pr-4">Activity Logs</td>
                      <td className="py-2">12 months</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-2 pr-4">Account Information</td>
                      <td className="py-2">Until deletion</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-2 pr-4">Quiz Results</td>
                      <td className="py-2">24 months</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-2 pr-4">Parental Consent Records</td>
                      <td className="py-2">36 months (COPPA)</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4">Access Audit Logs</td>
                      <td className="py-2">36 months (FERPA)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <p className="text-sm text-gray-500">{t('privacy.dataRetention.deletion')}</p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('privacy.regulatoryCompliance.title')}</h2>
            <p className="text-gray-600 mb-6">{t('privacy.regulatoryCompliance.intro')}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
                <h3 className="font-semibold text-gray-900 mb-2">{t('privacy.regulatoryCompliance.coppa.title')}</h3>
                <p className="text-sm text-gray-600">{t('privacy.regulatoryCompliance.coppa.description')}</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-5">
                <h3 className="font-semibold text-gray-900 mb-2">{t('privacy.regulatoryCompliance.ferpa.title')}</h3>
                <p className="text-sm text-gray-600">{t('privacy.regulatoryCompliance.ferpa.description')}</p>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-5">
                <h3 className="font-semibold text-gray-900 mb-2">{t('privacy.regulatoryCompliance.pipa.title')}</h3>
                <p className="text-sm text-gray-600">{t('privacy.regulatoryCompliance.pipa.description')}</p>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-5">
                <h3 className="font-semibold text-gray-900 mb-2">{t('privacy.regulatoryCompliance.gdpr.title')}</h3>
                <p className="text-sm text-gray-600">{t('privacy.regulatoryCompliance.gdpr.description')}</p>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('privacy.parentalRights.title')}</h2>
            <p className="text-gray-600 mb-4">{t('privacy.parentalRights.intro')}</p>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-4">
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <Shield className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <span>{t('privacy.parentalRights.items.review')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Shield className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <span>{t('privacy.parentalRights.items.consent')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Shield className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <span>{t('privacy.parentalRights.items.delete')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Shield className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <span>{t('privacy.parentalRights.items.amend')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Shield className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <span>{t('privacy.parentalRights.items.access')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Shield className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <span>{t('privacy.parentalRights.items.export')}</span>
                </li>
              </ul>
            </div>

            <p className="text-gray-600 mb-3">{t('privacy.parentalRights.dashboard')}</p>
            <Link
              href="/dashboard/parent"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t('privacy.parentalRights.dashboardLink')}
            </Link>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('privacy.koreaSpecific.title')}</h2>
            <p className="text-gray-600 mb-4">{t('privacy.koreaSpecific.intro')}</p>

            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-4">
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <Eye className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <span><strong>{t('privacy.section6.item1')}:</strong> {t('privacy.koreaSpecific.rights.access')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Eye className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <span><strong>{t('privacy.section6.item2')}:</strong> {t('privacy.koreaSpecific.rights.correction')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Eye className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <span><strong>{t('privacy.section6.item3')}:</strong> {t('privacy.koreaSpecific.rights.deletion')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Eye className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <span><strong>{t('privacy.section6.item6')}:</strong> {t('privacy.koreaSpecific.rights.suspension')}</span>
                </li>
              </ul>
            </div>

            <p className="text-sm text-gray-600 mb-2">{t('privacy.koreaSpecific.processingTime')}</p>
            <p className="text-sm text-gray-500 italic">{t('privacy.koreaSpecific.minor')}</p>
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