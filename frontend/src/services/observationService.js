// src/services/observationService.js
import api from './api';

export const observationService = {
  // Get all observations
  getAll: async (params = {}) => {
    const response = await api.get('/observations', { params });
    return response.data;
  },

  // Get observation by ID
  getById: async (id) => {
    const response = await api.get(`/observations/${id}`);
    return response.data;
  },

  // Get observations by inspection
  getByInspection: async (inspectionId) => {
    const response = await api.get(`/observations/inspection/${inspectionId}`);
    return response.data;
  },

  // Get observations by vessel
  getByVessel: async (vesselId) => {
    const response = await api.get(`/observations/vessel/${vesselId}`);
    return response.data;
  },

  // Get observation statistics
  getStats: async () => {
    const response = await api.get('/observations/stats');
    return response.data;
  },

  // Create observation with multiple findings
  create: async (data) => {
    const response = await api.post('/observations', data);
    return response.data;
  },

  // Update observation
  update: async (id, data) => {
    const response = await api.put(`/observations/${id}`, data);
    return response.data;
  },

  // Delete observation
  delete: async (id) => {
    const response = await api.delete(`/observations/${id}`);
    return response.data;
  },

  // Attach photos to observation
  attachPhotos: async (observationId, photoIds) => {
    const response = await api.post(`/observations/${observationId}/photos`, { photoIds });
    return response.data;
  },

  // Get observation types (for dropdown)
  getTypes: () => {
    const types = [
      'Corrosion',
      'Erosion',
      'Cracking',
      'Deformation',
      'Mechanical Damage',
      'Weld Defect',
      'Coating Damage',
      'Pitting',
      'Leakage',
      'Structural Issue',
      'General Wear',
      'Other'
    ];
    return Promise.resolve({ data: { types } });
  },

  // Get severities (for dropdown)
  getSeverities: () => {
    const severities = ['Minor', 'Moderate', 'Major', 'Critical'];
    return Promise.resolve({ data: { severities } });
  },

  // Get statuses (for dropdown)
  getStatuses: () => {
    const statuses = [
      'Open',
      'Acceptable',
      'Monitoring Required',
      'Repair Required',
      'Closed'
    ];
    return Promise.resolve({ data: { statuses } });
  },

  // Get action required options (for dropdown)
  getActionRequired: () => {
    const actions = [
      'No Action',
      'Monitor',
      'Repair',
      'Replace',
      'Further Investigation',
      'Immediate Action'
    ];
    return Promise.resolve({ data: { actions } });
  },

  // Get priorities
  getPriorities: () => {
    const priorities = ['Low', 'Medium', 'High', 'Critical'];
    return Promise.resolve({ data: { priorities } });
  }
};