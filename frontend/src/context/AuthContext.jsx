import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getMe } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    // Skip auth check if returning from OAuth
    if (window.location.hash?.includes('session_id=')) {
      setLoading(false);
      return;
    }

    const token = localStorage.getItem('voltpath_token');
    if (!token) {
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }

    try {
      const res = await getMe();
      setUser(res.data.data);
      setIsAuthenticated(true);
    } catch {
      localStorage.removeItem('voltpath_token');
      localStorage.removeItem('voltpath_user');
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { checkAuth(); }, [checkAuth]);

  const loginWithToken = (token, userData) => {
    localStorage.setItem('voltpath_token', token);
    localStorage.setItem('voltpath_user', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
  };

  const signOut = () => {
    localStorage.removeItem('voltpath_token');
    localStorage.removeItem('voltpath_user');
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = (data) => setUser(prev => ({ ...prev, ...data }));

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, loginWithToken, signOut, updateUser, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
