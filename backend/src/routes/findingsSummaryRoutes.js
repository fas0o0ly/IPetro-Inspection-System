const express = require('express');
const router = express.Router();
const findingsSummaryController = require('../controllers/findingsSummaryController');
const { authenticate } = require('../middlewares/auth');

// All routes require authentication
router.use(authenticate);

// Get findings summary for inspection
router.get('/inspection/:inspectionId', findingsSummaryController.getFindingsSummary);

// Create or update findings summary
router.post('/inspection/:inspectionId', findingsSummaryController.upsertFindingsSummary);

// Get default NDT text based on vessel
router.get('/default-ndt/:vesselId', findingsSummaryController.getDefaultNDT);

// Delete findings summary
router.delete('/inspection/:inspectionId', findingsSummaryController.deleteFindingsSummary);

module.exports = router;