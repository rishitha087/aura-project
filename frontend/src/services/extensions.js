import api from './api';

export const getHRWallet = async () => {
  const response = await api.get('/wallet/');
  return response.data;
};

export const depositStudentWallet = async (amount) => {
  const response = await api.post('/wallet/deposit/', { amount });
  return response.data;
};

export const withdrawHRWallet = async (amount) => {
  const response = await api.post('/wallet/withdraw/', { amount });
  return response.data;
};

export const checkoutWithWallet = async (bookingId) => {
  const response = await api.post('/bookings/wallet-checkout/', { booking_id: bookingId });
  return response.data;
};

export const generateHRAssessment = async () => {
  const response = await api.post('/hr/assessment/generate/');
  return response.data;
};

export const submitHRAssessment = async (answers) => {
  const response = await api.post('/hr/assessment/submit/', { answers });
  return response.data;
};

export const getLeaderboard = async () => {
  const response = await api.get('/leaderboard/');
  return response.data;
};

export const sendOTP = async (emailOrPhone) => {
  const isEmail = emailOrPhone.includes('@');
  const payload = isEmail ? { email: emailOrPhone } : { phone_number: emailOrPhone };
  const response = await api.post('/auth/otp/send/', payload);
  return response.data;
};

export const verifyOTP = async (emailOrPhone, otp) => {
  const isEmail = emailOrPhone.includes('@');
  const payload = isEmail ? { email: emailOrPhone, otp } : { phone_number: emailOrPhone, otp };
  const response = await api.post('/auth/otp/verify/', payload);
  return response.data;
};
