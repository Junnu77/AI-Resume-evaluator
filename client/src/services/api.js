import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://ai-resume-evaluator-remw.onrender.com/api',
  timeout: 120000, // 2-minute timeout to allow for LLM evaluation calls
});

// Add a request interceptor to add the auth token
api.interceptors.request.use((config) => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
      }
    } catch (e) {
      // Corrupted localStorage entry — clear it
      localStorage.removeItem('user');
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Add a response interceptor to handle errors globally.
// IMPORTANT: We re-throw the original axios error (not a new Error) so that
// catch blocks can still access err.response.data for the server's message.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      'An unexpected error occurred.';
    console.error('API Error:', message);
    // Attach a human-readable message but preserve the original error
    error.displayMessage = message;
    return Promise.reject(error);
  }
);

export default api;
