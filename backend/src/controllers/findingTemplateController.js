// backend/src/controllers/findingTemplateController.js

const db = require('../config/db');
const { successResponse, errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

// Get all finding templates
exports.getAllFindingTemplates = async (req, res, next) => {
  try {
    const { observation_type, severity, is_active } = req.query;
    
    let query = 'SELECT * FROM finding_templates WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (observation_type) {
      query += ` AND observation_type = $${paramCount}`;
      params.push(observation_type);
      paramCount++;
    }

    if (severity) {
      query += ` AND severity = $${paramCount}`;
      params.push(severity);
      paramCount++;
    }

    if (is_active !== undefined) {
      query += ` AND is_active = $${paramCount}`;
      params.push(is_active === 'true');
      paramCount++;
    }

    query += ' ORDER BY observation_type, severity, template_id';

    const result = await db.query(query, params);

    return successResponse(
      res,
      { templates: result.rows },
      'Finding templates retrieved successfully'
    );

  } catch (err) {
    logger.error('Get finding templates error:', err);
    next(err);
  }
};

// Get finding templates by observation type
exports.getFindingTemplatesByType = async (req, res, next) => {
  try {
    const { observationType } = req.params;

    const result = await db.query(
      'SELECT * FROM finding_templates WHERE observation_type = $1 AND is_active = true ORDER BY severity, template_id',
      [observationType]
    );

    return successResponse(
      res,
      { templates: result.rows },
      'Finding templates retrieved successfully'
    );

  } catch (err) {
    logger.error('Get finding templates by type error:', err);
    next(err);
  }
};

// Create custom finding template
exports.createFindingTemplate = async (req, res, next) => {
  try {
    const { observation_type, severity, template_text } = req.body;
    const created_by = req.user.user_id;

    // Validation
    if (!observation_type || !severity || !template_text) {
      return errorResponse(res, 'Observation type, severity, and template text are required', 400);
    }

    const result = await db.query(
      `INSERT INTO finding_templates (observation_type, severity, template_text, created_by, is_active)
       VALUES ($1, $2, $3, $4, true)
       RETURNING *`,
      [observation_type, severity, template_text, created_by]
    );

    logger.success('Finding template created', { templateId: result.rows[0].template_id });

    return successResponse(
      res,
      { template: result.rows[0] },
      'Finding template created successfully',
      201
    );

  } catch (err) {
    logger.error('Create finding template error:', err);
    next(err);
  }
};

// Delete finding template
exports.deleteFindingTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Soft delete by setting is_active to false
    const result = await db.query(
      'UPDATE finding_templates SET is_active = false WHERE template_id = $1 RETURNING *',
      [id]
    );

    if (result.rowCount === 0) {
      return errorResponse(res, 'Finding template not found', 404);
    }

    logger.success('Finding template deleted', { templateId: id });

    return successResponse(
      res,
      { template: result.rows[0] },
      'Finding template deleted successfully'
    );

  } catch (err) {
    logger.error('Delete finding template error:', err);
    next(err);
  }
};