// src/controllers/authController.js
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { comparePassword } = require('../utils/hash');
const { successResponse, errorResponse } = require('../utils/response');


/**
 * POST /api/auth/login
 */
exports.login = async (req, res, next) => {
  try {
    const { login, password } = req.body;

    // Validation
    if (!login || !password) {
      return errorResponse(res, 'Username/email and password are required', 400);
    }

    // Check if login is email or username
    const isEmail = login.includes('@');
    
    // Find user by username OR email
    const result = await db.query(
      `SELECT user_id, username, name, email, password_hash, role, department, certification_id, active 
       FROM users 
       WHERE ${isEmail ? 'email' : 'username'} = $1 AND active = true`,
      [login]
    );

    if (result.rowCount === 0) {
      return errorResponse(res, 'Invalid credentials', 401);
    }

    const user = result.rows[0];

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      return errorResponse(res, 'Invalid credentials', 401);
    }

    // Create token payload
    const payload = {
      user_id: user.user_id,
      username: user.username,  
      email: user.email,
      name: user.name,
      role: user.role
    };

    // Generate JWT
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '8h'
    });

    // Log activity
    await db.query(
      `INSERT INTO activity_logs (user_id, action, entity, details)
       VALUES ($1, $2, $3, $4)`,
      [user.user_id, 'login', 'auth', JSON.stringify({ 
        timestamp: new Date(), 
        login_method: isEmail ? 'email' : 'username',
        ip: req.ip 
      })]
    );

    // Return response
    return successResponse(res, {
      token,
      user: {
        user_id: user.user_id,
        username: user.username,  
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        certification_id: user.certification_id
      }
    }, 'Login successful');

  } catch (err) {
    next(err);
  }
};


/**
 * GET /api/auth/me
 * Get current user info
 */
/**
 * GET /api/auth/me
 */
exports.getCurrentUser = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT user_id, username, name, email, role, department, certification_id, active, created_at
       FROM users 
       WHERE user_id = $1`,
      [req.user.user_id]
    );

    if (result.rowCount === 0) {
      return errorResponse(res, 'User not found', 404);
    }

    return successResponse(res, result.rows[0], 'User retrieved successfully');
  } catch (err) {
    next(err);
  }
};
/**
 * POST /api/auth/change-password
 * Allow users to change their own password
 * Protected route - requires authentication
 */
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.user_id;

    // Validation
    if (!currentPassword || !newPassword) {
      return errorResponse(res, 'Current password and new password are required', 400);
    }

    if (newPassword.length < 8) {
      return errorResponse(res, 'New password must be at least 8 characters', 400);
    }

    // Get current password hash
    const userResult = await db.query(
      'SELECT password_hash FROM users WHERE user_id = $1',
      [userId]
    );

    if (userResult.rowCount === 0) {
      return errorResponse(res, 'User not found', 404);
    }

    // Verify current password
    const isValid = await comparePassword(currentPassword, userResult.rows[0].password_hash);
    if (!isValid) {
      return errorResponse(res, 'Current password is incorrect', 401);
    }

    // Hash new password
    const { hashPassword } = require('../utils/hash');
    const newPasswordHash = await hashPassword(newPassword);

    // Update password
    await db.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE user_id = $2',
      [newPasswordHash, userId]
    );

    // Log activity
    await db.query(
      `INSERT INTO activity_logs (user_id, action, entity, details)
       VALUES ($1, $2, $3, $4)`,
      [userId, 'password_change', 'user', JSON.stringify({ timestamp: new Date() })]
    );

    return successResponse(res, null, 'Password changed successfully');

  } catch (err) {
    next(err);
  }
};



/**
 * POST /api/auth/logout
 * Logout (mainly handled client-side)
 * Protected route - requires authentication
 */
exports.logout = async (req, res, next) => {
  try {
    // Log logout activity
    await db.query(
      `INSERT INTO activity_logs (user_id, action, entity, details)
       VALUES ($1, $2, $3, $4)`,
      [req.user.user_id, 'logout', 'auth', JSON.stringify({ timestamp: new Date() })]
    );

    return successResponse(res, null, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
};
