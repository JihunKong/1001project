import { Metadata } from 'next';
import { 
  Handshake, 
  Globe, 
  Users, 
  BookOpen,
  GraduationCap,
  Building,
  Award,
  Heart,
  ArrowRight,
  MapPin,
  Calendar,
  Target
} from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Our Partners - 1001 Stories',
  description: 'Meet our global network of partners including schools, NGOs, and organizations working together to empower children through education.',
  keywords: 'partners, collaboration, schools, NGOs, organizations, global network',
  openGraph: {
    title: 'Our Partners - 1001 Stories',
    description: 'Discover the amazing organizations we work with to create educational opportunities worldwide.',
    url: 'https://1001stories.org/partners',
    type: 'website',
  },
};

// Mock partner data
const partners = {
  educational: [
    {
      id: '1',
      name: 'UNESCO Education Sector',
      type: 'International Organization',
      location: 'Paris, France',
      description: 'Collaborating on global literacy initiatives and educational resource development.',
      partnership: 'Since 2023',
      impact: '50+ countries reached',
      logo: '/images/partners/unesco.png'
    },
    {
      id: '2',
      name: 'Teach for All',
      type: 'Educational Network',
      location: 'Global Network',
      description: 'Working with local organizations to integrate storytelling into classroom curricula.',
      partnership: 'Since 2023',
      impact: '25 countries, 500+ teachers',
      logo: '/images/partners/teach-for-all.png'
    },
    {
      id: '3',
      name: 'Room to Read',
      type: 'Non-Profit Organization',
      location: 'San Francisco, USA',
      description: 'Joint initiatives in literacy and girls\' education programs across Asia and Africa.',
      partnership: 'Since 2024',
      impact: '10+ countries, 5,000+ students',
      logo: '/images/partners/room-to-read.png'
    }
  ],
  
  technology: [
    {
      id: '4',
      name: 'Google.org',
      type: 'Technology Foundation',
      location: 'Mountain View, USA',
      description: 'Providing AI translation tools and cloud infrastructure for global content distribution.',
      partnership: 'Since 2023',
      impact: 'AI translation in 20+ languages',
      logo: '/images/partners/google-org.png'
    },
    {
      id: '5',
      name: 'Microsoft Education',
      type: 'Technology Company',
      location: 'Redmond, USA',
      description: 'Supporting digital literacy programs with technology resources and training.',
      partnership: 'Since 2024',
      impact: '1,000+ devices donated',
      logo: '/images/partners/microsoft.png'
    }
  ],
  
  local: [
    {
      id: '6',
      name: 'Kailash Satyarthi Children\'s Foundation',
      type: 'Child Rights NGO',
      location: 'New Delhi, India',
      description: 'Implementing storytelling programs in rural schools and child-friendly spaces.',
      partnership: 'Since 2023',
      impact: '100+ schools, 5,000+ children',
      logo: '/images/partners/kscf.png'
    },
    {
      id: '7',
      name: 'Fundación Escuela Nueva',
      type: 'Educational Foundation',
      location: 'Bogotá, Colombia',
      description: 'Developing Spanish-language educational content for rural communities.',
      partnership: 'Since 2024',
      impact: '200+ rural schools',
      logo: '/images/partners/escuela-nueva.png'
    },
    {
      id: '8',
      name: 'Camfed',
      type: 'Education Non-Profit',
      location: 'Cambridge, UK',
      description: 'Supporting girls\' education through storytelling and mentorship programs in Africa.',
      partnership: 'Since 2024',
      impact: '50+ schools, 2,000+ girls',
      logo: '/images/partners/camfed.png'
    }
  ]
};

const partnershipTypes = [
  {
    icon: GraduationCap,
    title: 'Educational Partners',
    description: 'Schools, universities, and educational organizations implementing our programs',
    count: '150+ institutions',
    color: 'blue'
  },
  {
    icon: Building,
    title: 'Corporate Partners',
    description: 'Companies providing technology, funding, and expertise to scale our impact',
    count: '25+ companies',
    color: 'purple'
  },
  {
    icon: Globe,
    title: 'NGO Partners',
    description: 'Non-profit organizations working directly with communities around the world',
    count: '75+ organizations',
    color: 'green'
  },
  {
    icon: Users,
    title: 'Community Partners',
    description: 'Local community groups and grassroots organizations leading change',
    count: '200+ groups',
    color: 'red'
  }
];

const benefits = [
  {
    icon: BookOpen,
    title: 'Access to Content Library',
    description: 'Free access to our growing collection of educational stories and materials'
  },
  {
    icon: Users,
    title: 'Global Volunteer Network',
    description: 'Connect with our network of skilled volunteers for translation, illustration, and teaching'
  },
  {
    icon: Target,
    title: 'Impact Measurement',
    description: 'Comprehensive reporting and analytics to track educational outcomes and progress'
  },
  {
    icon: Award,
    title: 'Professional Development',
    description: 'Training workshops and resources for educators and community leaders'
  }
];

export default function Partners() {
  const { t } = useTranslation('common');

  const PartnerCard = ({ partner }: { partner: typeof partners.educational[0] }) => (
    <div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
      className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow"
    >
      <div className="flex items-start gap-4 mb-6">
        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
          <Building className="w-8 h-8 text-gray-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-gray-900 mb-1">{partner.name}</h3>
          <div className="text-sm text-blue-600 font-medium mb-2">{partner.type}</div>
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <MapPin className="w-4 h-4" />
            {partner.location}
          </div>
        </div>
      </div>
      
      <p className="text-gray-600 mb-6 leading-relaxed">{partner.description}</p>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-blue-600 font-medium mb-1">
            <Calendar className="w-4 h-4" />
            Partnership
          </div>
          <div className="text-sm text-gray-700">{partner.partnership}</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-green-600 font-medium mb-1">
            <Target className="w-4 h-4" />
            Impact
          </div>
          <div className="text-sm text-gray-700">{partner.impact}</div>
        </div>
      </div>
      
      <button className="w-full px-4 py-3 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
        Learn More About Partnership
      </button>
    </div>
  );

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-purple-50 py-20 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 mb-6 bg-blue-100 rounded-full">
              <Handshake className="w-10 h-10 text-blue-600" />
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              <span className="gradient-text">Our Global Partners</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Together with amazing organizations worldwide, we're creating educational opportunities 
              and empowering children to share their stories with the world.
            </p>
          </div>
        </div>
      </section>

      {/* Partnership Types */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Partnership Network
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We collaborate with diverse organizations to create a comprehensive support system for children's education.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {partnershipTypes.map((type, index) => (
              <div
                key={type.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center bg-gray-50 p-8 rounded-xl hover:bg-white hover:shadow-lg transition-all"
              >
                <div className={`inline-flex items-center justify-center w-16 h-16 mb-6 bg-${type.color}-100 rounded-full`}>
                  <type.icon className={`w-8 h-8 text-${type.color}-600`} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {type.title}
                </h3>
                <p className="text-gray-600 mb-4">
                  {type.description}
                </p>
                <div className="text-2xl font-bold text-blue-600">
                  {type.count}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Educational Partners */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Educational Partners
            </h2>
            <p className="text-xl text-gray-600">
              International organizations and institutions leading educational innovation.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {partners.educational.map(partner => (
              <PartnerCard key={partner.id} partner={partner} />
            ))}
          </div>
        </div>
      </section>

      {/* Technology Partners */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Technology Partners
            </h2>
            <p className="text-xl text-gray-600">
              Leading technology companies providing infrastructure and innovation.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {partners.technology.map(partner => (
              <PartnerCard key={partner.id} partner={partner} />
            ))}
          </div>
        </div>
      </section>

      {/* Local Partners */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Local & Regional Partners
            </h2>
            <p className="text-xl text-gray-600">
              Community organizations working directly with children and families.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {partners.local.map(partner => (
              <PartnerCard key={partner.id} partner={partner} />
            ))}
          </div>
        </div>
      </section>

      {/* Partnership Benefits */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Partnership Benefits
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              When you partner with 1001 Stories, you gain access to resources, expertise, and a global network committed to educational excellence.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 mb-6 bg-blue-100 rounded-full">
                  <benefit.icon className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {benefit.title}
                </h3>
                <p className="text-gray-600">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Become a Partner CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto"
          >
            <Handshake className="w-16 h-16 text-white mx-auto mb-6" />
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Become a Partner
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join our global network of organizations working to create educational opportunities 
              and empower children through storytelling. Together, we can reach more communities and create greater impact.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-medium text-blue-600 bg-white rounded-full hover:bg-gray-50 transition-all transform hover:scale-105"
              >
                <Users className="w-5 h-5" />
                Partner With Us
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-medium text-white bg-transparent border-2 border-white rounded-full hover:bg-white hover:text-blue-600 transition-all transform hover:scale-105"
              >
                Learn More About Us
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}