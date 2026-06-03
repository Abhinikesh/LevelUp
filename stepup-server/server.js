const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// ─── Route Imports ────────────────────────────────────────────────────────────
const authRoutes = require('./routes/auth');

// ─── App Init ─────────────────────────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 5000;

// ─── Security Middleware ───────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, mobile apps, Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy: origin "${origin}" not allowed.`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Rate Limiting ─────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please try again in 15 minutes.',
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many auth attempts. Please try again in 15 minutes.',
  },
});

app.use(globalLimiter);

// ─── Body Parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Logging ───────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// ─── Static Files (uploaded proof images etc.) ────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'STEPUP API is running 🚀',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// ─── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found.`,
  });
});

// ─── Global Error Handler ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[Global Error Handler]', err);

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid ${err.path}: ${err.value}`,
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: messages[0],
    });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      success: false,
      message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`,
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token.',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired. Please log in again.',
    });
  }

  // CORS errors
  if (err.message && err.message.startsWith('CORS policy')) {
    return res.status(403).json({
      success: false,
      message: err.message,
    });
  }

  // Default
  const statusCode = err.statusCode || err.status || 500;
  return res.status(statusCode).json({
    success: false,
    message: err.message || 'An unexpected error occurred. Please try again.',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ─── MongoDB Connection ────────────────────────────────────────────────────────
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

// ─── Graceful Shutdown ─────────────────────────────────────────────────────────
const gracefulShutdown = async (signal) => {
  console.log(`\n⚠️  ${signal} received. Shutting down gracefully...`);
  await mongoose.connection.close();
  console.log('🔌 MongoDB connection closed.');
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT',  () => gracefulShutdown('SIGINT'));

// Catch unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('🔥 Unhandled Promise Rejection:', promise, 'Reason:', reason);
});

// ─── Start Server ──────────────────────────────────────────────────────────────
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🚀 STEPUP API running at http://localhost:${PORT}`);
    console.log(`📡 Environment : ${process.env.NODE_ENV || 'development'}`);
    console.log(`🏥 Health check: http://localhost:${PORT}/api/health\n`);
  });
});

module.exports = app;
