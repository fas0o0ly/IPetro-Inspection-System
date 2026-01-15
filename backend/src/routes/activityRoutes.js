// src/routes/activityRoutes.js
const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const { authenticate, requireAdmin } = require('../middlewares/auth');

router.use(authenticate);

router.get('/', requireAdmin, activityController.getSystemActivities);
router.get('/me', activityController.getMyActivities);
router.get('/user/:id', requireAdmin, activityController.getUserActivities);

module.exports = router;