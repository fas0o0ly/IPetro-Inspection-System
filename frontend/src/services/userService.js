// src/services/userService.js

import api from './api';

export const userService = {
  // Get all users (admin only)
  getAll: async (params = {}) => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  // Get user by ID (all authenticated users)
  getById: async (userId) => {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },

  // Create user (admin only)
  create: async (userData) => {
    const response = await api.post('/users', {
      username: userData.username,
      name: userData.name,
      email: userData.email,
      password: userData.password,
      role: userData.role,
      department: userData.department,
      certification_id: userData.certification_id
    });
    return response.data;
  },

  // Update user (all authenticated users - for their own profile)
  update: async (userId, userData) => {
    const response = await api.put(`/users/${userId}`, {
      username: userData.username,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      department: userData.department,
      certification_id: userData.certification_id,
      active: userData.active
    });
    return response.data;
  },

  // Reset password (admin only)
  resetPassword: async (userId, newPassword) => {
    const response = await api.put(`/users/${userId}/reset-password`, { 
      newPassword: newPassword 
    });
    return response.data;
  },

  // Delete user (admin only - soft delete)
  delete: async (userId) => {
    const response = await api.delete(`/users/${userId}`);
    return response.data;
  }
};