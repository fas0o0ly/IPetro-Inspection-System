// src/routes/observationRoutes.js
const express = require('express');
const router = express.Router();
const observationController = require('../controllers/observationController');
const { 
  authenticate, 
  requireAdmin, 
  requireInspector,
  requireReviewer 
} = require('../middlewares/auth');

// All routes require authentication
router.use(authenticate);

// =============================================
// SPECIFIC ROUTES FIRST (before /:id)
// =============================================

// Get observation types
router.get('/types', observationController.getObservationTypes);

// Get observation statistics
router.get('/stats', observationController.getObservationStats);

// Get action items
router.get('/action-items', observationController.getActionItems);

// Get observations by inspection
router.get('/inspection/:inspection_id', observationController.getObservationsByInspection);

// Get vessel observation history
router.get('/vessel/:vessel_id/history', observationController.getVesselObservationHistory);

// =============================================
// PARAMETERIZED ROUTES (/:id)
// =============================================

// Get observation by ID
router.get('/:id', observationController.getObservationById);

// Update observation
router.put('/:id', observationController.updateObservation);

// Delete observation
router.delete('/:id', observationController.deleteObservation);

// =============================================
// GENERAL ROUTES
// =============================================

// Get all observations
router.get('/', observationController.getAllObservations);

// Create observation (inspector only)
router.post('/', requireInspector, observationController.createObservation);

module.exports = router;