import axios from 'axios';

// Normalize baseURL: if user set https://host.onrender.com without /api, ensure /api is appended
const rawBaseURL = import.meta.env.VITE_API_BASE_URL || '/api';
const cleanBaseURL = rawBaseURL.replace(/\/+$/, '');
const normalizedBaseURL = cleanBaseURL.endsWith('/api')
  ? cleanBaseURL
  : `${cleanBaseURL}/api`;

const api = axios.create({
  baseURL: normalizedBaseURL,
  withCredentials: true, // Crucial for HttpOnly cookies
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Response interceptor to normalize error responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = 'An unexpected error occurred. Please try again.';

    if (error.response) {
      // Backend returned error response
      message = error.response.data?.message || message;
      return Promise.reject({
        status: error.response.status,
        message,
        errors: error.response.data?.errors || null,
      });
    } else if (error.request) {
      // Network error (backend down or unreachable)
      message = 'Cannot connect to StudySense server. Please check your network or try again shortly.';
      return Promise.reject({
        status: 0,
        message,
        errors: null,
      });
    }

    return Promise.reject({
      status: 0,
      message: error.message || message,
      errors: null,
    });
  }
);

export default api;
