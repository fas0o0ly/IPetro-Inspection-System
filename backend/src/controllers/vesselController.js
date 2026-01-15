// src/controllers/vesselController.js
const db = require('../config/db');
const { successResponse, errorResponse } = require('../utils/response');
const { logActivity, logger } = require('../utils/logger');

/**
 * Vessel types constant
 */
const VESSEL_TYPES = [
  'Column/Tower',
  'Reactor',
  'Condenser',
  'Bullet',
  'Sphere',
  'Accumulator',
  'Heat Exchanger',
  'Separator'
];

/**
 * GET /api/vessels
 * Get all vessels with search and filters
 */
exports.getAllVessels = async (req, res, next) => {
  try {
    const { search, vessel_type, plant_unit, location, sortBy = 'created_at', sortOrder = 'DESC' } = req.query;
    
    let query = `
      SELECT 
        vessel_id,
        tag_no,
        description,
        vessel_type,
        plant_unit,
        location,
        design_data,
        created_at,
        updated_at,
        plant_identifier
      FROM vessels 
      WHERE 1=1
    `;
    const params = [];
    
    // Search across tag_no, description, plant_unit, and location
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (
        tag_no ILIKE $${params.length} OR 
        description ILIKE $${params.length} OR
        plant_unit ILIKE $${params.length} OR
        location ILIKE $${params.length}
      )`;
    }
    
    // Filter by vessel type
    if (vessel_type) {
      params.push(vessel_type);
      query += ` AND vessel_type = $${params.length}`;
    }
    
    // Filter by plant unit
    if (plant_unit) {
      params.push(plant_unit);
      query += ` AND plant_unit = $${params.length}`;
    }
    
    // Filter by location
    if (location) {
      params.push(location);
      query += ` AND location = $${params.length}`;
    }
    
    // Sorting
    const validSortFields = ['tag_no', 'vessel_type', 'plant_unit', 'location', 'created_at'];
    const validSortOrders = ['ASC', 'DESC'];
    
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const order = validSortOrders.includes(sortOrder?.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';
    
    query += ` ORDER BY ${sortField} ${order}`;
    
    const result = await db.query(query, params);
    
    return successResponse(res, {
      total: result.rowCount,
      vessels: result.rows
    }, 'Vessels retrieved successfully');
    
  } catch (err) {
    logger.error('Get all vessels error:', err);
    next(err);
  }
};

/**
 * GET /api/vessels/types
 * Get all available vessel types
 */
exports.getVesselTypes = async (req, res, next) => {
  try {
    return successResponse(res, {
      types: VESSEL_TYPES
    }, 'Vessel types retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/vessels/:id
 * Get vessel by ID
 */
exports.getVesselById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      `SELECT 
        vessel_id,
        tag_no,
        description,
        vessel_type,
        plant_unit,
        location,
        design_data,
        created_at,
        updated_at,
        plant_identifier
       FROM vessels 
       WHERE vessel_id = $1`,
      [id]
    );

    if (result.rowCount === 0) {
      return errorResponse(res, 'Vessel not found', 404);
    }

    return successResponse(res, result.rows[0], 'Vessel retrieved successfully');
  } catch (err) {
    logger.error('Get vessel by ID error:', err);
    next(err);
  }
};

/**
 * GET /api/vessels/tag/:tag_no
 * Get vessel by tag number
 */
exports.getVesselByTag = async (req, res, next) => {
  try {
    const { tag_no } = req.params;
    
    const result = await db.query(
      `SELECT 
        vessel_id,
        tag_no,
        description,
        vessel_type,
        plant_unit,
        location,
        design_data,
        created_at,
        updated_at,
        plant_identifier
       FROM vessels 
       WHERE tag_no = $1`,
      [tag_no]
    );

    if (result.rowCount === 0) {
      return errorResponse(res, 'Vessel not found', 404);
    }

    return successResponse(res, result.rows[0], 'Vessel retrieved successfully');
  } catch (err) {
    logger.error('Get vessel by tag error:', err);
    next(err);
  }
};

/**
 * POST /api/vessels
 * Create new vessel
 */
exports.createVessel = async (req, res, next) => {
  try {
    const { tag_no, description, vessel_type, plant_unit, location, design_data, plant_identifier } = req.body;

    // Validation
    if (!tag_no) {
      return errorResponse(res, 'Tag number is required', 400);
    }

    if (!vessel_type) {
      return errorResponse(res, 'Vessel type is required', 400);
    }

    // Validate vessel type
    if (!VESSEL_TYPES.includes(vessel_type)) {
      return errorResponse(res, `Invalid vessel type. Must be one of: ${VESSEL_TYPES.join(', ')}`, 400);
    }

    // Tag number validation (alphanumeric, dash, underscore)
    const tagRegex = /^[A-Z0-9-_]+$/i;
    if (!tagRegex.test(tag_no)) {
      return errorResponse(res, 'Tag number must contain only letters, numbers, dashes, and underscores', 400);
    }

    // Insert vessel
    const result = await db.query(
      `INSERT INTO vessels (tag_no, description, vessel_type, plant_unit, location, design_data, plant_identifier)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING vessel_id, tag_no, description, vessel_type, plant_unit, location, design_data, created_at, plant_identifier`,
      [tag_no, description, vessel_type, plant_unit, location, design_data ? JSON.stringify(design_data) : null, plant_identifier]
    );

    const newVessel = result.rows[0];

    // Log activity
    await logActivity({
      userId: req.user.user_id,
      action: 'create_vessel',
      entity: 'vessel',
      entityId: newVessel.vessel_id,
      details: { tag_no: newVessel.tag_no, vessel_type: newVessel.vessel_type }
    });

    logger.success('Vessel created', { vesselId: newVessel.vessel_id, tagNo: newVessel.tag_no });

    return successResponse(res, newVessel, 'Vessel created successfully', 201);

  } catch (err) {
    // Handle duplicate tag_no
    if (err.code === '23505' && err.constraint === 'vessels_tag_no_key') {
      return errorResponse(res, 'Tag number already exists', 409);
    }
    logger.error('Vessel creation error:', err);
    next(err);
  }
};

/**
 * PUT /api/vessels/:id
 * Update vessel
 */
exports.updateVessel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { tag_no, description, vessel_type, plant_unit, location, design_data, plant_identifier } = req.body;

    // Validate vessel type if provided
    if (vessel_type && !VESSEL_TYPES.includes(vessel_type)) {
      return errorResponse(res, `Invalid vessel type. Must be one of: ${VESSEL_TYPES.join(', ')}`, 400);
    }

    // Validate tag number if provided
    if (tag_no) {
      const tagRegex = /^[A-Z0-9-_]+$/i;
      if (!tagRegex.test(tag_no)) {
        return errorResponse(res, 'Tag number must contain only letters, numbers, dashes, and underscores', 400);
      }
    }

    // Build update query
    let query = 'UPDATE vessels SET updated_at = NOW()';
    const params = [];
    let paramCount = 0;

    if (tag_no !== undefined) {
      params.push(tag_no);
      query += `, tag_no = $${++paramCount}`;
    }

    if (description !== undefined) {
      params.push(description);
      query += `, description = $${++paramCount}`;
    }

    if (vessel_type !== undefined) {
      params.push(vessel_type);
      query += `, vessel_type = $${++paramCount}`;
    }

    if (plant_unit !== undefined) {
      params.push(plant_unit);
      query += `, plant_unit = $${++paramCount}`;
    }

    if (location !== undefined) {
      params.push(location);
      query += `, location = $${++paramCount}`;
    }

    if (design_data !== undefined) {
      params.push(JSON.stringify(design_data));
      query += `, design_data = $${++paramCount}`;
    }

    if (plant_identifier !== undefined) {
      params.push(plant_identifier);
      query += `, plant_identifier = $${++paramCount}`;
    }
    // No fields to update
    if (paramCount === 0) {
      return errorResponse(res, 'No fields to update', 400);
    }

    params.push(id);
    query += ` WHERE vessel_id = $${++paramCount} 
               RETURNING vessel_id, tag_no, description, vessel_type, plant_unit, location, design_data, created_at, updated_at, plant_identifier`;

    const result = await db.query(query, params);

    if (result.rowCount === 0) {
      return errorResponse(res, 'Vessel not found', 404);
    }

    // Log activity
    await logActivity({
      userId: req.user.user_id,
      action: 'update_vessel',
      entity: 'vessel',
      entityId: parseInt(id),
      details: req.body
    });

    logger.success('Vessel updated', { vesselId: id, updatedBy: req.user.user_id });

    return successResponse(res, result.rows[0], 'Vessel updated successfully');

  } catch (err) {
    // Handle duplicate tag_no
    if (err.code === '23505' && err.constraint === 'vessels_tag_no_key') {
      return errorResponse(res, 'Tag number already exists', 409);
    }
    logger.error('Vessel update error:', err);
    next(err);
  }
};

/**
 * DELETE /api/vessels/:id
 * Delete vessel (hard delete or soft delete based on your preference)
 */
exports.deleteVessel = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if vessel has any inspections
    const inspectionCheck = await db.query(
      'SELECT COUNT(*) FROM inspections WHERE vessel_id = $1',
      [id]
    );

    if (parseInt(inspectionCheck.rows[0].count) > 0) {
      return errorResponse(
        res, 
        'Cannot delete vessel with existing inspections. Please delete inspections first or contact administrator.', 
        400
      );
    }

    // Delete vessel
    const result = await db.query(
      'DELETE FROM vessels WHERE vessel_id = $1 RETURNING vessel_id, tag_no, vessel_type',
      [id]
    );

    if (result.rowCount === 0) {
      return errorResponse(res, 'Vessel not found', 404);
    }

    // Log activity
    await logActivity({
      userId: req.user.user_id,
      action: 'delete_vessel',
      entity: 'vessel',
      entityId: parseInt(id),
      details: { 
        deleted_tag_no: result.rows[0].tag_no,
        deleted_vessel_type: result.rows[0].vessel_type
      }
    });

    logger.warn('Vessel deleted', { 
      vesselId: id, 
      tagNo: result.rows[0].tag_no,
      deletedBy: req.user.user_id 
    });

    return successResponse(res, null, 'Vessel deleted successfully');

  } catch (err) {
    logger.error('Vessel deletion error:', err);
    next(err);
  }
};

/**
 * GET /api/vessels/stats
 * Get vessel statistics
 */
exports.getVesselStats = async (req, res, next) => {
  try {
    // Total vessels
    const totalResult = await db.query('SELECT COUNT(*) FROM vessels');
    
    // Vessels by type
    const byTypeResult = await db.query(`
      SELECT vessel_type, COUNT(*) as count
      FROM vessels
      WHERE vessel_type IS NOT NULL
      GROUP BY vessel_type
      ORDER BY count DESC
    `);
    
    // Vessels by plant unit
    const byPlantResult = await db.query(`
      SELECT plant_unit, COUNT(*) as count
      FROM vessels
      WHERE plant_unit IS NOT NULL
      GROUP BY plant_unit
      ORDER BY count DESC
      LIMIT 10
    `);

    return successResponse(res, {
      total: parseInt(totalResult.rows[0].count),
      by_type: byTypeResult.rows,
      by_plant_unit: byPlantResult.rows
    }, 'Vessel statistics retrieved successfully');

  } catch (err) {
    logger.error('Get vessel stats error:', err);
    next(err);
  }
};