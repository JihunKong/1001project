'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { UserRole } from '@prisma/client';
import {
  ArrowLeft,
  Search,
  Eye,
  EyeOff,
  ShoppingCart,
  CheckCircle,
  AlertCircle,
  Edit,
  Filter,
  Plus,
  Trash2,
  Package,
  DollarSign,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface Product {
  id: string;
  title: string;
  description?: string;
  price: number;
  currency: string;
  type: 'PHYSICAL_BOOK' | 'DIGITAL_BOOK' | 'MERCHANDISE' | 'ARTWORK' | 'DONATION_ITEM';
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
  featured: boolean;
  createdAt: string;
  updatedAt: string;
  variants?: {
    id: string;
    title: string;
    price: number;
    sku: string;
  }[];
  images?: {
    id: string;
    url: string;
    alt?: string;
  }[];
}

interface ApiResponse {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export default function AdminShopPage() {
  const { data: session, status } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const fetchProducts = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        search,
        status: statusFilter,
        type: typeFilter,
      });

      const response = await fetch(`/api/admin/shop/products?${params}`);
      if (!response.ok) {
        // If API doesn't exist yet, show empty state
        setProducts([]);
        setPagination({
          page: 1,
          limit: 20,
          totalCount: 0,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        });
        return;
      }

      const data: ApiResponse = await response.json();
      setProducts(data.products);
      setPagination(data.pagination);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, typeFilter]);

  const toggleStatus = async (productId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'ACTIVE' ? 'DRAFT' : 'ACTIVE';
      const response = await fetch(`/api/admin/shop/products/${productId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update product');
      
      // Refresh the list
      await fetchProducts(currentPage);
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Failed to update product status');
    }
  };

  useEffect(() => {
    fetchProducts(1);
  }, [fetchProducts]);

  // Redirect if not admin
  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!session || (session.user as any).role !== UserRole.ADMIN) {
    redirect('/');
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
            <CheckCircle className="w-3 h-3" />
            Active
          </span>
        );
      case 'DRAFT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
            <EyeOff className="w-3 h-3" />
            Draft
          </span>
        );
      case 'ARCHIVED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
            <AlertCircle className="w-3 h-3" />
            Archived
          </span>
        );
      default:
        return status;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'PHYSICAL_BOOK':
      case 'DIGITAL_BOOK':
        return '📚';
      case 'MERCHANDISE':
        return '👕';
      case 'ARTWORK':
        return '🎨';
      case 'DONATION_ITEM':
        return '💝';
      default:
        return '📦';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/admin"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Shop Management</h1>
                <p className="text-sm text-gray-600">Manage products and merchandise</p>
              </div>
            </div>
            <Link
              href="/admin/shop/products/new"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="DRAFT">Draft</option>
              <option value="ARCHIVED">Archived</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              <option value="PHYSICAL_BOOK">Physical Books</option>
              <option value="DIGITAL_BOOK">Digital Books</option>
              <option value="MERCHANDISE">Merchandise</option>
              <option value="ARTWORK">Artwork</option>
              <option value="DONATION_ITEM">Donation Items</option>
            </select>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Filter className="w-4 h-4" />
              {pagination.totalCount} total products
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="p-8 text-center">
              <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No products found</p>
              <p className="text-sm text-gray-500 mb-6">
                Start by adding your first product to the shop.
              </p>
              <Link
                href="/admin/shop/products/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add First Product
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Featured
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {product.images?.[0]?.url ? (
                              <Image
                                className="h-10 w-10 rounded-lg object-cover"
                                src={product.images[0].url}
                                alt={product.title}
                                width={40}
                                height={40}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center">
                                <Package className="w-5 h-5 text-gray-500" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {product.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              {product.description?.slice(0, 60)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="flex items-center gap-2 text-sm text-gray-900">
                          <span>{getTypeIcon(product.type)}</span>
                          {product.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-sm font-medium text-gray-900">
                          <DollarSign className="w-4 h-4" />
                          {Number(product.price || 0).toFixed(2)} {product.currency}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleStatus(product.id, product.status)}
                          className="hover:scale-105 transition-transform"
                        >
                          {getStatusBadge(product.status)}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {product.featured && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                            ⭐ Featured
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/shop/products/${product.id}/edit`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button 
                            className="text-red-600 hover:text-red-900"
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this product?')) {
                                // TODO: Implement delete
                                console.log('Delete product:', product.id);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {((currentPage - 1) * pagination.limit) + 1} to{' '}
              {Math.min(currentPage * pagination.limit, pagination.totalCount)} of{' '}
              {pagination.totalCount} products
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchProducts(currentPage - 1)}
                disabled={!pagination.hasPreviousPage}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded">
                {currentPage} / {pagination.totalPages}
              </span>
              <button
                onClick={() => fetchProducts(currentPage + 1)}
                disabled={!pagination.hasNextPage}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}