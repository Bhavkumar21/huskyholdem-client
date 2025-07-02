import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'https://api.atcuw.org',
//   baseURL: 'http://localhost:8002',
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

        if (response.data.status_code !== 200) {
            throw new Error(response.data.error);
        }
        return response.data;
    },
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
}

const streamingAPI = {
    getMockData: async () => {
        const gameData = {
          rounds: {
            0: { // Posting blinds
              pot: 0,
              bets: { 0: 0, 1: 5, 2: 10, 3: 0, 4: 0, 5: 0 },
              actions: { 0: " ", 1: "SMALL BLIND", 2: "BIG BLIND", 3: " ", 4: " ", 5: " " },
              actionTimes: { 0: 0, 1: 300, 2: 400, 3: 0, 4: 0, 5: 0 }
            },
            1: { // Pre-flop
              pot: 15,
              bets: { 0: 0, 1: 5, 2: 10, 3: 10, 4: 10, 5: 10 },
              actions: { 0: "FOLD", 1: "CALL", 2: "CHECK", 3: "CALL", 4: "CALL", 5: "CALL" },
              actionTimes: { 0: 800, 1: 1200, 2: 1800, 3: 2100, 4: 2500, 5: 2000 }
            },
            2: { // Flop
              pot: 55,
              bets: { 0: 0, 1: 5, 2: 5, 3: 5, 4: 10, 5: 10 },
              actions: { 0: "FOLD", 1: "CHECK", 2: "CHECK", 3: "CHECK", 4: "BET", 5: "CALL" },
              actionTimes: { 0: 0, 1: 1300, 2: 1600, 3: 1800, 4: 3000, 5: 2800 }
            },
            3: { // Turn
              pot: 85,
              bets: { 0: 0, 1: 5, 2: 5, 3: 5, 4: 20, 5: 20 },
              actions: { 0: "FOLD", 1: "FOLD", 2: "FOLD", 3: "CHECK", 4: "BET", 5: "CALL" },
              actionTimes: { 0: 0, 1: 1000, 2: 1100, 3: 1500, 4: 3700, 5: 3900 }
            },
            4: { // River
              pot: 125,
              bets: { 0: 0, 1: 5, 2: 5, 3: 5, 4: 40, 5: 40 },
              actions: { 0: "FOLD", 1: "FOLD", 2: "FOLD", 3: "CHECK", 4: "BET", 5: "CALL" },
              actionTimes: { 0: 0, 1: 0, 2: 0, 3: 1200, 4: 4800, 5: 5200 }
            },
            5: { // Showdown
              pot: 205,
              bets: { 0: 0, 1: 5, 2: 5, 3: 5, 4: 40, 5: 40 },
              actions: { 0: "FOLD", 1: "FOLD", 2: "FOLD", 3: "SHOW", 4: "SHOW", 5: "SHOW" },
              actionTimes: { 0: 0, 1: 0, 2: 0, 3: 1500, 4: 1800, 5: 2100 }
            }
          },
          playerNames: {
            0: "player1", 1: "player2", 2: "player3", 3: "player4", 4: "player5", 5: "player6"
          },
          playerHands: {
            0: ["7s", "2d"], 1: ["4c", "8d"], 2: ["9h", "5h"], 3: ["Ah", "Qc"], 4: ["Jd", "Js"], 5: ["Kh", "10h"]
          },
          finalBoard: ["Jc", "9s", "10c", "2h", "Qh"],
          blinds: { small: 5, big: 10 }
        };
        return gameData;
    }
}

export {
    apiClient,
    authAPI,
    gameAPI,
    submissionAPI,
    profileAPI,
    streamingAPI
}