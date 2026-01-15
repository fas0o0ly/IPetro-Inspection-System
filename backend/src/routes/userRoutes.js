// src/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const {requireAdmin, authenticate} = require('../middlewares/auth');

// Authentication for all routes
router.use(authenticate);

// routes for admin only
router.get('/',requireAdmin, userController.getAllUsers );
router.post('/', requireAdmin, userController.createUser);
router.put('/:id/reset-password', requireAdmin, userController.resetPassword);
router.delete('/:id', requireAdmin, userController.deleteUser);

// routes for all users(including admins)
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser);


module.exports = router;