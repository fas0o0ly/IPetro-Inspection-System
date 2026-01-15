// backend/src/controllers/dashboardController.js

const db = require('../config/db');
const { successResponse, errorResponse } = require('../utils/response');
const { logger } = require('../utils/logger');

/**
 * GET /api/dashboard/stats
 * Get dashboard statistics (role-based)
 */
exports.getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user.user_id;
    const userRole = req.user.role;
    const isAdmin = userRole === 'admin';
    const isInspector = userRole === 'inspector';
    const isReviewer = userRole === 'reviewer';

    // Base stats object
    const stats = {
      vessels: { total: 0, recent: 0 },
      inspections: { total: 0, active: 0, pending_review: 0, completed: 0 },
      photos: { total: 0, recent: 0 },
      observations: { total: 0, require_action: 0 },
      reports: { total: 0, pending: 0, approved: 0, changes_requested: 0 },
      reviewer_stats: null // Only for reviewers
    };

    // VESSELS STATS
    if (isAdmin) {
      const vesselResult = await db.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as recent
        FROM vessels
      `);
      stats.vessels = vesselResult.rows[0];
    } else {
      const vesselResult = await db.query(`
        SELECT 
          COUNT(DISTINCT v.vessel_id) as total,
          COUNT(DISTINCT v.vessel_id) FILTER (WHERE i.created_at >= NOW() - INTERVAL '30 days') as recent
        FROM vessels v
        INNER JOIN inspections i ON v.vessel_id = i.vessel_id
        WHERE (i.inspector_id = $1 OR i.reviewer_id = $1)
      `, [userId]);
      stats.vessels = vesselResult.rows[0];
    }

    // INSPECTIONS STATS
    let inspectionQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status IN ('in_progress', 'pending_review')) as active,
        COUNT(*) FILTER (WHERE status = 'pending_review') as pending_review,
        COUNT(*) FILTER (WHERE status = 'completed') as completed
      FROM inspections
      WHERE 1=1
    `;
    const inspectionParams = [];

    if (isInspector) {
      inspectionParams.push(userId);
      inspectionQuery += ` AND inspector_id = $${inspectionParams.length}`;
    } else if (isReviewer) {
      inspectionParams.push(userId);
      inspectionQuery += ` AND reviewer_id = $${inspectionParams.length}`;
    }

    const inspectionResult = await db.query(inspectionQuery, inspectionParams);
    stats.inspections = inspectionResult.rows[0];

    // PHOTOS STATS
    if (isAdmin) {
      const photoResult = await db.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE uploaded_at >= NOW() - INTERVAL '1 day') as recent
        FROM photos
      `);
      stats.photos = photoResult.rows[0];
    } else {
      const photoResult = await db.query(`
        SELECT 
          COUNT(p.photo_id) as total,
          COUNT(p.photo_id) FILTER (WHERE p.uploaded_at >= NOW() - INTERVAL '1 day') as recent
        FROM photos p
        INNER JOIN inspections i ON p.inspection_id = i.inspection_id
        WHERE (i.inspector_id = $1 OR i.reviewer_id = $1)
      `, [userId]);
      stats.photos = photoResult.rows[0];
    }

    // OBSERVATIONS STATS
    if (isAdmin) {
      const observationResult = await db.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE severity IN ('critical', 'major')) as require_action
        FROM observations
      `);
      stats.observations = observationResult.rows[0];
    } else {
      const observationResult = await db.query(`
        SELECT 
          COUNT(o.observation_id) as total,
          COUNT(o.observation_id) FILTER (WHERE o.severity IN ('critical', 'major')) as require_action
        FROM observations o
        INNER JOIN inspections i ON o.inspection_id = i.inspection_id
        WHERE (i.inspector_id = $1 OR i.reviewer_id = $1)
      `, [userId]);
      stats.observations = observationResult.rows[0];
    }

    // REPORTS STATS - Different for Reviewer
if (isReviewer) {
  // Reviewer sees ALL reports that need review, not just assigned to them
  const reviewerReportResult = await db.query(`
    SELECT 
      COUNT(*) FILTER (WHERE report_number IS NOT NULL) as total_reports,
      COUNT(*) FILTER (WHERE report_reviewed_by = $1 AND report_number IS NOT NULL) as reviewed_by_me,
      COUNT(*) FILTER (WHERE report_number IS NOT NULL AND report_reviewed_by IS NULL) as not_reviewed,
      COUNT(*) FILTER (WHERE report_reviewed_by = $1 AND report_status = 'approved') as approved_by_me,
      COUNT(*) FILTER (WHERE report_reviewed_by = $1 AND report_status = 'changes_requested') as changes_requested_by_me,
      COUNT(*) FILTER (WHERE report_reviewed_by = $1 AND report_status = 'rejected') as rejected_by_me
    FROM inspections
    WHERE 1=1
  `, [userId]);

  const result = reviewerReportResult.rows[0];

  stats.reviewer_stats = {
    total_reports: parseInt(result.total_reports) || 0,
    reviewed_by_me: parseInt(result.reviewed_by_me) || 0,
    not_reviewed: parseInt(result.not_reviewed) || 0,
    approved_by_me: parseInt(result.approved_by_me) || 0,
    changes_requested_by_me: parseInt(result.changes_requested_by_me) || 0,
    rejected_by_me: parseInt(result.rejected_by_me) || 0
  };
  
  stats.reports = {
    total: parseInt(result.total_reports) || 0,
    pending: parseInt(result.not_reviewed) || 0,
    approved: parseInt(result.approved_by_me) || 0,
    changes_requested: parseInt(result.changes_requested_by_me) || 0
  };

    } else {
      // Admin or Inspector stats
      let reportQuery = `
        SELECT 
          COUNT(*) FILTER (WHERE report_number IS NOT NULL) as total,
          COUNT(*) FILTER (WHERE report_status = 'pending' AND report_number IS NOT NULL) as pending,
          COUNT(*) FILTER (WHERE report_status = 'approved') as approved,
          COUNT(*) FILTER (WHERE report_status = 'changes_requested') as changes_requested
        FROM inspections
        WHERE 1=1
      `;
      const reportParams = [];

      if (isInspector) {
        reportParams.push(userId);
        reportQuery += ` AND inspector_id = $${reportParams.length}`;
      }

      const reportResult = await db.query(reportQuery, reportParams);
      stats.reports = reportResult.rows[0];
    }

    return successResponse(res, stats, 'Dashboard stats retrieved successfully');

  } catch (err) {
    logger.error('Get dashboard stats error:', err);
    next(err);
  }
};

/**
 * GET /api/dashboard/recent-inspections
 * Get recent inspections (role-based)
 */
exports.getRecentInspections = async (req, res, next) => {
  try {
    const userId = req.user.user_id;
    const userRole = req.user.role;
    const limit = parseInt(req.query.limit) || 5;

    let query = `
      SELECT 
        i.inspection_id,
        i.inspection_date,
        i.status,
        v.tag_no as vessel_tag,
        v.description as vessel_description,
        v.vessel_type,
        u.name as inspector_name
      FROM inspections i
      LEFT JOIN vessels v ON i.vessel_id = v.vessel_id
      LEFT JOIN users u ON i.inspector_id = u.user_id
      WHERE 1=1
    `;
    const params = [];

    if (userRole === 'inspector') {
      params.push(userId);
      query += ` AND i.inspector_id = $${params.length}`;
    } else if (userRole === 'reviewer') {
      params.push(userId);
      query += ` AND i.reviewer_id = $${params.length}`;
    }

    query += ` ORDER BY i.created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await db.query(query, params);

    return successResponse(res, result.rows, 'Recent inspections retrieved successfully');

  } catch (err) {
    logger.error('Get recent inspections error:', err);
    next(err);
  }
};

/**
 * GET /api/dashboard/upcoming-tasks
 * Get upcoming inspection tasks (role-based)
 */
exports.getUpcomingTasks = async (req, res, next) => {
  try {
    const userId = req.user.user_id;
    const userRole = req.user.role;
    const limit = parseInt(req.query.limit) || 5;

    let query = `
      SELECT 
        i.inspection_id,
        i.inspection_date,
        i.status,
        i.next_inspection_date,
        v.tag_no as vessel_tag,
        v.description as vessel_description,
        v.vessel_type,
        (i.next_inspection_date - CURRENT_DATE) as days_until
      FROM inspections i
      LEFT JOIN vessels v ON i.vessel_id = v.vessel_id
      WHERE i.next_inspection_date IS NOT NULL
        AND i.next_inspection_date >= CURRENT_DATE
    `;
    const params = [];

    if (userRole === 'inspector') {
      params.push(userId);
      query += ` AND i.inspector_id = $${params.length}`;
    } else if (userRole === 'reviewer') {
      params.push(userId);
      query += ` AND i.reviewer_id = $${params.length}`;
    }

    query += ` ORDER BY i.next_inspection_date ASC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await db.query(query, params);

    return successResponse(res, result.rows, 'Upcoming tasks retrieved successfully');

  } catch (err) {
    logger.error('Get upcoming tasks error:', err);
    next(err);
  }
};

/**
 * GET /api/dashboard/reviewed-reports
 * Get recent reports reviewed by the current reviewer
 */
exports.getReviewedReports = async (req, res, next) => {
  try {
    const { limit = 5 } = req.query;
    const userId = req.user.user_id;

    const result = await db.query(`
      SELECT 
        i.inspection_id,
        i.report_number,
        i.report_status,
        i.report_reviewed_at,
        v.tag_no as vessel_tag,
        v.vessel_type
      FROM inspections i
      JOIN vessels v ON i.vessel_id = v.vessel_id
      WHERE i.report_reviewed_by = $1
        AND i.report_number IS NOT NULL
        AND i.report_status IS NOT NULL
      ORDER BY i.report_reviewed_at DESC
      LIMIT $2
    `, [userId, parseInt(limit)]);

    // ✅ Return array directly or wrap in data object based on your API structure
    return res.json({
      success: true,
      data: result.rows, // ✅ This should be an array
      message: 'Reviewed reports retrieved successfully'
    });
  } catch (err) {
    console.error('Get reviewed reports error:', err);
    return res.status(500).json({
      success: false,
      data: [],
      message: 'Failed to fetch reviewed reports'
    });
  }
};

/**
 * GET /api/dashboard/pending-reports
 * Get reports pending review (for reviewers)
 */
exports.getPendingReports = async (req, res, next) => {
  try {
    const { limit = 5 } = req.query;

    const result = await db.query(`
      SELECT 
        i.inspection_id,
        i.report_number,
        i.report_generated_at,
        v.tag_no as vessel_tag,
        v.vessel_type
      FROM inspections i
      JOIN vessels v ON i.vessel_id = v.vessel_id
      WHERE i.report_number IS NOT NULL
        AND (i.report_status IS NULL OR i.report_status = 'pending')
      ORDER BY i.report_generated_at ASC
      LIMIT $1
    `, [parseInt(limit)]);

    // ✅ Return array directly or wrap in data object
    return res.json({
      success: true,
      data: result.rows, // ✅ This should be an array
      message: 'Pending reports retrieved successfully'
    });
  } catch (err) {
    console.error('Get pending reports error:', err);
    return res.status(500).json({
      success: false,
      data: [],
      message: 'Failed to fetch pending reports'
    });
  }
};

module.exports = exports;