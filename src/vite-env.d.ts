/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_API_DEV_USERNAME?: string;
  readonly VITE_API_DEV_PASSWORD?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
