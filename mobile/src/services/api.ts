// src/services/api.ts
// Change this IP to your computer's local network IP when testing on a real device.
// For Android emulator: use 10.0.2.2 (maps to your machine's localhost)
// For real device:      use your machine's Wi-Fi IP e.g. 192.168.1.10
import axios from 'axios';

const BASE_URL = 'http://10.0.2.2:3000/api'; // Android emulator → your localhost

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Response interceptor for consistent error messages ───────────────────────
api.interceptors.response.use(
  res => res.data,
  err => {
    const msg = err.response?.data?.error || err.message || 'Network error';
    return Promise.reject(new Error(msg));
  }
);

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const getDashboard  = () => api.get('/dashboard');

// ─── Vehicles ─────────────────────────────────────────────────────────────────
export const getVehicles   = (status?: string) =>
  api.get('/vehicles' + (status ? `?status=${status}` : ''));
export const getVehicle    = (id: number) => api.get(`/vehicles/${id}`);
export const createVehicle = (body: any)  => api.post('/vehicles', body);
export const updateVehicle = (id: number, body: any) => api.patch(`/vehicles/${id}`, body);
export const deleteVehicle = (id: number) => api.delete(`/vehicles/${id}`);

// ─── Customers ────────────────────────────────────────────────────────────────
export const getCustomers   = () => api.get('/customers');
export const getCustomer    = (id: number) => api.get(`/customers/${id}`);
export const createCustomer = (body: any)  => api.post('/customers', body);
export const updateCustomer = (id: number, body: any) => api.patch(`/customers/${id}`, body);

// ─── Rentals ──────────────────────────────────────────────────────────────────
export const getRentals      = (status?: string) =>
  api.get('/rentals' + (status ? `?status=${status}` : ''));
export const createRental    = (body: any)  => api.post('/rentals', body);
export const completeRental  = (id: number) => api.patch(`/rentals/${id}/complete`);
export const cancelRental    = (id: number) => api.patch(`/rentals/${id}/cancel`);

// ─── Payments ─────────────────────────────────────────────────────────────────
export const getPayments   = () => api.get('/payments');
export const createPayment = (body: any) => api.post('/payments', body);

// ─── Tracking ─────────────────────────────────────────────────────────────────
export const getTracking      = () => api.get('/tracking');
export const updateLocation   = (id: number, body: any) => api.patch(`/tracking/${id}`, body);
