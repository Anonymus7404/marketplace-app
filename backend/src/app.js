/**
 * Marketplace API - Express Configuration
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/auth');

const app = express();

/* -----------------------------
   CORE MIDDLEWARE (must be first)
--------------------------------*/
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* -----------------------------
   SECURITY
--------------------------------*/
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
    credentials: true,
  })
);

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
      success: false,
      error: 'Too many requests, try again later',
      timestamp: new Date().toISOString(),
    },
  })
);

/* -----------------------------
   PERFORMANCE & LOGGING
--------------------------------*/
app.use(morgan('combined'));
app.use(compression());

/* -----------------------------
   HEALTH CHECK
--------------------------------*/
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Marketplace API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

/* -----------------------------
   ROOT
--------------------------------*/

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Marketplace Platform API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

/* -----------------------------
   ROUTES
--------------------------------*/
app.use('/api/v1/auth', authRoutes);
const providerRoutes = require('./routes/provider');
const categoryRoutes = require('./routes/category');
const listingRoutes = require('./routes/listing');
const searchRoutes = require('./routes/search');
const bookingRoutes = require('./routes/booking');
const paymentRoutes = require('./routes/payment');

app.use('/api/v1/providers', providerRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/listings', listingRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/payments', paymentRoutes);

/* -----------------------------
   404 HANDLER
--------------------------------*/
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
  });
});

/* -----------------------------
   GLOBAL ERROR HANDLER
--------------------------------*/
app.use((error, req, res, next) => {
  console.error('💥 Global Error:', error);

  res.status(error.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV !== 'production' && {
      stack: error.stack,
      details: error,
    }),
  });
});

module.exports = app;
