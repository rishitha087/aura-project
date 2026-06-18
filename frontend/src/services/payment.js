import api from './api';

export const createPaymentOrder = async (bookingId) => {
  const response = await api.post('/payments/order/', { booking_id: bookingId });
  return response.data;
};

export const verifyPaymentSignature = async (paymentData) => {
  const response = await api.post('/payments/verify/', paymentData);
  return response.data;
};
