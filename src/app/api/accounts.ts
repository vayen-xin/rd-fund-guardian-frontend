import { apiRequest } from "./http";

export type AccountRecord = {
  id: number;
  companyId?: number | null;
  username: string;
  name: string;
  role: string;
  email?: string;
  phone?: string;
  status: string;
  createdAt?: string;
};

export type PageResponse<T> = {
  list: T[];
  page: number;
  size: number;
  total: number;
};

export type CreateAccountPayload = {
  username: string;
  password: string;
  name: string;
  role: string;
  companyId?: number | null;
};

export function fetchAccounts(params: {
  page: number;
  size: number;
  keyword?: string;
  role?: string;
}) {
  const search = new URLSearchParams({
    page: String(params.page),
    size: String(params.size),
  });
  if (params.keyword) {
    search.set("keyword", params.keyword);
  }
  if (params.role) {
    search.set("role", params.role);
  }
  return apiRequest<PageResponse<AccountRecord>>(`/api/v1/accounts?${search.toString()}`);
}

export function createAccount(payload: CreateAccountPayload) {
  return apiRequest<AccountRecord>("/api/v1/accounts", {
    method: "POST",
    body: payload,
  });
}

export function updateAccountStatus(id: number | string, status: "enabled" | "disabled") {
  return apiRequest<void>(`/api/v1/accounts/${id}/status`, {
    method: "PUT",
    body: { status },
  });
}

export function updateMyProfile(payload: { name: string; email?: string; phone?: string }) {
  return apiRequest<void>("/api/v1/accounts/me/profile", {
    method: "PUT",
    body: payload,
  });
}

export function updateMyPassword(payload: { oldPassword: string; newPassword: string }) {
  return apiRequest<void>("/api/v1/accounts/me/password", {
    method: "PUT",
    body: payload,
  });
}
