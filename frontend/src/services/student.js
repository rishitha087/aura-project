import api from './api';

export const getStudentProfile = async () => {
  const response = await api.get('/student/profile/');
  return response.data;
};

export const updateStudentProfile = async (data) => {
  const response = await api.patch('/student/profile/', data);
  return response.data;
};

export const uploadStudentResume = async (file) => {
  const formData = new FormData();
  formData.append('resume', file);
  const response = await api.post('/student/profile/resume/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// --- PHASE 2 STUDENT DISCOVERY & BOOKINGS ---

export const getHRs = async (params = {}) => {
  const response = await api.get('/student/hrs/', { params });
  return response.data;
};

export const getHRDetail = async (id) => {
  const response = await api.get(`/student/hrs/${id}/`);
  return response.data;
};

export const createBooking = async (slotId) => {
  const response = await api.post('/bookings/', { slot_id: slotId });
  return response.data;
};

export const getStudentInterviews = async (status = 'upcoming') => {
  const response = await api.get('/student/interviews/', { params: { status } });
  return response.data;
};
