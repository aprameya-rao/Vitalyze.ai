import axios from 'axios';

// IMPORTANT: Replace this placeholder with your actual backend URL.
// Ensure your teammate provides the correct URL for development and production.
const BASE_URL = 'http://localhost:3000/medical_locator/v1'; 

// Create an instance of Axios
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    // If you need Authorization/Bearer tokens later, they go here:
    // 'Authorization': `Bearer ${localStorage.getItem('authToken')}` 
  },
  timeout: 10000, // Timeout requests after 10 seconds
});

// Optional: Add an interceptor to handle token injection dynamically
api.interceptors.request.use(
  (config) => {
    // Get token from auth store (if using Zustand/Redux) or local storage
    // const token = authStore.getState().token; 
    
    // Example using a simple placeholder for demonstration:
    const token = 'YOUR_DYNAMIC_AUTH_TOKEN'; 

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;