// src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

// Import routes
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const userRoutes = require('./routes/userRoutes');
const vesselRoutes = require('./routes/vesselRoutes');
const inspectionRoutes = require('./routes/inspectionRoutes');
const photoRoutes = require('./routes/photoRoutes');
const findingsSummaryRoutes = require('./routes/findingsSummaryRoutes');
const observationRoutes = require('./routes/observationRoutes'); 
const reportRoutes = require('./routes/reportRoutes');
const findingTemplateRoutes = require('./routes/findingTemplateRoutes');
const recommendationTemplateRoutes = require('./routes/recommendationTemplateRoutes');
const activityRoutes = require('./routes/activityRoutes');
const aiAnalysisRoutes = require('./routes/aiAnalysisRoutes');

// Import middleware
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'], // Add your frontend ports
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Static files (for uploaded photos/reports)
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  setHeaders: (res, filePath) => {
    // Allow CORS for images
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));
// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/vessels', vesselRoutes);
app.use('/api/inspections', inspectionRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/findings-summary', findingsSummaryRoutes);
app.use('/api/observations', observationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/finding-templates', findingTemplateRoutes);
app.use('/api/recommendation-templates', recommendationTemplateRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/ai', aiAnalysisRoutes);

// 404 handler - Must be after all routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Global error handler - Must be last
app.use(errorHandler);

module.exports = app;