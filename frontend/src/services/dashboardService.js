// src/services/dashboardService.js

import api from './api';

export const dashboardService = {
  // Get dashboard stats
  getStats: async () => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },

  // Get recent inspections
  getRecentInspections: async (limit = 5) => {
    const response = await api.get('/dashboard/recent-inspections', {
      params: { limit }
    });
    return response.data;
  },

  // Get upcoming tasks
  getUpcomingTasks: async (limit = 5) => {
    const response = await api.get('/dashboard/upcoming-tasks', {
      params: { limit }
    });
    return response.data;
  },

   getReviewedReports: async (limit = 5) => {
    const response = await api.get(`/dashboard/reviewed-reports?limit=${limit}`);
    console.log('📊 Reviewed Reports API Response:', response);
    return response;
  },
  
  getPendingReports: async (limit = 5) => {
    const response = await api.get(`/dashboard/pending-reports?limit=${limit}`);
    console.log('📊 Pending Reports API Response:', response);
    return response;
  },
};