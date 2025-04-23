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
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const response = await apiClient.get('/auth/whoami');
        return response.data;
    },
    logout: async (token: string) => {
        const response = await apiClient.post('/auth/logout', { token });
        return response.data;
    }
}

const gameAPI = {
    get_jobs: async () => {
        const response = await apiClient.get('/sim/status/all');
        return response.data;
    },
    get_job: async (job_id: string) => {
        const response = await apiClient.get(`/sim/status/${job_id}`);
        return response.data;
    },
    submitSimulationJob: async (formData: FormData) => {
        const response = await apiClient.post("/sim/async_run", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
        });
        console.log(response)
        return response.data;
    },
}

export {
    apiClient,
    authAPI,
    gameAPI,
}