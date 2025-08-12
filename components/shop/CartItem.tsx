'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Minus, Plus, Trash2, BookOpen } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import useCartStore, { CartItem as CartItemType } from '@/lib/cart-store';
import { motion } from 'framer-motion';

interface CartItemProps {
  item: CartItemType;
}

export default function CartItem({ item }: CartItemProps) {
  const { t } = useTranslation('common');
  const { updateQuantity, removeItem } = useCartStore();
  const [isRemoving, setIsRemoving] = useState(false);

  const handleUpdateQuantity = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= item.product.stock) {
      updateQuantity(item.product.id, newQuantity);
    }
  };

  const handleRemove = () => {
    setIsRemoving(true);
    setTimeout(() => {
      removeItem(item.product.id);
    }, 300);
  };

  return (
    <motion.div
      initial={{ opacity: 1, x: 0 }}
      animate={{ 
        opacity: isRemoving ? 0 : 1, 
        x: isRemoving ? -100 : 0 
      }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-lg shadow-sm p-4 flex gap-4"
    >
      {/* Product Image */}
      <div className="relative w-24 h-32 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
        <Link href={`/shop/${item.product.id}`}>
          {item.product.images[0] ? (
            <Image
              src={item.product.images[0]}
              alt={item.product.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
              <BookOpen className="w-12 h-12 text-blue-300" />
            </div>
          )}
        </Link>
      </div>

      {/* Product Details */}
      <div className="flex-grow">
        <Link href={`/shop/${item.product.id}`}>
          <h3 className="font-semibold text-gray-900 hover:text-blue-600 transition-colors">
            {item.product.title}
          </h3>
        </Link>
        
        <p className="text-sm text-gray-600 mt-1">
          {t('shop.product.by')} {item.product.creator.name} • {item.product.creator.location}
        </p>
        
        {/* Type Badge */}
        <div className="inline-block mt-2 px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-700">
          {item.product.type === 'book' ? '📚 Book' : '🎨 Handmade'}
        </div>

        {/* Quantity Controls */}
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleUpdateQuantity(item.quantity - 1)}
              disabled={item.quantity <= 1}
              className="p-1 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            
            <span className="w-12 text-center font-medium">{item.quantity}</span>
            
            <button
              onClick={() => handleUpdateQuantity(item.quantity + 1)}
              disabled={item.quantity >= item.product.stock}
              className="p-1 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleRemove}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            aria-label="Remove item"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Price */}
      <div className="text-right">
        <p className="text-sm text-gray-500">
          ${item.product.price.toFixed(2)} each
        </p>
        <p className="text-xl font-bold text-gray-900 mt-1">
          ${(item.product.price * item.quantity).toFixed(2)}
        </p>
      </div>
    </motion.div>
  );
}