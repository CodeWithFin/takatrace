import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

export const authApi = {
  sendOtp: (phone_number: string) =>
    api.post('/auth/otp/send', { phone_number }),
  verifyOtp: (phone_number: string, otp: string) =>
    api.post('/auth/otp/verify', { phone_number, otp }),
};

export const scanApi = {
  createScan: (payload: FormData) =>
    api.post('/scans', payload, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getMyScans: () =>
    api.get('/scans/me'),
};

export const walletApi = {
  getBalance: () =>
    api.get('/wallet/balance'),
  withdraw: (amount: number) =>
    api.post('/wallet/withdraw', { amount }),
};
