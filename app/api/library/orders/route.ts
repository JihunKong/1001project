import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') || 'all';
    const offset = (page - 1) * limit;

    // Build where clause for status filter
    let statusFilter: any = {};
    if (status !== 'all') {
      statusFilter = { status };
    }

    // Fetch user orders with items
    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where: {
          userId: session.user.id,
          ...statusFilter
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  title: true,
                  type: true,
                  creatorName: true,
                  description: true,
                  images: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: offset,
        take: limit
      }),
      prisma.order.count({
        where: {
          userId: session.user.id,
          ...statusFilter
        }
      })
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    // Get order statistics
    const stats = await prisma.order.groupBy({
      by: ['status'],
      where: {
        userId: session.user.id
      },
      _count: {
        status: true
      },
      _sum: {
        total: true
      }
    });

    const orderStats = {
      totalOrders: totalCount,
      totalSpent: stats.reduce((sum, stat) => sum + Number(stat._sum.total || 0), 0),
      byStatus: stats.reduce((acc: any, stat) => {
        acc[stat.status] = {
          count: stat._count.status,
          total: Number(stat._sum.total || 0)
        };
        return acc;
      }, {})
    };

    // Transform orders for response
    const transformedOrders = orders.map(order => ({
      id: order.id,
      status: order.status,
      paymentStatus: order.paymentStatus,
      total: Number(order.total),
      subtotal: Number(order.subtotal),
      tax: Number(order.tax || 0),
      shipping: Number(order.shipping || 0),
      discount: Number(order.discount || 0),
      currency: order.currency,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items: order.items.map(item => ({
        id: item.id,
        productId: item.productId,
        title: item.title,
        variantTitle: item.variantTitle,
        quantity: item.quantity,
        price: Number(item.price),
        total: Number(item.total),
        product: item.product ? {
          id: item.product.id,
          title: item.product.title,
          type: item.product.type,
          creatorName: item.product.creatorName,
          description: item.product.description,
          images: item.product.images
        } : null
      }))
    }));

    return NextResponse.json({
      success: true,
      orders: transformedOrders,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext,
        hasPrev
      },
      stats: orderStats,
      filters: {
        status,
        availableStatuses: ['all', 'PENDING', 'PROCESSING', 'DELIVERED', 'CANCELLED', 'REFUNDED']
      }
    });

  } catch (error) {
    console.error('Error fetching user orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}