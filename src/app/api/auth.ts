import { apiRequest, writeStoredToken } from "./http";

export type CurrentUser = {
  id: number;
  username: string;
  name: string;
  role: string;
  email?: string;
  phone?: string;
  companyId?: number | null;
};

export function fetchCurrentUser() {
  return apiRequest<CurrentUser>("/api/auth/current");
}

export function logout() {
  return apiRequest<void>("/api/auth/logout", {
    method: "POST",
  });
}

export type LoginResponse = {
  userId: number;
  username: string;
  name: string;
  role: string;
  token: string;
};

export async function login(payload: { username: string; password: string }) {
  const data = await apiRequest<LoginResponse>("/api/auth/login", {
    method: "POST",
    auth: false,
    body: payload,
  });
  writeStoredToken(data.token);
  return data;
}
