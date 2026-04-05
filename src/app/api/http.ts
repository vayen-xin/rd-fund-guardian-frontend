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

let loginPromise: Promise<void> | null = null;

function getToken() {
  return localStorage.getItem(TOKEN_KEY) ?? "";
}

function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function performDevLogin() {
  if (!apiEnv.devUsername || !apiEnv.devPassword) {
    return;
  }

  const response = await fetch(`${apiEnv.baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: apiEnv.devUsername,
      password: apiEnv.devPassword,
    }),
  });

  const payload = (await response.json()) as ApiEnvelope<{ token: string }>;
  if (!response.ok || payload.code !== 200 || !payload.data?.token) {
    throw new Error(payload.message || "开发环境自动登录失败");
  }
  setToken(payload.data.token);
}

async function ensureSession() {
  if (getToken()) {
    return;
  }
  if (!apiEnv.devUsername || !apiEnv.devPassword) {
    return;
  }
  if (!loginPromise) {
    loginPromise = performDevLogin().finally(() => {
      loginPromise = null;
    });
  }
  await loginPromise;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}, retried = false): Promise<T> {
  const { auth = true, headers, body, ...init } = options;
  if (auth) {
    await ensureSession();
  }

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

  if (auth && payload.code === 401 && !retried && apiEnv.devUsername && apiEnv.devPassword) {
    clearToken();
    await ensureSession();
    return apiRequest<T>(path, options, true);
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
