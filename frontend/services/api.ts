import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/store/auth.store";

const api = axios.create({
  baseURL: "/api/v1",
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

// Attach access token to every request
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 — attempt token refresh then retry once
let refreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;

    if (status === 401 && !original._retry && original.url !== "/auth/refresh") {
      if (refreshing) {
        return new Promise((resolve) => {
          refreshQueue.push((token) => {
            if (original.headers) original.headers.Authorization = `Bearer ${token}`;
            resolve(api(original));
          });
        });
      }

      original._retry = true;
      refreshing = true;

      try {
        const { refreshToken, setTokens, logout } = useAuthStore.getState();
        if (!refreshToken) {
          logout();
          return Promise.reject(error);
        }
        const res = await axios.post<{ success: boolean; data: { access_token: string; refresh_token: string } }>(
          "/api/v1/auth/refresh",
          { refresh_token: refreshToken }
        );
        if (res.data.success && res.data.data) {
          const { access_token, refresh_token } = res.data.data;
          setTokens(access_token, refresh_token);
          refreshQueue.forEach((cb) => cb(access_token));
          refreshQueue = [];
          if (original.headers) original.headers.Authorization = `Bearer ${access_token}`;
          return api(original);
        }
      } catch {
        useAuthStore.getState().logout();
      } finally {
        refreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
