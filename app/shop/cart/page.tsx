'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  ShoppingCart, 
  ArrowLeft, 
  CreditCard,
  Truck,
  Shield,
  Heart,
  BookOpen
} from 'lucide-react';
import Link from 'next/link';
import useCartStore from '@/lib/cart-store';
import CartItem from '@/components/shop/CartItem';
import ImpactBadge from '@/components/shop/ImpactBadge';

export default function CartPage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  
  const items = useCartStore((state) => state.items);
  const getTotalPrice = useCartStore((state) => state.getTotalPrice);
  const getTotalItems = useCartStore((state) => state.getTotalItems);
  const clearCart = useCartStore((state) => state.clearCart);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const subtotal = getTotalPrice();
  const shipping = subtotal > 50 ? 0 : 9.99;
  const total = subtotal + shipping;

  // Calculate total impact
  const calculateImpact = () => {
    let educationDays = 0;
    let meals = 0;
    let supplies = 0;

    items.forEach(item => {
      const impactValue = parseInt(item.product.impact.value);
      const quantity = item.quantity;
      
      if (item.product.impact.metric.includes('education')) {
        educationDays += impactValue * quantity;
      } else if (item.product.impact.metric.includes('meal')) {
        meals += impactValue * quantity;
      } else if (item.product.impact.metric.includes('supplies')) {
        supplies += impactValue * quantity;
      }
    });

    return { educationDays, meals, supplies };
  };

  const impact = calculateImpact();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Continue Shopping
          </Link>
          
          <h1 className="text-3xl font-bold text-gray-900">
            {t('shop.cart.title')}
          </h1>
          <p className="text-gray-600 mt-2">
            {getTotalItems()} {getTotalItems() === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        /* Empty Cart */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="container mx-auto px-4 sm:px-6 lg:px-8 py-16"
        >
          <div className="max-w-md mx-auto text-center">
            <div className="bg-white rounded-full w-32 h-32 mx-auto mb-6 flex items-center justify-center">
              <ShoppingCart className="w-16 h-16 text-gray-300" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              {t('shop.cart.empty')}
            </h2>
            <p className="text-gray-600 mb-8">
              Discover books and handmade goods that make a difference
            </p>
            <Link
              href="/shop"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              {t('shop.cart.continueShopping')}
            </Link>
          </div>
        </motion.div>
      ) : (
        /* Cart with Items */
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item, index) => (
                <motion.div
                  key={item.product.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <CartItem item={item} />
                </motion.div>
              ))}

              {/* Clear Cart Button */}
              <div className="pt-4">
                <button
                  onClick={clearCart}
                  className="text-red-600 hover:text-red-700 font-medium"
                >
                  Clear Cart
                </button>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-xl shadow-sm p-6 sticky top-4"
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Order Summary
                </h2>

                {/* Price Breakdown */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>{t('shop.cart.subtotal')}</span>
                    <span className="font-medium">${Number(subtotal || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>{t('shop.cart.shipping')}</span>
                    <span className="font-medium">
                      {shipping === 0 ? 'FREE' : `$${Number(shipping || 0).toFixed(2)}`}
                    </span>
                  </div>
                  {shipping > 0 && (
                    <p className="text-xs text-orange-600">
                      Add ${Number((50 - subtotal) || 0).toFixed(2)} more for free shipping!
                    </p>
                  )}
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-lg font-semibold text-gray-900">
                      <span>{t('shop.cart.total')}</span>
                      <span>${Number(total || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Impact Summary */}
                <div className="bg-green-50 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-green-800 mb-2">
                    {t('shop.cart.impact')}:
                  </h3>
                  <ul className="space-y-1 text-sm text-green-700">
                    {impact.educationDays > 0 && (
                      <li>• {impact.educationDays} {t('shop.impact.education')}</li>
                    )}
                    {impact.meals > 0 && (
                      <li>• {impact.meals} {t('shop.impact.meals')}</li>
                    )}
                    {impact.supplies > 0 && (
                      <li>• {impact.supplies} sets of {t('shop.impact.supplies')}</li>
                    )}
                  </ul>
                </div>

                {/* Checkout Button */}
                <button
                  onClick={() => router.push('/shop/checkout')}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors mb-4"
                >
                  <CreditCard className="w-5 h-5 inline mr-2" />
                  {t('shop.cart.checkout')}
                </button>

                {/* Security Badges */}
                <div className="space-y-2 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    <span>Secure checkout powered by Stripe</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4" />
                    <span>Free shipping on orders over $50</span>
                  </div>
                </div>
              </motion.div>

              {/* Trust Badges */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mt-6"
              >
                <div className="flex items-center gap-3 mb-3">
                  <Heart className="w-6 h-6 text-red-500" />
                  <h3 className="font-semibold text-gray-900">
                    100% for Good
                  </h3>
                </div>
                <p className="text-sm text-gray-700">
                  Every purchase directly supports education and community development in underserved areas. 
                  All profits are reinvested through the Seeds of Empowerment program.
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}