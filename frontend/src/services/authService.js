import api from './apiService';
import { API_BASE } from '../config/constants';

export const register = (data) => api.post('/auth/register', data);
export const login = (data) => api.post('/auth/login', data);

// Google OAuth login - redirects to backend
export const googleLogin = () => {
  window.location.href = `${API_BASE}/auth/google`;
};

// Session-based Google auth (legacy)
export const googleSession = (sessionId) => api.post('/auth/google/session', { sessionId });

export const getMe = () => api.get('/auth/me');
export const updateVehicle = (data) => api.put('/auth/vehicle', data);
export const logout = () => api.post('/auth/logout');

export const calculateRoute = (data) => api.post('/routes/calculate', data);
export const geocodeAddress = (address) => api.get('/routes/geocode', { params: { address } });

export const saveTrip = (data) => api.post('/trips', data);
export const getTrips = (params) => api.get('/trips', { params });
export const getTripById = (id) => api.get(`/trips/${id}`);
export const deleteTrip = (id) => api.delete(`/trips/${id}`);
export const getTripStats = () => api.get('/trips/stats');

export const getNearbyStations = (params) => api.get('/stations', { params });

export const runWeatherSimulation = (data) => api.post('/simulations/weather', data);
export const runTrafficSimulation = (data) => api.post('/simulations/traffic', data);
export const runBatteryDegradation = (data) => api.post('/simulations/battery-degradation', data);

export const getVehicles = (params) => api.get('/vehicles', { params });
export const getVehicleById = (id) => api.get(`/vehicles/${id}`);

// Share
export const createShare = (data) => api.post('/share', data);
export const getShareByToken = (token) => api.get(`/share/${token}`);
