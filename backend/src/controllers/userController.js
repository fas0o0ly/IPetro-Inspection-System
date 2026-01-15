// src/controllers/userController.js
const db = require('../config/db');
const { hashPassword } = require('../utils/hash');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * GET /api/users
 * Get all users (Admin only)
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    const { 
      role, 
      active, 
      search,
      sortBy = 'created_at',
      sortOrder = 'DESC',
      page = 1,
      limit = 50
    } = req.query;
    
    let query = `
      SELECT user_id, username, name, email, role, department, certification_id, active, created_at 
      FROM users 
      WHERE 1=1
    `;
    const params = [];
    
    // Filter by role
    if (role) {
      params.push(role);
      query += ` AND role = $${params.length}`;
    }
    
    // Filter by active status
    if (active !== undefined) {
      params.push(active === 'true');
      query += ` AND active = $${params.length}`;
    }
    
    // Search across username, name, and email
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (
        username ILIKE $${params.length} OR 
        name ILIKE $${params.length} OR 
        email ILIKE $${params.length}
      )`;
    }
    
    // Count total matching records
    const countQuery = query.replace(
      'SELECT user_id, username, name, email, role, department, certification_id, active, created_at',
      'SELECT COUNT(*)'
    );
    const countResult = await db.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);
    
    // Sorting
    const validSortFields = ['name', 'username', 'email', 'role', 'created_at'];
    const validSortOrders = ['ASC', 'DESC'];
    
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const order = validSortOrders.includes(sortOrder?.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';
    
    query += ` ORDER BY ${sortField} ${order}`;
    
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
      users: result.rows
    }, 'Users retrieved successfully');
    
  } catch (err) {
    logger.error('Get all users error:', err);
    next(err);
  }
};

/**
 * GET /api/users/:id
 * Get user by ID (Admin or self)
 */
exports.getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (req.user.role !== 'admin' && req.user.user_id !== parseInt(id)) {
      return errorResponse(res, 'Not authorized to view this user', 403);
    }
    
    const result = await db.query(
      `SELECT user_id, username, name, email, role, department, certification_id, active, created_at, updated_at
       FROM users 
       WHERE user_id = $1`,
      [id]
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
 * POST /api/users
 * Create new user (Admin only)
 */
exports.createUser = async (req, res, next) => {
  try {
    const { username, name, email, password, role, department, certification_id } = req.body;  // ← Added username

    // Validation
    if (!username || !name || !email || !password || !role) {
      return errorResponse(res, 'Username, name, email, password, and role are required', 400);
    }

    // Validate username format (alphanumeric, underscore, dash, 3-50 chars)
    const usernameRegex = /^[a-zA-Z0-9_-]{3,50}$/;
    if (!usernameRegex.test(username)) {
      return errorResponse(res, 'Username must be 3-50 characters (letters, numbers, _, -)', 400);
    }

    // Validate role
    const validRoles = ['inspector', 'reviewer', 'admin'];
    if (!validRoles.includes(role)) {
      return errorResponse(res, 'Invalid role. Must be: inspector, reviewer, or admin', 400);
    }

    // Password validation
    if (password.length < 8) {
      return errorResponse(res, 'Password must be at least 8 characters', 400);
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return errorResponse(res, 'Invalid email format', 400);
    }

    // Hash password
    const password_hash = await hashPassword(password);

    // Insert user
    const result = await db.query(
      `INSERT INTO users (username, name, email, password_hash, role, department, certification_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING user_id, username, name, email, role, department, certification_id, active, created_at`,
      [username, name, email, password_hash, role, department, certification_id]
    ); 

    const newUser = result.rows[0];

    // Log activity
    await db.query(
      `INSERT INTO activity_logs (user_id, action, entity, entity_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        req.user.user_id,
        'create_user',
        'user',
        newUser.user_id,
        JSON.stringify({ 
          created_user: newUser.name, 
          username: newUser.username,
          email: newUser.email,
          role: newUser.role 
        })
      ]
    );

    return successResponse(res, newUser, 'User created successfully', 201);

  } catch (err) {
    // Handle duplicate username or email
    if (err.code === '23505') {
      if (err.constraint === 'users_username_key') {
        return errorResponse(res, 'Username already exists', 409);
      }
      if (err.constraint === 'users_email_key') {
        return errorResponse(res, 'Email already exists', 409);
      }
      return errorResponse(res, 'Username or email already exists', 409);
    }
    next(err);
  }
};


/**
 * PUT /api/users/:id
 * Update user (Admin or self - limited fields)
 */
exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { username, name, email, role, department, certification_id, active } = req.body; 

    const isAdmin = req.user.role === 'admin';
    const isSelf = req.user.user_id === parseInt(id);

    if (!isAdmin && !isSelf) {
      return errorResponse(res, 'Not authorized to update this user', 403);
    }

    let query = 'UPDATE users SET updated_at = NOW()';
    const params = [];
    let paramCount = 0;

    
    if (username && isAdmin) {  // Only admin can change username
      const usernameRegex = /^[a-zA-Z0-9_-]{3,50}$/;
      if (!usernameRegex.test(username)) {
        return errorResponse(res, 'Invalid username format', 400);
      }
      params.push(username);
      query += `, username = $${++paramCount}`;
    }

    if (name) {
      params.push(name);
      query += `, name = $${++paramCount}`;
    }

    if (department) {
      params.push(department);
      query += `, department = $${++paramCount}`;
    }

    if (certification_id) {
      params.push(certification_id);
      query += `, certification_id = $${++paramCount}`;
    }

    // Admin-only fields
    if (isAdmin) {
      if (email) {
        params.push(email);
        query += `, email = $${++paramCount}`;
      }

      if (role) {
        const validRoles = ['inspector', 'reviewer', 'admin'];
        if (!validRoles.includes(role)) {
          return errorResponse(res, 'Invalid role', 400);
        }
        params.push(role);
        query += `, role = $${++paramCount}`;
      }

      if (active !== undefined) {
        params.push(active);
        query += `, active = $${++paramCount}`;
      }
    }

    params.push(id);
    query += ` WHERE user_id = $${++paramCount} 
               RETURNING user_id, username, name, email, role, department, certification_id, active`;

    const result = await db.query(query, params);

    if (result.rowCount === 0) {
      return errorResponse(res, 'User not found', 404);
    }

    // Log activity
    await db.query(
      `INSERT INTO activity_logs (user_id, action, entity, entity_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.user.user_id, 'update_user', 'user', id, JSON.stringify(req.body)]
    );

    return successResponse(res, result.rows[0], 'User updated successfully');

  } catch (err) {
    if (err.code === '23505') {
      if (err.constraint === 'users_username_key') {
        return errorResponse(res, 'Username already exists', 409);
      }
      if (err.constraint === 'users_email_key') {
        return errorResponse(res, 'Email already exists', 409);
      }
      return errorResponse(res, 'Username or email already exists', 409);
    }
    next(err);
  }
};

/**
 * PUT /api/users/:id/reset-password
 * Reset user password (Admin only)
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return errorResponse(res, 'New password is required', 400);
    }

    if (newPassword.length < 8) {
      return errorResponse(res, 'Password must be at least 8 characters', 400);
    }

    // Hash new password
    const password_hash = await hashPassword(newPassword);

    // Update password
    const result = await db.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE user_id = $2 RETURNING user_id, name, email',
      [password_hash, id]
    );

    if (result.rowCount === 0) {
      return errorResponse(res, 'User not found', 404);
    }

    // Log activity
    await db.query(
      `INSERT INTO activity_logs (user_id, action, entity, entity_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        req.user.user_id,
        'reset_password',
        'user',
        id,
        JSON.stringify({ target_user: result.rows[0].name })
      ]
    );

    return successResponse(res, null, 'Password reset successfully');

  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/users/:id
 * Soft delete user (Admin only)
 */
exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Prevent deleting yourself
    if (req.user.user_id === parseInt(id)) {
      return errorResponse(res, 'Cannot delete your own account', 400);
    }

    // Soft delete (set active = false)
    const result = await db.query(
      'UPDATE users SET active = false, updated_at = NOW() WHERE user_id = $1 RETURNING user_id, name, email',
      [id]
    );

    if (result.rowCount === 0) {
      return errorResponse(res, 'User not found', 404);
    }

    // Log activity
    await db.query(
      `INSERT INTO activity_logs (user_id, action, entity, entity_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        req.user.user_id,
        'delete_user',
        'user',
        id,
        JSON.stringify({ deleted_user: result.rows[0].name })
      ]
    );

    return successResponse(res, null, 'User deleted successfully');

  } catch (err) {
    next(err);
  }
};