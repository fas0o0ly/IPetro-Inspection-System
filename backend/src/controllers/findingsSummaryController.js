const db = require('../config/db');
const { successResponse, errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Get findings summary for an inspection
 */
exports.getFindingsSummary = async (req, res, next) => {
  try {
    const { inspectionId } = req.params;

    const result = await db.query(
      `SELECT 
        fs.*,
        v.tag_no as vessel_tag_no,
        i.inspection_type
      FROM findings_summary fs
      JOIN vessels v ON fs.vessel_id = v.vessel_id
      JOIN inspections i ON fs.inspection_id = i.inspection_id
      WHERE fs.inspection_id = $1`,
      [inspectionId]
    );

    if (result.rowCount === 0) {
      return errorResponse(res, 'Findings summary not found', 404);
    }

    return successResponse(
      res,
      { findingsSummary: result.rows[0] },
      'Findings summary retrieved successfully'
    );
  } catch (err) {
    //logger.error('Get findings summary error:', err);
    next(err);
  }
};

/**
 * Create or update findings summary
 */
exports.upsertFindingsSummary = async (req, res, next) => {
  try {
    const { inspectionId } = req.params;
    const {
      initial_inspection,
      post_inspection,
      external_findings,
      internal_findings,
      ndt_testings,
      recommendations
    } = req.body;

    const userId = req.user.user_id;

    // Get vessel_id from inspection
    const inspectionResult = await db.query(
      'SELECT vessel_id FROM inspections WHERE inspection_id = $1',
      [inspectionId]
    );

    if (inspectionResult.rowCount === 0) {
      return errorResponse(res, 'Inspection not found', 404);
    }

    const vesselId = inspectionResult.rows[0].vessel_id;

    // Check if summary exists
    const existingResult = await db.query(
      'SELECT summary_id FROM findings_summary WHERE inspection_id = $1',
      [inspectionId]
    );

    let result;

    if (existingResult.rowCount > 0) {
      // Update existing
      result = await db.query(
        `UPDATE findings_summary SET
          initial_inspection = $1,
          post_inspection = $2,
          external_findings = $3,
          internal_findings = $4,
          ndt_testings = $5,
          recommendations = $6,
          updated_at = NOW()
        WHERE inspection_id = $7
        RETURNING *`,
        [
          initial_inspection,
          post_inspection,
          JSON.stringify(external_findings || []),
          JSON.stringify(internal_findings || []),
          ndt_testings,
          JSON.stringify(recommendations || []),
          inspectionId
        ]
      );
    } else {
      // Create new
      result = await db.query(
        `INSERT INTO findings_summary (
          inspection_id,
          vessel_id,
          initial_inspection,
          post_inspection,
          external_findings,
          internal_findings,
          ndt_testings,
          recommendations,
          created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [
          inspectionId,
          vesselId,
          initial_inspection || 'Not applicable',
          post_inspection,
          JSON.stringify(external_findings || []),
          JSON.stringify(internal_findings || []),
          ndt_testings,
          JSON.stringify(recommendations || []),
          userId
        ]
      );
    }

    //logger.success('Findings summary saved', { inspectionId });

    return successResponse(
      res,
      { findingsSummary: result.rows[0] },
      'Findings summary saved successfully',
      existingResult.rowCount > 0 ? 200 : 201
    );
  } catch (err) {
    //logger.error('Upsert findings summary error:', err);
    next(err);
  }
};

/**
 * Get default NDT text based on vessel tag
 */
exports.getDefaultNDT = async (req, res, next) => {
  try {
    const { vesselId } = req.params;

    const result = await db.query(
      'SELECT tag_no FROM vessels WHERE vessel_id = $1',
      [vesselId]
    );

    if (result.rowCount === 0) {
      return errorResponse(res, 'Vessel not found', 404);
    }

    const tagNo = result.rows[0].tag_no;
    let defaultNDT = '';

    if (tagNo.startsWith('V-')) {
      defaultNDT = 'UTTM: No significant wall lost detected compared to nominal thickness. Please refer attachment report.';
    } else if (tagNo.startsWith('R-')) {
      defaultNDT = 'UTTM: No significant wall loss detected compared to nominal thickness upon testing. Please refer UTTM report.';
    } else {
      defaultNDT = 'UTTM: No significant wall loss detected compared to nominal thickness upon testing. Please refer UTTM report.';
    }

    return successResponse(
      res,
      { defaultNDT, vesselTag: tagNo },
      'Default NDT retrieved successfully'
    );
  } catch (err) {
    //logger.error('Get default NDT error:', err);
    next(err);
  }
};

/**
 * Delete findings summary
 */
exports.deleteFindingsSummary = async (req, res, next) => {
  try {
    const { inspectionId } = req.params;

    const result = await db.query(
      'DELETE FROM findings_summary WHERE inspection_id = $1 RETURNING *',
      [inspectionId]
    );

    if (result.rowCount === 0) {
      return errorResponse(res, 'Findings summary not found', 404);
    }

    //logger.success('Findings summary deleted', { inspectionId });

    return successResponse(
      res,
      null,
      'Findings summary deleted successfully'
    );
  } catch (err) {
    //logger.error('Delete findings summary error:', err);
    next(err);
  }
};