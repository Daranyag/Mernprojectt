import api from './api';

const examPaperService = {
  getExamPapers: async (params = {}) => {
    const response = await api.get('/exam-papers', { params });
    return response.data;
  },

  getExamPaperById: async (id) => {
    const response = await api.get(`/exam-papers/${id}`);
    return response.data;
  },

  generateExamPaper: async (payload) => {
    const response = await api.post('/exam-papers/generate', payload);
    return response.data;
  },

  updateExamPaper: async (id, payload) => {
    const response = await api.put(`/exam-papers/${id}`, payload);
    return response.data;
  },

  finalizeExamPaper: async (id) => {
    const response = await api.post(`/exam-papers/${id}/finalize`);
    return response.data;
  },

  duplicateExamPaper: async (id) => {
    const response = await api.post(`/exam-papers/${id}/duplicate`);
    return response.data;
  },

  regenerateQuestion: async (id, sectionId, questionIndex) => {
    const response = await api.post(`/exam-papers/${id}/regenerate-question`, {
      sectionId,
      questionIndex
    });
    return response.data;
  },

  deleteExamPaper: async (id) => {
    const response = await api.delete(`/exam-papers/${id}`);
    return response.data;
  }
};

export default examPaperService;
