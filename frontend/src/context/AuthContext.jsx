import React, { createContext, useState, useEffect, useContext } from 'react';
import { login as apiLogin, registerStudent, registerHR, logout as apiLogout, getCurrentUser } from '../services/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load user state from local storage on init
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('access_token');
    
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      // Optionally fetch latest profile from backend to ensure data is in sync
      getCurrentUser()
        .then((latestUser) => {
          setUser(latestUser);
          localStorage.setItem('user', JSON.stringify(latestUser));
        })
        .catch(() => {
          // If token has expired and refresh fails, we will be auto logged out by axios interceptor
        });
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await apiLogin(email, password);
      setUser(data.user);
      return data.user;
    } finally {
      setLoading(false);
    }
  };

  const registerAsStudent = async (data) => {
    setLoading(true);
    try {
      await registerStudent(data);
      // Automatically login after successful registration
      return await login(data.email, data.password);
    } finally {
      setLoading(false);
    }
  };

  const registerAsHR = async (data) => {
    setLoading(true);
    try {
      await registerHR(data);
      // Automatically login after successful registration
      return await login(data.email, data.password);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    apiLogout();
    setUser(null);
  };

  const isStudent = user?.role === 'student';
  const isHR = user?.role === 'hr';
  const isAdmin = user?.role === 'admin';

  const value = {
    user,
    loading,
    login,
    registerAsStudent,
    registerAsHR,
    logout,
    isStudent,
    isHR,
    isAdmin,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
