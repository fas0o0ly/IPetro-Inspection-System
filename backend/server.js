// require('dotenv').config();
// const express = require('express');
// const bodyParser = require('body-parser');

// const authRoutes = require('./src/routes/authRoutes');
// const inspections = require('./src/routes/inspectionRoutes');
// const photos = require('./src/routes/photoRoutes');
// const usersRouter = require('./src/routes/userRoutes');

// const app = express();
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));

// // Routes
// app.use('/auth', authRoutes);
// app.use('/inspections', inspections);
// app.use('/photos', photos);
// app.use('/users', usersRouter);

// // Health
// app.get('/health', (req, res) => res.json({ok: true, time: new Date()}));

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//   console.log(`iPetro backend running on http://localhost:${PORT}`);
// });


// server.js
require('dotenv').config();
const app = require('./src/app');
const { pool } = require('./src/config/db');

const PORT = process.env.PORT || 3000;

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err.message);
    console.error('Check your DATABASE_URL in .env file');
    process.exit(1);
  }
  console.log('Database connected successfully');
  console.log('Current database time:', res.rows[0].now);
});

// Start server
const server = app.listen(PORT, () => {
  console.log('====================================');
  console.log(`Server running on port ${PORT}`);
  console.log(`URL: http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('====================================');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    pool.end(() => {
      console.log('Database pool closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('\n SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    pool.end(() => {
      console.log('Database pool closed');
      process.exit(0);
    });
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error(' Uncaught Exception:', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(' Unhandled Rejection:', err);
  process.exit(1);
});