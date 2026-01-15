// src/services/vesselService.js
import api from './api';

export const vesselService = {
  // Get all vessels
  getAll: async (params = {}) => {
    const response = await api.get('/vessels', { params });
    return response.data;
  },

  // Get vessel by ID
  getById: async (id) => {
    const response = await api.get(`/vessels/${id}`);
    return response.data;
  },

  // Get vessel by tag number
  getByTag: async (tagNo) => {
    const response = await api.get(`/vessels/tag/${tagNo}`);
    return response.data;
  },

  // Get vessel types
  getTypes: async () => {
    const response = await api.get('/vessels/types');
    return response.data;
  },

  // Get vessel statistics
  getStats: async () => {
    const response = await api.get('/vessels/stats');
    return response.data;
  },

  // Create vessel
  create: async (data) => {
    const response = await api.post('/vessels', data);
    return response.data;
  },

  // Update vessel
  update: async (id, data) => {
    const response = await api.put(`/vessels/${id}`, data);
    return response.data;
  },

  // Delete vessel
  delete: async (id) => {
    const response = await api.delete(`/vessels/${id}`);
    return response.data;
  }
};