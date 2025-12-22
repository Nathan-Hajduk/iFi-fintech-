/**
 * iFi Backend Server
 * Main Express application with Plaid integration
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const compression = require('compression');
const morgan = require('morgan');

// Import middleware
const {
  apiLimiter,
  plaidLimiter,
  configureHelmet,
  getCorsOptions,
  requestLogger,
  errorHandler,
  notFoundHandler,
  healthCheck,
  validateEnv,
} = require('./middleware/security');

// Import routes
const plaidRoutes = require('./routes/plaidRoutes');
const authRoutes = require('./routes/auth');
const ifiAIRoutes = require('./routes/ifi-ai');

// Import database
const db = require('./config/database');

// Validate environment variables
validateEnv();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// ==========================
// Middleware Configuration
// ==========================

// Security headers
app.use(configureHelmet());

// CORS configuration
app.use(cors(getCorsOptions()));

// Body parsing
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Logging (Morgan for HTTP requests)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Custom request logger
app.use(requestLogger);

// ==========================
// Health Check
// ==========================

app.get('/health', healthCheck);
app.get('/api/health', healthCheck);

// ==========================
// API Routes
// ==========================

// Apply rate limiting to all API routes
app.use('/api', apiLimiter);

// Authentication routes (public)
app.use('/api/auth', authRoutes);

// iFi AI routes (requires authentication + premium)
app.use('/api/ifi-ai', ifiAIRoutes);

// Plaid routes with specific rate limiting
app.use('/api/plaid', plaidLimiter, plaidRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'iFi Backend API',
    version: process.env.API_VERSION || 'v1',
    environment: process.env.NODE_ENV || 'development',
    status: 'running',
    enifiAI: '/api/ifi-ai',
      dpoints: {
      health: '/health',
      auth: '/api/auth',
      plaid: '/api/plaid',
    },
    documentation: 'See PLAID_INTEGRATION_GUIDE.md',
  });
});

// ==========================
// Error Handling
// ==========================

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// ==========================
// Database & Server Startup
// ==========================

/**
 * Initialize database and start server
 */
async function startServer() {
  try {
    console.log('\n🚀 Starting iFi Backend Server...\n');
    
    // Test database connection
    console.log('📦 Connecting to database...');
    const dbConnected = await db.testConnection();
    
    if (!dbConnected) {
      throw new Error('Database connection failed');
    }
    
    // Initialize database tables
    console.log('📊 Initializing database tables...');
    await db.initializeTables();
    
    // Start Express server
    const server = app.listen(PORT, () => {
      console.log(`\n✅ Server running successfully!\n`);
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   Port: ${PORT}`);
      console.log(`   API URL: http://localhost:${PORT}/api`);
      console.log(`   Health Check: http://localhost:${PORT}/health`);
      console.log(`   Plaid Environment: ${process.env.PLAID_ENV}`);
      console.log(`\n   Authentication:`);
      console.log(`   POST   /api/auth/register`);
      console.log(`   POST   /api/auth/login`);
      console.log(`   POST   /api/auth/refresh`);
      console.log(`   POST   /api/auth/logout`);
      console.log(`   GET    /api/auth/me`);
      console.log(`\n   Plaid Integration:`);
      console.log(`\n📚 API Endpoints:`);
      console.log(`   POST   /api/plaid/create_link_token`);
      console.log(`   POST   /api/plaid/exchange_public_token`);
      console.log(`   GET    /api/plaid/connections/:userId`);
      console.log(`   POST   /api/plaid/sync/:itemId`);
      console.log(`   POST   /api/plaid/webhook`);
      console.log(`   DELETE /api/plaid/connection/:itemId`);
      console.log(`\n🔒 Security: Rate limiting enabled`);
      console.log(`   API: ${process.env.RATE_LIMIT_MAX_REQUESTS || 100} requests per 15 minutes`);
      console.log(`   Plaid: 50 requests per 15 minutes`);
      console.log(`\n👀 Ready for connections!\n`);
    });
    
    // Graceful shutdown
    process.on('SIGTERM', () => gracefulShutdown(server));
    process.on('SIGINT', () => gracefulShutdown(server));
    
  } catch (error) {
    console.error('\n❌ Failed to start server:', error.message);
    console.error('\nPlease check:');
    console.error('  1. PostgreSQL is running');
    console.error('  2. .env file is configured correctly');
    console.error('  3. Database credentials are correct');
    console.error('  4. All required packages are installed (npm install)');
    process.exit(1);
  }
}

/**
 * Graceful shutdown handler
 */
async function gracefulShutdown(server) {
  console.log('\n🛑 Shutting down gracefully...');
  
  // Stop accepting new connections
  server.close(async () => {
    console.log('📪 HTTP server closed');
    
    // Close database connections
    try {
      await db.close();
      console.log('🔌 Database connections closed');
    } catch (error) {
      console.error('Error closing database:', error.message);
    }
    
    console.log('✅ Shutdown complete\n');
    process.exit(0);
  });
  
  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('⚠️  Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

// Start the server
startServer();

// Export for testing
module.exports = app;
