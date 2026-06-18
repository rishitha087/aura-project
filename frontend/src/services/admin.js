/**
 * Admin service — uses the main `api` instance so that:
 *  - The JWT Bearer token interceptor is applied automatically
 *  - Token auto-refresh on 401 works
 *  - The Vite proxy forwards /api → Django:8000
 *
 * Helper: DRF ListAPIView may return {count, results:[...]} OR a plain array.
 * We always normalize to a plain array.
 */
import api from './api';

const toArray = (data) => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
};

// ── Admin Dashboard Stats (always returns a plain object)
export const getAdminStats = () =>
  api.get('/admin/stats/').then(r => r.data);

// ── Admin Users (role = 'student' | 'hr')
export const getAdminUsers = (role) =>
  api.get('/admin/users/', { params: role ? { role } : {} })
     .then(r => toArray(r.data));

// ── Admin HR Verifications
export const getAdminVerifications = (status) =>
  api.get('/admin/verifications/', { params: status ? { status } : {} })
     .then(r => toArray(r.data));

// Approve or reject a verification by its PK
export const updateVerification = (pk, payload) =>
  api.patch(`/admin/verifications/${pk}/verify/`, payload).then(r => r.data);

// ── Admin Bookings
export const getAdminBookings = (status) =>
  api.get('/admin/bookings/', { params: status ? { status } : {} })
     .then(r => toArray(r.data));

// ── Admin Contact Queries
export const getAdminContacts = (status) =>
  api.get('/admin/contact/', { params: status ? { status } : {} })
     .then(r => toArray(r.data));

export const updateContact = (pk, payload) =>
  api.patch(`/admin/contact/${pk}/`, payload).then(r => r.data);

// ── Public Contact Form (no auth required)
export const submitContact = (data) =>
  api.post('/contact/', data).then(r => r.data);
