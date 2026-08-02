/// <reference types="vite/client" />

declare module '*.module.css' {
  const classes: { readonly [key: string]: string }
  export default classes
}

// Status reporting environment variables
interface ImportMetaEnv {
  readonly VITE_STATUS_INGEST_URL: string;
  readonly VITE_STATUS_INGEST_KEY: string;
  readonly VITE_STATUS_ENVIRONMENT: string;
  readonly VITE_STATUS_RELEASE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
