// src/services/aiAnalysisService.js

import api from './api';

export const aiAnalysisService = {
  // Trigger AI analysis for a report
  analyzeReport: async (inspectionId) => {
    const response = await api.post(`/ai/analyze-report/${inspectionId}`);
    return response.data;
  },

  // Get latest analysis for inspection
  getAnalysis: async (inspectionId) => {
    const response = await api.get(`/ai/analysis/${inspectionId}`);
    return response.data;
  },

  // Get analysis history
  getAnalysisHistory: async (inspectionId) => {
    const response = await api.get(`/ai/analysis-history/${inspectionId}`);
    return response.data;
  },
};