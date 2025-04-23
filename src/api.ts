import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:8002',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout
});

apiClient.interceptors.request.use(
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

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Handle unauthorized access
      console.error('Unauthorized access - redirecting to login');
      // Redirect to login page or show a modal
    }
    return Promise.reject(error);
  }
);

const authAPI = {
    login: async (username: string, password: string) => {
        const response = await apiClient.post('/auth/login', { username, password });
        return response.data;
    },
    register: async (username: string, email: string, password: string) => {
        const response = await apiClient.post('/auth/register', {
            username,
            email,
            password,
        });
        return response.data;
    },
    verify: async (token: string) => {
        const response = await apiClient.post('/auth/whoami', { token });
        return response.data;
    },
    logout: async (token: string) => {
        const response = await apiClient.post('/auth/logout', { token });
        return response.data;
    }
}

export {
    apiClient,
    authAPI
}