// backend/src/routes/dashboardRoutes.js

const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticate } = require('../middlewares/auth');

// All routes require authentication
router.use(authenticate);

// Get dashboard statistics
router.get('/stats', dashboardController.getDashboardStats);

// Get recent inspections
router.get('/recent-inspections', dashboardController.getRecentInspections);

// Get upcoming tasks
router.get('/upcoming-tasks', dashboardController.getUpcomingTasks);

router.get('/reviewed-reports', dashboardController.getReviewedReports);
router.get('/pending-reports', dashboardController.getPendingReports);

module.exports = router;