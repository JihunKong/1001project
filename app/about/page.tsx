import { Metadata } from 'next';
import { Heart, Globe, Users, BookOpen, Award } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '1001 Stories - About Us',
  description: 'Learn about 1001 Stories, our mission to empower education through global storytelling, and the Seeds of Empowerment initiative.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-soe-green-50 to-soe-green-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              About <span className="text-soe-green-600">1001 Stories</span>
            </h1>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
              We are a global non-profit education platform dedicated to discovering, publishing,
              and sharing stories from children in underserved communities worldwide.
            </p>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Through the power of storytelling, we connect cultures, inspire learning,
            and empower communities to share their unique voices with the world.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-8 bg-gradient-to-br from-soe-green-50 to-soe-green-100 rounded-2xl">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-soe-green-400 rounded-full mb-6">
              <Globe className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Global Connection</h3>
            <p className="text-gray-600">
              Bridging cultures and communities through authentic storytelling from around the world.
            </p>
          </div>

          <div className="text-center p-8 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500 rounded-full mb-6">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Educational Excellence</h3>
            <p className="text-gray-600">
              Enhancing literacy and learning through culturally rich, engaging content for all ages.
            </p>
          </div>

          <div className="text-center p-8 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-500 rounded-full mb-6">
              <Heart className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Community Empowerment</h3>
            <p className="text-gray-600">
              Supporting underserved communities by amplifying their voices and celebrating their heritage.
            </p>
          </div>
        </div>
      </div>

      {/* Seeds of Empowerment Section */}
      <div className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Seeds of Empowerment Initiative
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                1001 Stories is a proud initiative of Seeds of Empowerment,
                a non-profit organization dedicated to creating educational opportunities
                and resources for communities worldwide.
              </p>
              <p className="text-gray-600 mb-8">
                All revenue generated through our platform is reinvested directly into
                educational programs, technology access, and community development projects
                that make a lasting impact.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="https://seedsofempowerment.org"
                  target="_blank"
                  className="inline-flex items-center justify-center px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Visit Seeds of Empowerment
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center px-6 py-3 border border-emerald-600 text-emerald-600 font-medium rounded-lg hover:bg-emerald-50 transition-colors"
                >
                  Learn More
                </Link>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Our Impact</h3>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-soe-green-100 rounded-lg">
                    <Users className="h-5 w-5 text-soe-green-600" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">10,000+</div>
                    <div className="text-sm text-gray-600">Students Served</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <BookOpen className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">500+</div>
                    <div className="text-sm text-gray-600">Stories Published</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Globe className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">25+</div>
                    <div className="text-sm text-gray-600">Countries Represented</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Award className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">95%</div>
                    <div className="text-sm text-gray-600">Satisfaction Rate</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">How It Works</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Our platform creates a seamless ecosystem for storytelling, learning, and cultural exchange.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-soe-green-400 text-white rounded-full mb-4 text-xl font-bold">
                1
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Story Collection</h3>
              <p className="text-sm text-gray-600">
                Children and writers submit authentic stories from their communities.
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500 text-white rounded-full mb-4 text-xl font-bold">
                2
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Review & Enhancement</h3>
              <p className="text-sm text-gray-600">
                Our team reviews, edits, and enhances stories while preserving their authenticity.
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-500 text-white rounded-full mb-4 text-xl font-bold">
                3
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Digital Publishing</h3>
              <p className="text-sm text-gray-600">
                Stories are published with AI-generated visuals and educational resources.
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500 text-white rounded-full mb-4 text-xl font-bold">
                4
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Global Access</h3>
              <p className="text-sm text-gray-600">
                Teachers and students worldwide access stories through our platform.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-soe-green-400 to-soe-green-500 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Join Our Global Community
          </h2>
          <p className="text-xl text-soe-green-100 mb-8">
            Whether you&apos;re an educator, student, writer, or storyteller,
            there&apos;s a place for you in the 1001 Stories community.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center px-8 py-3 bg-white text-soe-green-600 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Get Started Today
            </Link>
            <Link
              href="/library"
              className="inline-flex items-center justify-center px-8 py-3 border border-white text-white font-medium rounded-lg hover:bg-white hover:bg-opacity-10 transition-colors"
            >
              Explore Stories
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}