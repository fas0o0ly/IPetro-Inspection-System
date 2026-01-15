// src/routes/inspectionRoutes.js
const express = require('express');
const router = express.Router();
const inspectionController = require('../controllers/inspectionController');
const { 
  authenticate, 
  requireAdmin, 
  requireInspector,
  requireReviewer,
  requireInspectorOrReviewer 
} = require('../middlewares/auth');

// All routes require authentication
router.use(authenticate);

// Public routes (all authenticated users can view)
router.get('/', inspectionController.getAllInspections);
router.get('/stats', inspectionController.getInspectionStats);
router.get('/types', inspectionController.getInspectionTypes);
router.get('/overdue', inspectionController.getOverdueInspections);
router.get('/my', inspectionController.getMyInspections);
router.get('/:id', inspectionController.getInspectionById);
router.get('/:id/history', inspectionController.getInspectionHistory);

// Inspector routes (create and update their own inspections)
router.post('/', requireInspector, inspectionController.createInspection);
router.put('/:id', inspectionController.updateInspection); // Auth checked in controller
router.put('/:id/submit', inspectionController.submitInspection); // Auth checked in controller

// Reviewer routes (approve/reject inspections)
router.put('/:id/approve', requireReviewer, inspectionController.approveInspection);
router.put('/:id/reject', requireReviewer, inspectionController.rejectInspection);

// Delete (inspector can delete draft, admin can archive)
router.delete('/:id', inspectionController.deleteInspection); // Auth checked in controller

module.exports = router;