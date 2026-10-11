import api from './api';

export const mistakeService = {
  // Mistake Book
  getAllMistakes: (params = {}) => api.get('/mistakes', { params }),
  getMistakeById: (id) => api.get(`/mistakes/${id}`),
  updateMistake: (id, data) => api.patch(`/mistakes/${id}`, data),
  toggleMarkedForReview: (id) => api.patch(`/mistakes/${id}/review`),
  deleteMistake: (id) => api.delete(`/mistakes/${id}`),
  recordDirectMistakes: (data) => api.post('/mistakes/record', data),

  // Practice Engine
  getPracticeSession: (params = {}) => api.get('/mistakes/practice/session', { params }),
  submitPracticeAnswer: (id, data) => api.post(`/mistakes/${id}/practice-result`, data),
  getPracticeHistory: () => api.get('/mistakes/practice/history'),
};

export default mistakeService;
