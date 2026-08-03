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
  /**
   * Application version automatically injected from package.json at build time.
   * Used as fallback for VITE_STATUS_RELEASE when not explicitly configured.
   * Format: semantic version string (e.g., "0.0.1")
   */
  readonly VITE_APP_VERSION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
