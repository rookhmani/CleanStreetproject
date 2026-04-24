import axios from 'axios';

export const API_URL = (process.env.REACT_APP_API_URL || '/api').replace(/\/$/, '');


// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getMe: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password })
};

// Complaints API
export const complaintsAPI = {
  getAll: (params) => api.get('/complaints', { params }),
  getById: (id) => api.get(`/complaints/${id}`),
  getUserComplaints: () => api.get('/complaints/user'),
  getStats: () => api.get('/complaints/stats/overview'),
  getAllStats: () => api.get('/complaints/stats/all'),
  create: (complaintData) => {
    // If complaintData is FormData, set proper headers for file upload
    if (complaintData instanceof FormData) {
      return api.post('/complaints', complaintData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
    }
    return api.post('/complaints', complaintData);
  },
  update: (id, complaintData) => api.put(`/complaints/${id}`, complaintData),
  delete: (id) => api.delete(`/complaints/${id}`)
};

// Votes API
export const votesAPI = {
  vote: (complaintId, voteType) => api.post(`/votes/${complaintId}`, { vote_type: voteType }),
  getUserVote: (complaintId) => api.get(`/votes/${complaintId}`),
  getStats: (complaintId) => api.get(`/votes/complaint/${complaintId}/stats`)
};

// Users API
export const usersAPI = {
  getStats: () => api.get('/users/stats'),
  getAll: () => api.get('/users')
};

// Comments API
export const commentsAPI = {
  getByComplaint: (complaintId) => api.get(`/comments/complaint/${complaintId}`),
  create: (commentData) => api.post('/comments', commentData),
  like: (commentId) => api.post(`/comments/${commentId}/like`),
  delete: (commentId) => api.delete(`/comments/${commentId}`)
};

// Helper functions
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
};

export const getAuthToken = () => {
  return localStorage.getItem('token');
};

export const removeAuthToken = () => {
  localStorage.removeItem('token');
};

export default api;
