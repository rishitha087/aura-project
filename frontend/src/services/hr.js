import api from './api';

export const getHRProfile = async () => {
  const response = await api.get('/hr/profile/');
  return response.data;
};

export const updateHRProfile = async (data) => {
  const response = await api.patch('/hr/profile/', data);
  return response.data;
};

export const uploadHRPhoto = async (file) => {
  const formData = new FormData();
  formData.append('profile_photo', file);
  const response = await api.post('/hr/profile/photo/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getHRVerification = async () => {
  const response = await api.get('/hr/profile/documents/');
  return response.data;
};

export const uploadHRDocuments = async (files) => {
  const formData = new FormData();
  if (files.resume_file) {
    formData.append('resume_file', files.resume_file);
  }
  if (files.employee_id_file) {
    formData.append('employee_id_file', files.employee_id_file);
  }
  if (files.experience_letter) {
    formData.append('experience_letter', files.experience_letter);
  }
  if (files.pay_slips_file) {
    formData.append('pay_slips_file', files.pay_slips_file);
  }
  const response = await api.post('/hr/profile/documents/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// --- PHASE 2 HR AVAILABILITY & INTERVIEWS ---

export const getHRSlots = async () => {
  const response = await api.get('/hr/slots/');
  return response.data;
};

export const createHRSlot = async (slotData) => {
  const response = await api.post('/hr/slots/', slotData);
  return response.data;
};

export const deleteHRSlot = async (id) => {
  const response = await api.delete(`/hr/slots/${id}/`);
  return response.data;
};

export const getHRInterviews = async (status = 'upcoming') => {
  const response = await api.get('/hr/interviews/', { params: { status } });
  return response.data;
};
