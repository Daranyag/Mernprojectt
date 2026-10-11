import api from './api';

const analyticsService = {
  getOverview: async () => {
    const response = await api.get('/analytics/overview');
    return response.data;
  },

  getSubjectPerformance: async () => {
    const response = await api.get('/analytics/subjects');
    return response.data;
  },

  getTopicPerformance: async (subjectId = null) => {
    const params = subjectId ? { subjectId } : {};
    const response = await api.get('/analytics/topics', { params });
    return response.data;
  },

  getTrends: async (limit = 15) => {
    const response = await api.get('/analytics/trends', { params: { limit } });
    return response.data;
  },

  getRecommendations: async () => {
    const response = await api.get('/analytics/recommendations');
    return response.data;
  }
};

export default analyticsService;
