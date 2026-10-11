import api from './api';

export const subjectService = {
  /**
   * List all subjects for authenticated user
   */
  async getSubjects() {
    const response = await api.get('/subjects');
    return response.data;
  },

  /**
   * Alias for getSubjects supporting axios response format and direct array
   */
  async getAllSubjects() {
    const resData = await this.getSubjects();
    const rawSubjects = resData?.data?.subjects || resData?.subjects || [];
    const subjects = rawSubjects.map((s) => ({
      ...s,
      _id: s._id || s.id,
      id: s.id || s._id,
    }));
    return {
      success: true,
      data: {
        success: true,
        data: subjects,
        subjects: subjects,
      },
    };
  },

  /**
   * Get single subject by ID with topics and progress
   */
  async getSubjectById(subjectId) {
    const response = await api.get(`/subjects/${subjectId}`);
    return response.data;
  },

  /**
   * Create a new subject
   */
  async createSubject(subjectData) {
    const response = await api.post('/subjects', subjectData);
    return response.data;
  },

  /**
   * Update an owned subject
   */
  async updateSubject(subjectId, subjectData) {
    const response = await api.put(`/subjects/${subjectId}`, subjectData);
    return response.data;
  },

  /**
   * Delete an owned subject (cascades child topics)
   */
  async deleteSubject(subjectId) {
    const response = await api.delete(`/subjects/${subjectId}`);
    return response.data;
  },
};

export default subjectService;
