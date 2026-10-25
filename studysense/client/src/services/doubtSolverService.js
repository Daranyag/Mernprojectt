import api from './api';

const doubtSolverService = {
  /**
   * Request step-by-step conceptual breakdown for 1-tap "Explain to Me"
   */
  async explainConcept(payload) {
    const response = await api.post('/doubt-solver/explain', payload);
    return response.data;
  },

  /**
   * Interactive syllabus-aware doubt Q&A
   */
  async askDoubt(payload) {
    const response = await api.post('/doubt-solver/ask', payload);
    return response.data;
  },

  /**
   * Retrieve active academic context (subjects, topics, saved materials)
   */
  async getContext(params = {}) {
    const response = await api.get('/doubt-solver/context', { params });
    return response.data;
  },
};

export default doubtSolverService;
