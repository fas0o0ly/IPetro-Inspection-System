// src/utils/logger.js
const db = require('../config/db');  // 

/**
 * Log activity to database (activity_logs table)
 * @param {object} options
 * @param {number} options.userId - User performing the action
 * @param {string} options.action - Action name (e.g., 'login', 'create_user')
 * @param {string} options.entity - Entity type (e.g., 'user', 'inspection', 'photo')
 * @param {number} [options.entityId] - ID of affected entity
 * @param {object} [options.details] - Additional details
 */
async function logActivity({ userId, action, entity, entityId = null, details = {} }) {
  try {
    await db.query(
      `INSERT INTO activity_logs (user_id, action, entity, entity_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, action, entity, entityId, JSON.stringify(details)]
    );
    return true;
  } catch (err) {
    console.error(' Failed to log activity:', err.message);
    // Don't throw - logging should never break the main flow
    return false;
  }
}

/**
 * Console logger with timestamps and colors
 */
const logger = {
  info: (message, data = null) => {
    console.log(`[INFO] [${new Date().toISOString()}] ${message}`, data || '');
  },
  
  error: (message, error = null) => {
    console.error(`[ERROR] [${new Date().toISOString()}] ${message}`, error || '');
  },
  
  warn: (message, data = null) => {
    console.warn(`[WARN] [${new Date().toISOString()}] ${message}`, data || '');
  },
  
  debug: (message, data = null) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] [${new Date().toISOString()}] ${message}`, data || '');
    }
  },
  
  success: (message, data = null) => {
    console.log(`✓ [SUCCESS] [${new Date().toISOString()}] ${message}`, data || '');
  }
};

/**
 * Get activity logs with filters
 * @param {object} filters
 * @param {number} [filters.userId] - Filter by user
 * @param {string} [filters.action] - Filter by action
 * @param {string} [filters.entity] - Filter by entity
 * @param {number} [filters.limit] - Limit results
 */
async function getActivityLogs({ userId, action, entity, limit = 100 } = {}) {
  try {
    let query = `
      SELECT 
        al.log_id,
        al.user_id,
        u.name as user_name,
        u.role as user_role,
        al.action,
        al.entity,
        al.entity_id,
        al.details,
        al.created_at
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.user_id
      WHERE 1=1
    `;
    const params = [];
    
    if (userId) {
      params.push(userId);
      query += ` AND al.user_id = $${params.length}`;
    }
    
    if (action) {
      params.push(action);
      query += ` AND al.action = $${params.length}`;
    }
    
    if (entity) {
      params.push(entity);
      query += ` AND al.entity = $${params.length}`;
    }
    
    params.push(limit);
    query += ` ORDER BY al.created_at DESC LIMIT $${params.length}`;
    
    const result = await db.query(query, params);
    return result.rows;
  } catch (err) {
    logger.error('Failed to get activity logs:', err);
    throw err;
  }
}

/**
 * Get recent activities for a specific user
 */
async function getUserActivity(userId, limit = 50) {
  return getActivityLogs({ userId, limit });
}

/**
 * Get system-wide recent activities
 */
async function getSystemActivity(limit = 100) {
  return getActivityLogs({ limit });
}

/**
 * Clean old activity logs (optional - for maintenance)
 * @param {number} daysOld - Delete logs older than X days
 */
async function cleanOldLogs(daysOld = 90) {
  try {
    const result = await db.query(
      `DELETE FROM activity_logs 
       WHERE created_at < NOW() - INTERVAL '1 day' * $1
       RETURNING log_id`,
      [daysOld]
    );
    logger.success(`Cleaned ${result.rowCount} old activity logs`);
    return result.rowCount;
  } catch (err) {
    logger.error('Failed to clean old logs:', err);
    throw err;
  }
}

module.exports = {
  logActivity,
  logger,
  getActivityLogs,
  getUserActivity,
  getSystemActivity,
  cleanOldLogs
};