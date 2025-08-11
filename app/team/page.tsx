import { Metadata } from 'next';
import { 
  Users, 
  Heart, 
  Globe, 
  BookOpen,
  Award,
  Linkedin,
  Twitter,
  Mail,
  MapPin,
  Calendar,
  Star,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Our Team - 1001 Stories',
  description: 'Meet the passionate team behind 1001 Stories, dedicated to empowering young voices through global education and storytelling.',
  keywords: 'team, staff, leadership, global education, storytelling, nonprofit',
  openGraph: {
    title: 'Meet Our Team - 1001 Stories',
    description: 'Get to know the dedicated individuals working to empower children through storytelling.',
    url: 'https://1001stories.org/team',
    type: 'website',
  },
};

export default function Team() {

  const leadership = [
    {
      name: 'Sarah Chen',
      title: 'Founder & CEO',
      location: 'San Francisco, CA',
      bio: 'Former education technology executive with 15+ years of experience. Passionate about using storytelling to bridge cultural divides and empower children globally.',
      image: '/images/team/sarah-chen.jpg',
      linkedin: 'https://linkedin.com/in/sarahchen',
      email: 'sarah@1001stories.org',
      achievements: ['TED Speaker', 'Forbes 30 Under 30', 'UNESCO Education Advocate']
    },
    {
      name: 'Dr. Michael Rodriguez',
      title: 'Head of Education',
      location: 'Mexico City, Mexico',
      bio: 'Educational researcher and former UNESCO consultant specializing in literacy programs for underserved communities. PhD in Educational Psychology.',
      image: '/images/team/michael-rodriguez.jpg',
      linkedin: 'https://linkedin.com/in/mrodriguez',
      email: 'michael@1001stories.org',
      achievements: ['UNESCO Consultant', 'Published Author', 'Education Innovation Award']
    },
    {
      name: 'Aisha Patel',
      title: 'Director of Technology',
      location: 'Mumbai, India',
      bio: 'Full-stack developer and AI specialist. Previously worked at major tech companies building educational platforms. Expert in multi-language content systems.',
      image: '/images/team/aisha-patel.jpg',
      linkedin: 'https://linkedin.com/in/aishapatel',
      email: 'aisha@1001stories.org',
      achievements: ['Tech Leader Award', 'AI Ethics Advocate', 'Open Source Contributor']
    },
    {
      name: 'David Kim',
      title: 'Creative Director',
      location: 'Seoul, South Korea',
      bio: 'Award-winning children&apos;s book illustrator and designer. Specializes in culturally inclusive visual storytelling and has illustrated over 50 children&apos;s books.',
      image: '/images/team/david-kim.jpg',
      linkedin: 'https://linkedin.com/in/davidkim',
      email: 'david@1001stories.org',
      achievements: ['Caldecott Honor', 'IBBY Award', 'Cultural Bridge Builder']
    }
  ];

  const coreTeam = [
    {
      name: 'Emma Thompson',
      title: 'Content Manager',
      location: 'London, UK',
      speciality: 'Editorial & Publishing',
      yearsWithUs: '2 years'
    },
    {
      name: 'Carlos Silva',
      title: 'Community Coordinator',
      location: 'São Paulo, Brazil',
      speciality: 'Volunteer Management',
      yearsWithUs: '1.5 years'
    },
    {
      name: 'Fatima Al-Rashid',
      title: 'Translation Lead',
      location: 'Dubai, UAE',
      speciality: 'Multi-language Content',
      yearsWithUs: '3 years'
    },
    {
      name: 'James Wilson',
      title: 'Partnership Manager',
      location: 'Toronto, Canada',
      speciality: 'Strategic Partnerships',
      yearsWithUs: '2.5 years'
    },
    {
      name: 'Priya Sharma',
      title: 'Impact Analyst',
      location: 'New Delhi, India',
      speciality: 'Data & Research',
      yearsWithUs: '1 year'
    },
    {
      name: 'Sophie Martinez',
      title: 'Marketing Specialist',
      location: 'Barcelona, Spain',
      speciality: 'Digital Marketing',
      yearsWithUs: '1.5 years'
    }
  ];

  const advisors = [
    {
      name: 'Dr. Jane Morrison',
      title: 'Education Advisor',
      organization: 'Harvard Graduate School of Education',
      expertise: 'Literacy & Language Development'
    },
    {
      name: 'Prof. Ahmad Hassan',
      title: 'Cultural Advisor',
      organization: 'American University of Cairo',
      expertise: 'Cross-Cultural Communication'
    },
    {
      name: 'Maria Santos',
      title: 'Technology Advisor',
      organization: 'Former Google Education',
      expertise: 'EdTech Platform Development'
    },
    {
      name: 'Dr. Lisa Chen',
      title: 'Child Psychology Advisor',
      organization: 'Stanford Children&apos;s Hospital',
      expertise: 'Child Development & Trauma-Informed Care'
    }
  ];

  const teamStats = [
    { number: '25+', label: 'Team Members' },
    { number: '15', label: 'Countries Represented' },
    { number: '12', label: 'Languages Spoken' },
    { number: '50+', label: 'Years Combined Experience' }
  ];

  const values = [
    {
      icon: Heart,
      title: 'Passion for Impact',
      description: 'Every team member is deeply committed to empowering children through education and storytelling.'
    },
    {
      icon: Globe,
      title: 'Global Perspective',
      description: 'Our diverse team brings perspectives from around the world, enriching our approach and understanding.'
    },
    {
      icon: Users,
      title: 'Collaborative Spirit',
      description: 'We believe the best solutions come from working together across cultures and disciplines.'
    },
    {
      icon: BookOpen,
      title: 'Continuous Learning',
      description: 'We stay curious and committed to growing both personally and professionally.'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-purple-50 py-20 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 mb-6 bg-blue-100 rounded-full">
              <Users className="w-10 h-10 text-blue-600" />
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              <span className="gradient-text">Meet Our Team</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              We&apos;re a diverse group of educators, technologists, artists, and storytellers united by our mission 
              to empower young voices and create global connections through education.
            </p>
          </div>
        </div>
      </section>

      {/* Team Stats */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {teamStats.map((stat, index) => (
              <div
                key={stat.label}
                className="text-center"
              >
                <div className="text-4xl font-bold text-blue-600 mb-2">{stat.number}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Leadership Team */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Leadership Team
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Meet the visionary leaders guiding our mission to transform education through storytelling.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {leadership.map((leader, index) => (
              <div
                key={leader.name}
                className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow"
              >
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center">
                      <Users className="w-16 h-16 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-semibold text-gray-900 mb-1">
                      {leader.name}
                    </h3>
                    <div className="text-blue-600 font-medium mb-2">{leader.title}</div>
                    <div className="flex items-center gap-1 text-sm text-gray-600 mb-4">
                      <MapPin className="w-4 h-4" />
                      {leader.location}
                    </div>
                    <p className="text-gray-600 mb-6 leading-relaxed">
                      {leader.bio}
                    </p>
                    <div className="mb-6">
                      <div className="text-sm font-medium text-gray-700 mb-2">Notable Achievements:</div>
                      <div className="flex flex-wrap gap-2">
                        {leader.achievements.map(achievement => (
                          <span key={achievement} className="px-3 py-1 bg-blue-50 text-blue-600 text-xs rounded-full">
                            {achievement}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <a href={leader.linkedin} className="p-2 text-gray-600 hover:text-blue-600 transition-colors">
                        <Linkedin className="w-5 h-5" />
                      </a>
                      <a href={`mailto:${leader.email}`} className="p-2 text-gray-600 hover:text-blue-600 transition-colors">
                        <Mail className="w-5 h-5" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Team */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Core Team
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The dedicated professionals who make our daily operations possible and our mission a reality.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {coreTeam.map((member, index) => (
              <div
                key={member.name}
                className="text-center bg-gradient-to-br from-gray-50 to-white p-8 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {member.name}
                </h3>
                <div className="text-blue-600 font-medium mb-2">{member.title}</div>
                <div className="flex items-center justify-center gap-1 text-sm text-gray-600 mb-3">
                  <MapPin className="w-4 h-4" />
                  {member.location}
                </div>
                <div className="mb-4">
                  <span className="px-3 py-1 bg-green-50 text-green-600 text-sm rounded-full">
                    {member.speciality}
                  </span>
                </div>
                <div className="flex items-center justify-center gap-1 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" />
                  With us for {member.yearsWithUs}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Advisory Board */}
      <section className="py-20 bg-blue-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Advisory Board
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Distinguished experts who guide our strategic direction and ensure we maintain the highest standards in education and child development.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {advisors.map((advisor, index) => (
              <div
                key={advisor.name}
                className="bg-white p-8 rounded-xl shadow-lg"
              >
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Award className="w-8 h-8 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">
                      {advisor.name}
                    </h3>
                    <div className="text-purple-600 font-medium mb-2">{advisor.title}</div>
                    <div className="text-sm text-gray-600 mb-2">{advisor.organization}</div>
                    <div className="text-sm text-gray-700">
                      <strong>Expertise:</strong> {advisor.expertise}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              What Drives Us
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              These core values unite our global team and guide everything we do.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div
                key={value.title}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 mb-6 bg-blue-100 rounded-full">
                  <value.icon className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {value.title}
                </h3>
                <p className="text-gray-600">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Join Our Team CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="text-center max-w-3xl mx-auto"
          >
            <Heart className="w-16 h-16 text-white mx-auto mb-6" />
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Join Our Mission
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              We&apos;re always looking for passionate individuals who want to make a difference in children&apos;s lives. 
              If you share our vision of empowering young voices through education, we&apos;d love to hear from you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-medium text-blue-600 bg-white rounded-full hover:bg-gray-50 transition-all transform hover:scale-105"
              >
                <Users className="w-5 h-5" />
                View Open Positions
              </Link>
              <Link
                href="/volunteer"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-medium text-white bg-transparent border-2 border-white rounded-full hover:bg-white hover:text-blue-600 transition-all transform hover:scale-105"
              >
                <Heart className="w-5 h-5" />
                Volunteer With Us
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}