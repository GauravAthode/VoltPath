import axios from 'axios';
import { API_BASE } from '../config/constants';

const api = axios.create({ baseURL: API_BASE, withCredentials: true, timeout: 30000 });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('voltpath_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('voltpath_token');
      localStorage.removeItem('voltpath_user');
      if (!window.location.pathname.includes('/') || window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
