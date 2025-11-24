/**
 * Marketplace Platform - Main Server File
 * Professional server setup with error handling and graceful shutdown
 */

require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./config/database');

const PORT = process.env.PORT || 3000;

/**
 * Test database connection
 */
async function testDatabaseConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');
    
    // Sync database in development (remove force: true in production)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ force: false });
      console.log('✅ Database synced successfully');
    }
  } catch (error) {
    console.error('❌ Unable to connect to database:', error.message);
    process.exit(1);
  }
}

/**
 * Setup graceful shutdown handlers
 */
function setupGracefulShutdown(server) {
  const shutdown = async (signal) => {
    console.log(`\n📦 Received ${signal}, starting graceful shutdown...`);
    
    try {
      // Close server first
      server.close(() => {
        console.log('✅ HTTP server closed');
      });
      
      // Close database connection
      await sequelize.close();
      console.log('✅ Database connection closed');
      
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  };

  // Handle different shutdown signals
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception:', error);
    shutdown('UNCAUGHT_EXCEPTION');
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    shutdown('UNHANDLED_REJECTION');
  });
}

/**
 * Start the server
 */
async function startServer() {
  try {
    console.log('🚀 Starting Marketplace Platform Server...');
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    
    // Test database connection
    await testDatabaseConnection();
    
    // Start HTTP server
    const server = app.listen(PORT, () => {
      console.log(`🎯 Server running on port ${PORT}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`🏠 API Info: http://localhost:${PORT}/`);
      console.log('⏰', new Date().toISOString());
    });
    
    // Setup graceful shutdown
    setupGracefulShutdown(server);
    
    return server;
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the application
if (require.main === module) {
  startServer();
}

module.exports = startServer;