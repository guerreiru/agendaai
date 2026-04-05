import { api } from "./client";
import type {
  LoginPayload,
  LoginResponse,
  RefreshResponse,
} from "../../types/auth";
import type { User } from "../../types/user";

export async function loginRequest(
  payload: LoginPayload,
): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>("/auth/login", payload);
  return response.data;
}

export async function refreshRequest(): Promise<RefreshResponse> {
  const response = await api.post<RefreshResponse>("/auth/refresh");
  return response.data;
}

export async function logoutRequest(): Promise<void> {
  await api.post("/auth/logout");
}

export async function meRequest(): Promise<User> {
  const response = await api.get<User>("/auth/me");
  return response.data;
}
