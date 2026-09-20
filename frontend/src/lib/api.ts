import axios from 'axios';

export type SessionUser = {
  id: number;
  email: string;
  name: string;
  phone?: string | null;
  profession?: string | null;
  email_verified: boolean;
};

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRequest = error.config?.url?.includes('/api/auth/');
    if (error.response?.status === 401 && !isAuthRequest) {
      clearSession();
      window.location.assign('/');
    }
    return Promise.reject(error);
  },
);

export function saveSession(accessToken: string, user: SessionUser) {
  localStorage.setItem('access_token', accessToken);
  localStorage.setItem('user', JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('user');
}

export function getStoredUser(): SessionUser | null {
  try {
    const value = localStorage.getItem('user');
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}
