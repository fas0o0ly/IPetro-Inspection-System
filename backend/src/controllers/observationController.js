// src/controllers/observationController.js
const db = require('../config/db');
const { successResponse, errorResponse } = require('../utils/response');
const { logActivity, logger } = require('../utils/logger');

/**
 * Constants for observation classification
 */
const OBSERVATION_TYPES = [
  'Corrosion',
  'Erosion',
  'Cracking',
  'Deformation',
  'Mechanical Damage',
  'Weld Defect',
  'Coating Damage',
  'Pitting',
  'Leakage',
  'Structural Issue',
  'General Wear',
  'Other'
];

const SEVERITIES = ['Minor', 'Moderate', 'Major', 'Critical'];
const STATUSES = ['Open', 'Acceptable', 'Monitoring Required', 'Repair Required', 'Closed'];
const ACTIONS = ['No Action', 'Monitor', 'Repair', 'Replace', 'Further Investigation', 'Immediate Action'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
const FOLLOW_UP_STATUSES = ['Pending', 'In Progress', 'Completed', 'Cancelled', 'Overdue'];

/**
 * GET /api/observations/types
 * Get all observation classification types
 */
exports.getObservationTypes = async (req, res, next) => {
  try {
    return successResponse(res, {
      observation_types: OBSERVATION_TYPES,
      severities: SEVERITIES,
      statuses: STATUSES,
      actions: ACTIONS,
      priorities: PRIORITIES,
      follow_up_statuses: FOLLOW_UP_STATUSES
    }, 'Observation types retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/observations
 * Get all observations with filters
 */
exports.getAllObservations = async (req, res, next) => {
  try {
    const {
      inspection_id,
      vessel_id,
      observation_type,
      severity,
      status,
      action_required,
      priority,
      follow_up_status,
      component,
      created_by,
      search,
      date_from,
      date_to,
      sortBy = 'created_at',
      sortOrder = 'DESC',
      page = 1,
      limit = 50
    } = req.query;

    let baseQuery = `
      FROM observations o
      LEFT JOIN inspections i ON o.inspection_id = i.inspection_id
      LEFT JOIN vessels v ON o.vessel_id = v.vessel_id
      LEFT JOIN users u1 ON o.created_by = u1.user_id
      LEFT JOIN users u2 ON o.reviewed_by = u2.user_id
      WHERE 1=1
    `;
    const params = [];

    const userRole = req.user.role;
    const userId = req.user.user_id;

    if (userRole === 'inspector') {
      // Inspector can only see observations from their own inspections
      params.push(userId);
      baseQuery += ` AND i.inspector_id = $${params.length}`;
      console.log(`🔒 Inspector filter applied to observations: user_id=${userId}`);
    }

    // Filters
    if (inspection_id) {
      params.push(inspection_id);
      baseQuery += ` AND o.inspection_id = $${params.length}`;
    }

    if (vessel_id) {
      params.push(vessel_id);
      baseQuery += ` AND o.vessel_id = $${params.length}`;
    }

    if (observation_type) {
      params.push(observation_type);
      baseQuery += ` AND o.observation_type = $${params.length}`;
    }

    if (severity) {
      params.push(severity);
      baseQuery += ` AND o.severity = $${params.length}`;
    }

    if (status) {
      params.push(status);
      baseQuery += ` AND o.status = $${params.length}`;
    }

    if (action_required) {
      params.push(action_required);
      baseQuery += ` AND o.action_required = $${params.length}`;
    }

    if (priority) {
      params.push(priority);
      baseQuery += ` AND o.priority = $${params.length}`;
    }

    if (follow_up_status) {
      params.push(follow_up_status);
      baseQuery += ` AND o.follow_up_status = $${params.length}`;
    }

    if (component) {
      params.push(component);
      baseQuery += ` AND o.component = $${params.length}`;
    }

    if (created_by) {
      params.push(created_by);
      baseQuery += ` AND o.created_by = $${params.length}`;
    }

    // Search
    if (search) {
      params.push(`%${search}%`);
      baseQuery += ` AND (
        o.description ILIKE $${params.length} OR
        o.component ILIKE $${params.length} OR
        o.location ILIKE $${params.length} OR
        o.recommendation ILIKE $${params.length} OR
        v.tag_no ILIKE $${params.length}
      )`;
    }

    // Date range
    if (date_from) {
      params.push(date_from);
      baseQuery += ` AND o.created_at >= $${params.length}`;
    }

    if (date_to) {
      params.push(date_to);
      baseQuery += ` AND o.created_at <= $${params.length}`;
    }

    // Count total
    const countQuery = `SELECT COUNT(*) ${baseQuery}`;
    const countResult = await db.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    // Build main query
    let query = `
      SELECT 
        o.observation_id,
        o.inspection_id,
        i.status as inspection_status,
        o.vessel_id,
        v.tag_no as vessel_tag,
        o.finding_number,
        o.component,
        o.location,
        o.observation_type,
        o.severity,
        o.description,
        o.status,
        o.recommendation,
        o.action_required,
        o.priority,
        o.due_date,
        o.follow_up_status,
        o.created_by,
        u1.name as creator_name,
        o.reviewed_by,
        u2.name as reviewer_name,
        o.created_at,
        o.updated_at,
        (SELECT COUNT(*) FROM observation_photos WHERE observation_id = o.observation_id) as photo_count
      ${baseQuery}
    `;

    // Sorting
    const validSortFields = [
      'created_at', 'severity', 'priority', 'due_date', 
      'finding_number', 'component', 'observation_type', 'status'
    ];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const order = ['ASC', 'DESC'].includes(sortOrder?.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

    // Custom sorting for severity and priority
    if (sortField === 'severity') {
      query += ` ORDER BY 
        CASE o.severity
          WHEN 'Critical' THEN 1
          WHEN 'Major' THEN 2
          WHEN 'Moderate' THEN 3
          WHEN 'Minor' THEN 4
        END ${order}`;
    } else if (sortField === 'priority') {
      query += ` ORDER BY 
        CASE o.priority
          WHEN 'Critical' THEN 1
          WHEN 'High' THEN 2
          WHEN 'Medium' THEN 3
          WHEN 'Low' THEN 4
        END ${order}`;
    } else {
      query += ` ORDER BY o.${sortField} ${order}`;
    }

    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    params.push(parseInt(limit));
    query += ` LIMIT $${params.length}`;
    params.push(offset);
    query += ` OFFSET $${params.length}`;

    const result = await db.query(query, params);

    return successResponse(res, {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
      observations: result.rows
    }, 'Observations retrieved successfully');

  } catch (err) {
    logger.error('Get all observations error:', err);
    next(err);
  }
};

/**
 * GET /api/observations/inspection/:inspection_id
 * Get all observations for a specific inspection
 */
exports.getObservationsByInspection = async (req, res, next) => {
  try {
    const { inspection_id } = req.params;
    const { component, severity } = req.query;

    let query = `
      SELECT 
        o.*,
        u1.name as creator_name,
        u2.name as reviewer_name,
        ARRAY_AGG(DISTINCT op.photo_id) FILTER (WHERE op.photo_id IS NOT NULL) as photo_ids
      FROM observations o
      LEFT JOIN users u1 ON o.created_by = u1.user_id
      LEFT JOIN users u2 ON o.reviewed_by = u2.user_id
      LEFT JOIN observation_photos op ON o.observation_id = op.observation_id
      WHERE o.inspection_id = $1
    `;
    const params = [inspection_id];

    if (component) {
      params.push(component);
      query += ` AND o.component = $${params.length}`;
    }

    if (severity) {
      params.push(severity);
      query += ` AND o.severity = $${params.length}`;
    }

    query += ` GROUP BY o.observation_id, u1.name, u2.name
               ORDER BY o.finding_number ASC NULLS LAST, o.created_at ASC`;

    const result = await db.query(query, params);

    // Group by component
    const groupedByComponent = {};
    result.rows.forEach(obs => {
      const comp = obs.component || 'General';
      if (!groupedByComponent[comp]) {
        groupedByComponent[comp] = [];
      }
      groupedByComponent[comp].push(obs);
    });

    // Group by severity
    const groupedBySeverity = {
      Critical: [],
      Major: [],
      Moderate: [],
      Minor: []
    };
    result.rows.forEach(obs => {
      if (groupedBySeverity[obs.severity]) {
        groupedBySeverity[obs.severity].push(obs);
      }
    });

    return successResponse(res, {
      total: result.rowCount,
      observations: result.rows,
      grouped_by_component: groupedByComponent,
      grouped_by_severity: groupedBySeverity
    }, 'Observations retrieved successfully');

  } catch (err) {
    logger.error('Get observations by inspection error:', err);
    next(err);
  }
};

/**
 * GET /api/observations/:id
 * Get observation by ID with full details
 */
exports.getObservationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userRole = req.user.role;
    const userId = req.user.user_id;

    if (userRole === 'inspector') {
      const result = await db.query(`
      SELECT 
        o.*,
        i.inspection_id,
        i.inspection_date,
        i.status as inspection_status,
        v.tag_no as vessel_tag,
        v.vessel_type,
        v.description as vessel_description,
        u1.name as creator_name,
        u1.email as creator_email,
        u2.name as reviewer_name,
        u2.email as reviewer_email,
        ARRAY_AGG(
          DISTINCT jsonb_build_object(
            'photo_id', p.photo_id,
            'file_url', p.file_url,
            'caption', p.caption,
            'sequence_no', p.sequence_no
          )
        ) FILTER (WHERE p.photo_id IS NOT NULL) as photos
      FROM observations o
      LEFT JOIN inspections i ON o.inspection_id = i.inspection_id
      LEFT JOIN vessels v ON o.vessel_id = v.vessel_id
      LEFT JOIN users u1 ON o.created_by = u1.user_id
      LEFT JOIN users u2 ON o.reviewed_by = u2.user_id
      LEFT JOIN observation_photos op ON o.observation_id = op.observation_id
      LEFT JOIN photos p ON op.photo_id = p.photo_id
      WHERE o.observation_id = $1 AND i.inspector_id = $2
      GROUP BY o.observation_id, i.inspection_id, v.vessel_id, u1.user_id, u2.user_id
    `, [id, userId]);

    if (result.rowCount === 0) {
      return errorResponse(res, 'Observation not found', 404);
    }

    return successResponse(res, result.rows[0], 'Observation retrieved successfully');
    }
    else{
    const result = await db.query(`
      SELECT 
        o.*,
        i.inspection_id,
        i.inspection_date,
        i.status as inspection_status,
        v.tag_no as vessel_tag,
        v.vessel_type,
        v.description as vessel_description,
        u1.name as creator_name,
        u1.email as creator_email,
        u2.name as reviewer_name,
        u2.email as reviewer_email,
        ARRAY_AGG(
          DISTINCT jsonb_build_object(
            'photo_id', p.photo_id,
            'file_url', p.file_url,
            'caption', p.caption,
            'sequence_no', p.sequence_no
          )
        ) FILTER (WHERE p.photo_id IS NOT NULL) as photos
      FROM observations o
      LEFT JOIN inspections i ON o.inspection_id = i.inspection_id
      LEFT JOIN vessels v ON o.vessel_id = v.vessel_id
      LEFT JOIN users u1 ON o.created_by = u1.user_id
      LEFT JOIN users u2 ON o.reviewed_by = u2.user_id
      LEFT JOIN observation_photos op ON o.observation_id = op.observation_id
      LEFT JOIN photos p ON op.photo_id = p.photo_id
      WHERE o.observation_id = $1
      GROUP BY o.observation_id, i.inspection_id, v.vessel_id, u1.user_id, u2.user_id
    `, [id]);

    if (result.rowCount === 0) {
      return errorResponse(res, 'Observation not found', 404);
    }

    return successResponse(res, result.rows[0], 'Observation retrieved successfully');
  }

  } catch (err) {
    logger.error('Get observation by ID error:', err);
    next(err);
  }
};

/**
 * POST /api/observations
 * Create new observation
 */
exports.createObservation = async (req, res, next) => {
  const client = await db.pool.connect();
  
  try {
    await client.query('BEGIN');

    const {
      inspection_id,
      finding_number,
      component,
      location,
      observation_type,
      severity = 'Minor',
      description,
      acceptance_criteria,
      standard_reference,
      measurement_data,
      status = 'Open',
      recommendation,
      action_required = 'Monitor',
      priority = 'Medium',
      due_date,
      photo_ids,
      section  
    } = req.body;

    // Validation
    if (!inspection_id) {
      await client.query('ROLLBACK');
      return errorResponse(res, 'Inspection ID is required', 400);
    }

    if (!observation_type) {
      await client.query('ROLLBACK');
      return errorResponse(res, 'Observation type is required', 400);
    }

    if (!description) {
      await client.query('ROLLBACK');
      return errorResponse(res, 'Description is required', 400);
    }

    // Validate observation type
    if (!OBSERVATION_TYPES.includes(observation_type)) {
      await client.query('ROLLBACK');
      return errorResponse(res, `Invalid observation type. Must be one of: ${OBSERVATION_TYPES.join(', ')}`, 400);
    }

    // Validate severity
    if (!SEVERITIES.includes(severity)) {
      await client.query('ROLLBACK');
      return errorResponse(res, `Invalid severity. Must be one of: ${SEVERITIES.join(', ')}`, 400);
    }

    // Get inspection and vessel info
    const inspectionCheck = await client.query(
      'SELECT inspection_id, vessel_id, inspector_id, status FROM inspections WHERE inspection_id = $1',
      [inspection_id]
    );

    if (inspectionCheck.rowCount === 0) {
      await client.query('ROLLBACK');
      return errorResponse(res, 'Inspection not found', 404);
    }

    const inspection = inspectionCheck.rows[0];

    // Authorization check
    if (req.user.role !== 'admin' && inspection.inspector_id !== req.user.user_id) {
      await client.query('ROLLBACK');
      return errorResponse(res, 'Not authorized to create observations for this inspection', 403);
    }

    // Cannot add observations to approved inspections (unless admin)
    if (inspection.status === 'approved' && req.user.role !== 'admin') {
      await client.query('ROLLBACK');
      return errorResponse(res, 'Cannot add observations to approved inspections', 400);
    }

    // Insert observation
    const obsResult = await client.query(`
      INSERT INTO observations (
        inspection_id,
        vessel_id,
        finding_number,
        component,
        location,
        observation_type,
        severity,
        description,
        acceptance_criteria,
        standard_reference,
        measurement_data,
        status,
        recommendation,
        action_required,
        priority,
        due_date,
        created_by,
        section
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *
    `, [
      inspection_id,
      inspection.vessel_id,
      finding_number,
      component,
      location,
      observation_type,
      severity,
      description,
      acceptance_criteria,
      standard_reference,
      measurement_data ? JSON.stringify(measurement_data) : null,
      status,
      recommendation,
      action_required,
      priority,
      due_date,
      req.user.user_id,
      section || 'Internal'
    ]);

    const newObservation = obsResult.rows[0];

    // Link photos if provided
    if (photo_ids && Array.isArray(photo_ids) && photo_ids.length > 0) {
      for (let i = 0; i < photo_ids.length; i++) {
        await client.query(`
          INSERT INTO observation_photos (observation_id, photo_id, sequence_order)
          VALUES ($1, $2, $3)
        `, [newObservation.observation_id, photo_ids[i], i + 1]);
      }
    }

    await client.query('COMMIT');

    // Log activity
    await logActivity({
      userId: req.user.user_id,
      action: 'create_observation',
      entity: 'observation',
      entityId: newObservation.observation_id,
      details: {
        inspection_id,
        observation_type,
        severity,
        component
      }
    });

    logger.success('Observation created', {
      observationId: newObservation.observation_id,
      inspectionId: inspection_id
    });

    return successResponse(res, newObservation, 'Observation created successfully', 201);

  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('Create observation error:', err);
    next(err);
  } finally {
    client.release();
  }
};

/**
 * PUT /api/observations/:id
 * Update observation
 */
exports.updateObservation = async (req, res, next) => {
  const client = await db.pool.connect();
  
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const {
      finding_number,
      component,
      location,
      observation_type,
      severity,
      description,
      acceptance_criteria,
      standard_reference,
      measurement_data,
      status,
      recommendation,
      action_required,
      priority,
      due_date,
      follow_up_status,
      photo_ids
    } = req.body;

    // Check if observation exists
    const checkResult = await client.query(
      `SELECT o.*, i.inspector_id, i.status as inspection_status
       FROM observations o
       JOIN inspections i ON o.inspection_id = i.inspection_id
       WHERE o.observation_id = $1`,
      [id]
    );

    if (checkResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return errorResponse(res, 'Observation not found', 404);
    }

    const observation = checkResult.rows[0];

    // Authorization check
    if (req.user.role !== 'admin' && observation.created_by !== req.user.user_id) {
      await client.query('ROLLBACK');
      return errorResponse(res, 'Not authorized to update this observation', 403);
    }

    // Cannot edit observations in approved inspections (unless admin)
    if (observation.inspection_status === 'approved' && req.user.role !== 'admin') {
      await client.query('ROLLBACK');
      return errorResponse(res, 'Cannot edit observations in approved inspections', 400);
    }

    // Validate if provided
    if (observation_type && !OBSERVATION_TYPES.includes(observation_type)) {
      await client.query('ROLLBACK');
      return errorResponse(res, `Invalid observation type`, 400);
    }

    if (severity && !SEVERITIES.includes(severity)) {
      await client.query('ROLLBACK');
      return errorResponse(res, `Invalid severity`, 400);
    }

    // Build update query
    let query = 'UPDATE observations SET';
    const params = [];
    let paramCount = 0;
    const updates = [];

    if (finding_number !== undefined) {
      params.push(finding_number);
      updates.push(`finding_number = $${++paramCount}`);
    }

    if (component !== undefined) {
      params.push(component);
      updates.push(`component = $${++paramCount}`);
    }

    if (location !== undefined) {
      params.push(location);
      updates.push(`location = $${++paramCount}`);
    }

    if (observation_type !== undefined) {
      params.push(observation_type);
      updates.push(`observation_type = $${++paramCount}`);
    }

    if (severity !== undefined) {
      params.push(severity);
      updates.push(`severity = $${++paramCount}`);
    }

    if (description !== undefined) {
      params.push(description);
      updates.push(`description = $${++paramCount}`);
    }

    if (acceptance_criteria !== undefined) {
      params.push(acceptance_criteria);
      updates.push(`acceptance_criteria = $${++paramCount}`);
    }

    if (standard_reference !== undefined) {
      params.push(standard_reference);
      updates.push(`standard_reference = $${++paramCount}`);
    }

    if (measurement_data !== undefined) {
      params.push(JSON.stringify(measurement_data));
      updates.push(`measurement_data = $${++paramCount}`);
    }

    if (status !== undefined) {
      params.push(status);
      updates.push(`status = $${++paramCount}`);
    }

    if (recommendation !== undefined) {
      params.push(recommendation);
      updates.push(`recommendation = $${++paramCount}`);
    }

    if (action_required !== undefined) {
      params.push(action_required);
      updates.push(`action_required = $${++paramCount}`);
    }

    if (priority !== undefined) {
      params.push(priority);
      updates.push(`priority = $${++paramCount}`);
    }

    if (due_date !== undefined) {
      params.push(due_date);
      updates.push(`due_date = $${++paramCount}`);
    }

    if (follow_up_status !== undefined) {
      params.push(follow_up_status);
      updates.push(`follow_up_status = $${++paramCount}`);
    }

    if (updates.length === 0 && !photo_ids) {
      await client.query('ROLLBACK');
      return errorResponse(res, 'No fields to update', 400);
    }

    let updatedObservation;
    
    if (updates.length > 0) {
      query += ' ' + updates.join(', ');
      params.push(id);
      query += ` WHERE observation_id = $${++paramCount} RETURNING *`;

      const result = await client.query(query, params);
      updatedObservation = result.rows[0];
    }

    // Update photo links if provided
    if (photo_ids !== undefined) {
      // Delete existing links
      await client.query('DELETE FROM observation_photos WHERE observation_id = $1', [id]);

      // Add new links
      if (Array.isArray(photo_ids) && photo_ids.length > 0) {
        for (let i = 0; i < photo_ids.length; i++) {
          await client.query(`
            INSERT INTO observation_photos (observation_id, photo_id, sequence_order)
            VALUES ($1, $2, $3)
          `, [id, photo_ids[i], i + 1]);
        }
      }
    }

    await client.query('COMMIT');

    // Log activity
    await logActivity({
      userId: req.user.user_id,
      action: 'update_observation',
      entity: 'observation',
      entityId: parseInt(id),
      details: req.body
    });

    logger.success('Observation updated', { observationId: id });

    // Return updated observation
    if (!updatedObservation) {
      const finalResult = await db.query('SELECT * FROM observations WHERE observation_id = $1', [id]);
      updatedObservation = finalResult.rows[0];
    }

    return successResponse(res, updatedObservation, 'Observation updated successfully');

  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('Update observation error:', err);
    next(err);
  } finally {
    client.release();
  }
};

/**
 * DELETE /api/observations/:id
 * Delete observation
 */
exports.deleteObservation = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if observation exists
    const checkResult = await db.query(
      `SELECT o.*, i.inspector_id, i.status as inspection_status
       FROM observations o
       JOIN inspections i ON o.inspection_id = i.inspection_id
       WHERE o.observation_id = $1`,
      [id]
    );

    if (checkResult.rowCount === 0) {
      return errorResponse(res, 'Observation not found', 404);
    }

    const observation = checkResult.rows[0];

    // Authorization check
    const isAdmin = req.user.role === 'admin';
    const isCreator = observation.created_by === req.user.user_id;

    if (!isAdmin && !isCreator) {
      return errorResponse(res, 'Not authorized to delete this observation', 403);
    }

    // Cannot delete observations from approved inspections (unless admin)
    if (observation.inspection_status === 'approved' && !isAdmin) {
      return errorResponse(res, 'Cannot delete observations from approved inspections', 400);
    }

    // Delete observation (CASCADE will delete observation_photos)
    await db.query('DELETE FROM observations WHERE observation_id = $1', [id]);

    // Log activity
    await logActivity({
      userId: req.user.user_id,
      action: 'delete_observation',
      entity: 'observation',
      entityId: parseInt(id),
      details: {
        inspection_id: observation.inspection_id,
        component: observation.component,
        observation_type: observation.observation_type
      }
    });

    logger.warn('Observation deleted', { observationId: id, deletedBy: req.user.user_id });

    return successResponse(res, null, 'Observation deleted successfully');

  } catch (err) {
    logger.error('Delete observation error:', err);
    next(err);
  }
};

/**
 * GET /api/observations/stats
 * Get observation statistics with role-based filtering
 */
exports.getObservationStats = async (req, res, next) => {
  try {
    // ============================================================================
    // ROLE-BASED FILTERING
    // ============================================================================
    const userRole = req.user.role;
    const userId = req.user.user_id;
    
    let whereClause = '';
    let joinClause = '';
    const params = [];
    
    if (userRole === 'inspector') {
      // Inspector can only see observations from their own inspections
      joinClause = ' LEFT JOIN inspections i ON observations.inspection_id = i.inspection_id';
      params.push(userId);
      whereClause = ` WHERE i.inspector_id = $${params.length}`;
      console.log(`🔒 Observation stats filtered for inspector: user_id=${userId}`);
    }
    // Admin and reviewer see all observation stats (no filter)
    // ============================================================================
    
    // Total observations
    const totalResult = await db.query(
      `SELECT COUNT(*) FROM observations${joinClause}${whereClause}`, 
      params
    );

    // By severity
    const bySeverityResult = await db.query(`
      SELECT o.severity, COUNT(*) as count
      FROM observations o
      ${joinClause.replace('observations', 'o')}
      ${whereClause.replace('observations', 'o')}
      GROUP BY o.severity
      ORDER BY 
        CASE o.severity
          WHEN 'Critical' THEN 1
          WHEN 'Major' THEN 2
          WHEN 'Moderate' THEN 3
          WHEN 'Minor' THEN 4
        END
    `, params);

    // By observation type
    const byTypeResult = await db.query(`
      SELECT o.observation_type, COUNT(*) as count
      FROM observations o
      ${joinClause.replace('observations', 'o')}
      ${whereClause.replace('observations', 'o')}
      GROUP BY o.observation_type
      ORDER BY count DESC
    `, params);

    // By status
    const byStatusResult = await db.query(`
      SELECT o.status, COUNT(*) as count
      FROM observations o
      ${joinClause.replace('observations', 'o')}
      ${whereClause.replace('observations', 'o')}
      GROUP BY o.status
      ORDER BY count DESC
    `, params);

    // By priority
    const byPriorityResult = await db.query(`
      SELECT o.priority, COUNT(*) as count
      FROM observations o
      ${joinClause.replace('observations', 'o')}
      ${whereClause.replace('observations', 'o')}
      GROUP BY o.priority
      ORDER BY 
        CASE o.priority
          WHEN 'Critical' THEN 1
          WHEN 'High' THEN 2
          WHEN 'Medium' THEN 3
          WHEN 'Low' THEN 4
        END
    `, params);

    // Pending actions
    const pendingClause = whereClause 
      ? whereClause + " AND o.follow_up_status IN ('Pending', 'In Progress', 'Overdue')"
      : " WHERE o.follow_up_status IN ('Pending', 'In Progress', 'Overdue')";
    const pendingResult = await db.query(`
      SELECT COUNT(*) 
      FROM observations o
      ${joinClause.replace('observations', 'o')}
      ${pendingClause}
    `, params);

    // Overdue actions
    const overdueClause = whereClause 
      ? whereClause + " AND o.follow_up_status = 'Overdue'"
      : " WHERE o.follow_up_status = 'Overdue'";
    const overdueResult = await db.query(`
      SELECT COUNT(*) 
      FROM observations o
      ${joinClause.replace('observations', 'o')}
      ${overdueClause}
    `, params);

    // Recent observations (last 7 days)
    const recentClause = whereClause 
      ? whereClause + " AND o.created_at >= NOW() - INTERVAL '7 days'"
      : " WHERE o.created_at >= NOW() - INTERVAL '7 days'";
    const recentResult = await db.query(`
      SELECT COUNT(*) 
      FROM observations o
      ${joinClause.replace('observations', 'o')}
      ${recentClause}
    `, params);

    return successResponse(res, {
      total: parseInt(totalResult.rows[0].count),
      pending_actions: parseInt(pendingResult.rows[0].count),
      overdue_actions: parseInt(overdueResult.rows[0].count),
      created_last_7_days: parseInt(recentResult.rows[0].count),
      by_severity: bySeverityResult.rows,
      by_type: byTypeResult.rows,
      by_status: byStatusResult.rows,
      by_priority: byPriorityResult.rows
    }, 'Observation statistics retrieved successfully');

  } catch (err) {
    logger.error('Get observation stats error:', err);
    next(err);
  }
};

/**
 * GET /api/observations/action-items
 * Get observations requiring action
 */
exports.getActionItems = async (req, res, next) => {
  try {
    const { priority, overdue_only } = req.query;

    let query = `
      SELECT 
        o.observation_id,
        o.vessel_id,
        v.tag_no as vessel_tag,
        o.component,
        o.description,
        o.severity,
        o.action_required,
        o.priority,
        o.due_date,
        o.follow_up_status,
        o.recommendation,
        CASE 
          WHEN o.due_date IS NOT NULL AND o.due_date < CURRENT_DATE THEN 
            (CURRENT_DATE - o.due_date)
          ELSE 0
        END as days_overdue,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'photo_id', p.photo_id,
              'file_url', p.file_url
            )
          ) FILTER (WHERE p.photo_id IS NOT NULL),
          '[]'::json
        ) as photos
      FROM observations o
      LEFT JOIN vessels v ON o.vessel_id = v.vessel_id
      LEFT JOIN observation_photos op ON o.observation_id = op.observation_id
      LEFT JOIN photos p ON op.photo_id = p.photo_id
      WHERE o.follow_up_status IN ('Pending', 'In Progress', 'Overdue')
      AND o.action_required != 'No Action'
    `;
    const params = [];

    if (priority) {
      params.push(priority);
      query += ` AND o.priority = $${params.length}`;
    }

    if (overdue_only === 'true') {
      query += ` AND o.follow_up_status = 'Overdue'`;
    }

    query += ` GROUP BY o.observation_id, v.tag_no
               ORDER BY 
                 CASE o.priority
                   WHEN 'Critical' THEN 1
                   WHEN 'High' THEN 2
                   WHEN 'Medium' THEN 3
                   WHEN 'Low' THEN 4
                 END,
                 o.due_date ASC NULLS LAST`;

    const result = await db.query(query, params);

    return successResponse(res, {
      total: result.rowCount,
      action_items: result.rows
    }, 'Action items retrieved successfully');

  } catch (err) {
    logger.error('Get action items error:', err);
    next(err);
  }
};

/**
 * GET /api/observations/vessel/:vessel_id/history
 * Get observation history for a vessel
 */
exports.getVesselObservationHistory = async (req, res, next) => {
  try {
    const { vessel_id } = req.params;
    const { component, observation_type } = req.query;

    let query = `
      SELECT 
        o.*,
        i.inspection_date,
        i.inspection_type,
        u.name as inspector_name,
        ARRAY_AGG(DISTINCT op.photo_id) FILTER (WHERE op.photo_id IS NOT NULL) as photo_ids
      FROM observations o
      JOIN inspections i ON o.inspection_id = i.inspection_id
      LEFT JOIN users u ON o.created_by = u.user_id
      LEFT JOIN observation_photos op ON o.observation_id = op.observation_id
      WHERE o.vessel_id = $1
    `;
    const params = [vessel_id];

    if (component) {
      params.push(component);
      query += ` AND o.component = $${params.length}`;
    }

    if (observation_type) {
      params.push(observation_type);
      query += ` AND o.observation_type = $${params.length}`;
    }

    query += ` GROUP BY o.observation_id, i.inspection_id, u.user_id
               ORDER BY i.inspection_date DESC, o.created_at DESC`;

    const result = await db.query(query, params);

    // Group by year
    const groupedByYear = {};
    result.rows.forEach(obs => {
      const year = new Date(obs.inspection_date).getFullYear();
      if (!groupedByYear[year]) {
        groupedByYear[year] = [];
      }
      groupedByYear[year].push(obs);
    });

    return successResponse(res, {
      total: result.rowCount,
      observations: result.rows,
      grouped_by_year: groupedByYear
    }, 'Vessel observation history retrieved successfully');

  } catch (err) {
    logger.error('Get vessel observation history error:', err);
    next(err);
  }
};