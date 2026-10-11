import api from './api';

export const topicService = {
  /**
   * List topics for a specific subject
   */
  async getTopicsBySubject(subjectId) {
    const response = await api.get(`/subjects/${subjectId}/topics`);
    return response.data;
  },

  /**
   * Create topic under a parent subject
   */
  async createTopic(subjectId, topicData) {
    const response = await api.post(`/subjects/${subjectId}/topics`, topicData);
    return response.data;
  },

  /**
   * Get single topic by ID
   */
  async getTopicById(topicId) {
    const response = await api.get(`/topics/${topicId}`);
    return response.data;
  },

  /**
   * Update topic details or status
   */
  async updateTopic(topicId, topicData) {
    const response = await api.put(`/topics/${topicId}`, topicData);
    return response.data;
  },

  /**
   * Bulk create topics under a parent subject
   */
  async createBulkTopics(subjectId, data) {
    const response = await api.post(`/subjects/${subjectId}/topics/bulk`, data);
    return response.data;
  },

  /**
   * Extract topic candidates from syllabus text
   */
  async extractTopicsFromSyllabus(subjectId, data) {
    const response = await api.post(`/subjects/${subjectId}/topics/extract`, data);
    return response.data;
  },

  /**
   * Delete topic
   */
  async deleteTopic(topicId) {
    const response = await api.delete(`/topics/${topicId}`);
    return response.data;
  },
};

export default topicService;
