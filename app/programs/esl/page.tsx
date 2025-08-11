import { Metadata } from 'next';
import { 
  BookOpen, 
  Users, 
  GraduationCap,
  MessageCircle,
  Star,
  PlayCircle,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'ESL Program - 1001 Stories',
  description: 'Learn English through engaging stories from around the world. Our ESL program combines storytelling with interactive learning.',
  keywords: 'ESL, English learning, language education, stories, interactive learning',
  openGraph: {
    title: 'ESL Program - 1001 Stories',
    description: 'Master English through global stories and interactive learning experiences.',
    url: 'https://1001stories.org/programs/esl',
    type: 'website',
  },
};

export default function ESLProgram() {

  const features = [
    {
      icon: BookOpen,
      title: 'Story-Based Learning',
      description: 'Learn English through engaging stories from children around the world',
      highlight: '500+ Stories'
    },
    {
      icon: MessageCircle,
      title: 'Interactive Conversations',
      description: 'Practice speaking with AI tutors and conversation partners',
      highlight: '24/7 Available'
    },
    {
      icon: Users,
      title: 'Global Community',
      description: 'Connect with learners from 50+ countries and share experiences',
      highlight: '10,000+ Learners'
    },
    {
      icon: GraduationCap,
      title: 'Structured Curriculum',
      description: 'Follow a progressive learning path from beginner to advanced',
      highlight: '6 Levels'
    }
  ];

  const levels = [
    {
      level: 'A1',
      title: 'Beginner',
      description: 'Basic vocabulary and simple sentence structures',
      stories: 50,
      duration: '3-4 months',
      skills: ['Basic vocabulary (500 words)', 'Present tense', 'Simple questions', 'Pronunciation basics']
    },
    {
      level: 'A2',
      title: 'Elementary',
      description: 'Everyday conversations and familiar topics',
      stories: 75,
      duration: '4-5 months',
      skills: ['Extended vocabulary (1000 words)', 'Past and future tenses', 'Modal verbs', 'Basic writing']
    },
    {
      level: 'B1',
      title: 'Intermediate',
      description: 'Express opinions and handle various situations',
      stories: 100,
      duration: '5-6 months',
      skills: ['Complex sentences', 'Conditional statements', 'Idioms and phrasal verbs', 'Longer conversations']
    },
    {
      level: 'B2',
      title: 'Upper-Intermediate',
      description: 'Discuss abstract topics and complex ideas',
      stories: 125,
      duration: '6-7 months',
      skills: ['Advanced grammar', 'Debate and discussion', 'Academic writing', 'Cultural understanding']
    },
    {
      level: 'C1',
      title: 'Advanced',
      description: 'Near-native fluency in most situations',
      stories: 100,
      duration: '7-8 months',
      skills: ['Nuanced expression', 'Professional communication', 'Literary analysis', 'Advanced vocabulary']
    },
    {
      level: 'C2',
      title: 'Proficient',
      description: 'Master-level English comprehension and expression',
      stories: 75,
      duration: '8+ months',
      skills: ['Native-like fluency', 'Specialized terminology', 'Creative writing', 'Teaching others']
    }
  ];

  const curriculum = [
    {
      week: 'Week 1-2',
      title: 'Foundation Building',
      activities: ['Story comprehension', 'Vocabulary building', 'Basic grammar', 'Pronunciation practice']
    },
    {
      week: 'Week 3-4',
      title: 'Interactive Practice',
      activities: ['Conversation practice', 'Role-playing', 'Story discussions', 'Writing exercises']
    },
    {
      week: 'Week 5-6',
      title: 'Cultural Exchange',
      activities: ['Cultural stories', 'International discussions', 'Presentation skills', 'Creative projects']
    },
    {
      week: 'Week 7-8',
      title: 'Assessment & Progress',
      activities: ['Progress evaluation', 'Skill assessment', 'Feedback sessions', 'Next level preparation']
    }
  ];

  const testimonials = [
    {
      name: 'Maria Rodriguez',
      country: 'Mexico',
      level: 'B2',
      quote: 'The stories made learning English so engaging. I improved my vocabulary while learning about different cultures.',
      rating: 5
    },
    {
      name: 'Ahmed Hassan',
      country: 'Egypt',
      level: 'C1',
      quote: 'The interactive conversations helped me gain confidence in speaking. Now I can express complex ideas fluently.',
      rating: 5
    },
    {
      name: 'Li Wei',
      country: 'China',
      level: 'B1',
      quote: 'I love how the program connects me with learners worldwide. It&apos;s like having friends while learning English.',
      rating: 5
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
              <GraduationCap className="w-10 h-10 text-blue-600" />
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              <span className="gradient-text">ESL Program</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Master English through engaging stories from around the world. Our innovative ESL program 
              combines storytelling with interactive learning to make language acquisition natural and enjoyable.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-8 py-4 text-lg font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700 transition-all transform hover:scale-105"
              >
                Start Learning Today
                <ArrowRight className="w-5 h-5" />
              </Link>
              <button className="inline-flex items-center gap-2 px-8 py-4 text-lg font-medium text-blue-600 bg-white border-2 border-blue-600 rounded-full hover:bg-blue-50 transition-all">
                <PlayCircle className="w-5 h-5" />
                Watch Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Our ESL Program?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our unique approach combines the power of storytelling with proven language learning methodologies.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="text-center bg-gradient-to-br from-blue-50 to-purple-50 p-8 rounded-xl hover:shadow-lg transition-shadow"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 mb-6 bg-white rounded-full shadow-md">
                  <feature.icon className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 mb-4">
                  {feature.description}
                </p>
                <div className="text-2xl font-bold text-blue-600">
                  {feature.highlight}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Learning Levels */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Learning Levels & Path
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Progress through six structured levels, each designed to build your English skills systematically.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {levels.map((level, index) => (
              <div
                key={level.level}
                className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="text-3xl font-bold text-blue-600">{level.level}</div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Duration</div>
                    <div className="font-medium text-gray-900">{level.duration}</div>
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {level.title}
                </h3>
                <p className="text-gray-600 mb-4">
                  {level.description}
                </p>
                <div className="flex items-center justify-between mb-6 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-blue-900">{level.stories} Stories</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700 mb-2">Key Skills:</div>
                  {level.skills.map(skill => (
                    <div key={skill} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      {skill}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Curriculum Overview */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              8-Week Learning Cycle
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Each level follows a proven 8-week cycle that balances structured learning with creative expression.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {curriculum.map((phase, index) => (
              <div
                key={phase.week}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 mb-6 bg-blue-100 rounded-full text-blue-600 font-bold text-lg">
                  {index + 1}
                </div>
                <div className="text-sm text-blue-600 font-medium mb-2">{phase.week}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {phase.title}
                </h3>
                <div className="space-y-2">
                  {phase.activities.map(activity => (
                    <div key={activity} className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                      {activity}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Student Testimonials */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Success Stories
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Hear from our students who have transformed their English skills through our program.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={testimonial.name}
                className="bg-white p-8 rounded-xl shadow-lg"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-500 fill-current" />
                  ))}
                </div>
                <blockquote className="text-gray-600 mb-6 italic">
                  &quot;{testimonial.quote}&quot;
                </blockquote>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.country}</div>
                  </div>
                  <div className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                    Level {testimonial.level}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="text-center max-w-3xl mx-auto"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Start Your English Learning Journey
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join thousands of learners who have improved their English through our story-based approach. 
              Begin your free trial today and discover the joy of learning through stories.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-medium text-blue-600 bg-white rounded-full hover:bg-gray-50 transition-all transform hover:scale-105"
              >
                <GraduationCap className="w-5 h-5" />
                Start Free Trial
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-medium text-white bg-transparent border-2 border-white rounded-full hover:bg-white hover:text-blue-600 transition-all transform hover:scale-105"
              >
                <MessageCircle className="w-5 h-5" />
                Get More Info
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}