// src/services/findingTemplateService.js
import api from './api';

export const findingTemplateService = {
  // Get all finding templates
  getAll: async () => {
    const response = await api.get('/finding-templates');
    return response.data;
  },

  // Get finding templates by type
  getByType: async (observationType) => {
    const response = await api.get(`/finding-templates/type/${observationType}`);
    return response.data;
  },

  // Create custom finding template
  create: async (data) => {
    const response = await api.post('/finding-templates', data);
    return response.data;
  }
};