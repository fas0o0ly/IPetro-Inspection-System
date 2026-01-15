// src/routes/vesselRoutes.js
const express = require('express');
const router = express.Router();
const vesselController = require('../controllers/vesselController');
const { authenticate, requireAdmin, requireInspectorOrReviewer } = require('../middlewares/auth');

// All routes require authentication
router.use(authenticate);

// Public routes (all authenticated users)
router.get('/', vesselController.getAllVessels);
router.get('/types', vesselController.getVesselTypes);
router.get('/stats', vesselController.getVesselStats);
router.get('/tag/:tag_no', vesselController.getVesselByTag);
router.get('/:id', vesselController.getVesselById);

// Admin only routes
router.post('/', requireAdmin, vesselController.createVessel);
router.put('/:id', requireAdmin, vesselController.updateVessel);
router.delete('/:id', requireAdmin, vesselController.deleteVessel);

module.exports = router;