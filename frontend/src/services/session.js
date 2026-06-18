import api from './api';

export const getSessionDetails = async (id) => {
  const response = await api.get(`/session/${id}/`);
  return response.data;
};

export const submitSessionFeedback = async (id, rating, comment = '') => {
  const response = await api.post(`/session/${id}/feedback/`, { rating, comment });
  return response.data;
};
