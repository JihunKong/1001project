import { Metadata } from 'next';
import { HelpCircle, Search, BookOpen, Users, Settings, MessageCircle, Mail } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '1001 Stories - Help Center',
  description: 'Find answers to common questions about 1001 Stories platform, get started guides, and contact our support team.',
};

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-50 to-teal-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500 rounded-full mb-6">
              <HelpCircle className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Help Center</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
              Find answers to common questions, explore our guides, and get the support you need
              to make the most of 1001 Stories.
            </p>

            {/* Search Bar */}
            <div className="max-w-md mx-auto relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Search for help..."
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Quick Start */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Get Started Quickly</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Link href="#getting-started" className="group">
              <div className="bg-blue-50 rounded-2xl p-8 text-center hover:bg-blue-100 transition-colors">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 rounded-full mb-6 group-hover:scale-110 transition-transform">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">New User Guide</h3>
                <p className="text-gray-600">
                  Learn how to create your account, choose your role, and start exploring stories.
                </p>
              </div>
            </Link>

            <Link href="#for-teachers" className="group">
              <div className="bg-emerald-50 rounded-2xl p-8 text-center hover:bg-emerald-100 transition-colors">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500 rounded-full mb-6 group-hover:scale-110 transition-transform">
                  <BookOpen className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">For Educators</h3>
                <p className="text-gray-600">
                  Discover how to create classes, assign stories, and track student progress.
                </p>
              </div>
            </Link>

            <Link href="#technical-support" className="group">
              <div className="bg-purple-50 rounded-2xl p-8 text-center hover:bg-purple-100 transition-colors">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-500 rounded-full mb-6 group-hover:scale-110 transition-transform">
                  <Settings className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Technical Help</h3>
                <p className="text-gray-600">
                  Troubleshoot common issues and learn about platform features.
                </p>
              </div>
            </Link>
          </div>
        </div>

        {/* FAQ Sections */}
        <div className="space-y-12">
          {/* Getting Started */}
          <section id="getting-started">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Getting Started</h2>
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">How do I create an account?</h3>
                <p className="text-gray-600 mb-4">
                  Click the &quot;Sign Up&quot; button and choose your role (Student, Teacher, Writer, etc.).
                  Fill out the required information and verify your email address.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <p className="text-sm text-gray-600">
                    <strong>Tip:</strong> Choose your role carefully as it determines what features you&apos;ll have access to.
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">What are the different user roles?</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-600">
                  <div>
                    <p className="font-medium text-gray-900 mb-2">Educational Roles:</p>
                    <ul className="text-sm space-y-1">
                      <li>• <strong>Student:</strong> Access assigned content, track progress</li>
                      <li>• <strong>Teacher:</strong> Create classes, assign materials</li>
                      <li>• <strong>Institution:</strong> Manage organizational access</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 mb-2">Content Roles:</p>
                    <ul className="text-sm space-y-1">
                      <li>• <strong>Writer:</strong> Submit stories and content</li>
                      <li>• <strong>Story Manager:</strong> Review submissions</li>
                      <li>• <strong>Admin:</strong> Platform administration</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Is 1001 Stories free to use?</h3>
                <p className="text-gray-600">
                  Yes! 1001 Stories is a non-profit platform and free for educational use.
                  We&apos;re supported by the Seeds of Empowerment initiative to ensure
                  global access to quality educational content.
                </p>
              </div>
            </div>
          </section>

          {/* For Teachers */}
          <section id="for-teachers">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">For Educators</h2>
            <div className="space-y-6">
              <div className="bg-emerald-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">How do I create a class?</h3>
                <p className="text-gray-600 mb-3">
                  From your teacher dashboard, click &quot;Create Class&quot; and fill in the details:
                </p>
                <ol className="list-decimal list-inside text-gray-600 space-y-2">
                  <li>Enter class name and subject</li>
                  <li>Set grade level and capacity</li>
                  <li>Generate a unique class code</li>
                  <li>Share the code with your students</li>
                </ol>
              </div>

              <div className="bg-emerald-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">How do students join my class?</h3>
                <p className="text-gray-600">
                  Students use the 6-character class code you provide. They enter this code
                  during signup or in their student dashboard to join your class.
                </p>
              </div>

              <div className="bg-emerald-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Can I track student progress?</h3>
                <p className="text-gray-600">
                  Yes! Your teacher dashboard shows detailed analytics including:
                  reading progress, completion rates, engagement metrics, and individual student performance.
                </p>
              </div>

              <div className="bg-emerald-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">How do I assign specific stories?</h3>
                <p className="text-gray-600">
                  Browse the library, select stories appropriate for your class,
                  and use the &quot;Assign to Class&quot; feature. Students will see assigned
                  stories in their dashboard with due dates and instructions.
                </p>
              </div>
            </div>
          </section>

          {/* Technical Support */}
          <section id="technical-support">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Technical Support</h2>
            <div className="space-y-6">
              <div className="bg-purple-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">The platform is running slowly. What can I do?</h3>
                <p className="text-gray-600 mb-3">Try these troubleshooting steps:</p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Refresh your browser and clear cache</li>
                  <li>Check your internet connection</li>
                  <li>Try a different browser or device</li>
                  <li>Disable browser extensions temporarily</li>
                </ul>
              </div>

              <div className="bg-purple-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">I can&apos;t access my account. What should I do?</h3>
                <p className="text-gray-600 mb-3">
                  If you&apos;re having trouble logging in:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Check that you&apos;re using the correct email address</li>
                  <li>Try the &quot;Forgot Password&quot; link to reset your password</li>
                  <li>Check your spam folder for verification emails</li>
                  <li>Contact our support team if the issue persists</li>
                </ul>
              </div>

              <div className="bg-purple-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Which browsers are supported?</h3>
                <p className="text-gray-600">
                  1001 Stories works best on modern browsers including Chrome, Firefox, Safari, and Edge.
                  We recommend keeping your browser updated for the best experience.
                </p>
              </div>

              <div className="bg-purple-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Can I use 1001 Stories on mobile devices?</h3>
                <p className="text-gray-600">
                  Yes! Our platform is responsive and works well on tablets and smartphones.
                  For the best reading experience, we recommend tablets or larger screens.
                </p>
              </div>
            </div>
          </section>

          {/* Content Guidelines */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Content & Community</h2>
            <div className="space-y-6">
              <div className="bg-yellow-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">What types of stories can I submit?</h3>
                <p className="text-gray-600 mb-3">We welcome:</p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Cultural stories and folk tales</li>
                  <li>Personal experiences and memoirs</li>
                  <li>Educational narratives</li>
                  <li>Community stories and histories</li>
                </ul>
                <p className="text-gray-600 mt-3">
                  All content must be appropriate for educational use and respect
                  our <Link href="/terms" className="text-blue-600 hover:underline">community guidelines</Link>.
                </p>
              </div>

              <div className="bg-yellow-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">How do I report inappropriate content?</h3>
                <p className="text-gray-600">
                  If you encounter content that violates our guidelines, please use the &quot;Report&quot;
                  button on the story page or contact our moderation team directly.
                  We review all reports promptly.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Contact Support */}
        <div className="mt-16 bg-gray-50 rounded-2xl p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Still Need Help?</h2>
            <p className="text-gray-600">
              Our support team is here to help. Reach out and we&apos;ll get back to you as soon as possible.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
                <Mail className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Email Support</h3>
              <p className="text-gray-600 mb-4">Get detailed help via email</p>
              <a
                href="mailto:support@1001stories.org"
                className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Send Email
              </a>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-full mb-4">
                <MessageCircle className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Live Chat</h3>
              <p className="text-gray-600 mb-4">Chat with our support team</p>
              <button className="inline-flex items-center justify-center px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors">
                Start Chat
              </button>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600">
              For urgent issues, you can also reach us at{' '}
              <a href="tel:+1-555-1001-STORY" className="text-blue-600 hover:underline font-medium">
                +1 (555) 1001-STORY
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}