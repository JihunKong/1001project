'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Search, ShoppingBag, Heart, TrendingUp } from 'lucide-react';
import ProductCard from '@/components/shop/ProductCard';
import ProductFilters from '@/components/shop/ProductFilters';
import ImpactBadge from '@/components/shop/ImpactBadge';
import { Product } from '@/lib/cart-store';

// Mock data for products
const mockProducts: Product[] = [
  {
    id: '1',
    type: 'book',
    title: 'Dreams of the Ocean: Stories from Filipino Children',
    creator: {
      name: 'Maria Santos & Friends',
      age: 12,
      location: 'Palawan, Philippines',
      story: 'A collection of stories written by children in coastal villages, illustrated by local artists.',
    },
    price: 24.99,
    images: ['/images/shop/book1.jpg'],
    description: 'A beautiful collection of 20 stories from children living in the Philippines coastal communities. Each story captures the unique perspective of island life, family traditions, and dreams for the future.',
    impact: {
      metric: 'days of education',
      value: '5',
    },
    stock: 15,
    category: ['books', 'asia', 'ocean'],
    featured: true,
  },
  {
    id: '2',
    type: 'goods',
    title: 'Hand-woven Bookmark Set - African Patterns',
    creator: {
      name: 'Amara Collective',
      location: 'Kenya',
      story: 'Created by a women\'s cooperative supporting education in rural Kenya.',
    },
    price: 12.99,
    images: ['/images/shop/bookmark1.jpg'],
    description: 'Set of 3 handmade bookmarks featuring traditional African patterns. Each bookmark is unique and made with sustainable materials.',
    impact: {
      metric: 'school supplies',
      value: '2 sets of',
    },
    stock: 25,
    category: ['goods', 'africa', 'handmade'],
    featured: false,
  },
  {
    id: '3',
    type: 'book',
    title: 'Mountain Tales: Voices from the Himalayas',
    creator: {
      name: 'Children of Nepal',
      age: 10,
      location: 'Kathmandu, Nepal',
      story: 'Stories collected from schools in mountain villages, sharing daily life and cultural traditions.',
    },
    price: 29.99,
    images: ['/images/shop/book2.jpg'],
    description: 'An inspiring collection of stories from children living in the Himalayan region, featuring hand-drawn illustrations.',
    impact: {
      metric: 'nutritious meals',
      value: '10',
    },
    stock: 8,
    category: ['books', 'asia', 'mountains'],
    featured: true,
  },
  {
    id: '4',
    type: 'goods',
    title: 'Story Illustration Print - The Magic Garden',
    creator: {
      name: 'Li Wei',
      age: 14,
      location: 'Rural China',
      story: 'Original artwork from our published story "The Magic Garden", created by a young artist.',
    },
    price: 35.00,
    images: ['/images/shop/print1.jpg'],
    description: 'High-quality art print of an original illustration from one of our most beloved stories. Printed on sustainable paper.',
    impact: {
      metric: 'art supplies for',
      value: '1 classroom',
    },
    stock: 20,
    category: ['goods', 'art', 'prints'],
    featured: false,
  },
  {
    id: '5',
    type: 'book',
    title: 'Amazon Adventures: Tales from the Rainforest',
    creator: {
      name: 'Indigenous Youth Collective',
      location: 'Brazil',
      story: 'Stories from indigenous communities sharing their connection with the rainforest.',
    },
    price: 27.99,
    images: ['/images/shop/book3.jpg'],
    description: 'A unique collection of stories that share indigenous wisdom and the importance of protecting our natural world.',
    impact: {
      metric: 'new stories published',
      value: '2',
    },
    stock: 12,
    category: ['books', 'south-america', 'nature'],
    featured: true,
  },
  {
    id: '6',
    type: 'goods',
    title: 'Handmade Story Pouch - Guatemalan Textiles',
    creator: {
      name: 'Maya Weavers',
      location: 'Guatemala',
      story: 'Traditional textile pouches made by indigenous artisans, perfect for carrying books.',
    },
    price: 18.99,
    images: ['/images/shop/pouch1.jpg'],
    description: 'Beautiful hand-woven pouch featuring traditional Guatemalan patterns. Perfect size for carrying a book or journal.',
    impact: {
      metric: 'days of vocational training',
      value: '3',
    },
    stock: 30,
    category: ['goods', 'textiles', 'central-america'],
    featured: false,
  },
];

export default function ShopPage() {
  const { t } = useTranslation('common');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSort, setSelectedSort] = useState('newest');

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = [...mockProducts];

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.type === selectedCategory);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(query) ||
        p.creator.name.toLowerCase().includes(query) ||
        p.creator.location.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
      );
    }

    // Sorting
    switch (selectedSort) {
      case 'priceLow':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'priceHigh':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'popular':
        filtered.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
        break;
      case 'newest':
      default:
        // Keep original order (newest first)
        break;
    }

    return filtered;
  }, [searchQuery, selectedCategory, selectedSort]);

  // Calculate total impact
  const totalImpact = {
    education: 23,
    meals: 145,
    stories: 8,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50/50 to-white">
      {/* Hero Section */}
      <section className="relative py-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 opacity-50" />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative container mx-auto text-center"
        >
          <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-4">
            {t('shop.title')}
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            {t('shop.subtitle')}
          </p>

          {/* Impact Stats */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <ImpactBadge metric="days of education funded" value={totalImpact.education.toString()} />
            <ImpactBadge metric="meals provided" value={totalImpact.meals.toString()} />
            <ImpactBadge metric="new stories published" value={totalImpact.stories.toString()} />
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search for books, creators, or locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </motion.div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="md:col-span-1">
            <ProductFilters
              selectedCategory={selectedCategory}
              selectedSort={selectedSort}
              onCategoryChange={setSelectedCategory}
              onSortChange={setSelectedSort}
            />
          </div>

          {/* Products Grid */}
          <div className="md:col-span-3">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">
                Showing <span className="font-semibold">{filteredProducts.length}</span> products
              </p>
              
              {/* View Options (optional) */}
              <div className="flex gap-2">
                <button className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                  </svg>
                </button>
                <button className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Products Grid */}
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No products found</h3>
                <p className="text-gray-500">Try adjusting your filters or search query</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Heart className="w-12 h-12 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-4">Every Purchase Makes a Difference</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            100% of profits go directly to supporting education and community development in underserved areas.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button className="px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              Learn About Our Impact
            </button>
            <button className="px-6 py-3 bg-blue-700 text-white rounded-lg font-semibold hover:bg-blue-800 transition-colors">
              Become a Monthly Supporter
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}