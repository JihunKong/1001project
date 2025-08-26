'use client';

import { useState, useEffect } from 'react';
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
  Minus,
  CreditCard,
  Loader2,
  ExternalLink
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import useCartStore, { Product } from '@/lib/cart-store';
import ProductCard from '@/components/shop/ProductCard';
import ImpactBadge from '@/components/shop/ImpactBadge';

// Extended Product interface for detailed shop product
interface DetailedProduct extends Product {
  bookId?: string;
  pdfKey?: string;
  description: string;
  specifications?: {
    [key: string]: string;
  };
  relatedProducts?: Product[];
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation('common');
  const { data: session, status } = useSession();
  const addItem = useCartStore((state) => state.addItem);
  const getItemQuantity = useCartStore((state) => state.getItemQuantity);
  
  // Product state
  const [product, setProduct] = useState<DetailedProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  
  // UI state
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isGuestPurchasing, setIsGuestPurchasing] = useState(false);

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      if (!params.id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/shop/products/${params.id}`);
        
        if (!response.ok) {
          throw new Error('Product not found');
        }
        
        const data = await response.json();
        setProduct(data);
        
        // Fetch related products if we have category info
        if (data.category && data.category.length > 0) {
          try {
            const relatedResponse = await fetch(`/api/shop/products?category=${data.category[0]}&limit=4`);
            const relatedData = await relatedResponse.json();
            setRelatedProducts(relatedData.products?.filter((p: Product) => p.id !== data.id) || []);
          } catch (e) {
            console.error('Failed to fetch related products:', e);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [params.id]);

  // Calculate cart and stock info
  const cartQuantity = product ? getItemQuantity(product.id) : 0;
  const availableStock = product ? product.stock - cartQuantity : 0;

  const handleAddToCart = () => {
    if (!product) return;
    
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

  const handleGuestPurchase = async () => {
    if (!product) return;
    
    setIsGuestPurchasing(true);
    
    // Store purchase intent in sessionStorage for after login
    const purchaseIntent = {
      productId: product.id,
      quantity: quantity,
      timestamp: Date.now()
    };
    sessionStorage.setItem('purchaseIntent', JSON.stringify(purchaseIntent));
    
    // Redirect to guest checkout flow
    router.push(`/checkout/guest?productId=${product.id}&quantity=${quantity}`);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Product Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'The product you are looking for does not exist.'}</p>
          <Link 
            href="/shop"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Shop
          </Link>
        </div>
      </div>
    );
  }

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
              <div className="space-y-3">
                {/* Primary Action - Add to Cart or Guest Purchase */}
                <div className="flex gap-3">
                  {availableStock > 0 ? (
                    <>
                      {session ? (
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
                        <>
                          <button
                            onClick={handleGuestPurchase}
                            disabled={isGuestPurchasing}
                            className={`
                              flex-1 px-6 py-3 rounded-lg font-semibold transition-all
                              ${isGuestPurchasing 
                                ? 'bg-orange-500 text-white' 
                                : 'bg-brand-100 hover:bg-brand-200 text-white'
                              }
                            `}
                          >
                            {isGuestPurchasing ? (
                              <>Processing...</>
                            ) : (
                              <>
                                <CreditCard className="w-5 h-5 inline mr-2" />
                                Buy as Guest
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => router.push('/login')}
                            className="px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                          >
                            Login to Add to Cart
                          </button>
                        </>
                      )}
                    </>
                  ) : (
                    <button disabled className="flex-1 px-6 py-3 bg-gray-200 text-gray-500 rounded-lg font-semibold cursor-not-allowed">
                      {t('shop.product.outOfStock')}
                    </button>
                  )}
                </div>
                
                {/* Library Access Button */}
                {product.bookId && (
                  <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-blue-900 mb-1">📚 Available in Library</h4>
                        <p className="text-xs text-blue-700">Read this book instantly in our digital library</p>
                      </div>
                      <Link 
                        href={`/library/books/${product.bookId}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        <BookOpen className="w-4 h-4" />
                        Read Now
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                )}

                {/* Secondary Actions */}
                <div className="flex gap-3">
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