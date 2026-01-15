// src/services/photoService.js
import api from './api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'; // ✅ ADDED

export const photoService = {
  // ✅ ADDED: Get photo URL with proper encoding
  getPhotoUrl: (filename) => {
    const encodedFilename = encodeURIComponent(filename);
    return `${API_BASE_URL}/uploads/photos/${encodedFilename}`;
  },

  // Get all photos for an inspection
  getByInspection: async (inspectionId) => {
    const response = await api.get(`/photos/inspection/${inspectionId}`);
    return response.data;
  },

  // Get photos by observation
  getByObservation: async (observationId) => {
    const response = await api.get(`/photos/observation/${observationId}`);
    return response.data;
  },

  // Upload photos
  upload: async (inspectionId, files, photoGroup, observationId = null) => {
    const formData = new FormData();
    formData.append('inspection_id', inspectionId);
    formData.append('tag_number', photoGroup);
    
    if (observationId) {
      formData.append('observation_id', observationId);
    }

    // Append all files
    for (let i = 0; i < files.length; i++) {
      formData.append('photos', files[i]);
    }

    const response = await api.post('/photos/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Delete photo
  delete: async (photoId) => {
    const response = await api.delete(`/photos/${photoId}`);
    return response.data;
  },

  // Link photos to observation
  linkToObservation: async (observationId, photoIds) => {
    const response = await api.post(`/photos/link-observation`, {
      observation_id: observationId,
      photo_ids: photoIds
    });
    return response.data;
  },

  // Unlink photo from observation
  unlinkFromObservation: async (observationId, photoId) => {
    const response = await api.delete(`/photos/unlink-observation/${observationId}/${photoId}`);
    return response.data;
  },

  // Get photo groups for inspection
  getPhotoGroups: async (inspectionId) => {
    const response = await api.get(`/photos/inspection/${inspectionId}/groups`);
    return response.data;
  },

  saveAnnotations: async (photoId, annotations) => {
    const response = await api.post(`/photos/${photoId}/annotations`, {
      annotations
    });
    return response.data;
  },
};