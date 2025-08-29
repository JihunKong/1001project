'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  ArrowLeft,
  ShoppingBag,
  Calendar,
  CreditCard,
  Package,
  Download,
  Eye,
  Filter,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  BookOpen,
  Crown,
  Loader2
} from 'lucide-react';

interface OrderItem {
  id: string;
  productId: string;
  title: string;
  variantTitle?: string;
  quantity: number;
  price: number;
  total: number;
  product?: {
    id: string;
    title: string;
    type: string;
    creatorName?: string;
    description?: string;
    images?: string[];
  };
}

interface Order {
  id: string;
  status: string;
  paymentStatus?: string;
  total: number;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

interface OrderStats {
  totalOrders: number;
  totalSpent: number;
  byStatus: Record<string, { count: number; total: number }>;
}

const statusConfig = {
  PENDING: { 
    label: 'Pending', 
    color: 'bg-yellow-100 text-yellow-800',
    icon: Clock 
  },
  PROCESSING: { 
    label: 'Processing', 
    color: 'bg-blue-100 text-blue-800',
    icon: RefreshCw 
  },
  DELIVERED: { 
    label: 'Delivered', 
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle 
  },
  CANCELLED: { 
    label: 'Cancelled', 
    color: 'bg-gray-100 text-gray-800',
    icon: XCircle 
  },
  REFUNDED: { 
    label: 'Refunded', 
    color: 'bg-red-100 text-red-800',
    icon: RefreshCw 
  }
};

export default function PurchaseHistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login?callbackUrl=' + encodeURIComponent('/library/orders'));
    }
  }, [session, status, router]);

  // Fetch orders
  const fetchOrders = async (page = 1, status = 'all') => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        status
      });
      
      const response = await fetch(`/api/library/orders?${params}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch orders');
      }
      
      setOrders(data.orders || []);
      setStats(data.stats || null);
      setCurrentPage(data.pagination.page);
      setTotalPages(data.pagination.totalPages);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      fetchOrders(currentPage, statusFilter);
    }
  }, [session, currentPage, statusFilter]);

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const toggleOrderExpansion = (orderId: string) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(amount);
  };

  if (status === 'loading' || !session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/library"
                className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Library
              </Link>
              <div className="h-6 w-px bg-gray-300" />
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-6 h-6 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">Purchase History</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <ShoppingBag className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <CreditCard className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Spent</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(stats.totalSpent)}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-full">
                  <BookOpen className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Books Owned</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.byStatus.DELIVERED?.count || 0}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Filter by status:</span>
            </div>
            {['all', 'PENDING', 'PROCESSING', 'DELIVERED', 'CANCELLED', 'REFUNDED'].map((status) => (
              <button
                key={status}
                onClick={() => handleStatusFilter(status)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  statusFilter === status
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {status === 'all' ? 'All Orders' : statusConfig[status as keyof typeof statusConfig]?.label || status}
                {stats?.byStatus[status]?.count && (
                  <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                    {stats.byStatus[status].count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading orders...</span>
            </div>
          ) : error ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Orders</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={() => fetchOrders(currentPage, statusFilter)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Orders Found</h3>
              <p className="text-gray-600 mb-4">
                {statusFilter === 'all' 
                  ? "You haven't made any purchases yet." 
                  : `No ${statusConfig[statusFilter as keyof typeof statusConfig]?.label.toLowerCase() || statusFilter} orders found.`}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/library"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Browse Library
                </Link>
                <Link
                  href="/shop"
                  className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  Visit Shop
                </Link>
              </div>
            </div>
          ) : (
            <>
              {orders.map((order, index) => {
                const StatusIcon = statusConfig[order.status as keyof typeof statusConfig]?.icon || AlertCircle;
                const isExpanded = expandedOrders.has(order.id);
                
                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-lg shadow-sm overflow-hidden"
                  >
                    <div 
                      className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => toggleOrderExpansion(order.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0">
                            <StatusIcon className="w-6 h-6 text-gray-400" />
                          </div>
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="font-semibold text-gray-900">Order #{order.id.slice(-8)}</h3>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                statusConfig[order.status as keyof typeof statusConfig]?.color || 'bg-gray-100 text-gray-800'
                              }`}>
                                {statusConfig[order.status as keyof typeof statusConfig]?.label || order.status}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {formatDate(order.createdAt)}
                              </div>
                              <div className="flex items-center gap-1">
                                <Package className="w-4 h-4" />
                                {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-gray-900">
                            {formatCurrency(order.total, order.currency)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {isExpanded ? 'Click to collapse' : 'Click to expand'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Order Details */}
                    {isExpanded && (
                      <div className="border-t border-gray-200 p-6 bg-gray-50">
                        <div className="space-y-6">
                          {/* Order Items */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-3">Items Purchased</h4>
                            <div className="space-y-3">
                              {order.items.map((item) => (
                                <div key={item.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                                  <div className="flex items-center gap-4">
                                    <div className="w-12 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded flex items-center justify-center">
                                      {item.product?.type === 'DIGITAL_BOOK' ? (
                                        <BookOpen className="w-6 h-6 text-blue-600" />
                                      ) : (
                                        <Package className="w-6 h-6 text-gray-400" />
                                      )}
                                    </div>
                                    <div>
                                      <h5 className="font-medium text-gray-900">{item.title}</h5>
                                      {item.variantTitle && (
                                        <p className="text-sm text-gray-600">{item.variantTitle}</p>
                                      )}
                                      {item.product?.creatorName && (
                                        <p className="text-sm text-gray-600">by {item.product.creatorName}</p>
                                      )}
                                      <p className="text-xs text-gray-500">
                                        Quantity: {item.quantity} × {formatCurrency(item.price)}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <div className="text-right">
                                      <p className="font-semibold text-gray-900">
                                        {formatCurrency(item.total)}
                                      </p>
                                      {item.product?.type === 'DIGITAL_BOOK' && order.status === 'DELIVERED' && (
                                        <p className="text-xs text-green-600">Available in Library</p>
                                      )}
                                    </div>
                                    {order.status === 'DELIVERED' && item.product?.type === 'DIGITAL_BOOK' && (
                                      <div className="flex gap-2">
                                        <Link
                                          href={`/library/books/${item.productId}`}
                                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                          title="View Book"
                                        >
                                          <Eye className="w-4 h-4" />
                                        </Link>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Order Summary */}
                          <div className="bg-white rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-3">Order Summary</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Subtotal</span>
                                <span className="text-gray-900">{formatCurrency(order.subtotal)}</span>
                              </div>
                              {order.discount > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Discount</span>
                                  <span className="text-green-600">-{formatCurrency(order.discount)}</span>
                                </div>
                              )}
                              {order.shipping > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Shipping</span>
                                  <span className="text-gray-900">{formatCurrency(order.shipping)}</span>
                                </div>
                              )}
                              {order.tax > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Tax</span>
                                  <span className="text-gray-900">{formatCurrency(order.tax)}</span>
                                </div>
                              )}
                              <div className="border-t pt-2 flex justify-between font-semibold">
                                <span className="text-gray-900">Total</span>
                                <span className="text-gray-900">{formatCurrency(order.total)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage <= 1}
                    className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = i + Math.max(1, currentPage - 2);
                      if (pageNum > totalPages) return null;
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                            pageNum === currentPage
                              ? 'bg-blue-100 text-blue-700'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage >= totalPages}
                    className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}