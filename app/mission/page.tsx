import { Metadata } from 'next';
import { 
  Target, 
  Heart, 
  Globe, 
  BookOpen,
  Users,
  Lightbulb,
  Compass,
  Sparkles,
  ArrowRight,
  Award,
  TreePine,
  Zap
} from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Our Mission - 1001 Stories',
  description: 'Discover our mission to empower young voices through storytelling, education, and global community building.',
  keywords: 'mission, vision, values, children, education, empowerment, storytelling',
  openGraph: {
    title: 'Our Mission - 1001 Stories',
    description: 'Learn about our commitment to empowering children through storytelling and education.',
    url: 'https://1001stories.org/mission',
    type: 'website',
  },
};

export default function Mission() {
  const { t } = useTranslation('common');

  const coreBeliefs = [
    {
      icon: BookOpen,
      title: 'Every Story Matters',
      description: 'We believe that every child has a unique story worth telling, regardless of their background, location, or circumstances.',
      impact: 'Stories Published: 500+'
    },
    {
      icon: Users,
      title: 'Community Creates Change',
      description: 'Through collaboration between volunteers, educators, and communities, we create lasting positive impact.',
      impact: 'Global Community: 10,000+ members'
    },
    {
      icon: Globe,
      title: 'Education Transforms Lives',
      description: 'Quality education and literacy are fundamental human rights that unlock potential and create opportunities.',
      impact: 'Countries Served: 50+'
    },
    {
      icon: Heart,
      title: 'Empowerment Through Support',
      description: 'By providing platforms, resources, and mentorship, we empower children to become authors of their own futures.',
      impact: 'Children Empowered: 10,000+'
    }
  ];

  const goals = [
    {
      icon: Target,
      title: 'Bridge Educational Gaps',
      description: 'Provide accessible, engaging educational content to children in underserved communities worldwide.',
      metrics: ['100,000 learners by 2025', '1,000 stories annually', '100 partner schools']
    },
    {
      icon: Globe,
      title: 'Foster Global Understanding',
      description: 'Create connections between cultures through shared stories and collaborative learning experiences.',
      metrics: ['Stories in 20+ languages', 'Cultural exchange programs', 'International partnerships']
    },
    {
      icon: Lightbulb,
      title: 'Develop Future Leaders',
      description: 'Nurture critical thinking, creativity, and leadership skills in the next generation of changemakers.',
      metrics: ['Leadership workshops', 'Mentorship programs', 'Youth advisory board']
    },
    {
      icon: TreePine,
      title: 'Create Sustainable Impact',
      description: 'Build self-sustaining programs that continue to benefit communities long after initial implementation.',
      metrics: ['Local capacity building', 'Train-the-trainer programs', 'Community ownership']
    }
  ];

  const approach = [
    {
      step: '01',
      title: 'Discover',
      description: 'We find and connect with communities where children have stories to tell but lack platforms to share them.',
      icon: Compass
    },
    {
      step: '02',
      title: 'Collaborate',
      description: 'We work with local educators, community leaders, and volunteers to understand unique needs and opportunities.',
      icon: Users
    },
    {
      step: '03',
      title: 'Create',
      description: 'Together, we develop stories, educational content, and programs tailored to each community\'s culture and language.',
      icon: Sparkles
    },
    {
      step: '04',
      title: 'Share',
      description: 'We publish and distribute content globally, allowing children\'s voices to inspire and educate audiences worldwide.',
      icon: Globe
    },
    {
      step: '05',
      title: 'Empower',
      description: 'Revenue from our platform is reinvested as scholarships and resources, creating cycles of empowerment.',
      icon: Zap
    }
  ];

  const impact2030 = [
    { number: '1M+', label: 'Children Reached' },
    { number: '10K+', label: 'Stories Published' },
    { number: '100+', label: 'Countries Served' },
    { number: '50K+', label: 'Scholarships Provided' }
  ];

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
              <Target className="w-10 h-10 text-blue-600" />
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              <span className="gradient-text">Our Mission</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              To empower young voices through storytelling, bridge educational gaps with compassionate technology, 
              and create a global community where every child's story contributes to a more understanding world.
            </p>
          </div>
        </div>
      </section>

      {/* Core Beliefs */}
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
              What We Believe
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our core beliefs guide every decision we make and every program we develop.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {coreBeliefs.map((belief, index) => (
              <div
                key={belief.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-blue-50 to-purple-50 p-8 rounded-xl"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 mb-6 bg-white rounded-full shadow-md">
                  <belief.icon className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  {belief.title}
                </h3>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  {belief.description}
                </p>
                <div className="flex items-center gap-2 text-sm font-medium text-blue-600">
                  <Award className="w-4 h-4" />
                  {belief.impact}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Strategic Goals */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Our Strategic Goals
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Clear objectives that drive our work and measure our success in creating meaningful change.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {goals.map((goal, index) => (
              <div
                key={goal.title}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white p-8 rounded-xl shadow-lg"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
                    <goal.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {goal.title}
                  </h3>
                </div>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  {goal.description}
                </p>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700 mb-2">Key Metrics:</div>
                  {goal.metrics.map(metric => (
                    <div key={metric} className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                      {metric}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Approach */}
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
              How We Work
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our five-step approach ensures sustainable, community-driven impact that empowers local voices and creates global connections.
            </p>
          </div>
          
          <div className="relative">
            {/* Connection Line */}
            <div className="hidden lg:block absolute top-24 left-20 right-20 h-0.5 bg-gray-200"></div>
            
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {approach.map((step, index) => (
                <div
                  key={step.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center relative"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-blue-600 rounded-full text-white font-bold text-lg relative z-10">
                    <step.icon className="w-8 h-8" />
                  </div>
                  <div className="absolute top-4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-white border-4 border-blue-600 rounded-full hidden lg:block"></div>
                  <div className="text-sm font-bold text-blue-600 mb-2">{step.step}</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Vision 2030 */}
      <section className="py-20 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center max-w-4xl mx-auto mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Vision 2030
            </h2>
            <p className="text-xl text-blue-100">
              By 2030, we envision a world where every child has access to quality education and the 
              opportunity to share their story with a global audience that celebrates their unique perspective.
            </p>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {impact2030.map((stat, index) => (
              <div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-4xl lg:text-5xl font-bold text-white mb-2">{stat.number}</div>
                <div className="text-blue-100">{stat.label}</div>
              </div>
            ))}
          </div>
          
          <div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <Link
              href="/volunteer"
              className="inline-flex items-center gap-2 px-8 py-4 text-lg font-medium text-blue-600 bg-white rounded-full hover:bg-gray-50 transition-all transform hover:scale-105"
            >
              <Users className="w-5 h-5" />
              Help Us Achieve This Vision
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              Be Part of Our Story
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Every great mission needs passionate people to make it reality. Whether you're an educator, 
              volunteer, donor, or simply someone who believes in the power of children's voices, 
              there's a place for you in our community.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/volunteer"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700 transition-all transform hover:scale-105"
              >
                <Users className="w-5 h-5" />
                Join Our Team
              </Link>
              <Link
                href="/donate"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-medium text-blue-600 bg-transparent border-2 border-blue-600 rounded-full hover:bg-blue-50 transition-all transform hover:scale-105"
              >
                <Heart className="w-5 h-5" />
                Support Our Mission
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}