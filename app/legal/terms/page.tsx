import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Terms and Conditions | 1001 Stories',
  description: 'Terms and Conditions for the 1001 Stories Program by Seeds of Empowerment'
};

export default function TermsAndConditionsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-soe-green-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="mb-8">
          <Link href="/" className="text-soe-green-600 hover:text-soe-green-700 flex items-center gap-2">
            ← Back to Home
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms and Conditions</h1>
          <p className="text-gray-600 mb-8">1001 Stories Program</p>
          <p className="text-sm text-gray-500 mb-8">Last Updated: October 1, 2025</p>

          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <p className="text-gray-700 leading-relaxed">
                Welcome to the 1001 Stories Program. By subscribing to our services, you agree to the following
                Terms and Conditions (&quot;Terms&quot;), which govern your access to and participation in the 1001 Stories
                storytelling platform, operated by Seeds of Empowerment, a nonprofit organization based in Stanford,
                California, USA.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. About Us</h2>
              <p className="text-gray-700 leading-relaxed">
                1001 Stories is a global mobile storytelling program committed to empowering children in
                under-resourced communities through storytelling, literacy development, and digital publishing.
                Operated by Seeds of Empowerment, our nonprofit mission is to amplify young voices and create
                educational opportunities around the world.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Eligibility</h2>
              <p className="text-gray-700 leading-relaxed mb-4">To subscribe, you must:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Be at least 18 years old or have the consent of a parent or guardian if under 18.</li>
                <li>Provide accurate and complete information at the time of registration.</li>
                <li>Agree to these Terms and all applicable laws.</li>
                <li>Educators or parents/guardians may register on behalf of minors.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Subscription Overview</h2>
              <p className="text-gray-700 leading-relaxed mb-4">A 1001 Stories subscription includes:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Access to a digital library of children&apos;s stories created through the program</li>
                <li>Participation in online or local storytelling workshops (when available)</li>
                <li>Opportunities to submit stories for publishing consideration</li>
                <li>Program updates and community impact reports</li>
                <li>Support for community reinvestment through story proceeds</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Billing and Payment</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Subscription fees are billed monthly or yearly in advance and are non-refundable.</li>
                <li>Payments are securely processed via our payment gateway.</li>
                <li>By subscribing, you authorize Seeds of Empowerment to charge your selected payment method on a recurring basis.</li>
                <li>You may cancel your subscription at any time via your account settings. Service will remain active until the end of the current billing cycle.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Content and Usage</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                All content provided through the 1001 Stories Program is intended for educational and non-commercial
                personal use.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">You agree not to:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Copy, distribute, or commercially exploit any program content without prior written permission.</li>
                <li>Misuse or alter program materials.</li>
                <li>Share access credentials with others not registered under the same account.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. User-Submitted Stories</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Participants may submit original stories as part of the program. By submitting content, you (or your
                parent/guardian if under 18) grant Seeds of Empowerment a non-exclusive, royalty-free, worldwide
                license to use, reproduce, distribute, and publish the content for educational and program-related
                purposes.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Where selected, stories may be published digitally or in print. All proceeds from these publications
                are reinvested into local community programs as part of our self-sustaining educational model.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Educational and Personal Licenses</h2>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
                <h3 className="font-bold text-gray-900 mb-2">Personal License</h3>
                <p className="text-gray-700">
                  For individual readers and families, providing access to read and enjoy stories for personal,
                  non-commercial use.
                </p>
              </div>
              <div className="bg-green-50 border-l-4 border-green-500 p-4">
                <h3 className="font-bold text-gray-900 mb-2">Educational License</h3>
                <p className="text-gray-700">
                  For teachers, schools, and educational institutions, allowing classroom use, student assignments,
                  and educational activities. Educational licenses require active subscription and may have specific
                  terms regarding student access and usage.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Restrictions and Prohibited Use</h2>
              <p className="text-gray-700 leading-relaxed mb-4">Users may not:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Reproduce, redistribute, or resell works without explicit authorization</li>
                <li>Use content for commercial purposes without written permission</li>
                <li>Remove or alter copyright notices or attribution</li>
                <li>Use classroom materials without an active educational license</li>
                <li>Share access credentials or circumvent access controls</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Community Standards</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We are committed to maintaining a respectful and inclusive global community. By participating, you
                agree not to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Submit harmful, discriminatory, or inappropriate content</li>
                <li>Harass, impersonate, or exploit others</li>
                <li>Interfere with platform operations or security</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                Violations may result in suspension or permanent removal from the program.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Intellectual Property</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                All materials, trademarks, and digital content made available by Seeds of Empowerment through the
                1001 Stories Program remain the property of the organization or its content partners.
              </p>
              <p className="text-gray-700 leading-relaxed">
                User-submitted stories remain the intellectual property of the authors, subject to the license
                granted under Section 6.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Platform Responsibilities</h2>
              <p className="text-gray-700 leading-relaxed">
                The Platform provides hosting, distribution, and technical support for the 1001 Stories Program.
                While we strive for continuous availability, we do not guarantee uninterrupted access to services.
                We reserve the right to modify, suspend, or discontinue any aspect of the platform with reasonable
                notice to users.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Privacy and Data Use</h2>
              <p className="text-gray-700 leading-relaxed">
                Seeds of Empowerment respects your privacy and complies with applicable international data protection
                laws, including the California Consumer Privacy Act (CCPA) and the General Data Protection Regulation
                (GDPR) for users in the European Union.
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                We collect personal data only to provide, improve, and communicate about the 1001 Stories Program.
                For full details, please refer to our{' '}
                <Link href="/legal/privacy" className="text-soe-green-600 hover:text-soe-green-700 underline">
                  Privacy Policy
                </Link>.
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                Children&apos;s data is collected and used only with verified parental consent and in compliance with
                child privacy laws such as COPPA (U.S.) and equivalent regulations globally.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">13. International Use</h2>
              <p className="text-gray-700 leading-relaxed">
                The 1001 Stories Program is operated from the United States and may not be available or appropriate
                in all regions. If you access the program from outside the U.S., you do so voluntarily and are
                responsible for complying with any local laws applicable in your country. We do not guarantee that
                program features or protections meet local requirements outside of the U.S.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Enforcement and Remedies</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Violation of these Terms may result in:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Suspension of access to the platform</li>
                <li>Revocation of licenses</li>
                <li>Legal remedies as permitted by law</li>
                <li>Termination of your account</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                We reserve the right to take appropriate action to protect our community and the integrity of the
                platform.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">15. Modifications to Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                Seeds of Empowerment reserves the right to modify or update these Terms at any time. We will notify
                subscribers of significant changes by email or platform notice. Continued use of the program following
                such changes constitutes acceptance of the revised Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">16. Governing Law and Jurisdiction</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                These Terms shall be governed by and construed in accordance with the laws of the State of California,
                United States, without regard to its conflict of law principles.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Seeds of Empowerment is a nonprofit organization based in Stanford, California. Any disputes arising
                from these Terms shall be subject to the exclusive jurisdiction of the state or federal courts located
                in Santa Clara County, California.
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                If a provision of these Terms is found to be unenforceable, the remainder will remain in effect.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">17. Acceptance of Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                By accessing the Platform and using the 1001 Stories Program, Users agree to be bound by these Terms
                of Use. If you do not agree to these Terms, you may not access or use the platform.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">18. Contact Information</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                For questions, support, or feedback, please contact us:
              </p>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-900 font-semibold">Seeds of Empowerment</p>
                <p className="text-gray-700">Stanford, California, USA</p>
                <p className="text-gray-700">Email: contact@seedsofempowerment.org</p>
                <p className="text-gray-700">Website: <a href="https://seedsofempowerment.org" className="text-soe-green-600 hover:text-soe-green-700 underline">seedsofempowerment.org</a></p>
              </div>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 bg-soe-green-600 text-white rounded-lg hover:bg-soe-green-700 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
