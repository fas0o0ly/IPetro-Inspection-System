// src/controllers/activityController.js
const { getUserActivity, getSystemActivity, logger } = require('../utils/logger');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * GET /api/activities
 * Get system-wide activity logs (Admin only)
 */
exports.getSystemActivities = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const activities = await getSystemActivity(limit);
    
    return successResponse(res, activities, 'Activity logs retrieved');
  } catch (err) {
    logger.error('Failed to get system activities:', err);
    next(err);
  }
};

/**
 * GET /api/activities/me
 * Get current user's activity logs
 */
exports.getMyActivities = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const activities = await getUserActivity(req.user.user_id, limit);
    
    return successResponse(res, activities, 'Your activity logs retrieved');
  } catch (err) {
    logger.error('Failed to get user activities:', err);
    next(err);
  }
};

/**
 * GET /api/activities/user/:id
 * Get specific user's activity logs (Admin only)
 */
exports.getUserActivities = async (req, res, next) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const activities = await getUserActivity(parseInt(id), limit);
    
    return successResponse(res, activities, 'User activity logs retrieved');
  } catch (err) {
    logger.error('Failed to get user activities:', err);
    next(err);
  }
};