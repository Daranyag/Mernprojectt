import api from './api';

export const questionService = {
  // Question Bank
  getAllQuestions: (params = {}) => api.get('/questions', { params }),
  getQuestionById: (id) => api.get(`/questions/${id}`),
  createQuestion: (data) => api.post('/questions', data),
  updateQuestion: (id, data) => api.put(`/questions/${id}`, data),
  deleteQuestion: (id) => api.delete(`/questions/${id}`),

  // Quiz Management
  getAllQuizzes: (params = {}) => api.get('/quizzes', { params }),
  getQuizById: (id) => api.get(`/quizzes/${id}`),
  createQuiz: (data) => api.post('/quizzes', data),
  updateQuiz: (id, data) => api.put(`/quizzes/${id}`, data),
  deleteQuiz: (id) => api.delete(`/quizzes/${id}`),

  // Quiz Taking & Submission
  getQuizForTaking: (id) => api.get(`/quizzes/${id}/take`),
  submitQuiz: (id, submissionData) => api.post(`/quizzes/${id}/submit`, submissionData),

  // Quiz Attempts & Results
  getAllAttempts: (params = {}) => api.get('/quiz-attempts', { params }),
  getAttemptById: (id) => api.get(`/quiz-attempts/${id}`),
};

export default questionService;
