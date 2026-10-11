import api from './api';

export const authService = {
  /**
   * Register a new user account
   */
  async register(userData) {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  /**
   * Log in with credentials
   */
  async login(credentials) {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  /**
   * Log out of current session and clear HttpOnly cookie
   */
  async logout() {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  /**
   * Fetch authenticated user profile using active HttpOnly session cookie
   */
  async getCurrentUser() {
    const response = await api.get('/auth/me');
    return response.data;
  },

  /**
   * Update authenticated user profile details
   */
  async updateProfile(profileData) {
    const response = await api.put('/auth/profile', profileData);
    return response.data;
  },

  /**
   * Change user account password
   */
  async changePassword(passwordData) {
    const response = await api.put('/auth/change-password', passwordData);
    return response.data;
  },

  /**
   * Health check
   */
  async checkHealth() {
    const response = await api.get('/health');
    return response.data;
  },
};

export default authService;
