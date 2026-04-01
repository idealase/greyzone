import axios from "axios";
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
} from "../types/auth";

/**
 * Auth endpoints live at /api/auth/*, not under /api/v1/,
 * so we use a plain axios instance to avoid the apiClient baseURL prefix.
 */
const authHttp = axios.create({
  headers: { "Content-Type": "application/json" },
});

export async function login(data: LoginRequest): Promise<AuthResponse> {
  const response = await authHttp.post<AuthResponse>("/api/auth/login", data);
  return response.data;
}

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const response = await authHttp.post<AuthResponse>("/api/auth/register", data);
  return response.data;
}

export async function refresh(
  refreshToken: string
): Promise<AuthResponse> {
  const response = await authHttp.post<AuthResponse>("/api/auth/refresh", {
    refresh_token: refreshToken,
  });
  return response.data;
}

export async function logout(): Promise<void> {
  await authHttp.post("/api/auth/logout");
}
