'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Mail, 
  CreditCard, 
  Lock, 
  CheckCircle,
  AlertCircle 
} from 'lucide-react';

interface GuestCheckoutForm {
  email: string;
  firstName: string;
  lastName: string;
  acceptTerms: boolean;
  createAccount: boolean;
}

function GuestCheckoutForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const productId = searchParams.get('productId');
  const quantity = parseInt(searchParams.get('quantity') || '1');
  
  const [form, setForm] = useState<GuestCheckoutForm>({
    email: '',
    firstName: '',
    lastName: '',
    acceptTerms: false,
    createAccount: true
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<any>(null);

  // Fetch product details
  useEffect(() => {
    if (productId) {
      fetchProductDetails();
    }
  }, [productId]);

  const fetchProductDetails = async () => {
    try {
      const response = await fetch(`/api/shop/products`);
      const data = await response.json();
      const foundProduct = data.products.find((p: any) => p.id === productId);
      setProduct(foundProduct);
    } catch (err) {
      console.error('Error fetching product:', err);
    }
  };

  const handleInputChange = (field: keyof GuestCheckoutForm, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.email || !form.firstName || !form.lastName || !form.acceptTerms) {
      setError('Please fill in all required fields and accept the terms.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create guest checkout session
      const response = await fetch('/api/shop/guest-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          quantity,
          guestInfo: {
            email: form.email,
            firstName: form.firstName,
            lastName: form.lastName,
            createAccount: form.createAccount
          }
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to process guest checkout');
      }

      // Redirect to payment or confirmation
      router.push(`/checkout/confirm?sessionId=${result.sessionId}`);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!productId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Request</h1>
          <p className="text-gray-600 mb-4">No product selected for checkout.</p>
          <button
            onClick={() => router.push('/shop')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Return to Shop
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
            <h1 className="text-xl font-semibold text-gray-900">Guest Checkout</h1>
            <div className="w-16"></div> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Checkout Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Guest Information
              </h2>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <p className="text-red-700">{error}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="your@email.com"
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    We'll send your purchase confirmation and magic login link here
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={form.createAccount}
                      onChange={(e) => handleInputChange('createAccount', e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      Create account for easy access to your purchases
                    </span>
                  </label>

                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      required
                      checked={form.acceptTerms}
                      onChange={(e) => handleInputChange('acceptTerms', e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      I accept the{' '}
                      <a href="/terms" className="text-blue-600 hover:underline">
                        Terms of Service
                      </a>{' '}
                      and{' '}
                      <a href="/privacy" className="text-blue-600 hover:underline">
                        Privacy Policy
                      </a>{' '}
                      *
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`
                    w-full px-6 py-3 rounded-lg font-semibold transition-all
                    ${loading 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-brand-100 hover:bg-brand-200'
                    } text-white
                  `}
                >
                  {loading ? (
                    'Processing...'
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5 inline mr-2" />
                      Continue to Payment
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Lock className="w-4 h-4" />
                  Secure checkout powered by industry-standard encryption
                </div>
              </div>
            </motion.div>

            {/* Order Summary */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Order Summary
              </h2>

              {product ? (
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="w-16 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-8 h-8 text-blue-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{product.title}</h3>
                      <p className="text-sm text-gray-600">
                        by {product.creator.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        Digital Book • Quantity: {quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        ${(parseFloat(product.price || '0') * quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="text-gray-900">
                        ${(parseFloat(product.price || '0') * quantity).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax</span>
                      <span className="text-gray-900">$0.00</span>
                    </div>
                    <div className="flex justify-between text-lg font-semibold border-t pt-2">
                      <span className="text-gray-900">Total</span>
                      <span className="text-gray-900">
                        ${(parseFloat(product.price || '0') * quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-blue-900">
                          What happens next:
                        </p>
                        <ul className="text-blue-700 mt-1 space-y-1">
                          <li>• Instant access to your digital book</li>
                          <li>• Email confirmation with download links</li>
                          <li>• Optional account creation for easy re-access</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              )}
            </motion.div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default function GuestCheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    }>
      <GuestCheckoutForm />
    </Suspense>
  );
}