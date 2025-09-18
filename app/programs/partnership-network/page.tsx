'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Handshake, Globe, Users, Building, CheckCircle, Calendar, Target, Sparkles, Network, FileText, Award, BookOpen } from 'lucide-react';

export default function PartnershipNetworkPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isJoining, setIsJoining] = useState(false);
  const [joinSuccess, setJoinSuccess] = useState(false);

  const handleJoinNetwork = async () => {
    if (!session) {
      router.push('/login');
      return;
    }

    setIsJoining(true);
    
    // Simulate joining process
    setTimeout(() => {
      setJoinSuccess(true);
      setIsJoining(false);
      
      // Redirect to partnership dashboard after successful join
      setTimeout(() => {
        router.push('/programs/apply?program=PARTNERSHIP_NETWORK');
      }, 2000);
    }, 1500);
  };

  const features = [
    {
      icon: <Globe className="w-6 h-6" />,
      title: "Global Network",
      description: "Connect with educational institutions across 25+ countries"
    },
    {
      icon: <Building className="w-6 h-6" />,
      title: "Institutional Partnerships", 
      description: "Schools, NGOs, companies, and universities collaboration"
    },
    {
      icon: <FileText className="w-6 h-6" />,
      title: "Resource Sharing",
      description: "Exchange educational materials, curricula, and best practices"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Cross-Cultural Exchange",
      description: "Foster international understanding through educational exchange"
    },
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: "Joint Curriculum",
      description: "Collaborate on developing innovative educational programs"
    },
    {
      icon: <Award className="w-6 h-6" />,
      title: "Recognition Programs",
      description: "Gain recognition for educational excellence and innovation"
    }
  ];

  const partnershipTypes = [
    {
      title: "Educational Institutions",
      description: "Schools, colleges, and universities seeking global collaboration",
      benefits: ["Student exchange programs", "Curriculum sharing", "Teacher training", "Research collaboration"]
    },
    {
      title: "NGOs & Non-Profits",
      description: "Organizations focused on education and community development",
      benefits: ["Resource pooling", "Impact measurement", "Community outreach", "Funding opportunities"]
    },
    {
      title: "Corporate Partners",
      description: "Companies investing in education and social responsibility",
      benefits: ["CSR initiatives", "Employee volunteering", "Technology support", "Skills development"]
    },
    {
      title: "Government Bodies",
      description: "Educational departments and policy-making institutions",
      benefits: ["Policy development", "Standards alignment", "Public-private partnerships", "Scalable solutions"]
    }
  ];

  const stats = [
    { number: "150+", label: "Active Partners" },
    { number: "25+", label: "Countries" },
    { number: "10,000+", label: "Students Impacted" },
    { number: "500+", label: "Programs Launched" }
  ];

  if (joinSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto text-center">
          <div className="bg-white p-8 rounded-2xl shadow-xl">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome to the Partnership Network!
            </h2>
            <p className="text-gray-600 mb-4">
              Your application has been received. We'll connect you with relevant partners soon.
            </p>
            <div className="text-sm text-gray-500">
              Redirecting to application form...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-blue-50/30 to-white" />
        
        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-green-100 rounded-full">
                <Handshake className="w-12 h-12 text-green-600" />
              </div>
            </div>
            
            <h1 className="text-5xl sm:text-6xl font-bold mb-6">
              Partnership <span className="text-green-600">Network</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Connect with schools, NGOs, companies, and universities worldwide to expand educational opportunities 
              and create meaningful collaboration that transforms learning experiences.
            </p>
            
            <div className="flex justify-center gap-4">
              <button
                onClick={handleJoinNetwork}
                disabled={isJoining}
                className="btn-brand-primary text-lg px-8 py-4 disabled:opacity-50"
              >
                {isJoining ? (
                  <>
                    <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                    Joining Network...
                  </>
                ) : (
                  <>
                    <Network className="w-5 h-5 mr-2" />
                    Join Partnership Network
                  </>
                )}
              </button>
              <Link href="/programs" className="btn-brand-secondary text-lg px-8 py-4">
                View All Programs
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">{stat.number}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Network Benefits</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Unlock opportunities for collaboration, resource sharing, and educational innovation
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                <div className="p-3 bg-green-100 rounded-lg w-fit mb-4">
                  <div className="text-green-600">
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partnership Types */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Partnership Opportunities</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join our diverse network of educational stakeholders making a global impact
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {partnershipTypes.map((type, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl shadow-lg">
                <h3 className="text-2xl font-bold mb-3 text-green-600">{type.title}</h3>
                <p className="text-gray-600 mb-6">{type.description}</p>
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900">Key Benefits:</h4>
                  <ul className="space-y-1">
                    {type.benefits.map((benefit, benefitIndex) => (
                      <li key={benefitIndex} className="flex items-center text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-green-600 to-blue-700 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <Globe className="w-16 h-16 mx-auto mb-6 opacity-80" />
            <h2 className="text-4xl font-bold mb-4">
              Ready to Transform Education Together?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join our global partnership network and be part of the educational revolution
            </p>
            <button
              onClick={handleJoinNetwork}
              disabled={isJoining}
              className="bg-white text-green-600 hover:bg-gray-100 transition-colors text-lg px-8 py-4 rounded-lg font-semibold disabled:opacity-50"
            >
              {isJoining ? (
                <>
                  <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                  Joining Network...
                </>
              ) : (
                <>
                  <Handshake className="w-5 h-5 mr-2" />
                  Join Partnership Network
                </>
              )}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}