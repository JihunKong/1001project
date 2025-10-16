import { Metadata } from 'next';
import { FileText, Users, Shield, AlertTriangle, Check, Mail } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '1001 Stories - Terms of Service',
  description: 'Read the Terms of Service for 1001 Stories platform, including user responsibilities, content policies, and platform usage guidelines.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-50 to-indigo-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-500 rounded-full mb-6">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              These terms govern your use of the 1001 Stories platform.
              Please read them carefully before using our services.
            </p>
            <p className="text-sm text-gray-500 mt-4">
              Last updated: September 25, 2024
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Quick Summary */}
        <div className="bg-green-50 border border-green-200 rounded-2xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Agreement Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                You Can:
              </h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Use the platform for educational purposes</li>
                <li>• Share appropriate stories and content</li>
                <li>• Connect with other users respectfully</li>
                <li>• Download content for personal/classroom use</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                You Cannot:
              </h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Use the platform for commercial purposes</li>
                <li>• Share inappropriate or harmful content</li>
                <li>• Violate others&apos; privacy or rights</li>
                <li>• Attempt to hack or disrupt the platform</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="prose prose-lg max-w-none">
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">1. Acceptance of Terms</h2>
            <p className="text-gray-600 mb-4">
              By accessing or using 1001 Stories, you agree to be bound by these Terms of Service
              and all applicable laws and regulations. If you do not agree with any of these terms,
              you are prohibited from using or accessing this platform.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-gray-600">
                <strong>For Minors:</strong> If you are under 18, your parent or guardian must
                agree to these terms on your behalf before you can use the platform.
              </p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">2. Platform Purpose</h2>
            <p className="text-gray-600 mb-4">
              1001 Stories is an educational platform designed to:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
              <li>Facilitate cultural exchange through storytelling</li>
              <li>Provide educational resources for teachers and students</li>
              <li>Support literacy development worldwide</li>
              <li>Connect communities through shared narratives</li>
            </ul>
            <p className="text-gray-600">
              The platform is operated by Seeds of Empowerment, a non-profit organization
              dedicated to educational empowerment.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">3. User Accounts and Roles</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-3">Educational Roles</h3>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• <strong>Students:</strong> Access assigned content, track progress</li>
                  <li>• <strong>Teachers:</strong> Create classes, assign materials</li>
                  <li>• <strong>Institutions:</strong> Manage organizational access</li>
                </ul>
              </div>
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-3">Content Roles</h3>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• <strong>Writers:</strong> Submit stories and content</li>
                  <li>• <strong>Managers:</strong> Review and curate content</li>
                  <li>• <strong>Admins:</strong> Platform administration</li>
                </ul>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Account Security</h3>
              <p className="text-sm text-gray-600">
                You are responsible for maintaining the security of your account and password.
                Notify us immediately of any unauthorized use of your account.
              </p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">4. Content Guidelines</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-4">Acceptable Content</h3>
            <ul className="list-disc list-inside text-gray-600 space-y-2 mb-6">
              <li>Educational and culturally enriching stories</li>
              <li>Age-appropriate content for the intended audience</li>
              <li>Respectful discussions and comments</li>
              <li>Original work or properly attributed content</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-4">Prohibited Content</h3>
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Harmful, abusive, or discriminatory content</li>
                <li>Inappropriate sexual or violent material</li>
                <li>Copyright-infringing content</li>
                <li>Spam, malware, or malicious code</li>
                <li>Personal information of others</li>
                <li>Commercial advertisements or solicitations</li>
              </ul>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">5. Intellectual Property</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-4">Your Content</h3>
            <p className="text-gray-600 mb-4">
              When you submit content to 1001 Stories, you retain ownership of your original work.
              However, you grant us a license to:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 mb-6">
              <li>Display and distribute your content on the platform</li>
              <li>Make editorial improvements while preserving authenticity</li>
              <li>Create educational materials based on your stories</li>
              <li>Translate content to make it accessible globally</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-4">Our Content</h3>
            <p className="text-gray-600 mb-4">
              The platform itself, including design, features, and curated content,
              is owned by Seeds of Empowerment and protected by intellectual property laws.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">6. Educational Use</h2>
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Permitted Educational Uses</h3>
              <ul className="text-sm text-gray-600 space-y-2 mb-4">
                <li>• Classroom instruction and assignments</li>
                <li>• Student research and projects</li>
                <li>• Teacher training and development</li>
                <li>• Non-profit educational initiatives</li>
              </ul>
              <p className="text-sm text-gray-600">
                <strong>Attribution:</strong> When using our content, please credit &quot;1001 Stories&quot; and
                include a link to our platform when possible.
              </p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">7. Privacy and Data Protection</h2>
            <p className="text-gray-600 mb-4">
              Your privacy is important to us. Our data practices are governed by our
              <Link href="/privacy" className="text-blue-600 hover:text-blue-700 underline">Privacy Policy</Link>,
              which is incorporated into these terms by reference.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-gray-600">
                <strong>COPPA Compliance:</strong> We comply with the Children&apos;s Online Privacy
                Protection Act and have special protections for users under 13.
              </p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">8. Platform Availability</h2>
            <p className="text-gray-600 mb-4">
              While we strive to maintain continuous service, we cannot guarantee:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
              <li>Uninterrupted access to the platform</li>
              <li>Error-free operation</li>
              <li>Permanent availability of all content</li>
            </ul>
            <p className="text-gray-600">
              We reserve the right to modify, suspend, or discontinue the platform
              with appropriate notice to users.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">9. Limitation of Liability</h2>
            <div className="bg-gray-50 border border-gray-300 rounded-lg p-6">
              <p className="text-gray-600 mb-4">
                1001 Stories is provided &quot;as is&quot; for educational purposes. To the fullest
                extent permitted by law, Seeds of Empowerment disclaims all warranties
                and limits liability for:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Indirect, incidental, or consequential damages</li>
                <li>Loss of data or educational progress</li>
                <li>Service interruptions or technical issues</li>
                <li>Content accuracy or completeness</li>
              </ul>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">10. Termination</h2>
            <p className="text-gray-600 mb-4">
              Either party may terminate this agreement:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
              <li><strong>You:</strong> By discontinuing use and deleting your account</li>
              <li><strong>Us:</strong> For violation of these terms or misuse of the platform</li>
            </ul>
            <p className="text-gray-600">
              Upon termination, your access will cease, but educational content you&apos;ve
              created may remain for the benefit of the community (unless you request removal).
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">11. Changes to Terms</h2>
            <p className="text-gray-600 mb-4">
              We may update these terms periodically to reflect:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
              <li>Changes in applicable law</li>
              <li>New platform features</li>
              <li>Community feedback</li>
              <li>Educational best practices</li>
            </ul>
            <p className="text-gray-600">
              We&apos;ll notify users of significant changes via email or platform notification.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">12. Contact Information</h2>
            <div className="bg-gray-50 rounded-lg p-6">
              <p className="text-gray-600 mb-4">
                Questions about these terms? We&apos;re here to help:
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-900">Legal Team:</p>
                    <a href="mailto:legal@1001stories.org" className="text-blue-600 hover:text-blue-700">
                      legal@1001stories.org
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-900">General Support:</p>
                    <a href="mailto:support@1001stories.org" className="text-blue-600 hover:text-blue-700">
                      support@1001stories.org
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
              Contact Legal Team
            </Link>
            <Link
              href="/privacy"
              className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              View Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}