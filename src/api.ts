import axios from 'axios';

const apiClient = axios.create({
//   baseURL: 'https://api-huskyholdem.atcuw.org',
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
    },
    resendVerification: async () => {
        const response = await apiClient.post('/auth/resend-verification');
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

        if (response.data.status_code !== 200) {
            throw new Error(response.data.error);
        }
        return response.data;
    },
    submitSimulationUserJob: async (usernames: string[]) => {
        const response = await apiClient.post("/sim/async_run_user", usernames);
      
        if (response.data.status_code !== 200) {
          throw new Error(response.data.error);
        }
        return response.data;
      },
    deleteJob: async (job_id: string) => {
        const response = await apiClient.delete(`/sim/job/${job_id}`);
        return response.data;
    }
}

const submissionAPI = {
   uploadSubmission: async (formData: FormData) => {
        const response = await apiClient.post("/submission/upload", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
        });

        if (response.data.status_code !== 200) {
            throw new Error(response.data.error);
        }
        return response.data;
      },
    getSubmission: async (submission_id: string) => {
        const res = await apiClient.get(`/submission/list`);
        const submission = res.data.files.find((file: any) => file.id === submission_id);
        return submission;
    },
    getContentFile: async (file_name: string) => {
        const res = await apiClient.get(`/submission/files/${file_name}`);
        return res.data; 
    },
    listSubmissions: async () => {
        const response = await apiClient.get('/submission/list');
        console.log(response.data)
        return response.data;
    },
    unmark_submission: async (submission_id: string) => {
        const response = await apiClient.post(`/submission/unmark_final`, { 
            submission_id: submission_id
         });
        return response.data;
    },
    mark_submission: async (submission_id: string) => {
        const response = await apiClient.post(`/submission/mark_final`, { 
            submission_id: submission_id
         });
        return response.data;
    },
    delete_submission: async (submission_id: string) => {
        const response = await apiClient.delete(`/submission/${submission_id}`);
        return response.data;
    },
    getUsersWithFinalSubmission: async () => {
        const response = await apiClient.get('/submission/users/with-final')
        return response.data
    }
}

const profileAPI = {
    getProfilePublic: async (username: string) => {
        const res = await apiClient.get(`/profile/${username}`);
        return res.data;
    },

    getProfileSelf: async () => {
        const res = await apiClient.get(`/profile`);
        return res.data;
    },

    updateProfile: async (data: {
        name?: string;
        github?: string;
        discord_username?: string;
        about?: string;
    }) => {
        const res = await apiClient.post('/user/update', data);
        return res.data;
    },
}

const leaderboardAPI = {
    getTopN: async (n: number, tag?: string) => {
        const params = tag ? `?tag=${encodeURIComponent(tag)}` : '';
        const response = await apiClient.get(`/leaderboard/top/${n}${params}`);
        return response.data;
    },
    
    getAllTags: async () => {
        const response = await apiClient.get('/leaderboard/tags');
        return response.data;
    },
    
    getUserEntries: async (username: string, tag?: string) => {
        const params = tag ? `?tag=${encodeURIComponent(tag)}` : '';
        const response = await apiClient.get(`/leaderboard/user/${username}${params}`);
        return response.data;
    },
    
    removeEntry: async (entryId: string) => {
        const response = await apiClient.delete(`/leaderboard/remove/${entryId}`);
        return response.data;
    },
    
    addEntry: async (score: number, tag?: string) => {
        const response = await apiClient.post('/leaderboard/add', { score, tag });
        return response.data;
    }
}

const userAPI = {
    getAllUsers: async () => {
        const res = await apiClient.get('/user/all');
        return res.data
    },
    searchUsers: async (query: string) => {
        const res = await apiClient.get(`/user/search?q=${encodeURIComponent(query)}`);
        return res.data;
    }
}

export {
    apiClient,
    authAPI,
    gameAPI,
    submissionAPI,
    profileAPI,
    leaderboardAPI,
    userAPI
}