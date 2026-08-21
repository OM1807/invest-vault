import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import type {
  AuthResponse,
  Bid,
  BidPayload,
  FieldErrors,
  FounderProfile,
  FounderProfilePayload,
  FundingRound,
  FundingRoundPayload,
  InvestorProfile,
  InvestorProfilePayload,
  LoginPayload,
  RegisterPayload,
  Startup,
  StartupPayload,
  User,
} from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ---- Token storage ----
const ACCESS_KEY = 'iv_access';
const REFRESH_KEY = 'iv_refresh';

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY);
}
export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}
export function setTokens(access: string, refresh: string) {
  localStorage.setItem(ACCESS_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}
export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

// ---- Request interceptor: attach JWT ----
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---- Response interceptor: auto-refresh on 401 ----
let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const refresh = getRefreshToken();
  if (!refresh) throw new Error('No refresh token');
  const res = await axios.post<{ access: string }>(`${API_BASE_URL}/auth/refresh/`, {
    refresh,
  });
  const access = res.data.access;
  localStorage.setItem(ACCESS_KEY, access);
  return access;
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (
      error.response?.status === 401 &&
      !original._retry &&
      !original.url?.includes('/auth/')
    ) {
      original._retry = true;
      try {
        if (!isRefreshing) {
          isRefreshing = true;
          refreshPromise = refreshAccessToken().finally(() => {
            isRefreshing = false;
          });
        }
        const newToken = await refreshPromise!;
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        clearTokens();
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

// ---- Error helpers ----
export function getFieldErrors(err: unknown): FieldErrors {
  const ax = err as AxiosError<any>;
  if (ax.response?.data) {
    const data = ax.response.data;
    if (typeof data === 'object' && !Array.isArray(data)) {
      return data as FieldErrors;
    }
  }
  return {};
}

export function getGenericError(err: unknown): string | null {
  const ax = err as AxiosError<any>;
  if (ax.response?.data) {
    const data = ax.response.data;
    if (typeof data === 'string') return data;
    if (data.detail) return data.detail;
    if (data.non_field_errors) return data.non_field_errors.join(' ');
    if (data.message) return data.message;
  }
  if (ax.message) return ax.message;
  return null;
}

export function hasFieldError(errors: FieldErrors, field: string): boolean {
  return Array.isArray(errors[field]) && errors[field].length > 0;
}

export function fieldError(errors: FieldErrors, field: string): string | null {
  return hasFieldError(errors, field) ? errors[field][0] : null;
}

// ---- Auth API ----
export const authApi = {
  register: (payload: RegisterPayload) =>
    api.post<AuthResponse>('/auth/register/', payload).then((r) => r.data),
  login: (payload: LoginPayload) =>
    api.post<AuthResponse>('/auth/login/', payload).then((r) => r.data),
  refresh: (refresh: string) =>
    api.post<{ access: string }>('/auth/refresh/', { refresh }).then((r) => r.data),
  me: () => api.get<User>('/auth/me/').then((r) => r.data),
};

// ---- Startups API ----
export const startupsApi = {
  list: (params?: AxiosRequestConfig['params']) =>
    api.get<Startup[]>('/startups/', { params }).then((r) => r.data),
  get: (id: number) => api.get<Startup>(`/startups/${id}/`).then((r) => r.data),
  create: (payload: StartupPayload) =>
    api.post<Startup>('/startups/', payload).then((r) => r.data),
  update: (id: number, payload: Partial<StartupPayload>) =>
    api.patch<Startup>(`/startups/${id}/`, payload).then((r) => r.data),
  remove: (id: number) => api.delete(`/startups/${id}/`).then((r) => r.data),
};

// ---- Founder profiles API ----
export const foundersApi = {
  list: () => api.get<FounderProfile[]>('/founders/').then((r) => r.data),
  get: (id: number) => api.get<FounderProfile>(`/founders/${id}/`).then((r) => r.data),
  create: (payload: FounderProfilePayload) =>
    api.post<FounderProfile>('/founders/', payload).then((r) => r.data),
  update: (id: number, payload: Partial<FounderProfilePayload>) =>
    api.patch<FounderProfile>(`/founders/${id}/`, payload).then((r) => r.data),
  remove: (id: number) => api.delete(`/founders/${id}/`).then((r) => r.data),
};

// ---- Investor profiles API ----
export const investorsApi = {
  list: () => api.get<InvestorProfile[]>('/investors/').then((r) => r.data),
  get: (id: number) => api.get<InvestorProfile>(`/investors/${id}/`).then((r) => r.data),
  create: (payload: InvestorProfilePayload) =>
    api.post<InvestorProfile>('/investors/', payload).then((r) => r.data),
  update: (id: number, payload: Partial<InvestorProfilePayload>) =>
    api.patch<InvestorProfile>(`/investors/${id}/`, payload).then((r) => r.data),
  remove: (id: number) => api.delete(`/investors/${id}/`).then((r) => r.data),
};

// ---- Funding rounds API ----
export const roundsApi = {
  list: (params?: AxiosRequestConfig['params']) =>
    api.get<FundingRound[]>('/investments/funding-rounds/', { params }).then((r) => r.data),
  get: (id: number) =>
    api.get<FundingRound>(`/investments/funding-rounds/${id}/`).then((r) => r.data),
  create: (payload: FundingRoundPayload) =>
    api.post<FundingRound>('/investments/funding-rounds/', payload).then((r) => r.data),
  update: (id: number, payload: Partial<FundingRoundPayload>) =>
    api.patch<FundingRound>(`/investments/funding-rounds/${id}/`, payload).then((r) => r.data),
  remove: (id: number) =>
    api.delete(`/investments/funding-rounds/${id}/`).then((r) => r.data),
};

// ---- Bids API ----
export const bidsApi = {
  list: (params?: AxiosRequestConfig['params']) =>
    api.get<Bid[]>('/investments/bids/', { params }).then((r) => r.data),
  get: (id: number) => api.get<Bid>(`/investments/bids/${id}/`).then((r) => r.data),
  create: (payload: BidPayload) =>
    api.post<Bid>('/investments/bids/', payload).then((r) => r.data),
  update: (id: number, payload: Partial<BidPayload>) =>
    api.patch<Bid>(`/investments/bids/${id}/`, payload).then((r) => r.data),
  remove: (id: number) => api.delete(`/investments/bids/${id}/`).then((r) => r.data),
};
