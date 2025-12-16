import axios from 'axios';
const API_URL = 'http://localhost:8000/api/v1'; 

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const authService = {
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  login: async (phone, password) => {
    const params = new URLSearchParams();
    params.append('username', phone); 
    params.append('password', password);

    const response = await api.post('/auth/login', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    return response.data;
  },

  getCurrentUser: async () => {

    return localStorage.getItem('access_token');
  },

  logout: () => {
    localStorage.removeItem('access_token');
  }
};

export default api;