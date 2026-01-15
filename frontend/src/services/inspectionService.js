// src/services/inspectionService.js
import api from './api';

export const inspectionService = {
  // Get all inspections
  getAll: async (params = {}) => {
    const response = await api.get('/inspections', { params });
    return response.data;
  },

  // Get inspection by ID
  getById: async (id) => {
    const response = await api.get(`/inspections/${id}`);
    return response.data;
  },

  // Get inspections by vessel
  getByVessel: async (vesselId) => {
    const response = await api.get(`/inspections/vessel/${vesselId}`);
    return response.data;
  },

  // Get inspection statistics
  getStats: async () => {
    const response = await api.get('/inspections/stats');
    return response.data;
  },

  // Create inspection
  create: async (data) => {
    const response = await api.post('/inspections', data);
    return response.data;
  },

  // Update inspection
  update: async (id, data) => {
    const response = await api.put(`/inspections/${id}`, data);
    return response.data;
  },

  // Delete inspection
  delete: async (id) => {
    const response = await api.delete(`/inspections/${id}`);
    return response.data;
  },

  // Update status
  updateStatus: async (id, status) => {
    const response = await api.patch(`/inspections/${id}/status`, { status });
    return response.data;
  }
};