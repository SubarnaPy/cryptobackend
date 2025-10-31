const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/auth');
const {
  getServicesAnalytics,
  getCoursesProductsAnalytics,
  getCombinedAnalytics,
  getServiceSalesTable,
  getAdvancedServiceMetrics,
  getCohortAnalysis,
  getServicePerformanceComparison,
  getRevenueForecast
} = require('../controllers/admin/analyticsController');

// Get service sales analytics
router.get('/services', requireAdmin, getServicesAnalytics);

// Get courses and products sales analytics
router.get('/courses-products', requireAdmin, getCoursesProductsAnalytics);

// Get combined analytics for services and courses/products
router.get('/combined', requireAdmin, getCombinedAnalytics);

// Get detailed service sales table data
router.get('/services/table', requireAdmin, getServiceSalesTable);

// Advanced analytics endpoints
router.get('/advanced/metrics', requireAdmin, getAdvancedServiceMetrics);
router.get('/advanced/cohorts', requireAdmin, getCohortAnalysis);
router.get('/advanced/performance', requireAdmin, getServicePerformanceComparison);
router.get('/advanced/forecast', requireAdmin, getRevenueForecast);

module.exports = router;
