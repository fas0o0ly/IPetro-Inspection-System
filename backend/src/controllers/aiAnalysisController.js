// backend/src/controllers/aiAnalysisController.js

const db = require('../config/db');
const { successResponse, errorResponse } = require('../utils/response');
//const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs');
const aiAnalysisService = require('../services/aiAnalysisService');

/**
 * POST /api/ai/analyze-report/:inspection_id
 * Analyze inspection report with AI
 */
exports.analyzeReport = async (req, res, next) => {
  try {
    const { inspection_id } = req.params;
    const userId = req.user.user_id;

    // Only admin and reviewer can trigger AI analysis
    if (req.user.role !== 'admin' && req.user.role !== 'reviewer') {
      return errorResponse(res, 'Only admins and reviewers can analyze reports', 403);
    }

    // Check if inspection and report exist
    const inspectionResult = await db.query(`
      SELECT 
        i.*,
        v.vessel_type,
        v.tag_no,
        COUNT(DISTINCT p.photo_id) as photo_count,
        COUNT(DISTINCT o.observation_id) as observation_count
      FROM inspections i
      LEFT JOIN vessels v ON i.vessel_id = v.vessel_id
      LEFT JOIN photos p ON i.inspection_id = p.inspection_id
      LEFT JOIN observations o ON i.inspection_id = o.inspection_id
      WHERE i.inspection_id = $1
      GROUP BY i.inspection_id, v.vessel_type, v.tag_no
    `, [inspection_id]);

    if (inspectionResult.rowCount === 0) {
      return errorResponse(res, 'Inspection not found', 404);
    }

    const inspection = inspectionResult.rows[0];

    console.log('🔍 Inspection data:', {
      inspection_id: inspection.inspection_id,
      report_file_url: inspection.report_file_url,
      report_number: inspection.report_number
    });

    if (!inspection.report_file_url) {
      return errorResponse(res, 'No report generated for this inspection', 404);
    }

    // IMPROVED: Better path construction
    let reportPath;
    
    // Check if report_file_url is absolute or relative
    if (path.isAbsolute(inspection.report_file_url)) {
      reportPath = inspection.report_file_url;
    } else {
      // Remove leading slash if present
      const cleanPath = inspection.report_file_url.replace(/^\//, '');
      reportPath = path.join(__dirname, '../../', cleanPath);
    }

    console.log('📂 Constructed report path:', reportPath);
    console.log('📂 Path exists:', fs.existsSync(reportPath));

    // Check if file exists
    if (!fs.existsSync(reportPath)) {
      // Try alternative path constructions
      const alternativePaths = [
        path.join(__dirname, '../../uploads/reports', path.basename(inspection.report_file_url)),
        path.join(process.cwd(), 'uploads/reports', path.basename(inspection.report_file_url)),
        path.join(process.cwd(), inspection.report_file_url.replace(/^\//, ''))
      ];

      console.log('🔍 Trying alternative paths:');
      for (const altPath of alternativePaths) {
        console.log('  -', altPath, ':', fs.existsSync(altPath));
        if (fs.existsSync(altPath)) {
          reportPath = altPath;
          console.log('✅ Found report at:', reportPath);
          break;
        }
      }

      if (!fs.existsSync(reportPath)) {
        console.error('❌ Report file not found at any location');
        return errorResponse(res, 'Report file not found on server', 404);
      }
    }

    // logger.info('Starting AI analysis', { 
    //   inspectionId: inspection_id,
    //   userId,
    //   reportPath 
    // });

    // Perform AI analysis
    const analysisResults = await aiAnalysisService.analyzeReport(reportPath, {
      vessel_type: inspection.vessel_type,
      inspection_date: inspection.inspection_date,
      photo_count: parseInt(inspection.photo_count) || 0,
      observation_count: parseInt(inspection.observation_count) || 0
    });

    // Save analysis to database
    const saveResult = await db.query(`
      INSERT INTO ai_report_analysis (
        inspection_id,
        overall_score,
        grade,
        breakdown,
        strengths,
        improvements,
        overall_comment,
        analyzed_by,
        analyzed_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING *
    `, [
      inspection_id,
      analysisResults.overall_score,
      analysisResults.grade,
      JSON.stringify(analysisResults.breakdown),
      analysisResults.strengths,
      analysisResults.improvements,
      analysisResults.overall_comment,
      userId
    ]);

    const savedAnalysis = saveResult.rows[0];

    // Update inspection with latest analysis
    await db.query(
      'UPDATE inspections SET last_ai_analysis_id = $1 WHERE inspection_id = $2',
      [savedAnalysis.analysis_id, inspection_id]
    );

    //logger.success('AI analysis completed and saved', { 
    //   analysisId: savedAnalysis.analysis_id,
    //   score: analysisResults.overall_score 
    // });

    return successResponse(
      res,
      {
        analysis: {
          ...savedAnalysis,
          breakdown: analysisResults.breakdown
        }
      },
      'Report analyzed successfully',
      201
    );

  } catch (err) {
    //logger.error('Analyze report error:', err);
    
    if (err.message === 'AI service unavailable') {
      return errorResponse(res, 'AI analysis service is currently unavailable', 503);
    }

    if (err.message.includes('quota')) {
      return errorResponse(res, 'AI service quota exceeded. Please try again later.', 429);
    }
    
    next(err);
  }
};

/**
 * GET /api/ai/analysis/:inspection_id
 * Get AI analysis for inspection
 */
exports.getAnalysis = async (req, res, next) => {
  try {
    const { inspection_id } = req.params;

    const result = await db.query(`
      SELECT 
        a.*,
        u.name as analyzed_by_name,
        i.report_number
      FROM ai_report_analysis a
      LEFT JOIN users u ON a.analyzed_by = u.user_id
      LEFT JOIN inspections i ON a.inspection_id = i.inspection_id
      WHERE a.inspection_id = $1
      ORDER BY a.analyzed_at DESC
      LIMIT 1
    `, [inspection_id]);

    if (result.rowCount === 0) {
      return errorResponse(res, 'No AI analysis found for this inspection', 404);
    }

    return successResponse(res, { analysis: result.rows[0] }, 'Analysis retrieved successfully');

  } catch (err) {
    //logger.error('Get analysis error:', err);
    next(err);
  }
};

/**
 * GET /api/ai/analysis-history/:inspection_id
 * Get all AI analyses for inspection (history)
 */
exports.getAnalysisHistory = async (req, res, next) => {
  try {
    const { inspection_id } = req.params;

    const result = await db.query(`
      SELECT 
        a.*,
        u.name as analyzed_by_name
      FROM ai_report_analysis a
      LEFT JOIN users u ON a.analyzed_by = u.user_id
      WHERE a.inspection_id = $1
      ORDER BY a.analyzed_at DESC
    `, [inspection_id]);

    return successResponse(
      res,
      { analyses: result.rows, count: result.rowCount },
      'Analysis history retrieved successfully'
    );

  } catch (err) {
    //logger.error('Get analysis history error:', err);
    next(err);
  }
};


