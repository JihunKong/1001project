'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/useTranslation';

export default function TermsAndConditionsPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-soe-green-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="mb-8">
          <Link href="/" className="text-soe-green-600 hover:text-soe-green-700 flex items-center gap-2">
            {t('legal.terms.navigation.backToHome')}
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{t('legal.terms.header.title')}</h1>
          <p className="text-gray-600 mb-8">{t('legal.terms.header.subtitle')}</p>
          <p className="text-sm text-gray-500 mb-8">{t('legal.terms.header.lastUpdated')}</p>

          <div className="prose prose-lg max-w-none text-gray-900">
            <section className="mb-8">
              <p className="text-gray-700 leading-relaxed">
                {t('legal.terms.intro.welcome')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('legal.terms.section1.title')}</h2>
              <p className="text-gray-700 leading-relaxed">
                {t('legal.terms.section1.content')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('legal.terms.section2.title')}</h2>
              <p className="text-gray-700 leading-relaxed mb-4">{t('legal.terms.section2.intro')}</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>{t('legal.terms.section2.bullet1')}</li>
                <li>{t('legal.terms.section2.bullet2')}</li>
                <li>{t('legal.terms.section2.bullet3')}</li>
                <li>{t('legal.terms.section2.bullet4')}</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('legal.terms.section3.title')}</h2>
              <p className="text-gray-700 leading-relaxed mb-4">{t('legal.terms.section3.intro')}</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>{t('legal.terms.section3.bullet1')}</li>
                <li>{t('legal.terms.section3.bullet2')}</li>
                <li>{t('legal.terms.section3.bullet3')}</li>
                <li>{t('legal.terms.section3.bullet4')}</li>
                <li>{t('legal.terms.section3.bullet5')}</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('legal.terms.section4.title')}</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>{t('legal.terms.section4.bullet1')}</li>
                <li>{t('legal.terms.section4.bullet2')}</li>
                <li>{t('legal.terms.section4.bullet3')}</li>
                <li>{t('legal.terms.section4.bullet4')}</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('legal.terms.section5.title')}</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t('legal.terms.section5.intro')}
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">{t('legal.terms.section5.agreementIntro')}</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>{t('legal.terms.section5.bullet1')}</li>
                <li>{t('legal.terms.section5.bullet2')}</li>
                <li>{t('legal.terms.section5.bullet3')}</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('legal.terms.section6.title')}</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t('legal.terms.section6.paragraph1')}
              </p>
              <p className="text-gray-700 leading-relaxed">
                {t('legal.terms.section6.paragraph2')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('legal.terms.section7.title')}</h2>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
                <h3 className="font-bold text-gray-900 mb-2">{t('legal.terms.section7.personalTitle')}</h3>
                <p className="text-gray-700">
                  {t('legal.terms.section7.personalDesc')}
                </p>
              </div>
              <div className="bg-green-50 border-l-4 border-green-500 p-4">
                <h3 className="font-bold text-gray-900 mb-2">{t('legal.terms.section7.educationalTitle')}</h3>
                <p className="text-gray-700">
                  {t('legal.terms.section7.educationalDesc')}
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('legal.terms.section8.title')}</h2>
              <p className="text-gray-700 leading-relaxed mb-4">{t('legal.terms.section8.intro')}</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>{t('legal.terms.section8.bullet1')}</li>
                <li>{t('legal.terms.section8.bullet2')}</li>
                <li>{t('legal.terms.section8.bullet3')}</li>
                <li>{t('legal.terms.section8.bullet4')}</li>
                <li>{t('legal.terms.section8.bullet5')}</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('legal.terms.section9.title')}</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t('legal.terms.section9.intro')}
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>{t('legal.terms.section9.bullet1')}</li>
                <li>{t('legal.terms.section9.bullet2')}</li>
                <li>{t('legal.terms.section9.bullet3')}</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                {t('legal.terms.section9.conclusion')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('legal.terms.section10.title')}</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t('legal.terms.section10.paragraph1')}
              </p>
              <p className="text-gray-700 leading-relaxed">
                {t('legal.terms.section10.paragraph2')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('legal.terms.section11.title')}</h2>
              <p className="text-gray-700 leading-relaxed">
                {t('legal.terms.section11.content')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('legal.terms.section12.title')}</h2>
              <p className="text-gray-700 leading-relaxed">
                {t('legal.terms.section12.paragraph1')}
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                {t('legal.terms.section12.paragraph2')}
                <Link href="/legal/privacy" className="text-soe-green-600 hover:text-soe-green-700 underline">
                  {t('legal.terms.section12.privacyPolicyLink')}
                </Link>.
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                {t('legal.terms.section12.paragraph3')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('legal.terms.section13.title')}</h2>
              <p className="text-gray-700 leading-relaxed">
                {t('legal.terms.section13.content')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('legal.terms.section14.title')}</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t('legal.terms.section14.intro')}
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>{t('legal.terms.section14.bullet1')}</li>
                <li>{t('legal.terms.section14.bullet2')}</li>
                <li>{t('legal.terms.section14.bullet3')}</li>
                <li>{t('legal.terms.section14.bullet4')}</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                {t('legal.terms.section14.conclusion')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('legal.terms.section15.title')}</h2>
              <p className="text-gray-700 leading-relaxed">
                {t('legal.terms.section15.content')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('legal.terms.section16.title')}</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t('legal.terms.section16.paragraph1')}
              </p>
              <p className="text-gray-700 leading-relaxed">
                {t('legal.terms.section16.paragraph2')}
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                {t('legal.terms.section16.paragraph3')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('legal.terms.section17.title')}</h2>
              <p className="text-gray-700 leading-relaxed">
                {t('legal.terms.section17.content')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('legal.terms.section18.title')}</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t('legal.terms.section18.intro')}
              </p>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-900 font-semibold">{t('legal.terms.section18.orgName')}</p>
                <p className="text-gray-700">{t('legal.terms.section18.location')}</p>
                <p className="text-gray-700">{t('legal.terms.section18.email')}</p>
                <p className="text-gray-700">
                  {t('legal.terms.section18.website')}
                  <a href={t('legal.terms.section18.websiteLink')} className="text-soe-green-600 hover:text-soe-green-700 underline">
                    {t('legal.terms.section18.websiteUrl')}
                  </a>
                </p>
              </div>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 bg-soe-green-600 text-white rounded-lg hover:bg-soe-green-700 transition-colors"
            >
              {t('legal.terms.footer.backToHome')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
