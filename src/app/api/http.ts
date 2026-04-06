import { apiEnv } from "./env";

const TOKEN_KEY = "rdcm_token";

export type ApiEnvelope<T> = {
  code: number;
  message: string;
  data: T;
};

type RequestOptions = Omit<RequestInit, "body"> & {
  auth?: boolean;
  body?: BodyInit | Record<string, unknown> | null;
};

function getToken() {
  return localStorage.getItem(TOKEN_KEY) ?? "";
}

function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function redirectToLogin() {
  if (typeof window === "undefined") {
    return;
  }
  if (window.location.pathname !== "/login") {
    window.location.replace("/login");
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { auth = true, headers, body, ...init } = options;
  const requestHeaders = new Headers(headers);
  let requestBody: BodyInit | null | undefined = null;

  if (body instanceof FormData || typeof body === "string" || body instanceof Blob) {
    requestBody = body;
  } else if (body != null) {
    requestHeaders.set("Content-Type", "application/json");
    requestBody = JSON.stringify(body);
  }

  if (auth && getToken()) {
    requestHeaders.set("Authorization", `Bearer ${getToken()}`);
  }

  const response = await fetch(`${apiEnv.baseUrl}${path}`, {
    ...init,
    headers: requestHeaders,
    body: requestBody,
  });

  const payload = (await response.json()) as ApiEnvelope<T>;
  if (response.ok && payload.code === 200) {
    return payload.data;
  }

  if (auth && (response.status === 401 || response.status === 403 || payload.code === 401 || payload.code === 403)) {
    clearToken();
    redirectToLogin();
  }

  throw new Error(payload.message || "请求失败");
}

export function readStoredToken() {
  return getToken();
}

export function clearStoredToken() {
  clearToken();
}

export function writeStoredToken(token: string) {
  setToken(token);
}
