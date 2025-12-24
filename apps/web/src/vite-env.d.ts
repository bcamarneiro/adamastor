/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SAMPLE_ENV_VAR: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.md';
