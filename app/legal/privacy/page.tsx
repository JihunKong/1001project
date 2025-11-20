'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/useTranslation';

export default function PrivacyPolicyPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-soe-green-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="mb-8">
          <Link href="/" className="text-soe-green-600 hover:text-soe-green-700 flex items-center gap-2">
            {t('legal.privacy.navigation.backToHome')}
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{t('legal.privacy.header.title')}</h1>
          <p className="text-gray-600 mb-8">{t('legal.privacy.header.subtitle')}</p>
          <p className="text-sm text-gray-500 mb-8">{t('legal.privacy.header.effectiveDate')}</p>

          <div className="prose prose-lg max-w-none text-gray-900">
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('legal.privacy.section1.title')}</h2>
              <p className="text-gray-700 leading-relaxed">
                {t('legal.privacy.section1.content')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('legal.privacy.section2.title')}</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t('legal.privacy.section2.intro')}
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>{t('legal.privacy.section2.personalInfo.title')}</strong> {t('legal.privacy.section2.personalInfo.content')}</li>
                <li><strong>{t('legal.privacy.section2.childData.title')}</strong> {t('legal.privacy.section2.childData.content')}</li>
                <li><strong>{t('legal.privacy.section2.technicalData.title')}</strong> {t('legal.privacy.section2.technicalData.content')}</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('legal.privacy.section3.title')}</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t('legal.privacy.section3.intro')}
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>{t('legal.privacy.section3.bullet1')}</li>
                <li>{t('legal.privacy.section3.bullet2')}</li>
                <li>{t('legal.privacy.section3.bullet3')}</li>
                <li>{t('legal.privacy.section3.bullet4')}</li>
                <li>{t('legal.privacy.section3.bullet5')}</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('legal.privacy.section4.title')}</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t('legal.privacy.section4.intro')}
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>{t('legal.privacy.section4.bullet1')}</li>
                <li>{t('legal.privacy.section4.bullet2')}</li>
                <li>{t('legal.privacy.section4.bullet3')}</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                {t('legal.privacy.section4.conclusion')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('legal.privacy.section5.title')}</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t('legal.privacy.section5.intro')}
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>{t('legal.privacy.section5.bullet1')}</li>
                <li>{t('legal.privacy.section5.bullet2')}</li>
                <li>{t('legal.privacy.section5.bullet3')}</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('legal.privacy.section6.title')}</h2>
              <p className="text-gray-700 leading-relaxed">
                {t('legal.privacy.section6.content')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('legal.privacy.section7.title')}</h2>
              <p className="text-gray-700 leading-relaxed">
                {t('legal.privacy.section7.content')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('legal.privacy.section8.title')}</h2>
              <p className="text-gray-700 leading-relaxed">
                {t('legal.privacy.section8.content')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('legal.privacy.section9.title')}</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t('legal.privacy.section9.intro')}
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>{t('legal.privacy.section9.bullet1')}</li>
                <li>{t('legal.privacy.section9.bullet2')}</li>
                <li>{t('legal.privacy.section9.bullet3')}</li>
                <li>{t('legal.privacy.section9.bullet4')}</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                {t('legal.privacy.section9.conclusion')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('legal.privacy.section10.title')}</h2>
              <p className="text-gray-700 leading-relaxed">
                {t('legal.privacy.section10.content')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('legal.privacy.section11.title')}</h2>
              <p className="text-gray-700 leading-relaxed">
                {t('legal.privacy.section11.intro')}
              </p>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-900 font-semibold">{t('legal.privacy.section11.orgName')}</p>
                <p className="text-gray-700">{t('legal.privacy.section11.location')}</p>
                <p className="text-gray-700">{t('legal.privacy.section11.email')}</p>
              </div>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 bg-soe-green-600 text-white rounded-lg hover:bg-soe-green-700 transition-colors"
            >
              {t('legal.privacy.footer.backToHome')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
