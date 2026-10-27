
import axios from 'axios';

// In production, fallback to the deployed Render backend URL if VITE_API_URL is unset.
// In development, fallback to '' so requests use Vite's local dev server proxy (/api -> localhost:5000).
const defaultApiUrl = import.meta.env.PROD
  ? 'https://scholarflow-api-2yas.onrender.com'
  : '';

let rawApiUrl = (import.meta.env.VITE_API_URL || defaultApiUrl).trim();

// Strip trailing slashes
rawApiUrl = rawApiUrl.replace(/\/+$/, '');

// Prevent duplicate '/api/api' if the user included '/api' in VITE_API_URL
if (rawApiUrl.endsWith('/api')) {
  rawApiUrl = rawApiUrl.slice(0, -4);
}

const api = axios.create({
  baseURL: rawApiUrl ? `${rawApiUrl}/api` : '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sf_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isAuthUrl =
        error.config?.url?.includes('/auth/login') ||
        error.config?.url?.includes('/auth/register');

      if (!isAuthUrl) {
        localStorage.removeItem('sf_token');
        localStorage.removeItem('sf_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
