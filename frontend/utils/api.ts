import axios from 'axios';
import { Platform } from 'react-native';

// 🔧 SMART BACKEND URL DETECTION
// Automatically detects platform and uses correct URL
const getBackendURL = () => {
  // For web browser (Expo Web)
  if (Platform.OS === 'web') {
    return 'http://localhost:4000';
  }

  // For Android device/emulator (Expo Go on phone/emulator)
  if (Platform.OS === 'android') {
    // Android emulator maps 10.0.2.2 -> host machine
  return 'http://10.0.2.2:4000';
  }

  // For iOS Simulator
  if (Platform.OS === 'ios') {
  return 'http://localhost:4000';
  }

  // Default fallback
  return 'http://localhost:4000';
};

const BACKEND_URL = getBackendURL();
// Use the backend API prefix so frontend calls map to routes implemented in backend
const API_URL = `${BACKEND_URL}/api/v1`;

console.log('🌍 Platform:', Platform.OS);
console.log('🌍 Backend URL:', BACKEND_URL);
console.log('📡 API URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add JWT token to requests
api.interceptors.request.use(async (config) => {
  try {
    // For React Native, we need to use AsyncStorage
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const token = await AsyncStorage.getItem('authToken');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    console.error('Error getting auth token:', e);
  }
  return config;
});

// Authentication types
export interface SignUpData {
  name: string;
  email: string;
  password: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token?: string;
  token_type?: string;
  user?: {
    id: string;
    email: string;
    name: string;
  };
  message?: string;
}

export const authAPI = {
  // POST /api/v1/auth/signup
  signup: async (data: SignUpData): Promise<AuthResponse> => {
    console.log('📤 Signup request:', { ...data, password: '***' });
    // backend expects full_name instead of name
    const payload = { full_name: data.name, email: data.email, password: data.password };
    const response = await api.post('/auth/signup', payload);
    console.log('📦 Signup response:', response.data);
    return response.data;
  },

  // POST /api/v1/auth/login
  signin: async (data: SignInData): Promise<AuthResponse> => {
    console.log('📤 Signin request:', { email: data.email, password: '***' });
    const response = await api.post('/auth/login', { email: data.email, password: data.password });
    console.log('📦 Signin response:', response.data);
    return response.data;
  }
};

// ============================================
// USER ENDPOINTS
// ============================================

export const userAPI = {

  // GET /api/v1/users/{user_id}
  getProfile: async (userId: string) => {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },

  // PATCH /api/v1/users/{user_id}
  updateProfile: async (userId: string, data: any) => {
    const response = await api.patch(`/users/${userId}`, data);
    return response.data;
  },

  // POST /api/v1/users/{user_id}/generate-resume-embedding
  generateResumeEmbedding: async (userId: string, resumeText: string) => {
    const response = await api.post(`/users/${userId}/generate-resume-embedding`, {
      resume_text: resumeText,
    });
    return response.data;
  },
};

// ============================================
// RESUME UPLOAD ENDPOINTS
// ============================================

export const resumeAPI = {
  // POST /api/v1/resume/upload
  uploadResume: async (fileUri: string, fileName: string, fileType: string) => {
    const formData = new FormData();
    
    // For React Native
    const file: any = {
      uri: fileUri,
      name: fileName,
      type: fileType,
    };
    
    formData.append('file', file)  // Backend expects 'file' field;
    
    const response = await api.post('/profile/resume', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000, // 60 seconds for file upload
    });
    
    return response.data;
  },

  // GET /api/v1/resume/status
  getResumeStatus: async () => {
    const response = await api.get('/resume/status');
    return response.data;
  },
};

// ============================================
// JOB ENDPOINTS
// ============================================

export interface JobFilterParams {
  skip?: number;
  limit?: number;
  job_type?: string;
  remote?: boolean;
  skill?: string;
}

export const jobsAPI = {
  // GET /api/v1/jobs - List all jobs
  getAllJobs: async (params: JobFilterParams = {}) => {
    const response = await api.get('/jobs', { params });
    return response.data;
  },

  // GET /api/v1/jobs/fetch-live/:specialization - Fetch live jobs from RapidAPI
  fetchLiveJobs: async (specialization: string, limit: number = 30) => {
    const response = await api.get(`/jobs/specialization/${specialization}`, {
      params: { limit },
      timeout: 30000, // 30 seconds for external API call
    });
    return response.data;
  },

  // GET /api/v1/jobs/{job_id}
  getJobDetails: async (jobId: string) => {
    const response = await api.get(`/jobs/${jobId}`);
    return response.data;
  },

  // POST /api/v1/jobs/store - Store job when user clicks (selective storage)
  storeJob: async (jobData: any) => {
    const response = await api.post('/jobs/store', jobData);
    return response.data;
  },

  // POST /api/v1/jobs - Create job (admin only)
  createJob: async (jobData: any) => {
    const response = await api.post('/jobs', jobData);
    return response.data;
  },

  // PUT /api/v1/jobs/{job_id}
  updateJob: async (jobId: string, jobData: any) => {
    const response = await api.put(`/jobs/${jobId}`, jobData);
    return response.data;
  },

  // DELETE /api/v1/jobs/{job_id}
  deleteJob: async (jobId: string) => {
    const response = await api.delete(`/jobs/${jobId}`);
    return response.data;
  },
  
  // GET /api/v1/jobs/suggested/:userId
  getSuggested: async (userId: string) => {
    const response = await api.get(`/jobs/suggested/${userId}`);
    return response.data;
  }
};

// ============================================
// RECOMMENDATION ENDPOINTS (ML-POWERED)
// ============================================

export interface RecommendationQuery {
  query?: string; // Search text
  user_id?: string; // Or use user ID
  job_type?: string; // 'full-time' or 'internship'
  limit?: number;
  skip?: number;
}

export const recommendationsAPI = {
  // POST /api/v1/recommendations
  getRecommendations: async (query: RecommendationQuery) => {
    const response = await api.post('/recommendations', query);
    return response.data;
  },

  // Get recommendations for a user (skill-based matching)
  getForUser: async (userId: string, jobType?: string) => {
    return recommendationsAPI.getRecommendations({
      user_id: userId,
      job_type: jobType,
      limit: 20,
    });
  },

  // Search jobs with query
  searchJobs: async (query: string, jobType?: string) => {
    return recommendationsAPI.getRecommendations({
      query,
      job_type: jobType,
      limit: 10,
    });
  },
};

// ============================================
// JOBS ENDPOINTS (with recent jobs filter)
// ============================================

export const recentJobsAPI = {
  // Get jobs posted in the last 7 days
  getRecent: async (limit: number = 10, jobType?: string) => {
    const params: any = { limit, skip: 0 };
    if (jobType) params.job_type = jobType;
    
  const response = await api.get('/jobs/recent', { params });
    const jobs = response.data;
    
    // Filter to only last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    return jobs.filter((job: any) => {
      if (!job.created_at) return true; // Include if no date
      const jobDate = new Date(job.created_at);
      return jobDate >= sevenDaysAgo;
    });
  },
};

// ============================================
// RAPIDAPI ENDPOINTS (Job Ingestion)
// ============================================

export const rapidapiAPI = {
  // GET /api/v1/rapidapi/status
  checkStatus: async () => {
    const response = await api.get('/rapidapi/status');
    return response.data;
  },

  // POST /api/v1/rapidapi/ingest/all
  ingestAllJobs: async (jobsLimit: number = 100, internshipsLimit: number = 100) => {
    const response = await api.post('/rapidapi/ingest/all', {
      jobs_limit: jobsLimit,
      internships_limit: internshipsLimit,
    });
    return response.data;
  },

  // POST /api/v1/rapidapi/ingest/jobs
  ingestJobs: async (limit: number = 100) => {
    const response = await api.post('/rapidapi/ingest/jobs', { limit });
    return response.data;
  },

  // POST /api/v1/rapidapi/ingest/internships
  ingestInternships: async (limit: number = 100) => {
    const response = await api.post('/rapidapi/ingest/internships', { limit });
    return response.data;
  },

  // GET /api/v1/rapidapi/search/jobs - Fetch dynamic jobs without storing
  searchJobsDynamic: async (params: {
    title_filter?: string;
    location_filter?: string;
    limit?: number;
    offset?: number;
  }) => {
    const response = await api.get('/rapidapi/search/jobs', {
      params,
      timeout: 30000, // 30 seconds for external API
    });
    return response.data;
  },

  // POST /api/v1/rapidapi/ingest/user-based - Fetch jobs based on user profile
  fetchUserBasedJobs: async (userId: string, jobsPerSkill: number = 20) => {
    const response = await api.post('/rapidapi/ingest/user-based', {
      user_id: userId,
      jobs_per_skill: jobsPerSkill,
    });
    return response.data;
  },
};

// Export for easy access
export const profileAPI = userAPI;

export default api;
