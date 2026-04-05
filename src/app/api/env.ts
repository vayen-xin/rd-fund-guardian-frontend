const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

export const apiEnv = {
  baseUrl: trimTrailingSlash(import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080"),
  devUsername: import.meta.env.VITE_API_DEV_USERNAME?.trim() ?? "",
  devPassword: import.meta.env.VITE_API_DEV_PASSWORD?.trim() ?? "",
};
