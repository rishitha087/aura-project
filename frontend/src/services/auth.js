import api from './api';

export const login = async (email, password) => {
  const response = await api.post('/auth/login/', { email, password });
  if (response.data.access) {
    localStorage.setItem('access_token', response.data.access);
    localStorage.setItem('refresh_token', response.data.refresh);
    localStorage.setItem('user', JSON.stringify(response.data.user));
  }
  return response.data;
};

export const registerStudent = async (data) => {
  const response = await api.post('/auth/register/student/', data);
  return response.data;
};

export const registerHR = async (data) => {
  const response = await api.post('/auth/register/hr/', data);
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get('/auth/me/');
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
};
