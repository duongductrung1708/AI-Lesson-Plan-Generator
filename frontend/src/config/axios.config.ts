import axios from 'axios';

// Get API URL from environment variable
// In development, this will be empty (uses proxy)
// In production, this should be your backend URL (e.g., https://your-backend.onrender.com)
const API_URL = import.meta.env.VITE_API_URL || '';

// Configure axios default baseURL
if (API_URL) {
  axios.defaults.baseURL = API_URL;
}

// Configure default headers
axios.defaults.headers.common['Content-Type'] = 'application/json';

export default axios;

