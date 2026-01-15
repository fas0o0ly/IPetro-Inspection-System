// src/services/reportService.js

import api from './api';

export const reportService = {
  // Get all reports (role-based)
  getAll: async (params = {}) => {
    const response = await api.get('/reports', { params });
    return response.data;
  },

  // Generate report for inspection
  generate: async (inspectionId) => {
    const response = await api.post(`/reports/generate/${inspectionId}`);
    return response.data;
  },

  // Get report info
  getInfo: async (inspectionId) => {
    const response = await api.get(`/reports/inspection/${inspectionId}`);
    return response.data;
  },

  // Download report
  download: async (inspectionId) => {
    const response = await api.get(`/reports/download/${inspectionId}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Update report status (admin/reviewer only)
  updateStatus: async (inspectionId, status, reviewComments) => {
    const response = await api.put(`/reports/${inspectionId}/status`, {
      status,
      review_comments: reviewComments
    });
    return response.data;
  },

  // Delete report (admin only)
  delete: async (inspectionId) => {
    const response = await api.delete(`/reports/${inspectionId}`);
    return response.data;
  },

  // Get download URL
  getDownloadUrl: (inspectionId) => {
    return `${api.defaults.baseURL}/reports/download/${inspectionId}`;
  }
};