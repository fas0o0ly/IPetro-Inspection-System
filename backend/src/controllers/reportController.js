// src/controllers/reportController.js
const db = require('../config/db');
const { successResponse, errorResponse } = require('../utils/response');
const { logActivity, logger } = require('../utils/logger');
const pdfService = require('../services/pdfService');
const { generateReportNumber } = require('../utils/reportHelper');
const fs = require('fs');
const path = require('path');

/**
 * POST /api/reports/generate/:inspection_id
 * Generate PDF report for inspection
 */
exports.generateReport = async (req, res, next) => {
  try {
    const { inspection_id } = req.params;

    // Get inspection details
    const inspectionResult = await db.query(`
      SELECT 
        i.*,
        v.tag_no,
        v.description as vessel_description,
        v.vessel_type,
        v.plant_unit,
        v.location,
        v.design_data,
        v.plant_identifier,
        u1.name as inspector_name,
        u1.email as inspector_email,
        u2.name as reviewer_name,
        u2.email as reviewer_email
      FROM inspections i
      LEFT JOIN vessels v ON i.vessel_id = v.vessel_id
      LEFT JOIN users u1 ON i.inspector_id = u1.user_id
      LEFT JOIN users u2 ON i.reviewer_id = u2.user_id
      WHERE i.inspection_id = $1
    `, [inspection_id]);

    if (inspectionResult.rowCount === 0) {
      return errorResponse(res, 'Inspection not found', 404);
    }

    const inspection = inspectionResult.rows[0];

    // Authorization check
    const canGenerate = req.user.role === 'admin' || 
                       req.user.user_id === inspection.inspector_id ||
                       req.user.user_id === inspection.reviewer_id;

    if (!canGenerate) {
      return errorResponse(res, 'Not authorized to generate report for this inspection', 403);
    }

    // Get observations
    const observationsResult = await db.query(`
      SELECT 
        o.*,
        ARRAY_AGG(op.photo_id) FILTER (WHERE op.photo_id IS NOT NULL) as photo_ids
      FROM observations o
      LEFT JOIN observation_photos op ON o.observation_id = op.observation_id
      WHERE o.inspection_id = $1
      GROUP BY o.observation_id
      ORDER BY o.finding_number ASC NULLS LAST, o.created_at ASC
    `, [inspection_id]);

    // UPDATED: Get only photos that are linked to observations
    const photosResult = await db.query(`
      SELECT DISTINCT p.*
      FROM photos p
      INNER JOIN observation_photos op ON p.photo_id = op.photo_id
      INNER JOIN observations o ON op.observation_id = o.observation_id
      WHERE o.inspection_id = $1
      ORDER BY p.tag_number, p.sequence_no, p.uploaded_at ASC
    `, [inspection_id]);

    // Generate report number if not exists
    let reportNumber = inspection.report_number;
    if (!reportNumber) {
      reportNumber = generateReportNumber(
        inspection.plant_unit || '1',
        inspection.tag_no
      ); 
      // Update inspection with report number
      await db.query(
        'UPDATE inspections SET report_number = $1 WHERE inspection_id = $2',
        [reportNumber, inspection_id]
      );
    }

    // Prepare report data
    const reportData = {
      inspection: {
        ...inspection,
        report_number: reportNumber,
        dosh_registration: inspection.dosh_registration
      },
      vessel: {
        tag_no: inspection.tag_no,
        description: inspection.vessel_description,
        vessel_type: inspection.vessel_type,
        plant_unit: inspection.plant_unit,
        location: inspection.location,
        design_data: inspection.design_data
      },
      observations: observationsResult.rows,
      photos: photosResult.rows,
      inspector: {
        name: inspection.inspector_name,
        email: inspection.inspector_email
      },
      reviewer: {
        name: inspection.reviewer_name,
        email: inspection.reviewer_email
      }
    };

    // Generate PDF
    const result = await pdfService.generateInspectionReport(reportData);

    // Update inspection with report info
    await db.query(`
      UPDATE inspections 
      SET report_generated_at = NOW(),
          report_generated_by = $1,
          report_file_url = $2
      WHERE inspection_id = $3
    `, [req.user.user_id, result.url, inspection_id]);

    // Log activity
    await logActivity({
      userId: req.user.user_id,
      action: 'generate_report',
      entity: 'inspection',
      entityId: parseInt(inspection_id),
      details: {
        report_number: reportNumber,
        filename: result.filename
      }
    });

    logger.success('Report generated', {
      inspectionId: inspection_id,
      filename: result.filename
    });

    return successResponse(res, {
      report_number: reportNumber,
      filename: result.filename,
      url: result.url,
      generated_at: new Date()
    }, 'Report generated successfully', 201);

  } catch (err) {
    logger.error('Generate report error:', err);
    next(err);
  }
};

/**
 * GET /api/reports/inspection/:inspection_id
 * Get report info for inspection
 */
exports.getReportInfo = async (req, res, next) => {
  try {
    const { inspection_id } = req.params;

    const result = await db.query(`
      SELECT 
        i.inspection_id,
        i.report_number,
        i.report_generated_at,
        i.report_file_url,
        u.name as generated_by_name,
        v.tag_no as vessel_tag
      FROM inspections i
      LEFT JOIN users u ON i.report_generated_by = u.user_id
      LEFT JOIN vessels v ON i.vessel_id = v.vessel_id
      WHERE i.inspection_id = $1
    `, [inspection_id]);

    if (result.rowCount === 0) {
      return errorResponse(res, 'Inspection not found', 404);
    }

    const reportInfo = result.rows[0];

    if (!reportInfo.report_number) {
      return successResponse(res, {
        report_exists: false,
        message: 'Report not yet generated'
      }, 'No report found for this inspection');
    }

    return successResponse(res, {
      report_exists: true,
      ...reportInfo
    }, 'Report info retrieved successfully');

  } catch (err) {
    logger.error('Get report info error:', err);
    next(err);
  }
};

/**
 * GET /api/reports/download/:inspection_id
 * Download report PDF
 */
exports.downloadReport = async (req, res, next) => {
  try {
    const { inspection_id } = req.params;

    const result = await db.query(`
      SELECT report_file_url, report_number, tag_no
      FROM inspections i
      LEFT JOIN vessels v ON i.vessel_id = v.vessel_id
      WHERE i.inspection_id = $1
    `, [inspection_id]);

    if (result.rowCount === 0) {
      return errorResponse(res, 'Inspection not found', 404);
    }

    const { report_file_url, report_number, tag_no } = result.rows[0];

    if (!report_file_url) {
      return errorResponse(res, 'Report not yet generated', 404);
    }

    // Get file path
    const filename = path.basename(report_file_url);
    const filepath = path.join(__dirname, '../../uploads/reports', filename);

    // Check if file exists
    if (!fs.existsSync(filepath)) {
      return errorResponse(res, 'Report file not found', 404);
    }

    // Set headers for download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${tag_no}_${report_number}.pdf"`);

    // Stream file
    const fileStream = fs.createReadStream(filepath);
    fileStream.pipe(res);

  } catch (err) {
    logger.error('Download report error:', err);
    next(err);
  }
};

/**
 * DELETE /api/reports/:inspection_id
 * Delete generated report
 */
exports.deleteReport = async (req, res, next) => {
  try {
    const { inspection_id } = req.params;

    // Only admin can delete reports
    if (req.user.role !== 'admin') {
      return errorResponse(res, 'Only admins can delete reports', 403);
    }

    const result = await db.query(`
      SELECT report_file_url
      FROM inspections
      WHERE inspection_id = $1
    `, [inspection_id]);

    if (result.rowCount === 0) {
      return errorResponse(res, 'Inspection not found', 404);
    }

    const { report_file_url } = result.rows[0];

    if (report_file_url) {
      // Delete file
      const filename = path.basename(report_file_url);
      const filepath = path.join(__dirname, '../../uploads/reports', filename);

      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
    }

    // Clear report info from database
    await db.query(`
      UPDATE inspections 
      SET report_number = NULL,
          report_generated_at = NULL,
          report_generated_by = NULL,
          report_file_url = NULL
      WHERE inspection_id = $1
    `, [inspection_id]);

    // Log activity
    await logActivity({
      userId: req.user.user_id,
      action: 'delete_report',
      entity: 'inspection',
      entityId: parseInt(inspection_id)
    });

    return successResponse(res, null, 'Report deleted successfully');

  } catch (err) {
    logger.error('Delete report error:', err);
    next(err);
  }
};

/**
 * PUT /api/reports/:inspection_id/status
 * Update report status (Admin or Reviewer only)
 */
exports.updateReportStatus = async (req, res, next) => {
  try {
    const { inspection_id } = req.params;
    const { status, review_comments } = req.body;

    // Only admin and reviewer can update status
    if (req.user.role !== 'admin' && req.user.role !== 'reviewer') {
      return errorResponse(res, 'Only admins and reviewers can update report status', 403);
    }

    // Validate status
    const validStatuses = ['approved', 'changes_requested', 'rejected'];
    if (!validStatuses.includes(status)) {
      return errorResponse(res, 'Invalid status. Must be: approved, changes_requested, or rejected', 400);
    }

    // Check if report exists
    const reportCheck = await db.query(
      'SELECT report_number, report_generated_by, reviewer_id FROM inspections WHERE inspection_id = $1',
      [inspection_id]
    );

    if (reportCheck.rowCount === 0) {
      return errorResponse(res, 'Inspection not found', 404);
    }

    if (!reportCheck.rows[0].report_number) {
      return errorResponse(res, 'No report generated for this inspection', 404);
    }

    // Update report status AND assign reviewer_id if not set
    const result = await db.query(`
      UPDATE inspections 
      SET report_status = $1,
          report_reviewed_by = $2,
          report_reviewed_at = NOW(),
          report_review_comments = $3,
          reviewer_id = COALESCE(reviewer_id, $2),
          updated_at = NOW()
      WHERE inspection_id = $4
      RETURNING inspection_id, report_number, report_status, report_reviewed_at, reviewer_id
    `, [status, req.user.user_id, review_comments || null, inspection_id]);

    // Log activity
    await logActivity({
      userId: req.user.user_id,
      action: 'update_report_status',
      entity: 'inspection',
      entityId: parseInt(inspection_id),
      details: {
        status,
        review_comments
      }
    });

    logger.success('Report status updated', {
      inspectionId: inspection_id,
      status
    });

    return successResponse(res, result.rows[0], 'Report status updated successfully');

  } catch (err) {
    logger.error('Update report status error:', err);
    next(err);
  }
};

/**
 * GET /api/reports
 * Get all reports (role-based filtering)
 */
exports.getAllReports = async (req, res, next) => {
  try {
    const { 
      status, 
      search,
      sortBy = 'report_generated_at',
      sortOrder = 'DESC',
      page = 1,
      limit = 50
    } = req.query;

    const userRole = req.user.role;
    const userId = req.user.user_id;

    // Build WHERE clause first (used for both count and data query)
    let whereClause = 'WHERE i.report_number IS NOT NULL';
    const params = [];

    // ============================================================================
    // ROLE-BASED FILTERING
    // ============================================================================
    if (userRole === 'inspector') {
      // Inspector can only see their own reports
      params.push(userId);
      whereClause += ` AND i.inspector_id = $${params.length}`;
      console.log(`🔒 Reports filtered for inspector: user_id=${userId}`);
    }
    // Admin and reviewer see ALL reports (no filter)
    // ============================================================================

    // Filter by status
    if (status) {
      params.push(status);
      whereClause += ` AND i.report_status = $${params.length}`;
    }

    // Search
    if (search) {
      params.push(`%${search}%`);
      whereClause += ` AND (
        i.report_number ILIKE $${params.length} OR 
        v.tag_no ILIKE $${params.length} OR
        v.description ILIKE $${params.length}
      )`;
    }

    // ============================================================================
    // COUNT QUERY - Get total count
    // ============================================================================
    const countQuery = `
      SELECT COUNT(*) as count
      FROM inspections i
      LEFT JOIN vessels v ON i.vessel_id = v.vessel_id
      ${whereClause}
    `;

    let countResult;
    try {
      countResult = await db.query(countQuery, params);
    } catch (countErr) {
      console.error('❌ Count query error:', countErr);
      console.error('Count query:', countQuery);
      console.error('Params:', params);
      throw countErr;
    }

    const total = countResult.rows[0] ? parseInt(countResult.rows[0].count) : 0;

    // ============================================================================
    // DATA QUERY - Get actual reports
    // ============================================================================
    let dataQuery = `
      SELECT 
        i.inspection_id,
        i.report_number,
        i.report_status,
        i.report_generated_at,
        i.report_reviewed_at,
        i.report_review_comments,
        i.report_file_url,
        v.tag_no as vessel_tag,
        v.vessel_type,
        v.description as vessel_description,
        u1.name as generated_by_name,
        u2.name as reviewed_by_name,
        i.inspection_date
      FROM inspections i
      LEFT JOIN vessels v ON i.vessel_id = v.vessel_id
      LEFT JOIN users u1 ON i.report_generated_by = u1.user_id
      LEFT JOIN users u2 ON i.report_reviewed_by = u2.user_id
      ${whereClause}
    `;

    // Sorting
    const validSortFields = ['report_generated_at', 'report_reviewed_at', 'vessel_tag', 'report_status', 'inspection_date'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'report_generated_at';
    const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    // Map sort field to actual column with table alias
    const sortMapping = {
      'vessel_tag': 'v.tag_no',
      'report_status': 'i.report_status',
      'report_generated_at': 'i.report_generated_at',
      'report_reviewed_at': 'i.report_reviewed_at',
      'inspection_date': 'i.inspection_date'
    };
    const actualSortField = sortMapping[sortField] || `i.${sortField}`;
    
    dataQuery += ` ORDER BY ${actualSortField} ${order}`;

    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    params.push(parseInt(limit));
    dataQuery += ` LIMIT $${params.length}`;
    params.push(offset);
    dataQuery += ` OFFSET $${params.length}`;

    let dataResult;
    try {
      dataResult = await db.query(dataQuery, params);
    } catch (dataErr) {
      console.error('❌ Data query error:', dataErr);
      console.error('Data query:', dataQuery);
      console.error('Params:', params);
      throw dataErr;
    }

    console.log(`✅ Retrieved ${dataResult.rowCount} reports (total: ${total})`);

    return successResponse(res, {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
      reports: dataResult.rows
    }, 'Reports retrieved successfully');

  } catch (err) {
    console.error('❌ Get all reports error:', err);
    console.error('Error details:', {
      message: err.message,
      stack: err.stack
    });
    next(err);
  }
};