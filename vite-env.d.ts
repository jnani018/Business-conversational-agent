/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY: string;
  readonly VITE_GOOGLE_SHEETS_API_KEY: string;
  // Add other VITE_ prefixed environment variables here if you use them
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}