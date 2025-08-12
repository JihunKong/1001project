'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft, 
  ShoppingCart, 
  Heart, 
  Share2, 
  Truck,
  Shield,
  RefreshCw,
  Star,
  Users,
  BookOpen,
  Plus,
  Minus
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import useCartStore, { Product } from '@/lib/cart-store';
import ProductCard from '@/components/shop/ProductCard';
import ImpactBadge from '@/components/shop/ImpactBadge';

// Mock data - in production, this would come from an API
const mockProducts: Product[] = [
  {
    id: '1',
    type: 'book',
    title: 'Dreams of the Ocean: Stories from Filipino Children',
    creator: {
      name: 'Maria Santos & Friends',
      age: 12,
      location: 'Palawan, Philippines',
      story: 'Maria and her classmates from a small coastal school in Palawan wrote these stories during a creative writing workshop. Each story reflects their daily life by the sea, their dreams, and the challenges they face. The illustrations were created by local artists who volunteered their time to bring these stories to life.',
    },
    price: 24.99,
    images: ['/images/shop/book1.jpg', '/images/shop/book1-2.jpg', '/images/shop/book1-3.jpg'],
    description: 'A beautiful collection of 20 stories from children living in the Philippines coastal communities. Each story captures the unique perspective of island life, family traditions, and dreams for the future. The book includes original illustrations by local artists and photographs of the young authors.',
    impact: {
      metric: 'days of education',
      value: '5',
    },
    stock: 15,
    category: ['books', 'asia', 'ocean'],
    featured: true,
  },
  // Add other products...
];

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation('common');
  const addItem = useCartStore((state) => state.addItem);
  const getItemQuantity = useCartStore((state) => state.getItemQuantity);
  
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  // Find product by ID
  const product = mockProducts.find(p => p.id === params.id) || mockProducts[0];
  const cartQuantity = getItemQuantity(product.id);
  const availableStock = product.stock - cartQuantity;

  const handleAddToCart = () => {
    setIsAdding(true);
    addItem(product, quantity);
    setTimeout(() => {
      setIsAdding(false);
      setQuantity(1);
    }, 1000);
  };

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= availableStock) {
      setQuantity(newQuantity);
    }
  };

  // Related products (mock)
  const relatedProducts = mockProducts.filter(p => p.id !== product.id).slice(0, 3);

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <nav className="flex items-center gap-2 text-sm text-gray-600">
          <Link href="/shop" className="hover:text-blue-600 transition-colors">
            Shop
          </Link>
          <span>/</span>
          <span className="text-gray-900">{product.type === 'book' ? 'Books' : 'Goods'}</span>
        </nav>
      </div>

      {/* Product Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Shop
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Images Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {/* Main Image */}
            <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-gray-100 mb-4">
              {product.images[selectedImageIndex] ? (
                <Image
                  src={product.images[selectedImageIndex]}
                  alt={product.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
                  <BookOpen className="w-32 h-32 text-blue-300" />
                </div>
              )}
              
              {/* Featured Badge */}
              {product.featured && (
                <div className="absolute top-4 left-4 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-semibold">
                  <Star className="w-4 h-4 inline mr-1" />
                  Featured
                </div>
              )}
            </div>

            {/* Thumbnail Images */}
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`
                      relative aspect-square overflow-hidden rounded-lg bg-gray-100
                      ${selectedImageIndex === index ? 'ring-2 ring-blue-500' : ''}
                    `}
                  >
                    {image ? (
                      <Image
                        src={image}
                        alt={`${product.title} ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Title and Type */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 bg-gray-100 rounded-full text-sm font-medium">
                  {product.type === 'book' ? '📚 Book' : '🎨 Handmade'}
                </span>
                {availableStock <= 5 && availableStock > 0 && (
                  <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                    Only {availableStock} left!
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {product.title}
              </h1>
            </div>

            {/* Creator Info */}
            <div className="border-l-4 border-blue-500 pl-4">
              <p className="text-sm text-gray-600 mb-1">
                {t('shop.product.by')} <span className="font-semibold">{product.creator.name}</span>
                {product.creator.age && ` • ${t('shop.product.age')} ${product.creator.age}`}
              </p>
              <p className="text-sm text-gray-600">
                📍 {product.creator.location}
              </p>
            </div>

            {/* Price */}
            <div>
              <p className="text-4xl font-bold text-gray-900">${product.price}</p>
            </div>

            {/* Impact */}
            <ImpactBadge 
              metric={product.impact.metric} 
              value={product.impact.value}
              size="lg"
            />

            {/* Description */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">About this product</h3>
              <p className="text-gray-600 leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Add to Cart Section */}
            <div className="space-y-4">
              {/* Quantity Selector */}
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700">
                  {t('shop.cart.quantity')}:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                    className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center font-semibold">{quantity}</span>
                  <button
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= availableStock}
                    className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                {availableStock > 0 ? (
                  <button
                    onClick={handleAddToCart}
                    disabled={isAdding}
                    className={`
                      flex-1 px-6 py-3 rounded-lg font-semibold transition-all
                      ${isAdding 
                        ? 'bg-green-500 text-white' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }
                    `}
                  >
                    {isAdding ? (
                      <>✓ Added to Cart</>
                    ) : (
                      <>
                        <ShoppingCart className="w-5 h-5 inline mr-2" />
                        {t('shop.product.addToCart')}
                      </>
                    )}
                  </button>
                ) : (
                  <button disabled className="flex-1 px-6 py-3 bg-gray-200 text-gray-500 rounded-lg font-semibold cursor-not-allowed">
                    {t('shop.product.outOfStock')}
                  </button>
                )}
                
                <button
                  onClick={() => setIsFavorite(!isFavorite)}
                  className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
                </button>
                
                <button className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <Share2 className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Shipping Info */}
            <div className="space-y-3 border-t pt-6">
              <div className="flex items-center gap-3">
                <Truck className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-600">Free shipping on orders over $50</span>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-600">Secure payment processing</span>
              </div>
              <div className="flex items-center gap-3">
                <RefreshCw className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-600">30-day return policy</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Story Behind Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-16 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {t('shop.product.story')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <p className="text-gray-700 leading-relaxed">
                {product.creator.story}
              </p>
            </div>
            <div className="bg-white rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Your Purchase Impact</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  <span className="text-sm text-gray-600">Directly supports the creators and their community</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  <span className="text-sm text-gray-600">Funds educational materials and programs</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  <span className="text-sm text-gray-600">Enables more stories to be discovered and published</span>
                </li>
              </ul>
            </div>
          </div>
        </motion.section>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-16"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {t('shop.product.relatedProducts')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard key={relatedProduct.id} product={relatedProduct} />
              ))}
            </div>
          </motion.section>
        )}
      </section>
    </div>
  );
}