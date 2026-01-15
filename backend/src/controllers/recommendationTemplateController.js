// backend/src/controllers/recommendationTemplateController.js

const db = require('../config/db');
const { successResponse, errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

// Get all recommendation templates
exports.getAllRecommendationTemplates = async (req, res, next) => {
  try {
    const { action_required, priority, is_active } = req.query;
    
    let query = 'SELECT * FROM recommendation_templates WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (action_required) {
      query += ` AND action_required = $${paramCount}`;
      params.push(action_required);
      paramCount++;
    }

    if (priority) {
      query += ` AND priority = $${paramCount}`;
      params.push(priority);
      paramCount++;
    }

    if (is_active !== undefined) {
      query += ` AND is_active = $${paramCount}`;
      params.push(is_active === 'true');
      paramCount++;
    }

    query += ' ORDER BY action_required, priority, template_id';

    const result = await db.query(query, params);

    return successResponse(
      res,
      { templates: result.rows },
      'Recommendation templates retrieved successfully'
    );

  } catch (err) {
    logger.error('Get recommendation templates error:', err);
    next(err);
  }
};

// Get recommendation templates by action required
exports.getRecommendationTemplatesByAction = async (req, res, next) => {
  try {
    const { actionRequired } = req.params;

    const result = await db.query(
      'SELECT * FROM recommendation_templates WHERE action_required = $1 AND is_active = true ORDER BY priority, template_id',
      [actionRequired]
    );

    return successResponse(
      res,
      { templates: result.rows },
      'Recommendation templates retrieved successfully'
    );

  } catch (err) {
    logger.error('Get recommendation templates by action error:', err);
    next(err);
  }
};

// Create custom recommendation template
exports.createRecommendationTemplate = async (req, res, next) => {
  try {
    const { action_required, priority, template_text } = req.body;
    const created_by = req.user.user_id;

    // Validation
    if (!action_required || !priority || !template_text) {
      return errorResponse(res, 'Action required, priority, and template text are required', 400);
    }

    const result = await db.query(
      `INSERT INTO recommendation_templates (action_required, priority, template_text, created_by, is_active)
       VALUES ($1, $2, $3, $4, true)
       RETURNING *`,
      [action_required, priority, template_text, created_by]
    );

    logger.success('Recommendation template created', { templateId: result.rows[0].template_id });

    return successResponse(
      res,
      { template: result.rows[0] },
      'Recommendation template created successfully',
      201
    );

  } catch (err) {
    logger.error('Create recommendation template error:', err);
    next(err);
  }
};

// Delete recommendation template
exports.deleteRecommendationTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Soft delete by setting is_active to false
    const result = await db.query(
      'UPDATE recommendation_templates SET is_active = false WHERE template_id = $1 RETURNING *',
      [id]
    );

    if (result.rowCount === 0) {
      return errorResponse(res, 'Recommendation template not found', 404);
    }

    logger.success('Recommendation template deleted', { templateId: id });

    return successResponse(
      res,
      { template: result.rows[0] },
      'Recommendation template deleted successfully'
    );

  } catch (err) {
    logger.error('Delete recommendation template error:', err);
    next(err);
  }
};