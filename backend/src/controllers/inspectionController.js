// src/controllers/inspectionController.js
const db = require('../config/db');
const { successResponse, errorResponse } = require('../utils/response');
const { logActivity, logger } = require('../utils/logger');

/**
 * Constants for inspection types and priorities
 */
const INSPECTION_TYPES = ['Initial', 'Periodic', 'Emergency', 'Pre-Shutdown', 'Post-Repair'];
const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];
const STATUSES = ['draft', 'submitted', 'under_review', 'changes_requested', 'approved', 'archived'];

/**
 * GET /api/inspections
 * Get all inspections with search and filters
 */
exports.getAllInspections = async (req, res, next) => {
  try {
    const { 
      search,
      status,
      inspection_type,
      priority,
      vessel_id,
      inspector_id,
      reviewer_id,
      is_overdue,
      date_from,
      date_to,
      next_inspection_date,
      findings_summary,
      sortBy = 'created_at',
      sortOrder = 'DESC',
      page = 1,
      limit = 50
    } = req.query;
    
    let query = `
      SELECT 
        i.inspection_id,
        i.vessel_id,
        v.tag_no as vessel_tag,
        v.vessel_type,
        i.inspector_id,
        u1.name as inspector_name,
        i.reviewer_id,
        u2.name as reviewer_name,
        i.status,
        i.inspection_type,
        i.priority,
        i.inspection_date,
        i.scheduled_date,
        i.due_date,
        i.next_inspection_date,
        i.findings_summary,
        i.completed_date,
        i.is_overdue,
        i.remarks,
        i.version,
        i.created_at,
        i.updated_at,
        i.report_file_url,
        i.report_number,
        i.report_generated_at,
        i.last_ai_analysis_id,
        u1.email as inspector_email,
        u2.email as reviewer_email,
        i.dosh_registration
      FROM inspections i
      LEFT JOIN vessels v ON i.vessel_id = v.vessel_id
      LEFT JOIN users u1 ON i.inspector_id = u1.user_id
      LEFT JOIN users u2 ON i.reviewer_id = u2.user_id
      WHERE 1=1
    `;
    const params = [];
    
    /**
 * Role-Based Data Filtering
 * - Admin: sees all inspections
 * - Reviewer: sees all inspections
 * - Inspector: sees only their own inspections
 */
const userRole = req.user.role;
const userId = req.user.user_id;

if (userRole === 'inspector') {
  // Inspector can only see their own inspections
  params.push(userId);
  query += ` AND i.inspector_id = $${params.length}`;
  
  console.log(`🔒 Inspector filter applied: user_id=${userId}`);
}
    // Search across vessel tag, inspector name, remarks
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (
        v.tag_no ILIKE $${params.length} OR 
        u1.name ILIKE $${params.length} OR
        u2.name ILIKE $${params.length} OR
        i.remarks ILIKE $${params.length}
      )`;
    }
    
    // Filter by status
    if (status) {
      params.push(status);
      query += ` AND i.status = $${params.length}`;
    }
    
    // Filter by inspection type
    if (inspection_type) {
      params.push(inspection_type);
      query += ` AND i.inspection_type = $${params.length}`;
    }
    
    // Filter by priority
    if (priority) {
      params.push(priority);
      query += ` AND i.priority = $${params.length}`;
    }
    
    // Filter by vessel
    if (vessel_id) {
      params.push(vessel_id);
      query += ` AND i.vessel_id = $${params.length}`;
    }
    
    // Filter by inspector
    if (inspector_id) {
      params.push(inspector_id);
      query += ` AND i.inspector_id = $${params.length}`;
    }
    
    // Filter by reviewer
    if (reviewer_id) {
      params.push(reviewer_id);
      query += ` AND i.reviewer_id = $${params.length}`;
    }
    
    // Filter by overdue status
    if (is_overdue !== undefined) {
      params.push(is_overdue === 'true');
      query += ` AND i.is_overdue = $${params.length}`;
    }
    
    // Filter by date range
    if (date_from) {
      params.push(date_from);
      query += ` AND i.inspection_date >= $${params.length}`;
    }
    
    if (date_to) {
      params.push(date_to);
      query += ` AND i.inspection_date <= $${params.length}`;
    }
    
    // Count total matching records
    const countQuery = query.replace(
      /SELECT[\s\S]*?FROM/,
      'SELECT COUNT(*) FROM'
    );
    const countResult = await db.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);
    
    // Sorting
    const validSortFields = [
      'inspection_date', 'scheduled_date', 'due_date', 'created_at', 
      'status', 'priority', 'vessel_tag', 'inspector_name'
    ];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const order = ['ASC', 'DESC'].includes(sortOrder?.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';
    
    // Map sort field to actual column
    const sortMapping = {
      'vessel_tag': 'v.tag_no',
      'inspector_name': 'u1.name',
      'reviewer_name': 'u2.name'
    };
    const actualSortField = sortMapping[sortField] || `i.${sortField}`;
    
    query += ` ORDER BY ${actualSortField} ${order}`;
    
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
      inspections: result.rows
    }, 'Inspections retrieved successfully');
    
  } catch (err) {
    logger.error('Get all inspections error:', err);
    next(err);
  }
};

/**
 * GET /api/inspections/stats
 * Get inspection statistics with role-based filtering
 */
exports.getInspectionStats = async (req, res, next) => {
  try {
    // ============================================================================
    // ROLE-BASED FILTERING
    // ============================================================================
    const userRole = req.user.role;
    const userId = req.user.user_id;
    
    let whereClause = '';
    const params = [];
    
    if (userRole === 'inspector') {
      params.push(userId);
      whereClause = ` WHERE inspector_id = $${params.length}`;
      console.log(`🔒 Stats filtered for inspector: user_id=${userId}`);
    }
    // Admin and reviewer see all stats (no filter)
    // ============================================================================
    
    // Total inspections
    const totalResult = await db.query(`SELECT COUNT(*) FROM inspections${whereClause}`, params);
    
    // By status
    const byStatusResult = await db.query(`
      SELECT status, COUNT(*) as count
      FROM inspections
      ${whereClause}
      GROUP BY status
      ORDER BY count DESC
    `, params);
    
    // By priority
    const byPriorityResult = await db.query(`
      SELECT priority, COUNT(*) as count
      FROM inspections
      ${whereClause ? whereClause + ' AND' : 'WHERE'} priority IS NOT NULL
      GROUP BY priority
      ORDER BY 
        CASE priority
          WHEN 'Critical' THEN 1
          WHEN 'High' THEN 2
          WHEN 'Medium' THEN 3
          WHEN 'Low' THEN 4
        END
    `, params);
    
    // By type
    const byTypeResult = await db.query(`
      SELECT inspection_type, COUNT(*) as count
      FROM inspections
      ${whereClause ? whereClause + ' AND' : 'WHERE'} inspection_type IS NOT NULL
      GROUP BY inspection_type
      ORDER BY count DESC
    `, params);
    
    // Overdue inspections
    const overdueClause = whereClause ? whereClause + ' AND is_overdue = true' : 'WHERE is_overdue = true';
    const overdueResult = await db.query(`SELECT COUNT(*) FROM inspections ${overdueClause}`, params);
    
    // Completed this month
    const thisMonthClause = whereClause 
      ? whereClause + ' AND completed_date >= DATE_TRUNC(\'month\', CURRENT_DATE) AND status = \'approved\''
      : 'WHERE completed_date >= DATE_TRUNC(\'month\', CURRENT_DATE) AND status = \'approved\'';
    const thisMonthResult = await db.query(`
      SELECT COUNT(*) 
      FROM inspections 
      ${thisMonthClause}
    `, params);
    
    // Pending review
    const pendingClause = whereClause
      ? whereClause + ' AND status IN (\'submitted\', \'under_review\')'
      : 'WHERE status IN (\'submitted\', \'under_review\')';
    const pendingResult = await db.query(`
      SELECT COUNT(*) 
      FROM inspections 
      ${pendingClause}
    `, params);

    return successResponse(res, {
      total: parseInt(totalResult.rows[0].count),
      overdue: parseInt(overdueResult.rows[0].count),
      completed_this_month: parseInt(thisMonthResult.rows[0].count),
      pending_review: parseInt(pendingResult.rows[0].count),
      by_status: byStatusResult.rows,
      by_priority: byPriorityResult.rows,
      by_type: byTypeResult.rows
    }, 'Inspection statistics retrieved successfully');

  } catch (err) {
    logger.error('Get inspection stats error:', err);
    next(err);
  }
};

/**
 * GET /api/inspections/overdue
 * Get overdue inspections
 */
exports.getOverdueInspections = async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT 
        i.inspection_id,
        i.vessel_id,
        v.tag_no as vessel_tag,
        i.inspector_id,
        u.name as inspector_name,
        i.status,
        i.inspection_type,
        i.priority,
        i.due_date,
        i.scheduled_date,
        DATE_PART('day', CURRENT_DATE - i.due_date) as days_overdue,
        i.remarks
      FROM inspections i
      LEFT JOIN vessels v ON i.vessel_id = v.vessel_id
      LEFT JOIN users u ON i.inspector_id = u.user_id
      WHERE i.is_overdue = true
      ORDER BY i.due_date ASC
    `);

    return successResponse(res, {
      total: result.rowCount,
      inspections: result.rows
    }, 'Overdue inspections retrieved successfully');

  } catch (err) {
    logger.error('Get overdue inspections error:', err);
    next(err);
  }
};

/**
 * GET /api/inspections/my
 * Get inspections assigned to current user
 */
exports.getMyInspections = async (req, res, next) => {
  try {
    const userId = req.user.user_id;
    const { status } = req.query;
    
    let query = `
      SELECT 
        i.inspection_id,
        i.vessel_id,
        v.tag_no as vessel_tag,
        v.vessel_type,
        i.status,
        i.inspection_type,
        i.priority,
        i.inspection_date,
        i.scheduled_date,
        i.due_date,
        i.next_inspection_date,
        i.findings_summary,
        i.is_overdue,
        i.remarks,
        i.created_at
      FROM inspections i
      LEFT JOIN vessels v ON i.vessel_id = v.vessel_id
      WHERE i.inspector_id = $1
    `;
    const params = [userId];
    
    if (status) {
      params.push(status);
      query += ` AND i.status = $${params.length}`;
    }
    
    query += ` ORDER BY i.created_at DESC`;
    
    const result = await db.query(query, params);

    return successResponse(res, {
      total: result.rowCount,
      inspections: result.rows
    }, 'Your inspections retrieved successfully');

  } catch (err) {
    logger.error('Get my inspections error:', err);
    next(err);
  }
};

/**
 * GET /api/inspections/:id
 * Get inspection by ID with full details
 */
exports.getInspectionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(`
      SELECT 
        i.*,
        i.dosh_registration,
        v.tag_no as vessel_tag,
        v.description as vessel_description,
        v.vessel_type,
        v.plant_unit,
        v.location as vessel_location,
        u1.name as inspector_name,
        u1.email as inspector_email,
        u2.name as reviewer_name,
        u2.email as reviewer_email,
        (SELECT COUNT(*) FROM photos WHERE inspection_id = i.inspection_id) as photo_count,
        (SELECT COUNT(*) FROM observations WHERE inspection_id = i.inspection_id) as observation_count
      FROM inspections i
      LEFT JOIN vessels v ON i.vessel_id = v.vessel_id
      LEFT JOIN users u1 ON i.inspector_id = u1.user_id
      LEFT JOIN users u2 ON i.reviewer_id = u2.user_id
      WHERE i.inspection_id = $1
    `, [id]);

    if (result.rowCount === 0) {
      return errorResponse(res, 'Inspection not found', 404);
    }

    return successResponse(res, result.rows[0], 'Inspection retrieved successfully');
  } catch (err) {
    logger.error('Get inspection by ID error:', err);
    next(err);
  }
};

/**
 * GET /api/inspections/:id/history
 * Get version history of an inspection
 */
exports.getInspectionHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Get all versions of this inspection (current and previous)
    const result = await db.query(`
      WITH RECURSIVE inspection_chain AS (
        -- Start with the requested inspection
        SELECT 
          inspection_id,
          vessel_id,
          inspector_id,
          status,
          version,
          previous_inspection_id,
          created_at,
          updated_at,
          1 as depth
        FROM inspections
        WHERE inspection_id = $1
        
        UNION ALL
        
        -- Recursively get previous versions
        SELECT 
          i.inspection_id,
          i.vessel_id,
          i.inspector_id,
          i.status,
          i.version,
          i.previous_inspection_id,
          i.created_at,
          i.updated_at,
          ic.depth + 1
        FROM inspections i
        INNER JOIN inspection_chain ic ON i.inspection_id = ic.previous_inspection_id
      )
      SELECT 
        ic.*,
        u.name as inspector_name,
        v.tag_no as vessel_tag
      FROM inspection_chain ic
      LEFT JOIN users u ON ic.inspector_id = u.user_id
      LEFT JOIN vessels v ON ic.vessel_id = v.vessel_id
      ORDER BY ic.version DESC
    `, [id]);

    return successResponse(res, {
      total_versions: result.rowCount,
      history: result.rows
    }, 'Inspection history retrieved successfully');

  } catch (err) {
    logger.error('Get inspection history error:', err);
    next(err);
  }
};

/**
 * POST /api/inspections
 * Create new inspection
 */
exports.createInspection = async (req, res, next) => {
  try {
    const {
      vessel_id,
      inspection_type,
      priority = 'Medium',
      inspection_date,
      scheduled_date,
      due_date,
      next_inspection_date,   
      findings_summary,
      remarks,
      weather_conditions,
      dosh_registration
    } = req.body;

    // Validation
    if (!vessel_id) {
      return errorResponse(res, 'Vessel ID is required', 400);
    }

    if (!inspection_type) {
      return errorResponse(res, 'Inspection type is required', 400);
    }

    if (!INSPECTION_TYPES.includes(inspection_type)) {
      return errorResponse(res, `Invalid inspection type. Must be one of: ${INSPECTION_TYPES.join(', ')}`, 400);
    }

    if (!PRIORITIES.includes(priority)) {
      return errorResponse(res, `Invalid priority. Must be one of: ${PRIORITIES.join(', ')}`, 400);
    }

    // Check if vessel exists
    const vesselCheck = await db.query('SELECT vessel_id FROM vessels WHERE vessel_id = $1', [vessel_id]);
    if (vesselCheck.rowCount === 0) {
      return errorResponse(res, 'Vessel not found', 404);
    }

const sanitizeDate = (date) => {
      if (!date || date === '' || date === 'null' || date === 'undefined') {
        return null;
      }
      return date;
    };
    // Auto-assign inspector (current user if inspector, otherwise set null)
    const inspector_id = req.user.role === 'inspector' ? req.user.user_id : null;

    // Insert inspection
    const result = await db.query(`
      INSERT INTO inspections (
        vessel_id,
        inspector_id,
        inspection_type,
        priority,
        status,
        inspection_date,
        scheduled_date,
        due_date,
        next_inspection_date,
        findings_summary,
        remarks,
        weather_conditions,
        version,
        dosh_registration
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `, [
      vessel_id,
      inspector_id,
      inspection_type,
      priority,
      'draft',
      sanitizeDate(inspection_date),
      sanitizeDate(scheduled_date),
      sanitizeDate(due_date),
      sanitizeDate(next_inspection_date),
      findings_summary,
      remarks,
      weather_conditions ? JSON.stringify(weather_conditions) : null,
      1,
      dosh_registration || null
    ]);

    const newInspection = result.rows[0];

    // Log activity
    await logActivity({
      userId: req.user.user_id,
      action: 'create_inspection',
      entity: 'inspection',
      entityId: newInspection.inspection_id,
      details: {
        vessel_id,
        inspection_type,
        priority
      }
    });

    logger.success('Inspection created', {
      inspectionId: newInspection.inspection_id,
      vesselId: vessel_id
    });

    return successResponse(res, newInspection, 'Inspection created successfully', 201);

  } catch (err) {
    logger.error('Inspection creation error:', err);
    next(err);
  }
};

/**
 * PUT /api/inspections/:id
 * Update inspection
 */
exports.updateInspection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      vessel_id,
      inspector_id,
      reviewer_id,
      inspection_type,
      priority,
      inspection_date,
      scheduled_date,
      due_date,
      next_inspection_date,   
      findings_summary,
      completed_date,
      duration_hours,
      remarks,
      weather_conditions,
      status,
      dosh_registration
    } = req.body;

    // Check if inspection exists and get current status
    const checkResult = await db.query(
      'SELECT status, inspector_id FROM inspections WHERE inspection_id = $1',
      [id]
    );

    if (checkResult.rowCount === 0) {
      return errorResponse(res, 'Inspection not found', 404);
    }

    const currentStatus = checkResult.rows[0].status;
    const currentInspectorId = checkResult.rows[0].inspector_id;

    // Authorization check
    const isAdmin = req.user.role === 'admin';
    const isAssignedInspector = currentInspectorId === req.user.user_id;

    if (!isAdmin && !isAssignedInspector) {
      return errorResponse(res, 'Not authorized to update this inspection', 403);
    }

    // Cannot edit approved or archived inspections (admin can)
    if (['approved', 'archived'].includes(currentStatus) && !isAdmin) {
      return errorResponse(res, 'Cannot edit approved or archived inspections', 400);
    }

    // Validate inspection type if provided
    if (inspection_type && !INSPECTION_TYPES.includes(inspection_type)) {
      return errorResponse(res, `Invalid inspection type. Must be one of: ${INSPECTION_TYPES.join(', ')}`, 400);
    }

    // Validate priority if provided
    if (priority && !PRIORITIES.includes(priority)) {
      return errorResponse(res, `Invalid priority. Must be one of: ${PRIORITIES.join(', ')}`, 400);
    }

    const sanitizeDate = (date) => {
      if (!date || date === '' || date === 'null' || date === 'undefined') {
        return null;
      }
      return date;
    };
    
    // Build update query
    let query = 'UPDATE inspections SET updated_at = NOW()';
    const params = [];
    let paramCount = 0;

    if (vessel_id !== undefined) {
      params.push(vessel_id);
      query += `, vessel_id = $${++paramCount}`;
    }

    if (inspector_id !== undefined && inspector_id !== null && inspector_id !== '') {
      params.push(inspector_id);
      query += `, inspector_id = $${++paramCount}`;
      console.log(`✅ Updating inspector_id to: ${inspector_id}`);
    } else if (inspector_id !== undefined) {
      // Log when frontend sends null/empty but we're ignoring it
      console.warn(`⚠️ Ignoring invalid inspector_id value:`, inspector_id);
    }

    if (reviewer_id !== undefined) {
      params.push(reviewer_id);
      query += `, reviewer_id = $${++paramCount}`;
    }

    if (inspection_type !== undefined) {
      params.push(inspection_type);
      query += `, inspection_type = $${++paramCount}`;
    }

    if (priority !== undefined) {
      params.push(priority);
      query += `, priority = $${++paramCount}`;
    }

    if (inspection_date !== undefined) {
      params.push(sanitizeDate(inspection_date));
      query += `, inspection_date = $${++paramCount}`;
    }

    if (scheduled_date !== undefined) {
      params.push(sanitizeDate(scheduled_date));
      query += `, scheduled_date = $${++paramCount}`;
    }

    if (due_date !== undefined) {
      params.push(sanitizeDate(due_date));
      query += `, due_date = $${++paramCount}`;
    }

    if (next_inspection_date !== undefined) {
      params.push(sanitizeDate(next_inspection_date));
      query += `, next_inspection_date = $${++paramCount}`;
    }

    if (findings_summary !== undefined) {
      params.push(findings_summary);
      query += `, findings_summary = $${++paramCount}`;
    }

    if (completed_date !== undefined) {
      params.push(sanitizeDate(completed_date));
      query += `, completed_date = $${++paramCount}`;
    }

    if (duration_hours !== undefined) {
      params.push(duration_hours);
      query += `, duration_hours = $${++paramCount}`;
    }

    if (remarks !== undefined) {
      params.push(remarks);
      query += `, remarks = $${++paramCount}`;
    }

    if (weather_conditions !== undefined) {
      params.push(JSON.stringify(weather_conditions));
      query += `, weather_conditions = $${++paramCount}`;
    }

    if (status !== undefined) {
      params.push(status);
      query += `, status = $${++paramCount}`;
    }

    if (dosh_registration !== undefined) {
      params.push(dosh_registration);
      query += `, dosh_registration = $${++paramCount}`;
    }

    if (paramCount === 0) {
      return errorResponse(res, 'No fields to update', 400);
    }

    params.push(id);
    query += ` WHERE inspection_id = $${++paramCount} RETURNING *`;

    const result = await db.query(query, params);

    // Log activity
    await logActivity({
      userId: req.user.user_id,
      action: 'update_inspection',
      entity: 'inspection',
      entityId: parseInt(id),
      details: req.body
    });

    logger.success('Inspection updated', { inspectionId: id });

    return successResponse(res, result.rows[0], 'Inspection updated successfully');

  } catch (err) {
    logger.error('Inspection update error:', err);
    next(err);
  }
};

/**
 * PUT /api/inspections/:id/submit
 * Submit inspection for review
 */
exports.submitInspection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reviewer_id } = req.body;

    // Check if inspection exists
    const checkResult = await db.query(
      'SELECT status, inspector_id FROM inspections WHERE inspection_id = $1',
      [id]
    );

    if (checkResult.rowCount === 0) {
      return errorResponse(res, 'Inspection not found', 404);
    }

    const currentStatus = checkResult.rows[0].status;
    const inspectorId = checkResult.rows[0].inspector_id;

    // Authorization check
    if (req.user.user_id !== inspectorId && req.user.role !== 'admin') {
      return errorResponse(res, 'Only the assigned inspector can submit this inspection', 403);
    }

    // Can only submit from draft or changes_requested status
    if (!['draft', 'changes_requested'].includes(currentStatus)) {
      return errorResponse(res, `Cannot submit inspection with status: ${currentStatus}`, 400);
    }

    // Verify reviewer exists if provided
    if (reviewer_id) {
      const reviewerCheck = await db.query(
        "SELECT user_id FROM users WHERE user_id = $1 AND role IN ('reviewer', 'admin')",
        [reviewer_id]
      );
      if (reviewerCheck.rowCount === 0) {
        return errorResponse(res, 'Invalid reviewer. Must be a reviewer or admin.', 400);
      }
    }

    // Update status to submitted
    const result = await db.query(`
      UPDATE inspections 
      SET status = 'submitted',
          reviewer_id = COALESCE($1, reviewer_id),
          updated_at = NOW()
      WHERE inspection_id = $2
      RETURNING *
    `, [reviewer_id, id]);

    // Log activity
    await logActivity({
      userId: req.user.user_id,
      action: 'submit_inspection',
      entity: 'inspection',
      entityId: parseInt(id),
      details: { new_status: 'submitted', reviewer_id }
    });

    logger.success('Inspection submitted', { inspectionId: id });

    return successResponse(res, result.rows[0], 'Inspection submitted for review successfully');

  } catch (err) {
    logger.error('Submit inspection error:', err);
    next(err);
  }
};

/**
 * PUT /api/inspections/:id/approve
 * Approve inspection (Reviewer only)
 */
exports.approveInspection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;

    // Check if user is reviewer or admin
    if (!['reviewer', 'admin'].includes(req.user.role)) {
      return errorResponse(res, 'Only reviewers or admins can approve inspections', 403);
    }

    // Check if inspection exists
    const checkResult = await db.query(
      'SELECT status, reviewer_id FROM inspections WHERE inspection_id = $1',
      [id]
    );

    if (checkResult.rowCount === 0) {
      return errorResponse(res, 'Inspection not found', 404);
    }

    const currentStatus = checkResult.rows[0].status;
    const reviewerId = checkResult.rows[0].reviewer_id;

    // Authorization check (must be assigned reviewer or admin)
    if (reviewerId !== req.user.user_id && req.user.role !== 'admin') {
      return errorResponse(res, 'You are not the assigned reviewer for this inspection', 403);
    }

    // Can only approve from submitted or under_review status
    if (!['submitted', 'under_review'].includes(currentStatus)) {
      return errorResponse(res, `Cannot approve inspection with status: ${currentStatus}`, 400);
    }

    // Update status to approved
    const result = await db.query(`
      UPDATE inspections 
      SET status = 'approved',
          completed_date = CURRENT_DATE,
          updated_at = NOW()
      WHERE inspection_id = $1
      RETURNING *
    `, [id]);

    // Insert review record
    await db.query(`
      INSERT INTO reviews (inspection_id, reviewer_id, status, comments)
      VALUES ($1, $2, $3, $4)
    `, [id, req.user.user_id, 'approved', comments]);

    // Log activity
    await logActivity({
      userId: req.user.user_id,
      action: 'approve_inspection',
      entity: 'inspection',
      entityId: parseInt(id),
      details: { new_status: 'approved', comments }
    });

    logger.success('Inspection approved', { inspectionId: id, reviewerId: req.user.user_id });

    return successResponse(res, result.rows[0], 'Inspection approved successfully');

  } catch (err) {
    logger.error('Approve inspection error:', err);
    next(err);
  }
};

/**
 * PUT /api/inspections/:id/reject
 * Reject inspection and request changes (Reviewer only)
 */
exports.rejectInspection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;

    if (!comments) {
      return errorResponse(res, 'Comments are required when requesting changes', 400);
    }

    // Check if user is reviewer or admin
    if (!['reviewer', 'admin'].includes(req.user.role)) {
      return errorResponse(res, 'Only reviewers or admins can request changes', 403);
    }

    // Check if inspection exists
    const checkResult = await db.query(
      'SELECT status, reviewer_id FROM inspections WHERE inspection_id = $1',
      [id]
    );

    if (checkResult.rowCount === 0) {
      return errorResponse(res, 'Inspection not found', 404);
    }

    const currentStatus = checkResult.rows[0].status;
    const reviewerId = checkResult.rows[0].reviewer_id;

    // Authorization check (must be assigned reviewer or admin)
    if (reviewerId !== req.user.user_id && req.user.role !== 'admin') {
      return errorResponse(res, 'You are not the assigned reviewer for this inspection', 403);
    }

    // Can only reject from submitted or under_review status
    if (!['submitted', 'under_review'].includes(currentStatus)) {
      return errorResponse(res, `Cannot reject inspection with status: ${currentStatus}`, 400);
    }

    // Update status to changes_requested
    const result = await db.query(`
      UPDATE inspections 
      SET status = 'changes_requested',
          updated_at = NOW()
      WHERE inspection_id = $1
      RETURNING *
    `, [id]);

    // Insert review record
    await db.query(`
      INSERT INTO reviews (inspection_id, reviewer_id, status, comments)
      VALUES ($1, $2, $3, $4)
    `, [id, req.user.user_id, 'changes_requested', comments]);

    // Log activity
    await logActivity({
      userId: req.user.user_id,
      action: 'reject_inspection',
      entity: 'inspection',
      entityId: parseInt(id),
      details: { new_status: 'changes_requested', comments }
    });

    logger.warn('Inspection changes requested', { inspectionId: id, reviewerId: req.user.user_id });

    return successResponse(res, result.rows[0], 'Changes requested successfully');

  } catch (err) {
    logger.error('Reject inspection error:', err);
    next(err);
  }
};

/**
 * DELETE /api/inspections/:id
 * Delete inspection (soft delete by archiving)
 */
exports.deleteInspection = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if inspection exists
    const checkResult = await db.query(
      'SELECT status, inspector_id FROM inspections WHERE inspection_id = $1',
      [id]
    );

    if (checkResult.rowCount === 0) {
      return errorResponse(res, 'Inspection not found', 404);
    }

    const currentStatus = checkResult.rows[0].status;
    const inspectorId = checkResult.rows[0].inspector_id;

    // Authorization check
    const isAdmin = req.user.role === 'admin';
    const isAssignedInspector = inspectorId === req.user.user_id;

    if (!isAdmin && !isAssignedInspector) {
      return errorResponse(res, 'Not authorized to delete this inspection', 403);
    }

    // Cannot delete approved inspections (admin can archive)
    if (currentStatus === 'approved' && !isAdmin) {
      return errorResponse(res, 'Cannot delete approved inspections. Contact administrator.', 400);
    }

    // For approved inspections, archive instead of delete
    if (currentStatus === 'approved' && isAdmin) {
      const result = await db.query(`
        UPDATE inspections 
        SET status = 'archived', updated_at = NOW()
        WHERE inspection_id = $1
        RETURNING inspection_id
      `, [id]);

      await logActivity({
        userId: req.user.user_id,
        action: 'archive_inspection',
        entity: 'inspection',
        entityId: parseInt(id)
      });

      logger.warn('Inspection archived', { inspectionId: id });
      return successResponse(res, null, 'Inspection archived successfully');
    }

    // For non-approved inspections, actually delete
    const result = await db.query(
      'DELETE FROM inspections WHERE inspection_id = $1 RETURNING inspection_id',
      [id]
    );

    // Log activity
    await logActivity({
      userId: req.user.user_id,
      action: 'delete_inspection',
      entity: 'inspection',
      entityId: parseInt(id)
    });

    logger.warn('Inspection deleted', { inspectionId: id, deletedBy: req.user.user_id });

    return successResponse(res, null, 'Inspection deleted successfully');

  } catch (err) {
    logger.error('Inspection deletion error:', err);
    next(err);
  }
};

/**
 * GET /api/inspections/types
 * Get all available inspection types
 */
exports.getInspectionTypes = async (req, res, next) => {
  try {
    return successResponse(res, {
      types: INSPECTION_TYPES,
      priorities: PRIORITIES,
      statuses: STATUSES
    }, 'Inspection types retrieved successfully');
  } catch (err) {
    next(err);
  }
};