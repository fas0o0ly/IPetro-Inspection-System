// backend/src/routes/recommendationTemplateRoutes.js

const express = require('express');
const router = express.Router();
const recommendationTemplateController = require('../controllers/recommendationTemplateController');
const { authenticate } = require('../middlewares/auth');

// All routes require authentication
router.use(authenticate);

// Get all recommendation templates
router.get('/', recommendationTemplateController.getAllRecommendationTemplates);

// Get recommendation templates by action required
router.get('/action/:actionRequired', recommendationTemplateController.getRecommendationTemplatesByAction);

// Create custom recommendation template
router.post('/', recommendationTemplateController.createRecommendationTemplate);

// Delete recommendation template
router.delete('/:id', recommendationTemplateController.deleteRecommendationTemplate);

module.exports = router;