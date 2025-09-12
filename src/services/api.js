import axios from 'axios';

const API_URL = 'http://192.168.100.46:5000/api';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL
});

// Request interceptor to add token to all requests
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Response interceptor to handle token errors
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      console.log('Token validation failed in interceptor');
      localStorage.removeItem('token');
      // Uncomment to redirect to login
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Case API methods
const caseService = {
  getAllCases: () => api.get('/cases'),
  getCaseById: (id) => api.get(`/cases/${id}`),
  createCase: (caseData) => api.post('/cases', caseData),
  updateCase: (id, caseData) => api.put(`/cases/${id}`, caseData),
  deleteCase: (id) => api.delete(`/cases/${id}`)
};

export { api, caseService };