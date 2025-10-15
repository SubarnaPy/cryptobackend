const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3001', 
    'http://localhost:3000', 
    'http://localhost:5173', 
    'http://localhost:8081', 
    'http://localhost:8080',
    'https://thunderous-daifuku-d8654f.netlify.app',
    'https://gleaming-raindrop-809582.netlify.app',
    'https://kyptronix-canadian-nexus.netlify.app',
    'https://kyptronix-canada-nexus.netlify.app',
    'https://kyptronix-canada-nexus.netlify.app',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// CRITICAL: Webhook routes MUST use raw body for Stripe signature verification
// These routes must be defined BEFORE express.json()
app.use('/api/webhooks', express.raw({ type: 'application/json' }));
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));

// Parse JSON for all other routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger middleware - logs all incoming requests
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log('\n=====================================');
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  if (req.body && Object.keys(req.body).length > 0) {
    // Don't log passwords in plain text
    const sanitizedBody = { ...req.body };
    if (sanitizedBody.password) {
      sanitizedBody.password = '***HIDDEN***';
    }
    if (sanitizedBody.confirmPassword) {
      sanitizedBody.confirmPassword = '***HIDDEN***';
    }
    console.log('Body:', JSON.stringify(sanitizedBody, null, 2));
  }
  console.log('Query:', JSON.stringify(req.query, null, 2));
  console.log('=====================================\n');
  next();
});

// Check environment configuration
console.log('\n=== SERVER CONFIGURATION CHECK ===');
console.log('Environment Variables:');
console.log('  MONGODB_URI:', process.env.MONGODB_URI ? (process.env.MONGODB_URI.substring(0, 20) + '...') : 'NOT SET');
console.log('  STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? 'Set' : 'NOT SET');
console.log('  STRIPE_WEBHOOK_ENDPOINT_SECRET:', process.env.STRIPE_WEBHOOK_ENDPOINT_SECRET ? 'Set' : 'NOT SET');
console.log('  PORT:', process.env.PORT || 5000);
console.log('=== END CONFIGURATION CHECK ===\n');

// MongoDB Connection
console.log('Connecting to MongoDB...');
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://mondalsubarna29:Su12345@cluster0.1kmazke.mongodb.net/canada_admin', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ MongoDB connected successfully');
  console.log('  Connection string:', process.env.MONGODB_URI || 'mongodb://localhost:27017/canadian-nexus');
})
.catch((err) => {
  console.error('❌ MongoDB connection error:', err.message);
  console.error('  Connection string attempted:', process.env.MONGODB_URI || 'mongodb://localhost:27017/canadian-nexus');
  process.exit(1);
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/services', require('./routes/services'));
app.use('/api/admin/services', require('./routes/adminServices'));
app.use('/api/admin/payments', require('./routes/adminPayments'));
app.use('/api/admin/refunds', require('./routes/adminRefunds'));
app.use('/api/admin/users', require('./routes/adminUsers'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/refunds', require('./routes/refunds'));
app.use('/api/consultations', require('./routes/consultations'));

// Stripe webhook routes - support both URL formats for compatibility
const stripeWebhookHandler = require('./routes/webhooks/stripe');
app.use('/api/webhooks/stripe', stripeWebhookHandler);
app.use('/api/stripe/webhook', stripeWebhookHandler); // Alias for Stripe CLI default

// Health check with database connectivity
app.get('/api/health', async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState;
    const dbStateMap = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };

    const diagnostics = {
      status: dbStatus === 1 ? 'ok' : 'error',
      message: 'Server diagnostics',
      database: {
        status: dbStateMap[dbStatus],
        name: mongoose.connection.db?.databaseName || 'unknown',
      },
      environment: {
        mongodbUri: process.env.MONGODB_URI ? 'Set' : 'NOT SET',
        stripeSecret: process.env.STRIPE_SECRET_KEY ? 'Set' : 'NOT SET',
        stripeWebhook: process.env.STRIPE_WEBHOOK_ENDPOINT_SECRET ? 'Set' : 'NOT SET',
      }
    };

    // Check if there's at least one service
    if (dbStatus === 1) {
      const Service = require('./models/Service');
      const serviceCount = await Service.countDocuments();
      diagnostics.database.servicesCount = serviceCount;

      const sampleServices = await Service.find({}, 'serviceId title price').limit(3);
      diagnostics.database.sampleServices = sampleServices.map(s => ({
        id: s.serviceId,
        title: s.title,
        price: s.price,
      }));

      console.log('🔍 Health check diagnostics:', JSON.stringify(diagnostics, null, 2));
    }

    res.json(diagnostics);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      error: error.message,
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
