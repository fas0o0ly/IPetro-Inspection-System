// backend/src/routes/findingTemplateRoutes.js

const express = require('express');
const router = express.Router();
const findingTemplateController = require('../controllers/findingTemplateController');
const { authenticate } = require('../middlewares/auth');

// All routes require authentication
router.use(authenticate);

// Get all finding templates
router.get('/', findingTemplateController.getAllFindingTemplates);

// Get finding templates by observation type
router.get('/type/:observationType', findingTemplateController.getFindingTemplatesByType);

// Create custom finding template
router.post('/', findingTemplateController.createFindingTemplate);

// Delete finding template
router.delete('/:id', findingTemplateController.deleteFindingTemplate);

module.exports = router;