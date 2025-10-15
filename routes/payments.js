const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Payment = require('../models/Payment');
const Service = require('../models/Service');
const { createCheckoutSession, createRefund } = require('../services/stripeService');
const { verifyToken } = require('../middleware/auth');

// Debug logging helper
const debugLog = (message, data = {}) => {
  const timestamp = new Date().toISOString();
  console.log(`\n══════════════ PAYMENT DEBUG [${timestamp}]══════════════`);
  console.log(`MESSAGE: ${message}`);
  if (Object.keys(data).length > 0) {
    console.log('DATA:', JSON.stringify(data, null, 2));
  }
  console.log('═══════════════════════════════════════════════════════════════\n');
};

// Get user's payment history (bookings)
router.get('/my-payments', verifyToken, async (req, res) => {
  debugLog('GET /my-payments - Fetching user payment history', {
    userId: req.user._id,
    timestamp: new Date().toISOString(),
  });

  try {
    const Refund = require('../models/Refund');
    
    console.log('Looking for payments for user:', req.user._id);
    console.log('User object:', { id: req.user._id, email: req.user.email });
    
    // First check how many total payments exist
    const totalPayments = await Payment.countDocuments();
    console.log('Total payments in database:', totalPayments);
    
    // Try to find payments for this user
    const payments = await Payment.find({ 
      userId: req.user._id,
      status: { $in: ['succeeded', 'processing', 'refunded'] }
    })
      .sort({ createdAt: -1 })
      .populate('userId', 'firstName lastName email');
    
    console.log('Found payments for user:', payments.length);
    
    // If no payments found, let's check if there are ANY payments for debugging
    if (payments.length === 0) {
      const anyPayments = await Payment.find({}).limit(5);
      console.log('Sample payments in DB:', anyPayments.map(p => ({
        id: p._id,
        userId: p.userId,
        status: p.status,
        amount: p.amount
      })));
    }

    // For each payment, check if there's a refund request
    const paymentsWithRefundStatus = await Promise.all(
      payments.map(async (payment) => {
        const refund = await Refund.findOne({ 
          paymentId: payment._id 
        }).sort({ createdAt: -1 });

        return {
          ...payment.toObject(),
          refundStatus: refund ? refund.status : null,
          refundId: refund ? refund._id : null,
          hasRefundRequest: !!refund
        };
      })
    );

    debugLog('GET /my-payments - Payment history retrieved successfully', {
      totalPayments: paymentsWithRefundStatus.length,
      paymentStatuses: paymentsWithRefundStatus.map(p => ({ 
        id: p._id, 
        status: p.status, 
        amount: p.amount,
        hasRefund: p.hasRefundRequest,
        refundStatus: p.refundStatus
      })),
    });

    res.json({
      success: true,
      data: paymentsWithRefundStatus,
    });
  } catch (error) {
    debugLog('GET /my-payments - ERROR fetching payment history', {
      error: error.message,
      stack: error.stack,
      userId: req.user._id,
    });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment history',
      error: error.message,
    });
  }
});

// Get payment by ID
router.get('/:paymentId', verifyToken, async (req, res) => {
  debugLog('GET /:paymentId - Fetching specific payment', {
    paymentId: req.params.paymentId,
    userId: req.user._id,
    requestHeaders: req.headers,
  });

  try {
    const payment = await Payment.findOne({
      $or: [
        { stripePaymentIntentId: req.params.paymentId },
        { stripeCheckoutSessionId: req.params.paymentId }
      ],
      userId: req.user._id,
    });

    debugLog('GET /:paymentId - Database query result', {
      paymentFound: !!payment,
      paymentStatus: payment?.status,
      paymentAmount: payment?.amount,
      serviceDetails: payment?.serviceDetails,
    });

    if (!payment) {
      debugLog('GET /:paymentId - Payment not found', {
        searchedPaymentIntentId: req.params.paymentId,
        searchedUserId: req.user._id,
        foundPaymentsCount: await Payment.countDocuments({ userId: req.user._id }),
      });
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    debugLog('GET /:paymentId - Payment details retrieved successfully', {
      paymentId: payment._id,
      stripePaymentIntentId: payment.stripePaymentIntentId,
      status: payment.status,
      amount: payment.amount,
    });

    res.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    debugLog('GET /:paymentId - ERROR fetching payment', {
      error: error.message,
      stack: error.stack,
      paymentId: req.params.paymentId,
      userId: req.user._id,
    });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment details',
      error: error.message,
    });
  }
});

// Create checkout session for service purchase
router.post('/create-checkout-session', verifyToken, async (req, res) => {
  console.log('\n=== CREATE CHECKOUT SESSION - FULL DEBUG ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Request Body:', JSON.stringify(req.body, null, 2));
  console.log('User ID:', req.user?._id || 'NOT SET');
  console.log('User Email:', req.user?.email || 'NOT SET');
  console.log('User Name:', req.user ? `${req.user.firstName} ${req.user.lastName}` : 'NOT SET');
  console.log('Headers:', {
    authorization: req.headers.authorization ? 'Bearer ***PRESENT***' : 'MISSING',
    contentType: req.headers['content-type'],
    userAgent: req.headers['user-agent']?.substring(0, 100),
  });

  try {
    const { serviceId, successUrl, cancelUrl } = req.body;

    console.log('Step 1: Validating required fields');
    console.log('- Service ID:', serviceId, '(type:', typeof serviceId, ')');
    console.log('- Success URL:', successUrl);
    console.log('- Cancel URL:', cancelUrl);

    // Validate required fields
    if (!serviceId || !successUrl || !cancelUrl) {
      console.log('ERROR: Missing required fields');
      console.log('- hasServiceId:', !!serviceId);
      console.log('- hasSuccessUrl:', !!successUrl);
      console.log('- hasCancelUrl:', !!cancelUrl);
      return res.status(400).json({
        success: false,
        message: 'Service ID, success URL, and cancel URL are required',
        debug: { serviceId, successUrl, cancelUrl }
      });
    }

    console.log('Step 2: Looking up service in database');
    console.log('- Searching for serviceId:', serviceId);

    // Get service details
    const service = await Service.findOne({ serviceId });
    console.log('Database query result:');
    console.log('- Service found:', !!service);

    if (service) {
      console.log('- Service details:', {
        serviceId: service.serviceId,
        title: service.title,
        price: service.price,
        category: service.category,
        consultant: service.consultant,
        duration: service.duration,
      });
    } else {
      console.log('ERROR: Service not found');
      const allServices = await Service.find({}, 'serviceId title price');
      console.log('- Total services in DB:', await Service.countDocuments());
      console.log('- Available services:', JSON.stringify(allServices, null, 2));
      return res.status(404).json({
        success: false,
        message: 'Service not found',
        debug: { searchedServiceId: serviceId, totalServices: await Service.countDocuments() }
      });
    }

    console.log('Step 3: Processing service price');
    console.log('- Raw price from DB:', service.price);
    console.log('- Price type:', typeof service.price);

    // Convert price to cents (assuming format like "$999")
    const rawPrice = service.price.replace(/[$,]/g, '');
    console.log('- Price after cleaning:', rawPrice);
    console.log('- Parse result:', parseFloat(rawPrice));

    const priceInDollars = parseFloat(rawPrice);
    console.log('- Final price in dollars:', priceInDollars);
    console.log('- Is valid number:', !isNaN(priceInDollars));

    if (isNaN(priceInDollars)) {
      console.log('ERROR: Invalid price format detected');
      return res.status(400).json({
        success: false,
        message: 'Invalid service price format',
        debug: {
          originalPrice: service.price,
          cleanedPrice: rawPrice,
          parseResult: parseFloat(rawPrice)
        }
      });
    }

    const amountInCents = Math.round(priceInDollars * 100);
    console.log('- Amount in cents:', amountInCents);
    console.log('- Conversion calculation:', `${priceInDollars} * 100 = ${amountInCents}`);

    console.log('Step 4: Preparing checkout session data');
    const sessionData = {
      amount: amountInCents,
      currency: 'usd',
      serviceDetails: {
        serviceId: service.serviceId,
        title: service.title,
        category: service.category,
        consultant: service.consultant,
        duration: service.duration,
        price: service.price,
      },
      customerEmail: req.user.email,
      customerName: `${req.user.firstName} ${req.user.lastName}`,
      successUrl,
      cancelUrl,
      metadata: {
        userId: req.user._id.toString(), // Convert ObjectId to string for Stripe metadata
        serviceId: service.serviceId,
      },
    };
    console.log('- Session data:', JSON.stringify(sessionData, null, 2));

    console.log('Step 5: Creating Stripe checkout session...');
    const session = await createCheckoutSession(sessionData);
    console.log('Stripe session created successfully!');
    console.log('- Session ID:', session.id);
    console.log('- Session URL:', session.url);
    console.log('- Payment Intent ID:', session.payment_intent);

    // Create payment record in database
    console.log('Step 6: Creating payment record in database');
    const paymentData = {
      userId: req.user._id, // Fixed: use req.user._id instead of req.user.userId
      serviceId: service.serviceId,
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId: session.payment_intent, // Payment intent ID if available
      amount: amountInCents,
      currency: 'usd',
      paymentMethod: 'card',
      serviceDetails: sessionData.serviceDetails,
      customerEmail: req.user.email,
      customerName: sessionData.customerName,
      metadata: sessionData.metadata,
    };
    console.log('- Payment data to save:', JSON.stringify(paymentData, null, 2));

    console.log('Saving payment to MongoDB...');
    const payment = new Payment(paymentData);
    const savedPayment = await payment.save();
    console.log('Payment record saved successfully!');
    console.log('- Payment ID:', savedPayment._id);
    console.log('- Payment Status:', savedPayment.status);
    console.log('- Amount:', savedPayment.amount);

    console.log('Step 7: Preparing success response');
    const responseData = {
      success: true,
      data: {
        sessionId: session.id,
        url: session.url,
      },
    };
    console.log('- Response data:', JSON.stringify(responseData, null, 2));

    console.log('=== PAYMENT CREATION COMPLETED SUCCESSFULLY ===\n');
    res.json(responseData);
  } catch (error) {
    debugLog('POST /create-checkout-session - ERROR creating checkout session', {
      error: error.message,
      stack: error.stack,
      errorName: error.name,
      errorCode: error.code,
      requestBody: req.body,
      userId: req.user._id,
      userDetails: {
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
      },
      // Check if it's a Stripe error
      stripeError: error.type ? {
        type: error.type,
        code: error.code,
        param: error.param,
        message: error.message,
        detail: error.detail,
      } : null,
    });

    console.log('\n=== ERROR OCCURRED ===');
    console.log('Error Name:', error.name);
    console.log('Error Message:', error.message);
    console.log('Error Stack:', error.stack);
    console.log('Error Code:', error.code);
    console.log('Error Type:', error.type);

    // Check if it's a MongoDB connection error
    if (error.name === 'MongoError' || error.name === 'MongoNetworkError') {
      console.log('MONGO DB ERROR DETECTED');
      console.log('- MongoDB URI:', process.env.MONGODB_URI ? 'Set' : 'NOT SET');
    }

    // Check if it's a Stripe error
    if (error.type || error.code) {
      console.log('STRIPE ERROR DETECTED');
      console.log('- Error Type:', error.type);
      console.log('- Error Code:', error.code);
      console.log('- Error Param:', error.param);
    }

    console.log('=== END ERROR DEBUG ===\n');

    res.status(500).json({
      success: false,
      message: 'Unable to process payment. Please check connection and try again.',
      error: error.message,
      debug: {
        errorName: error.name,
        isMongoError: error.name === 'MongoError' || error.name === 'MongoNetworkError',
        isStripeError: !!(error.type || error.code),
        stripeErrorType: error.type,
        stripeErrorCode: error.code,
      }
    });
  }
});

module.exports = router;
