const Purchase = require('../../models/Purchase');
const Consultation = require('../../models/Consultation');
const Product = require('../../models/Product');
const Service = require('../../models/Service');
const Payment = require('../../models/Payment');

// Get service sales analytics
const getServicesAnalytics = async (req, res) => {
  try {
    console.log('🔍 Fetching service analytics...');
    console.log('📊 Checking database collections...');

    // Check if collections exist and have data
    const consultationCount = await Consultation.countDocuments();
    const paymentCount = await Payment.countDocuments();
    const serviceCount = await Service.countDocuments();
    const purchaseCount = await Purchase.countDocuments();

    console.log('📊 Database status:', {
      consultations: consultationCount,
      payments: paymentCount,
      services: serviceCount,
      purchases: purchaseCount
    });

    // Get service purchases with payment data
    console.log('🔍 Executing service purchases aggregation query...');
    const servicePurchases = await Purchase.aggregate([
      {
        $match: {
          itemType: { $in: ['service', 'consultation'] },
          status: { $in: ['confirmed', 'completed'] }
        }
      },
      {
        $lookup: {
          from: 'services',
          localField: 'itemId',
          foreignField: '_id',
          as: 'service'
        }
      },
      {
        $unwind: {
          path: '$service',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: {
          path: '$user',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $group: {
          _id: {
            serviceType: {
              $ifNull: [
                '$service.category',
                '$serviceName',
                { $ifNull: ['$serviceType', '$consultationType', 'General'] }
              ]
            }
          },
          count: { $sum: 1 },
          totalRevenue: { $sum: { $divide: ['$revenue', 100] } }, // Convert cents to dollars
          recentBookings: {
            $push: {
              date: '$createdAt',
              customer: { $concat: ['$user.firstName', ' ', '$user.lastName'] },
              email: '$user.email',
              amount: { $divide: ['$revenue', 100] } // Convert cents to dollars
            }
          }
        }
      },
      {
        $sort: { totalRevenue: -1 }
      }
    ]);

    console.log('📊 Service purchases aggregation results:', {
      count: servicePurchases.length,
      data: servicePurchases.map(item => ({
        category: item._id.serviceType,
        count: item.count,
        revenue: item.totalRevenue
      }))
    });

    // Get monthly service sales data from purchases
    console.log('🔍 Executing monthly service sales aggregation...');
    const monthlyServiceSales = await Purchase.aggregate([
      {
        $match: {
          itemType: { $in: ['service', 'consultation'] },
          status: { $in: ['confirmed', 'completed'] },
          createdAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $lookup: {
          from: 'payments',
          localField: 'paymentId',
          foreignField: '_id',
          as: 'payment'
        }
      },
      {
        $unwind: {
          path: '$payment',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $match: {
          'payment.status': { $in: ['succeeded', 'completed'] }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          revenue: { $sum: { $divide: ['$revenue', 100] } } // Convert cents to dollars
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    console.log('📊 Monthly service sales results:', {
      count: monthlyServiceSales.length,
      data: monthlyServiceSales
    });

    // Get top performing services from purchases
    console.log('🔍 Executing top services aggregation...');
    const topServices = await Purchase.aggregate([
      {
        $match: {
          itemType: { $in: ['service', 'consultation'] },
          status: { $in: ['confirmed', 'completed'] }
        }
      },
      {
        $lookup: {
          from: 'payments',
          localField: 'paymentId',
          foreignField: '_id',
          as: 'payment'
        }
      },
      {
        $unwind: {
          path: '$payment',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $match: {
          'payment.status': { $in: ['succeeded', 'completed'] }
        }
      },
      {
        $lookup: {
          from: 'services',
          localField: 'itemId',
          foreignField: '_id',
          as: 'service'
        }
      },
      {
        $unwind: {
          path: '$service',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $group: {
          _id: '$itemId',
          title: { $first: { $ifNull: ['$service.title', '$serviceName', 'Unknown Service'] } },
          category: { $first: { $ifNull: ['$service.category', 'general'] } },
          price: { $first: { $ifNull: ['$service.price', '$0'] } },
          bookingCount: { $sum: 1 },
          totalRevenue: { $sum: { $divide: ['$revenue', 100] } }, // Convert cents to dollars
          rating: { $first: { $ifNull: ['$service.rating', 0] } }
        }
      },
      {
        $sort: { bookingCount: -1 }
      },
      {
        $limit: 10
      }
    ]);

    console.log('📊 Top services results:', {
      count: topServices.length,
      data: topServices
    });

    // Calculate totals
    const totalRevenue = servicePurchases.reduce((sum, service) => sum + (service.totalRevenue || 0), 0);
    const totalBookings = servicePurchases.reduce((sum, service) => sum + (service.count || 0), 0);

    console.log('📊 Analytics summary:', {
      servicePurchasesCount: servicePurchases.length,
      totalRevenue,
      totalBookings,
      monthlySalesCount: monthlyServiceSales.length,
      topServicesCount: topServices.length
    });

    const responseData = {
      success: true,
      data: {
        serviceBreakdown: servicePurchases.map(service => ({
          _id: service._id.serviceType,
          count: service.count,
          totalRevenue: service.totalRevenue,
          recentBookings: service.recentBookings.slice(0, 5) // Limit recent bookings
        })),
        monthlySales: monthlyServiceSales,
        topServices: topServices,
        totalRevenue,
        totalBookings
      }
    };

    console.log('📤 Sending services analytics response:', responseData);

    res.json(responseData);
  } catch (error) {
    console.error('Error fetching service analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch service analytics'
    });
  }
};

// Get courses and products sales analytics
const getCoursesProductsAnalytics = async (req, res) => {
  try {
    console.log('🔍 Fetching courses/products analytics...');

    // Check database collections
    const purchaseCount = await Purchase.countDocuments();
    const productCount = await Product.countDocuments();
    const paymentCount = await Payment.countDocuments();

    console.log('📊 Database status:', {
      purchases: purchaseCount,
      products: productCount,
      payments: paymentCount
    });

    // Get product/course sales
    console.log('🔍 Executing product sales aggregation...');
    const productSales = await Purchase.aggregate([
      {
        $match: { itemType: 'product' }
      },
      {
        $lookup: {
          from: 'products',
          localField: 'itemId',
          foreignField: '_id',
          as: 'product'
        }
      },
      {
        $unwind: {
          path: '$product',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'payments',
          localField: 'paymentId',
          foreignField: '_id',
          as: 'payment'
        }
      },
      {
        $unwind: {
          path: '$payment',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $match: {
          'payment.status': 'succeeded'
        }
      },
      {
        $group: {
          _id: {
            productId: '$itemId',
            title: '$product.title',
            type: '$product.type',
            category: '$product.category'
          },
          salesCount: { $sum: '$quantity' },
          totalRevenue: { $sum: { $divide: ['$price', 100] } }, // Convert cents to dollars
          recentSales: {
            $push: {
              date: '$createdAt',
              quantity: '$quantity',
              price: '$price'
            }
          }
        }
      },
      {
        $sort: { totalRevenue: -1 }
      }
    ]);

    console.log('📊 Product sales aggregation results:', {
      count: productSales.length,
      data: productSales
    });

    // Get monthly product/course sales
    console.log('🔍 Executing monthly product sales aggregation...');
    const monthlyProductSales = await Purchase.aggregate([
      {
        $match: {
          itemType: 'product',
          createdAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $lookup: {
          from: 'payments',
          localField: 'paymentId',
          foreignField: '_id',
          as: 'payment'
        }
      },
      {
        $unwind: {
          path: '$payment',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $match: {
          'payment.status': 'succeeded'
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: '$quantity' },
          revenue: { $sum: { $divide: ['$price', 100] } } // Convert cents to dollars
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    console.log('📊 Monthly product sales results:', {
      count: monthlyProductSales.length,
      data: monthlyProductSales
    });

    // Get sales by category
    console.log('🔍 Executing sales by category aggregation...');
    const salesByCategory = await Purchase.aggregate([
      {
        $match: { itemType: 'product' }
      },
      {
        $lookup: {
          from: 'products',
          localField: 'itemId',
          foreignField: '_id',
          as: 'product'
        }
      },
      {
        $unwind: {
          path: '$product',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'payments',
          localField: 'paymentId',
          foreignField: '_id',
          as: 'payment'
        }
      },
      {
        $unwind: {
          path: '$payment',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $match: {
          'payment.status': 'succeeded'
        }
      },
      {
        $group: {
          _id: '$product.category',
          salesCount: { $sum: '$quantity' },
          totalRevenue: { $sum: { $divide: ['$price', 100] } } // Convert cents to dollars
        }
      },
      {
        $sort: { totalRevenue: -1 }
      }
    ]);

    console.log('📊 Sales by category results:', {
      count: salesByCategory.length,
      data: salesByCategory
    });

    // Get sales by type (ebook vs course)
    console.log('🔍 Executing sales by type aggregation...');
    const salesByType = await Purchase.aggregate([
      {
        $match: { itemType: 'product' }
      },
      {
        $lookup: {
          from: 'products',
          localField: 'itemId',
          foreignField: '_id',
          as: 'product'
        }
      },
      {
        $unwind: {
          path: '$product',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'payments',
          localField: 'paymentId',
          foreignField: '_id',
          as: 'payment'
        }
      },
      {
        $unwind: {
          path: '$payment',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $match: {
          'payment.status': 'succeeded'
        }
      },
      {
        $group: {
          _id: '$product.type',
          salesCount: { $sum: '$quantity' },
          totalRevenue: { $sum: { $divide: ['$price', 100] } } // Convert cents to dollars
        }
      },
      {
        $sort: { totalRevenue: -1 }
      }
    ]);

    console.log('📊 Sales by type results:', {
      count: salesByType.length,
      data: salesByType
    });

    console.log('📊 Courses/Products analytics results:', {
      productSalesCount: productSales.length,
      totalRevenue: productSales.reduce((sum, product) => sum + (product.totalRevenue || 0), 0),
      totalSales: productSales.reduce((sum, product) => sum + (product.salesCount || 0), 0),
      monthlySalesCount: monthlyProductSales.length,
      salesByCategoryCount: salesByCategory.length,
      salesByTypeCount: salesByType.length
    });

    const responseData = {
      success: true,
      data: {
        productSales: productSales,
        monthlySales: monthlyProductSales,
        salesByCategory: salesByCategory,
        salesByType: salesByType,
        totalRevenue: productSales.reduce((sum, product) => sum + (product.totalRevenue || 0), 0),
        totalSales: productSales.reduce((sum, product) => sum + (product.salesCount || 0), 0)
      }
    };

    console.log('📤 Sending courses/products analytics response:', responseData);

    res.json(responseData);
  } catch (error) {
    console.error('Error fetching courses/products analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch courses/products analytics'
    });
  }
};

// Get combined analytics for services and courses/products
const getCombinedAnalytics = async (req, res) => {
  try {
    console.log('🔍 Fetching combined analytics...');

    // Get service revenue (consultations)
    console.log('🔍 Executing service revenue aggregation...');
    const serviceRevenue = await Consultation.aggregate([
      {
        $match: {
          status: { $in: ['confirmed', 'completed'] }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: 0 }, // No revenue link yet
          totalBookings: { $sum: 1 }
        }
      }
    ]);

    // Get product/course revenue
    const productRevenue = await Purchase.aggregate([
      {
        $match: { itemType: 'product' }
      },
      {
        $lookup: {
          from: 'payments',
          localField: 'paymentId',
          foreignField: '_id',
          as: 'payment'
        }
      },
      {
        $unwind: {
          path: '$payment',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $match: {
          'payment.status': 'succeeded'
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$price' },
          totalSales: { $sum: '$quantity' }
        }
      }
    ]);

    // Get monthly combined revenue
    const monthlyCombined = await Promise.all([
      // Service monthly revenue (consultations)
      Consultation.aggregate([
        {
          $match: {
            status: { $in: ['confirmed', 'completed'] },
            createdAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            servicesRevenue: { $sum: 0 }, // No revenue link yet
            servicesCount: { $sum: 1 }
          }
        }
      ]),
      // Product monthly revenue
      Purchase.aggregate([
        {
          $match: {
            itemType: 'product',
            createdAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }
          }
        },
        {
          $lookup: {
            from: 'payments',
            localField: 'paymentId',
            foreignField: '_id',
            as: 'payment'
          }
        },
        {
          $unwind: {
            path: '$payment',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $match: {
            'payment.status': 'completed'
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            productsRevenue: { $sum: '$price' },
            productsCount: { $sum: '$quantity' }
          }
        }
      ])
    ]);

    // Combine monthly data
    const monthlyData = {};
    monthlyCombined[0].forEach(item => {
      const key = `${item._id.year}-${item._id.month}`;
      monthlyData[key] = {
        year: item._id.year,
        month: item._id.month,
        servicesRevenue: item.servicesRevenue || 0,
        servicesCount: item.servicesCount || 0,
        productsRevenue: 0,
        productsCount: 0
      };
    });

    monthlyCombined[1].forEach(item => {
      const key = `${item._id.year}-${item._id.month}`;
      if (monthlyData[key]) {
        monthlyData[key].productsRevenue = item.productsRevenue || 0;
        monthlyData[key].productsCount = item.productsCount || 0;
      } else {
        monthlyData[key] = {
          year: item._id.year,
          month: item._id.month,
          servicesRevenue: 0,
          servicesCount: 0,
          productsRevenue: item.productsRevenue || 0,
          productsCount: item.productsCount || 0
        };
      }
    });

    const combinedMonthly = Object.values(monthlyData).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });

    console.log('📊 Combined analytics results:', {
      serviceRevenue: serviceRevenue[0],
      productRevenue: productRevenue[0],
      monthlyCombinedCount: combinedMonthly.length,
      overallTotal: (serviceRevenue[0]?.totalRevenue || 0) + (productRevenue[0]?.totalRevenue || 0)
    });

    const responseData = {
      success: true,
      data: {
        services: {
          totalRevenue: serviceRevenue[0]?.totalRevenue || 0,
          totalBookings: serviceRevenue[0]?.totalBookings || 0
        },
        products: {
          totalRevenue: productRevenue[0]?.totalRevenue || 0,
          totalSales: productRevenue[0]?.totalSales || 0
        },
        monthlyCombined: combinedMonthly,
        overallTotal: (serviceRevenue[0]?.totalRevenue || 0) + (productRevenue[0]?.totalRevenue || 0)
      }
    };

    console.log('📤 Sending combined analytics response:', responseData);

    res.json(responseData);
  } catch (error) {
    console.error('Error fetching combined analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch combined analytics'
    });
  }
};

// Get detailed service sales table data
const getServiceSalesTable = async (req, res) => {
  try {
    console.log('🔍 Fetching detailed service sales table data...');

    // Get all service purchases with refund information
    const serviceSalesData = await Purchase.aggregate([
      {
        $match: {
          itemType: 'service',
          status: { $in: ['confirmed', 'completed'] }
        }
      },
      {
        $lookup: {
          from: 'services',
          localField: 'itemId',
          foreignField: '_id',
          as: 'service'
        }
      },
      {
        $unwind: {
          path: '$service',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'payments',
          localField: 'paymentId',
          foreignField: '_id',
          as: 'payment'
        }
      },
      {
        $unwind: {
          path: '$payment',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $match: {
          'payment.status': { $in: ['succeeded', 'completed'] }
        }
      },
      {
        $lookup: {
          from: 'refunds',
          let: { paymentId: '$paymentId' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$paymentId', '$$paymentId'] },
                status: 'succeeded'
              }
            }
          ],
          as: 'refunds'
        }
      },
      {
        $group: {
          _id: '$itemId',
          serviceName: { $first: { $ifNull: ['$service.title', '$serviceName', 'Unknown Service'] } },
          category: { $first: { $ifNull: ['$service.category', 'Uncategorized'] } },
          price: { $first: { $ifNull: ['$service.price', '$0'] } },
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: { $divide: ['$revenue', 100] } }, // Convert cents to dollars
          totalRefunds: { $sum: { $size: '$refunds' } },
          refundAmount: {
            $sum: {
              $reduce: {
                input: '$refunds',
                initialValue: 0,
                in: { $add: ['$$value', '$$this.refundAmount'] }
              }
            }
          },
          uniqueUsers: { $addToSet: '$userId' },
          lastSaleDate: { $max: '$createdAt' }
        }
      },
      {
        $project: {
          _id: 1,
          serviceName: 1,
          category: 1,
          price: 1,
          totalSales: 1,
          totalRevenue: 1,
          totalRefunds: 1,
          refundAmount: { $divide: ['$refundAmount', 100] }, // Convert cents to dollars
          uniqueUserCount: { $size: '$uniqueUsers' },
          netRevenue: { $subtract: ['$totalRevenue', { $divide: ['$refundAmount', 100] }] },
          lastSaleDate: 1
        }
      },
      {
        $sort: { totalRevenue: -1 }
      }
    ]);

    console.log('📊 Service sales table data:', {
      count: serviceSalesData.length,
      sample: serviceSalesData.slice(0, 2)
    });

    res.json({
      success: true,
      data: serviceSalesData
    });
  } catch (error) {
    console.error('Error fetching service sales table:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch service sales table data'
    });
  }
};

// Get advanced service metrics with growth trends and predictions
const getAdvancedServiceMetrics = async (req, res) => {
  try {
    console.log('🔍 Fetching advanced service metrics...');

    const { timeRange = '90' } = req.query; // days
    const daysAgo = parseInt(timeRange);
    const startDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    const midDate = new Date(Date.now() - (daysAgo / 2) * 24 * 60 * 60 * 1000);

    // Get current period metrics
    const currentPeriodMetrics = await Purchase.aggregate([
      {
        $match: {
          itemType: { $in: ['service', 'consultation'] },
          status: { $in: ['confirmed', 'completed'] },
          createdAt: { $gte: midDate }
        }
      },
      {
        $lookup: {
          from: 'payments',
          localField: 'paymentId',
          foreignField: '_id',
          as: 'payment'
        }
      },
      {
        $unwind: { path: '$payment', preserveNullAndEmptyArrays: true }
      },
      {
        $match: { 'payment.status': { $in: ['succeeded', 'completed'] } }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: { $divide: ['$revenue', 100] } },
          totalBookings: { $sum: 1 },
          uniqueCustomers: { $addToSet: '$userId' }
        }
      }
    ]);

    // Get previous period metrics for comparison
    const previousPeriodMetrics = await Purchase.aggregate([
      {
        $match: {
          itemType: { $in: ['service', 'consultation'] },
          status: { $in: ['confirmed', 'completed'] },
          createdAt: { $gte: startDate, $lt: midDate }
        }
      },
      {
        $lookup: {
          from: 'payments',
          localField: 'paymentId',
          foreignField: '_id',
          as: 'payment'
        }
      },
      {
        $unwind: { path: '$payment', preserveNullAndEmptyArrays: true }
      },
      {
        $match: { 'payment.status': { $in: ['succeeded', 'completed'] } }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: { $divide: ['$revenue', 100] } },
          totalBookings: { $sum: 1 },
          uniqueCustomers: { $addToSet: '$userId' }
        }
      }
    ]);

    const current = currentPeriodMetrics[0] || { totalRevenue: 0, totalBookings: 0, uniqueCustomers: [] };
    const previous = previousPeriodMetrics[0] || { totalRevenue: 0, totalBookings: 0, uniqueCustomers: [] };

    // Calculate growth rates
    const revenueGrowth = previous.totalRevenue > 0
      ? ((current.totalRevenue - previous.totalRevenue) / previous.totalRevenue) * 100
      : 0;
    const bookingGrowth = previous.totalBookings > 0
      ? ((current.totalBookings - previous.totalBookings) / previous.totalBookings) * 100
      : 0;
    const customerGrowth = previous.uniqueCustomers.length > 0
      ? ((current.uniqueCustomers.length - previous.uniqueCustomers.length) / previous.uniqueCustomers.length) * 100
      : 0;

    // Get conversion rate (consultations to purchases)
    const totalConsultations = await Consultation.countDocuments({
      createdAt: { $gte: midDate }
    });
    const conversionRate = totalConsultations > 0
      ? (current.totalBookings / totalConsultations) * 100
      : 0;

    // Get average customer lifetime value
    const customerLTV = await Purchase.aggregate([
      {
        $match: {
          itemType: { $in: ['service', 'consultation'] },
          status: { $in: ['confirmed', 'completed'] }
        }
      },
      {
        $lookup: {
          from: 'payments',
          localField: 'paymentId',
          foreignField: '_id',
          as: 'payment'
        }
      },
      {
        $unwind: { path: '$payment', preserveNullAndEmptyArrays: true }
      },
      {
        $match: { 'payment.status': { $in: ['succeeded', 'completed'] } }
      },
      {
        $group: {
          _id: '$userId',
          totalSpent: { $sum: { $divide: ['$revenue', 100] } },
          purchaseCount: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: null,
          avgLTV: { $avg: '$totalSpent' },
          avgPurchaseFrequency: { $avg: '$purchaseCount' }
        }
      }
    ]);

    // Get daily revenue for trend analysis
    const dailyRevenue = await Purchase.aggregate([
      {
        $match: {
          itemType: { $in: ['service', 'consultation'] },
          status: { $in: ['confirmed', 'completed'] },
          createdAt: { $gte: startDate }
        }
      },
      {
        $lookup: {
          from: 'payments',
          localField: 'paymentId',
          foreignField: '_id',
          as: 'payment'
        }
      },
      {
        $unwind: { path: '$payment', preserveNullAndEmptyArrays: true }
      },
      {
        $match: { 'payment.status': { $in: ['succeeded', 'completed'] } }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          revenue: { $sum: { $divide: ['$revenue', 100] } },
          bookings: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Calculate moving average for forecasting
    const movingAverage = dailyRevenue.length >= 7
      ? dailyRevenue.slice(-7).reduce((sum, day) => sum + day.revenue, 0) / 7
      : current.totalRevenue / (daysAgo / 2);

    // Get peak performance hours
    const peakHours = await Purchase.aggregate([
      {
        $match: {
          itemType: { $in: ['service', 'consultation'] },
          status: { $in: ['confirmed', 'completed'] },
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          bookings: { $sum: 1 },
          revenue: { $sum: { $divide: ['$revenue', 100] } }
        }
      },
      { $sort: { bookings: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      success: true,
      data: {
        currentPeriod: {
          revenue: current.totalRevenue,
          bookings: current.totalBookings,
          customers: current.uniqueCustomers.length,
          avgOrderValue: current.totalBookings > 0 ? current.totalRevenue / current.totalBookings : 0
        },
        previousPeriod: {
          revenue: previous.totalRevenue,
          bookings: previous.totalBookings,
          customers: previous.uniqueCustomers.length
        },
        growth: {
          revenue: revenueGrowth,
          bookings: bookingGrowth,
          customers: customerGrowth
        },
        metrics: {
          conversionRate,
          customerLTV: customerLTV[0]?.avgLTV || 0,
          avgPurchaseFrequency: customerLTV[0]?.avgPurchaseFrequency || 0,
          predictedDailyRevenue: movingAverage
        },
        trends: {
          dailyRevenue,
          peakHours
        }
      }
    });
  } catch (error) {
    console.error('Error fetching advanced service metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch advanced service metrics'
    });
  }
};

// Get cohort analysis for customer retention
const getCohortAnalysis = async (req, res) => {
  try {
    console.log('🔍 Fetching cohort analysis...');

    const { months = 6 } = req.query;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - parseInt(months));

    // Get first purchase date for each customer
    const customerCohorts = await Purchase.aggregate([
      {
        $match: {
          itemType: { $in: ['service', 'consultation'] },
          status: { $in: ['confirmed', 'completed'] },
          createdAt: { $gte: startDate }
        }
      },
      {
        $lookup: {
          from: 'payments',
          localField: 'paymentId',
          foreignField: '_id',
          as: 'payment'
        }
      },
      {
        $unwind: { path: '$payment', preserveNullAndEmptyArrays: true }
      },
      {
        $match: { 'payment.status': { $in: ['succeeded', 'completed'] } }
      },
      {
        $sort: { createdAt: 1 }
      },
      {
        $group: {
          _id: '$userId',
          firstPurchase: { $first: '$createdAt' },
          purchases: {
            $push: {
              date: '$createdAt',
              revenue: { $divide: ['$revenue', 100] }
            }
          },
          totalRevenue: { $sum: { $divide: ['$revenue', 100] } },
          purchaseCount: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$firstPurchase' },
            month: { $month: '$firstPurchase' }
          },
          customers: { $sum: 1 },
          totalRevenue: { $sum: '$totalRevenue' },
          avgPurchases: { $avg: '$purchaseCount' },
          customerDetails: {
            $push: {
              userId: '$_id',
              purchaseCount: '$purchaseCount',
              totalRevenue: '$totalRevenue'
            }
          }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } }
    ]);

    // Calculate retention rates
    const retentionData = await Promise.all(
      customerCohorts.map(async (cohort) => {
        const cohortDate = new Date(cohort._id.year, cohort._id.month - 1, 1);
        const nextMonth = new Date(cohortDate);
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        const returningCustomers = await Purchase.aggregate([
          {
            $match: {
              userId: { $in: cohort.customerDetails.map(c => c.userId) },
              createdAt: { $gte: nextMonth },
              status: { $in: ['confirmed', 'completed'] }
            }
          },
          {
            $group: {
              _id: '$userId'
            }
          }
        ]);

        return {
          cohort: `${cohort._id.year}-${String(cohort._id.month).padStart(2, '0')}`,
          customers: cohort.customers,
          revenue: cohort.totalRevenue,
          avgPurchases: cohort.avgPurchases,
          retentionRate: cohort.customers > 0
            ? (returningCustomers.length / cohort.customers) * 100
            : 0
        };
      })
    );

    res.json({
      success: true,
      data: retentionData
    });
  } catch (error) {
    console.error('Error fetching cohort analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cohort analysis'
    });
  }
};

// Get service performance comparison
const getServicePerformanceComparison = async (req, res) => {
  try {
    console.log('🔍 Fetching service performance comparison...');

    const servicePerformance = await Purchase.aggregate([
      {
        $match: {
          itemType: { $in: ['service', 'consultation'] },
          status: { $in: ['confirmed', 'completed'] }
        }
      },
      {
        $lookup: {
          from: 'services',
          localField: 'itemId',
          foreignField: '_id',
          as: 'service'
        }
      },
      {
        $unwind: { path: '$service', preserveNullAndEmptyArrays: true }
      },
      {
        $lookup: {
          from: 'payments',
          localField: 'paymentId',
          foreignField: '_id',
          as: 'payment'
        }
      },
      {
        $unwind: { path: '$payment', preserveNullAndEmptyArrays: true }
      },
      {
        $match: { 'payment.status': { $in: ['succeeded', 'completed'] } }
      },
      {
        $lookup: {
          from: 'refunds',
          let: { paymentId: '$paymentId' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$paymentId', '$$paymentId'] },
                status: 'succeeded'
              }
            }
          ],
          as: 'refunds'
        }
      },
      {
        $group: {
          _id: '$itemId',
          serviceName: { $first: { $ifNull: ['$service.title', '$serviceName', 'Unknown'] } },
          category: { $first: { $ifNull: ['$service.category', 'general'] } },
          totalBookings: { $sum: 1 },
          totalRevenue: { $sum: { $divide: ['$revenue', 100] } },
          refundCount: { $sum: { $size: '$refunds' } },
          refundAmount: {
            $sum: {
              $reduce: {
                input: '$refunds',
                initialValue: 0,
                in: { $add: ['$$value', { $divide: ['$$this.refundAmount', 100] }] }
              }
            }
          },
          uniqueCustomers: { $addToSet: '$userId' },
          avgRevenue: { $avg: { $divide: ['$revenue', 100] } }
        }
      },
      {
        $project: {
          serviceName: 1,
          category: 1,
          totalBookings: 1,
          totalRevenue: 1,
          netRevenue: { $subtract: ['$totalRevenue', '$refundAmount'] },
          refundRate: {
            $cond: [
              { $gt: ['$totalBookings', 0] },
              { $multiply: [{ $divide: ['$refundCount', '$totalBookings'] }, 100] },
              0
            ]
          },
          customerCount: { $size: '$uniqueCustomers' },
          repeatCustomerRate: {
            $cond: [
              { $gt: ['$totalBookings', 0] },
              { $multiply: [{ $divide: [{ $subtract: ['$totalBookings', { $size: '$uniqueCustomers' }] }, '$totalBookings'] }, 100] },
              0
            ]
          },
          avgRevenue: 1,
          revenuePerCustomer: {
            $cond: [
              { $gt: [{ $size: '$uniqueCustomers' }, 0] },
              { $divide: ['$totalRevenue', { $size: '$uniqueCustomers' }] },
              0
            ]
          }
        }
      },
      { $sort: { netRevenue: -1 } }
    ]);

    res.json({
      success: true,
      data: servicePerformance
    });
  } catch (error) {
    console.error('Error fetching service performance comparison:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch service performance comparison'
    });
  }
};

// Get revenue forecasting
const getRevenueForecast = async (req, res) => {
  try {
    console.log('🔍 Fetching revenue forecast...');

    const { days = 30 } = req.query;
    const historicalDays = parseInt(days) * 2; // Use 2x days for historical data
    const startDate = new Date(Date.now() - historicalDays * 24 * 60 * 60 * 1000);

    // Get historical daily revenue
    const historicalData = await Purchase.aggregate([
      {
        $match: {
          itemType: { $in: ['service', 'consultation'] },
          status: { $in: ['confirmed', 'completed'] },
          createdAt: { $gte: startDate }
        }
      },
      {
        $lookup: {
          from: 'payments',
          localField: 'paymentId',
          foreignField: '_id',
          as: 'payment'
        }
      },
      {
        $unwind: { path: '$payment', preserveNullAndEmptyArrays: true }
      },
      {
        $match: { 'payment.status': { $in: ['succeeded', 'completed'] } }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          revenue: { $sum: { $divide: ['$revenue', 100] } },
          bookings: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Simple moving average forecast
    const revenueValues = historicalData.map(d => d.revenue);
    const avgRevenue = revenueValues.reduce((a, b) => a + b, 0) / revenueValues.length;
    
    // Calculate trend (linear regression slope)
    const n = revenueValues.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    revenueValues.forEach((y, x) => {
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumX2 += x * x;
    });
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Generate forecast
    const forecast = [];
    for (let i = 1; i <= parseInt(days); i++) {
      const predictedRevenue = intercept + slope * (n + i);
      const date = new Date();
      date.setDate(date.getDate() + i);
      forecast.push({
        date: date.toISOString().split('T')[0],
        predictedRevenue: Math.max(0, predictedRevenue),
        confidence: Math.max(0, 100 - (i * 2)) // Confidence decreases over time
      });
    }

    res.json({
      success: true,
      data: {
        historical: historicalData,
        forecast,
        summary: {
          avgDailyRevenue: avgRevenue,
          trend: slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'stable',
          trendRate: slope,
          projectedMonthlyRevenue: (intercept + slope * (n + 30)) * 30
        }
      }
    });
  } catch (error) {
    console.error('Error fetching revenue forecast:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch revenue forecast'
    });
  }
};

module.exports = {
  getServicesAnalytics,
  getCoursesProductsAnalytics,
  getCombinedAnalytics,
  getServiceSalesTable,
  getAdvancedServiceMetrics,
  getCohortAnalysis,
  getServicePerformanceComparison,
  getRevenueForecast
};
