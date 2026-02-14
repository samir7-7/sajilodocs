import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
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

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
          refresh: refreshToken,
        });

        const { access } = response.data;
        localStorage.setItem('access_token', access);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// API endpoints
export const authAPI = {
  register: (data) => api.post('/auth/register/', {
    username: data.email, // Use full email as username for uniqueness
    email: data.email,
    password: data.password,
    first_name: data.name.split(' ')[0] || '',
    last_name: data.name.split(' ').slice(1).join(' ') || '',
    phone_number: data.contact || '',
  }),
  
  login: (email, password) => api.post('/auth/login/', {
    username: email, // Use full email as username
    password,
  }),
  
  getUser: () => api.get('/auth/user/'),
  
  updateUser: (data) => api.patch('/auth/user/', data),
};

export const folderAPI = {
  list: () => api.get('/folders/'),
  create: (data) => api.post('/folders/', data),
  get: (id) => api.get(`/folders/${id}/`),
  update: (id, data) => api.patch(`/folders/${id}/`, data),
  delete: (id) => api.delete(`/folders/${id}/`),
};

export const fileAPI = {
  list: () => api.get('/files/'),
  upload: (formData) => api.post('/files/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  get: (id) => api.get(`/files/${id}/`),
  update: (id, data) => api.patch(`/files/${id}/`, data),
  delete: (id) => api.delete(`/files/${id}/`),
  lock: (id) => api.post(`/files/${id}/lock/`),
  unlock: (id) => api.post(`/files/${id}/unlock/`),
  saveContent: (id, content) => api.post(`/files/${id}/save_content/`, { content }),
};

export const shareAPI = {
  shareFolder: (data) => api.post('/shares/folder/', data),
  shareFile: (data) => api.post('/shares/file/', data),
  listFolderShares: () => api.get('/shares/folder/'),
  listFileShares: () => api.get('/shares/file/'),
  revokeShare: (type, id) => api.delete(`/shares/${type}/${id}/`),
};

export const notificationAPI = {
  list: () => api.get('/notifications/'),
  markAllRead: () => api.post('/notifications/mark_all_read/'),
};

export default api;
