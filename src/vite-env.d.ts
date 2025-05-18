/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly MODE: string;
  readonly BASE_URL: string;
  readonly PROD: boolean;
  readonly DEV: boolean;
  readonly SSR: boolean;
  
  // Custom environment variables
  readonly VITE_APP_VERSION: string;
  readonly VITE_WASM_CDN_URL: string;
  readonly VITE_FEATURE_FLAGS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
