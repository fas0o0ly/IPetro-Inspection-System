const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token' });
  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

/**
 * Check if user has specific role(s)
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        error: 'Authentication required' 
      });
    }

    // Admin has access to everything
    if (req.user.role === 'admin') {
      return next();
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        error: 'Insufficient permissions',
        required: allowedRoles,
        current: req.user.role
      });
    }

    next();
  };
}

const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Admin access required' });
  }
  next();
};

const requireInspector = requireRole('inspector');
const requireReviewer = requireRole('reviewer');
const requireInspectorOrReviewer = requireRole('inspector', 'reviewer');


function requireOwnership(userIdField = 'user_id') {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    // Admin can access everything
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user owns the resource
    const resourceUserId = req.params[userIdField] || req.body[userIdField];
    if (parseInt(resourceUserId) !== req.user.user_id) {
      return res.status(403).json({ 
        success: false,
        error: 'You can only access your own resources' 
      });
    }

    next();
  };
}

// // Strict inspector-only (example)
// function requireInspector(req, res, next) {
//   if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
//   if (req.user.role !== 'inspector') return res.status(403).json({ error: 'Only inspectors allowed' });
//   next();
// }


module.exports = { 
  authenticate,  
  requireRole, 
  requireAdmin,
  requireInspector,
  requireReviewer,
  requireInspectorOrReviewer,
  requireOwnership
};