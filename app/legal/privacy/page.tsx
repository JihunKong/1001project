import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy | 1001 Stories',
  description: 'Privacy Policy for the 1001 Stories Program by Seeds of Empowerment'
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-soe-green-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="mb-8">
          <Link href="/" className="text-soe-green-600 hover:text-soe-green-700 flex items-center gap-2">
            ← Back to Home
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-gray-600 mb-8">1001 Stories Program</p>
          <p className="text-sm text-gray-500 mb-8">Effective Date: October 1, 2025</p>

          <div className="prose prose-lg max-w-none text-gray-900">
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-700 leading-relaxed">
                Seeds of Empowerment (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) respects your privacy. This Privacy Policy explains
                how we collect, use, and protect your personal information when you use the 1001 Stories Program,
                a nonprofit storytelling platform designed to empower children through literacy, creativity, and
                global citizenship.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We collect personal and usage information to operate and improve our services. This includes:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>Personal Information:</strong> Name, contact details, and payment information (for subscribers).</li>
                <li><strong>Child Participant Data:</strong> With verified parental or guardian consent, we collect children&apos;s names, ages, story submissions, and workshop participation data.</li>
                <li><strong>Technical Data:</strong> Device type, IP address, browser type, and usage patterns.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Deliver and improve the 1001 Stories Program</li>
                <li>Manage subscriptions and process payments</li>
                <li>Communicate updates and community news</li>
                <li>Select and publish participant-submitted stories</li>
                <li>Comply with legal obligations (e.g., COPPA, CCPA, GDPR)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Children&apos;s Privacy</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We comply with child privacy laws such as the Children&apos;s Online Privacy Protection Act (COPPA) and
                GDPR-K. We collect data from children only:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>With verifiable parental or guardian consent</li>
                <li>For educational purposes</li>
                <li>To support program-related activities, such as publishing stories</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                We do not sell or share children&apos;s personal information for commercial purposes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Sharing of Information</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We do not sell personal information. We may share data only:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>With service providers under strict confidentiality agreements</li>
                <li>When required by law or to protect participant safety</li>
                <li>In aggregate, non-identifiable form for program evaluation</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Story Submissions</h2>
              <p className="text-gray-700 leading-relaxed">
                By submitting stories, participants (or their guardians) grant us a non-exclusive, royalty-free
                license to use, reproduce, and distribute the content for educational and publishing purposes.
                Authors retain ownership of their original works.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Data Security</h2>
              <p className="text-gray-700 leading-relaxed">
                We use industry-standard safeguards to protect your information, including secure payment processing
                and encrypted communications. While no system is 100% secure, we take all reasonable steps to protect
                your data.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. International Users</h2>
              <p className="text-gray-700 leading-relaxed">
                If you access the 1001 Stories Program from outside the U.S., your information will be transferred to
                and processed in the United States. By using our services, you consent to this transfer.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Your Rights</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Depending on your location, you may have rights to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Access, correct, or delete your personal data</li>
                <li>Withdraw consent (where applicable)</li>
                <li>Request data portability</li>
                <li>File a complaint with a data protection authority</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                To exercise these rights, please contact us at: contact@seedsofempowerment.org
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Updates to This Policy</h2>
              <p className="text-gray-700 leading-relaxed">
                We may update this Privacy Policy to reflect changes in our practices. We will notify users of
                significant changes through email or a notice on our platform.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Contact Us</h2>
              <p className="text-gray-700 leading-relaxed">
                If you have questions or concerns about this policy, please contact:
              </p>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-900 font-semibold">Seeds of Empowerment</p>
                <p className="text-gray-700">Stanford, California, USA</p>
                <p className="text-gray-700">Email: contact@seedsofempowerment.org</p>
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
