'use client';

import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ShoppingCart, Heart, Star, Users, BookOpen } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import useCartStore, { Product } from '@/lib/cart-store';
import { useState } from 'react';
import EnhancedPDFThumbnailWrapper from './EnhancedPDFThumbnailWrapper';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { t } = useTranslation('common');
  const addItem = useCartStore((state) => state.addItem);
  const [isAdding, setIsAdding] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const handleAddToCart = () => {
    setIsAdding(true);
    addItem(product);
    setTimeout(() => setIsAdding(false), 1000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group"
    >
      {/* Image Container */}
      <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
        <Link href={`/shop/${product.id}`}>
          {product.pdfKey && product.bookId ? (
            <EnhancedPDFThumbnailWrapper
              bookId={product.bookId}
              title={product.title}
              className="w-full h-full group-hover:scale-105 transition-transform duration-300"
              alt={product.title}
            />
          ) : product.images[0] ? (
            <Image
              src={product.images[0]}
              alt={product.title}
              fill
              className="object-contain group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
              <BookOpen className="w-20 h-20 text-blue-300" />
            </div>
          )}
        </Link>
        
        {/* Featured Badge */}
        {product.featured && (
          <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-semibold">
            <Star className="w-3 h-3 inline mr-1" />
            Featured
          </div>
        )}
        
        {/* Category Badge */}
        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium">
          {product.type === 'book' ? '📚 Book' : '🎨 Handmade'}
        </div>
        
        {/* Favorite Button */}
        <button
          onClick={() => setIsFavorite(!isFavorite)}
          className="absolute bottom-2 right-2 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
        >
          <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
        </button>
      </div>
      
      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <Link href={`/shop/${product.id}`}>
          <h3 className="font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-2 mb-2">
            {product.title}
          </h3>
        </Link>
        
        {/* Creator Info */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
          <Users className="w-4 h-4" />
          <span>{product.creator.name}</span>
          {product.creator.age && <span>• {product.creator.age} years</span>}
        </div>
        
        {/* Location */}
        <p className="text-xs text-gray-500 mb-3">
          📍 {product.creator.location}
        </p>
        
        {/* Impact Badge */}
        <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-4">
          <p className="text-xs text-green-700">
            <span className="font-semibold">{t('shop.product.impact')}:</span> {product.impact.value} {product.impact.metric}
          </p>
        </div>
        
        {/* Price and Action */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-gray-900">${product.price}</p>
            {product.stock <= 5 && product.stock > 0 && (
              <p className="text-xs text-orange-600 mt-1">Only {product.stock} left!</p>
            )}
          </div>
          
          {product.stock > 0 ? (
            <button
              onClick={handleAddToCart}
              disabled={isAdding}
              className={`
                px-4 py-2 rounded-lg font-medium transition-all
                ${isAdding 
                  ? 'bg-green-500 text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
                }
              `}
            >
              {isAdding ? (
                <>✓ Added</>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4 inline mr-1" />
                  {t('shop.product.addToCart')}
                </>
              )}
            </button>
          ) : (
            <button disabled className="px-4 py-2 bg-gray-200 text-gray-500 rounded-lg font-medium cursor-not-allowed">
              {t('shop.product.outOfStock')}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

