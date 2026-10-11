import api from './api';

export const quizGeneratorService = {
  /**
   * Ingest plain or formatted text/syllabus
   */
  async ingestTextSource(payload) {
    const res = await api.post('/quiz-generator/sources/text', payload);
    return res.data;
  },

  /**
   * Ingest file upload (PDF or PPTX)
   */
  async ingestFileUpload(formData) {
    const res = await api.post('/quiz-generator/sources/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000,
    });
    return res.data;
  },

  /**
   * Ingest web or video URL
   */
  async ingestUrlSource(payload) {
    const res = await api.post('/quiz-generator/sources/url', payload, {
      timeout: 25000,
    });
    return res.data;
  },

  /**
   * Get all ingested sources
   */
  async getSources(params = {}) {
    const res = await api.get('/quiz-generator/sources', { params });
    return res.data;
  },

  /**
   * Delete source
   */
  async deleteSource(sourceId) {
    const res = await api.delete(`/quiz-generator/sources/${sourceId}`);
    return res.data;
  },

  /**
   * Generate questions using AI
   */
  async generateQuiz(payload) {
    const res = await api.post('/quiz-generator/generate', payload, {
      timeout: 35000,
    });
    return res.data;
  },

  /**
   * Save questions to bank and optional create quiz
   */
  async saveGeneratedQuestions(payload) {
    const res = await api.post('/quiz-generator/save', payload);
    return res.data;
  },
};

export default quizGeneratorService;
