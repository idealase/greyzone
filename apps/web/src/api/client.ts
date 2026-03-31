import axios from "axios";
import { useAuthStore } from "../stores/authStore";
import { refresh } from "./auth";

declare module "axios" {
  export interface InternalAxiosRequestConfig {
    _retry?: boolean;
  }
}

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api/v1",
  headers: { "Content-Type": "application/json" },
});

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

function isAuthEndpoint(url?: string): boolean {
  if (!url) return false;
  const parsed = new URL(url, window.location.origin);
  const path = parsed.pathname;
  return (
    path === "/api/auth/login" ||
    path === "/api/auth/register" ||
    path === "/api/auth/refresh"
  );
}

async function getRefreshedAccessToken(): Promise<string | null> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }
  const state = useAuthStore.getState();
  if (!state.refreshToken) {
    state.clear();
    return null;
  }
  isRefreshing = true;
  refreshPromise = refresh(state.refreshToken)
    .then((response) => {
      useAuthStore.getState().setAuth({
        user: response.user,
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
      });
      return response.access_token;
    })
    .catch(() => {
      useAuthStore.getState().clear();
      return null;
    })
    .finally(() => {
      isRefreshing = false;
      refreshPromise = null;
    });
  return refreshPromise;
}

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      !originalRequest?._retry &&
      !isAuthEndpoint(originalRequest?.url)
    ) {
      originalRequest._retry = true;
      const token = await getRefreshedAccessToken();
      if (token) {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiClient(originalRequest);
      }
    }
    if (error.response) {
      const message =
        error.response.data?.detail || error.response.statusText || "Request failed";
      return Promise.reject(new Error(message));
    }
    return Promise.reject(error);
  }
);

export default apiClient;
