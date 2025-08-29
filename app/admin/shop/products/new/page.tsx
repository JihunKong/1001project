'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Package } from 'lucide-react';
import Link from 'next/link';
import ProductUploadForm from '@/components/admin/ProductUploadForm';

export default function NewProductPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if not admin
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session || session.user.role !== 'ADMIN') {
    router.push('/dashboard');
    return null;
  }

  const handleSuccess = (productId: string) => {
    setIsLoading(true);
    // Redirect to product details or back to products list
    router.push(`/admin/shop/products/${productId}`);
  };

  const handleCancel = () => {
    router.push('/admin/shop');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/admin/shop"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Shop Management
          </Link>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Create New Product
              </h1>
              <p className="text-gray-600 mt-1">
                Add a new product to the 1001 Stories shop
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <div className="flex items-start">
              <Package className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
              <div>
                <h3 className="text-blue-800 font-semibold mb-1">Product Creation Guidelines</h3>
                <ul className="text-blue-700 text-sm space-y-1">
                  <li>• Include high-quality images that showcase the product</li>
                  <li>• Provide detailed descriptions that tell the story behind the product</li>
                  <li>• Set fair pricing that reflects the creator's work and impact</li>
                  <li>• Choose appropriate categories to help customers find the product</li>
                  <li>• Include creator information to connect customers with makers</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Product Creation Form */}
          <ProductUploadForm
            onSuccess={handleSuccess}
            onCancel={handleCancel}
            title="Create New Product"
            description="Add a new handmade product or book to the 1001 Stories shop with creator information and impact details"
            submitButtonText="Create Product"
          />

          {/* Additional Information */}
          <div className="mt-8 bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">What happens next?</h3>
            <div className="space-y-3 text-gray-700">
              <div className="flex items-start">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-xs font-semibold text-blue-600">1</span>
                </div>
                <div>
                  <p className="font-medium">Product Review</p>
                  <p className="text-sm text-gray-600">Your product will be reviewed for quality and appropriateness</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-xs font-semibold text-blue-600">2</span>
                </div>
                <div>
                  <p className="font-medium">Shop Listing</p>
                  <p className="text-sm text-gray-600">Once approved, the product will appear in the shop</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-xs font-semibold text-blue-600">3</span>
                </div>
                <div>
                  <p className="font-medium">Impact Tracking</p>
                  <p className="text-sm text-gray-600">Sales will be tracked and impact metrics will be calculated</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}