'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  BookOpen, 
  Search, 
  Filter, 
  Heart,
  Globe,
  Star,
  Play,
  Lock,
  Crown,
  ArrowRight,
  Users,
  Clock
} from 'lucide-react';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Digital Library - 1001 Stories',
  description: 'Explore our collection of inspiring stories from children around the world. Free samples and premium content available.',
  keywords: 'digital library, children stories, global, education, reading, ebooks',
  openGraph: {
    title: 'Digital Library - 1001 Stories',
    description: 'Discover inspiring stories from children in underserved communities worldwide.',
    url: 'https://1001stories.org/library',
    type: 'website',
  },
};

// Mock data for stories
const stories = [
  {
    id: '1',
    title: 'The Little Fisherman',
    author: 'Maria Santos',
    authorAge: 12,
    country: 'Philippines',
    language: 'English',
    category: 'Adventure',
    ageGroup: '8-12',
    rating: 4.8,
    readTime: '8 min',
    isPremium: false,
    coverImage: '/images/stories/fisherman.jpg',
    description: 'A young boy learns about courage and perseverance while helping his father fish in the beautiful waters of Palawan.',
    tags: ['courage', 'family', 'ocean']
  },
  {
    id: '2',
    title: 'Dancing with the Wind',
    author: 'Amara Okafor',
    authorAge: 10,
    country: 'Nigeria',
    language: 'English',
    category: 'Cultural',
    ageGroup: '6-10',
    rating: 4.9,
    readTime: '6 min',
    isPremium: true,
    coverImage: '/images/stories/dancing.jpg',
    description: 'A celebration of traditional dance and music in a small Nigerian village during harvest season.',
    tags: ['culture', 'music', 'celebration']
  },
  {
    id: '3',
    title: 'The Magic Paintbrush',
    author: 'Li Wei',
    authorAge: 11,
    country: 'China',
    language: 'English',
    category: 'Fantasy',
    ageGroup: '8-12',
    rating: 4.7,
    readTime: '10 min',
    isPremium: false,
    coverImage: '/images/stories/paintbrush.jpg',
    description: 'When Li Wei finds an old paintbrush, she discovers it has the power to bring her drawings to life.',
    tags: ['magic', 'art', 'creativity']
  },
  {
    id: '4',
    title: 'The School Garden',
    author: 'Carlos Rodriguez',
    authorAge: 13,
    country: 'Guatemala',
    language: 'Spanish',
    category: 'Educational',
    ageGroup: '10-14',
    rating: 4.6,
    readTime: '7 min',
    isPremium: true,
    coverImage: '/images/stories/garden.jpg',
    description: 'Students work together to create a school garden that feeds both bodies and minds.',
    tags: ['environment', 'teamwork', 'growth']
  },
  {
    id: '5',
    title: 'The Night Sky Stories',
    author: 'Fatima Al-Rashid',
    authorAge: 12,
    country: 'Jordan',
    language: 'Arabic',
    category: 'Adventure',
    ageGroup: '8-12',
    rating: 4.8,
    readTime: '9 min',
    isPremium: false,
    coverImage: '/images/stories/stars.jpg',
    description: 'A young girl learns about constellations and ancient stories from her grandmother in the desert.',
    tags: ['astronomy', 'tradition', 'family']
  },
  {
    id: '6',
    title: 'The Soccer Dream',
    author: 'João Silva',
    authorAge: 14,
    country: 'Brazil',
    language: 'Portuguese',
    category: 'Sports',
    ageGroup: '10-16',
    rating: 4.7,
    readTime: '12 min',
    isPremium: true,
    coverImage: '/images/stories/soccer.jpg',
    description: 'A passionate young player from the favelas dreams of playing professional soccer.',
    tags: ['sports', 'dreams', 'perseverance']
  }
];

const categories = ['All', 'Adventure', 'Cultural', 'Fantasy', 'Educational', 'Sports'];
const languages = ['All Languages', 'English', 'Spanish', 'Arabic', 'Portuguese', 'French'];
const ageGroups = ['All Ages', '6-10', '8-12', '10-14', '10-16'];

export default function Library() {
  const { t } = useTranslation('common');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLanguage, setSelectedLanguage] = useState('All Languages');
  const [selectedAge, setSelectedAge] = useState('All Ages');
  const [showFilters, setShowFilters] = useState(false);

  // Filter stories based on search and filters
  const filteredStories = stories.filter(story => {
    const matchesSearch = story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         story.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         story.country.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'All' || story.category === selectedCategory;
    const matchesLanguage = selectedLanguage === 'All Languages' || story.language === selectedLanguage;
    const matchesAge = selectedAge === 'All Ages' || story.ageGroup === selectedAge;

    return matchesSearch && matchesCategory && matchesLanguage && matchesAge;
  });

  const StoryCard = ({ story }: { story: typeof stories[0] }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="group bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all transform hover:-translate-y-2"
    >
      <div className="relative">
        <div className="aspect-[4/3] bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
          <BookOpen className="w-16 h-16 text-blue-600 opacity-50" />
        </div>
        {story.isPremium && (
          <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 bg-yellow-500 text-white text-xs font-medium rounded-full">
            <Crown className="w-3 h-3" />
            Premium
          </div>
        )}
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-medium rounded-full">
          <Star className="w-3 h-3 text-yellow-500 fill-current" />
          {story.rating}
        </div>
      </div>
      
      <div className="p-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Globe className="w-4 h-4" />
          {story.country}
          <span>•</span>
          <Clock className="w-4 h-4" />
          {story.readTime}
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
          {story.title}
        </h3>
        
        <div className="text-sm text-gray-600 mb-3">
          By {story.author}, age {story.authorAge}
        </div>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {story.description}
        </p>
        
        <div className="flex flex-wrap gap-1 mb-4">
          {story.tags.slice(0, 2).map(tag => (
            <span key={tag} className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-full">
              #{tag}
            </span>
          ))}
        </div>
        
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center px-3 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
            {story.category}
          </span>
          
          <div className="flex gap-2">
            <button className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
              <Play className="w-4 h-4" />
              Preview
            </button>
            <button className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
              {story.isPremium ? <Lock className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
              {story.isPremium ? 'Unlock' : 'Read'}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-purple-50 py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              <span className="gradient-text">{t('library.title')}</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              {t('library.subtitle')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Search and Filter Bar */}
      <section className="sticky top-16 z-40 bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={t('library.search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-5 h-5" />
              Filters
            </button>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 p-4 bg-gray-50 rounded-lg"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {languages.map(language => (
                    <option key={language} value={language}>{language}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Age Group</label>
                <select
                  value={selectedAge}
                  onChange={(e) => setSelectedAge(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {ageGroups.map(age => (
                    <option key={age} value={age}>{age}</option>
                  ))}
                </select>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* Stories Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Stories ({filteredStories.length})
              </h2>
              <p className="text-gray-600">
                Discover amazing stories from young authors worldwide
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4 text-green-600" />
                  Free
                </div>
                <div className="flex items-center gap-1">
                  <Crown className="w-4 h-4 text-yellow-500" />
                  Premium
                </div>
              </div>
            </div>
          </div>

          {filteredStories.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No stories found</h3>
              <p className="text-gray-600">Try adjusting your search terms or filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredStories.map((story, index) => (
                <StoryCard key={story.id} story={story} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Premium CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto"
          >
            <Crown className="w-16 h-16 text-yellow-300 mx-auto mb-6" />
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Unlock Premium Stories
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Get access to our complete library of stories while supporting scholarships 
              and educational programs for young authors worldwide.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-medium text-blue-600 bg-white rounded-full hover:bg-gray-50 transition-all transform hover:scale-105"
              >
                <Users className="w-5 h-5" />
                Start Free Trial
              </Link>
              <Link
                href="/donate"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-medium text-white bg-transparent border-2 border-white rounded-full hover:bg-white hover:text-blue-600 transition-all transform hover:scale-105"
              >
                <Heart className="w-5 h-5" />
                Learn About Seeds of Empowerment
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}