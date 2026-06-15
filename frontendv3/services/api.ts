import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = 'http://172.20.10.2:8000/api/v1';//change to local ip

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const authService = {
  register: async (userData: {
    name: string;
    phone_number: string;
    password: string;
    age?: number | null;
    gender: string;
  }) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  login: async (phone: string, password: string) => {
    // Ensure the phone number starts with +91
    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;

    // Manually format the string and encode the + symbol correctly
    const params = `username=${encodeURIComponent(formattedPhone)}&password=${encodeURIComponent(password)}`;

    const response = await api.post('/auth/login', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return response.data;
  },
  getCurrentUser: async () => {
    return await SecureStore.getItemAsync('access_token');
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('user_id');
  },

  setToken: async (token: string) => {
    await SecureStore.setItemAsync('access_token', token);
  },

  setUserId: async (userId: string) => {
    await SecureStore.setItemAsync('user_id', userId);
  },
};

export default api;
