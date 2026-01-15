// src/services/recommendationTemplateService.js
import api from './api';

export const recommendationTemplateService = {
  // Get all recommendation templates
  getAll: async () => {
    const response = await api.get('/recommendation-templates');
    return response.data;
  },

  // Get recommendation templates by action
  getByAction: async (actionRequired) => {
    const response = await api.get(`/recommendation-templates/action/${actionRequired}`);
    return response.data;
  },

  // Create custom recommendation template
  create: async (data) => {
    const response = await api.post('/recommendation-templates', data);
    return response.data;
  }
};