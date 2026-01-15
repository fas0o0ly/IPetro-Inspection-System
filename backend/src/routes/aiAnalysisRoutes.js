// backend/src/routes/aiAnalysisRoutes.js

const express = require('express');
const router = express.Router();
const aiAnalysisController = require('../controllers/aiAnalysisController');
const { authenticate } = require('../middlewares/auth');

// All routes require authentication
router.use(authenticate);

// Analyze report
router.post('/analyze-report/:inspection_id', aiAnalysisController.analyzeReport);

// Get latest analysis
router.get('/analysis/:inspection_id', aiAnalysisController.getAnalysis);

// Get analysis history
router.get('/analysis-history/:inspection_id', aiAnalysisController.getAnalysisHistory);

module.exports = router;