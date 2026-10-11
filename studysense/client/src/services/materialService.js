import api from './api';

export const materialService = {
  /**
   * List study materials with optional query filters
   * @param {Object} params - { subject, topic, type, favorite, reviewed, search, sort, page, limit }
   */
  async getMaterials(params = {}) {
    const response = await api.get('/materials', { params });
    return response.data;
  },

  /**
   * Alias for getMaterials ensuring compatible response envelope
   */
  async getAllMaterials(params = {}) {
    const data = await this.getMaterials(params);
    const materialsList = data?.data?.materials || data?.materials || data?.data || [];
    return {
      success: true,
      data: {
        success: true,
        data: materialsList,
        materials: materialsList,
        pagination: data?.data?.pagination || data?.pagination,
      },
    };
  },

  /**
   * Get single material by ID
   */
  async getMaterialById(id) {
    const response = await api.get(`/materials/${id}`);
    return response.data;
  },

  /**
   * Create a new note or resource
   */
  async createMaterial(materialData) {
    const response = await api.post('/materials', materialData);
    return response.data;
  },

  /**
   * Upload a PDF file with metadata as study material
   */
  async uploadPdfMaterial(formData) {
    const response = await api.post('/materials/upload-pdf', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Update an owned material
   */
  async updateMaterial(id, materialData) {
    const response = await api.put(`/materials/${id}`, materialData);
    return response.data;
  },

  /**
   * Delete an owned material
   */
  async deleteMaterial(id) {
    const response = await api.delete(`/materials/${id}`);
    return response.data;
  },

  /**
   * Toggle favorite status
   */
  async toggleFavorite(id) {
    const response = await api.patch(`/materials/${id}/favorite`);
    return response.data;
  },

  /**
   * Toggle reviewed status
   */
  async toggleReviewed(id) {
    const response = await api.patch(`/materials/${id}/reviewed`);
    return response.data;
  },

  /**
   * Generate Short Notes via AI
   */
  async generateNotes(payload) {
    const response = await api.post('/materials/generate-notes', payload);
    return response.data;
  },
};

export default materialService;

