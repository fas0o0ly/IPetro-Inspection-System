// src/routes/reportRoutes.js
const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { 
  authenticate, 
  requireAdmin,
  requireInspectorOrReviewer 
} = require('../middlewares/auth');

// All routes require authentication
router.use(authenticate);

// Get all reports (role-based)
router.get('/', reportController.getAllReports);

// Generate report (inspector, reviewer, or admin)
router.post('/generate/:inspection_id', reportController.generateReport);

// Get report info
router.get('/inspection/:inspection_id', reportController.getReportInfo);

// Download report
router.get('/download/:inspection_id', reportController.downloadReport);

// Update report status (admin or reviewer only)
router.put('/:inspection_id/status', reportController.updateReportStatus);

// Delete report (admin only)
router.delete('/:inspection_id', requireAdmin, reportController.deleteReport);

module.exports = router;