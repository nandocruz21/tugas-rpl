import axios from 'axios';

const api = axios.create({
  // Adjust this to your Laravel app URL (e.g. http://localhost:8000 or http://docusmart.test)
  baseURL: 'http://127.0.0.1:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
});

// Request interceptor to add the auth token header to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('docusmart_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('docusmart_token');
      localStorage.removeItem('docusmart_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
