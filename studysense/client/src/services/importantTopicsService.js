import api from './api';

const importantTopicsService = {
  analyzeTopics: async (payload) => {
    const response = await api.post('/important-topics/analyze', payload);
    return response.data;
  },

  getAnalyses: async (params = {}) => {
    const response = await api.get('/important-topics', { params });
    return response.data;
  },

  getAnalysisById: async (id) => {
    const response = await api.get(`/important-topics/${id}`);
    return response.data;
  },

  updateRevisionStatus: async (analysisId, topicId, revisionStatus) => {
    const response = await api.patch(
      `/important-topics/${analysisId}/topics/${topicId}/status`,
      { revisionStatus }
    );
    return response.data;
  },

  regenerateAnalysis: async (id) => {
    const response = await api.post(`/important-topics/${id}/regenerate`);
    return response.data;
  },

  deleteAnalysis: async (id) => {
    const response = await api.delete(`/important-topics/${id}`);
    return response.data;
  }
};

export default importantTopicsService;
