import axios from 'axios';

// Configure your API base URL
// In production (Vercel), use the proxied endpoint
// In development, use the direct backend URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD ? '/api/v1' : 'http://139.59.34.99:8000/api/v1');

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authentication
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔐 Adding Bearer token to request headers');
      console.log('🔐 Request headers:', {
        'Content-Type': config.headers['Content-Type'],
        'Authorization': config.headers.Authorization ? 'Bearer [TOKEN]' : 'Not set'
      });
    } else {
      console.warn('⚠️ No access token found in localStorage');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for handling 401 errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear stored tokens and user data
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      
      // Redirect to login page
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API functions
export const authAPI = {
  login: (credentials) => apiClient.post('/auth/login', credentials),
  getMe: () => apiClient.get('/auth/me'),
  logout: () => apiClient.post('/auth/logout'),
};

export const dashboardAPI = {
  getCEOData: () => apiClient.get('/dashboard/ceo'),
  getBDOData: () => apiClient.get('/dashboard/bdo'),
  getVDOData: () => apiClient.get('/dashboard/vdo'),
};

export const schemesAPI = {
  getSchemes: (params = {}) => {
    const queryParams = new URLSearchParams({
      skip: params.skip || 0,
      limit: params.limit || 100
    });
    // Only add active parameter if it's explicitly provided (not undefined)
    if (params.active !== undefined) {
      queryParams.append('active', params.active);
    }
    return apiClient.get(`/schemes/?${queryParams}`);
  },
  createScheme: (schemeData) => {
    return apiClient.post('/schemes/', schemeData);
  },
  updateScheme: (schemeId, schemeData) => {
    return apiClient.put(`/schemes/${schemeId}`, schemeData);
  },
  deleteScheme: (schemeId) => {
    return apiClient.delete(`/schemes/${schemeId}`);
  },
  uploadSchemeMedia: (schemeId, mediaFile) => {
    const formData = new FormData();
    formData.append('media', mediaFile);
    return apiClient.post(`/schemes/${schemeId}/media`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export const eventsAPI = {
  getEvents: (params = {}) => {
    const queryParams = new URLSearchParams({
      skip: params.skip || 0,
      limit: params.limit || 100
    });
    // Only add active parameter if it's explicitly provided (not undefined)
    if (params.active !== undefined) {
      queryParams.append('active', params.active);
    }
    return apiClient.get(`/events/?${queryParams}`);
  },
  createEvent: (eventData) => {
    return apiClient.post('/events/', eventData);
  },
  updateEvent: (eventId, eventData) => {
    return apiClient.put(`/events/${eventId}`, eventData);
  },
  deleteEvent: (eventId) => {
    return apiClient.delete(`/events/${eventId}`);
  },
  uploadEventMedia: (eventId, mediaFile) => {
    const formData = new FormData();
    formData.append('media', mediaFile);
    return apiClient.post(`/events/${eventId}/media`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export const noticesAPI = {
  getTypes: () => apiClient.get('/notices/types'),
  createNotice: (payload) => apiClient.post('/notices/', payload),
};

export const vehiclesAPI = {
  // Get vehicles by location using IDs
  getVehiclesByLocation: (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.district_id) queryParams.append('district_id', params.district_id);
    if (params.block_id) queryParams.append('block_id', params.block_id);
    if (params.gp_id) queryParams.append('gp_id', params.gp_id);
    return apiClient.get(`/gps/vehicles?${queryParams}`);
  },
  
  // Get vehicle details (if endpoint exists)
  getVehicleDetails: (vehicleId, params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.month) queryParams.append('month', params.month);
    if (params.year) queryParams.append('year', params.year);
    return apiClient.get(`/gps/vehicles/${vehicleId}/details?${queryParams}`);
  },
  
  // Add vehicle with gp_id, vehicle_no, and imei
  addVehicle: (vehicleData) => {
    return apiClient.post('/gps/vehicles', {
      gp_id: vehicleData.gp_id,
      vehicle_no: vehicleData.vehicle_no,
      imei: vehicleData.imei
    });
  },
  
  // Update vehicle
  updateVehicle: (vehicleId, vehicleData) => {
    return apiClient.put(`/gps/vehicles/${vehicleId}`, vehicleData);
  },
  
  // Delete vehicle
  deleteVehicle: (vehicleId) => {
    return apiClient.delete(`/gps/vehicles/${vehicleId}`);
  },
};

export const feedbackAPI = {
  // Get feedback statistics
  getStats: () => apiClient.get('/feedback/stats/summary'),
  
  // Get all feedbacks (authority users only)
  getFeedbacks: (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.feedback_source) queryParams.append('feedback_source', params.feedback_source);
    if (params.skip !== undefined) queryParams.append('skip', params.skip);
    if (params.limit !== undefined) queryParams.append('limit', params.limit);
    return apiClient.get(`/feedback/?${queryParams.toString()}`);
  },
  
  // Get feedback by ID (authority users only)
  getFeedbackById: (feedbackId) => apiClient.get(`/feedback/${feedbackId}`),
  
  // Get authenticated user's own feedback
  getMyFeedback: () => apiClient.get('/feedback/my/'),
  
  // Create new feedback
  createFeedback: (feedbackData) => {
    return apiClient.post('/feedback/', {
      comment: feedbackData.comment,
      rating: feedbackData.rating
    });
  },
  
  // Update authenticated user's own feedback
  updateMyFeedback: (feedbackData) => {
    return apiClient.put('/feedback/my/', {
      comment: feedbackData.comment,
      rating: feedbackData.rating
    });
  },
};

export default apiClient;

