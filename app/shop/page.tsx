'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Search, ShoppingBag, Heart, Loader2 } from 'lucide-react';
import ProductCard from '@/components/shop/ProductCard';
import ProductFilters from '@/components/shop/ProductFilters';
import ImpactBadge from '@/components/shop/ImpactBadge';
import { useCart } from '@/lib/hooks/useContentAccess';

interface ApiProduct {
  id: string
  sku: string
  type: string
  title: string
  description: string
  price: number
  compareAtPrice?: number
  currency: string
  featured: boolean
  creator: {
    name: string
    age?: number
    location: string
    story: string
  }
  category: {
    id: string
    name: string
    slug: string
  }
  tags: string[]
  impact: {
    metric: string
    value: string
  }
  images: Array<{
    id: string
    url: string
    alt: string
    position: number
  }>
  primaryImage?: string
  variants: Array<{
    id: string
    title: string
    price: number
    compareAtPrice?: number
    inventoryQuantity: number
    attributes: any
  }>
  inventory: {
    inStock: boolean
    availableQuantity?: number
    isDigital: boolean
  }
  stats: {
    rating: number
    reviewCount: number
    soldCount: number
  }
  digitalFile?: {
    downloadLimit: number
    hasFile: boolean
  }
}

// Convert API product to cart-store Product format
function transformApiProduct(apiProduct: ApiProduct): Product {
  return {
    id: apiProduct.id,
    type: apiProduct.type as 'book' | 'goods',
    title: apiProduct.title,
    creator: apiProduct.creator,
    price: apiProduct.price,
    images: apiProduct.images.map(img => img.url),
    description: apiProduct.description,
    impact: apiProduct.impact,
    stock: apiProduct.inventory.availableQuantity || (apiProduct.inventory.inStock ? 1 : 0),
    category: apiProduct.tags,
    featured: apiProduct.featured
  }
}

interface ProductsResponse {
  products: ApiProduct[]
  pagination: {
    page: number
    limit: number
    totalCount: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
  filters: {
    categories: Array<{ id: string; name: string; slug: string; count: number }>
    priceRange: {
      min: number
      max: number
    }
  }
}

// Re-export for compatibility with existing components
type Product = {
  id: string
  type: 'book' | 'goods'
  title: string
  creator: {
    name: string
    age?: number
    location: string
    story: string
  }
  price: number
  images: string[]
  description: string
  impact: {
    metric: string
    value: string
  }
  stock: number
  category: string[]
  featured: boolean
}


export default function ShopPage() {
  const { t } = useTranslation('common');
  
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<ProductsResponse['pagination'] | null>(null);
  const [availableFilters, setAvailableFilters] = useState<ProductsResponse['filters'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSort, setSelectedSort] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch products from API
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12'
      });
      
      if (searchQuery) params.set('search', searchQuery);
      if (selectedCategory !== 'all') params.set('type', selectedCategory);
      if (selectedSort !== 'newest') {
        const sortMap = {
          'priceLow': 'price_low',
          'priceHigh': 'price_high',
          'popular': 'popular',
          'newest': 'newest'
        };
        params.set('sort', sortMap[selectedSort as keyof typeof sortMap] || 'newest');
      }
      
      const response = await fetch(`/api/shop/products?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      
      const data: ProductsResponse = await response.json();
      
      // Transform API products to Product format for compatibility
      const transformedProducts = data.products.map(transformApiProduct);
      
      setProducts(transformedProducts);
      setPagination(data.pagination);
      setAvailableFilters(data.filters);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, selectedCategory, selectedSort]);
  
  // Fetch products when filters change
  useEffect(() => {
    fetchProducts();
  }, [currentPage, searchQuery, selectedCategory, selectedSort]);
  
  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedSort]);

  // Calculate total impact (placeholder - would come from API in real implementation)
  const totalImpact = {
    education: pagination?.totalCount ? Math.floor(pagination.totalCount * 1.5) : 23,
    meals: pagination?.totalCount ? Math.floor(pagination.totalCount * 8.2) : 145,
    stories: pagination?.totalCount ? Math.floor(pagination.totalCount * 0.4) : 8,
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
                Showing <span className="font-semibold">{pagination?.totalCount || 0}</span> products
                {pagination && pagination.totalPages > 1 && (
                  <span> (Page {pagination.page} of {pagination.totalPages})</span>
                )}
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
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Loading products...</span>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <ShoppingBag className="w-16 h-16 text-red-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Error loading products</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                  onClick={() => fetchProducts()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product, index) => (
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
            
            {/* Pagination Controls */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center mt-12 space-x-1">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={!pagination.hasPrev || loading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const pageNum = i + Math.max(1, currentPage - 2)
                  if (pageNum > pagination.totalPages) return null
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      disabled={loading}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                        pageNum === currentPage
                          ? 'text-white bg-blue-600 hover:bg-blue-700'
                          : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
                
                <button
                  onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                  disabled={!pagination.hasNext || loading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
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