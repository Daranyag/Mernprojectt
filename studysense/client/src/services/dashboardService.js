import api from './api';

export const dashboardService = {
  /**
   * Fetch authenticated user's dashboard summary and learning metrics
   * @returns {Promise<Object>} API response data with dashboard overview
   */
  async getSummary() {
    const response = await api.get('/dashboard/summary');
    return response.data;
  },
};

export default dashboardService;
