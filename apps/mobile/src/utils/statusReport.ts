/*
 * statusReport.ts — React Native crash reporter for status.tilcer.cz.
 * TypeScript adaptation for Expo/React Native environment.
 *
 * Uses fetch for error reporting and sets up global error handlers
 * for React Native. Fail-safe: an ingest error is swallowed and never
 * affects the host app.
 */

declare global {
  namespace NodeJS {
    interface Global {
      ErrorUtils?: {
        getGlobalHandler: () => ((error: Error, isFatal?: boolean) => void) | undefined;
        setGlobalHandler: (handler: (error: Error, isFatal?: boolean) => void) => void;
      };
      ErrorHandler?: (error: Error, isFatal: boolean) => void;
    }
  }
}

interface StatusReportConfig {
  url: string;
  key: string;
  environment?: string;
  release?: string;
}

interface ReportOptions {
  level?: 'fatal' | 'error' | 'warning';
  stack?: string;
  fingerprint?: string;
  context?: Record<string, unknown>;
}

interface CrashReport {
  message: string;
  level?: 'fatal' | 'error' | 'warning';
  stack?: string;
  environment?: string;
  release?: string;
  fingerprint?: string;
  context?: Record<string, unknown>;
  occurred_at?: string;
}

let config: StatusReportConfig | null = null;
let initialized = false;

/**
 * Initialize the status reporter with configuration.
 * Must be called before any reports can be sent.
 */
export function initStatusReport(options: StatusReportConfig): void {
  if (!options || !options.url || !options.key) {
    // Misconfiguration must not throw in the host app.
    console.warn('StatusReport.init: url and key are required');
    return;
  }
  
  if (initialized) {
    console.log('StatusReport already initialized, skipping');
    return;
  }
  
  initialized = true;
  config = {
    url: options.url,
    key: options.key,
    environment: options.environment || '',
    release: options.release || '',
  };

  // Set up global error handlers for React Native
  setupGlobalErrorHandlers();
}

/**
 * Set up global error handlers for React Native
 */
function setupGlobalErrorHandlers(): void {
  if (!config) return;

  try {
    // Handle uncaught errors (similar to window.onerror in browser)
    // Try to use ErrorUtils first (modern React Native)
    const globalObj = global as unknown as NodeJS.Global;
    if (globalObj.ErrorUtils && typeof globalObj.ErrorUtils.setGlobalHandler === 'function') {
      const ErrorUtils = globalObj.ErrorUtils as {
        getGlobalHandler: () => ((error: Error, isFatal?: boolean) => void) | undefined;
        setGlobalHandler: (handler: (error: Error, isFatal?: boolean) => void) => void;
      };
      
      const originalErrorHandler = ErrorUtils.getGlobalHandler?.();
      ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
        // Report the error
        reportStatusError(error, {
          level: isFatal ? 'fatal' : 'error',
          context: { 
            kind: 'global.error',
            isFatal: isFatal,
          },
        });
        
        // Call the original handler if it exists
        if (originalErrorHandler) {
          originalErrorHandler(error, isFatal);
        }
      });
    } else {
      // Fallback for older React Native versions - use any type for global
      const globalObj = global as any;
      const originalHandler = globalObj.ErrorHandler;
      globalObj.ErrorHandler = (error: Error, isFatal: boolean) => {
        reportStatusError(error, {
          level: isFatal ? 'fatal' : 'error',
          context: { 
            kind: 'global.error',
            isFatal: isFatal,
          },
        });
        
        if (originalHandler) {
          originalHandler(error, isFatal);
        }
      };
    }
  } catch (e) {
    // If error handler setup fails, just continue - we can still manually report errors
    console.warn('Failed to set up global error handlers:', e);
  }
}

/**
 * Report an error to the status service.
 */
export function reportStatusError(err: unknown, opts?: ReportOptions): void {
  if (!config) return; // not initialized — no-op
  
  opts = opts || {};
  let message: string;
  let stack = '';
  
  if (err instanceof Error) {
    message = err.message || err.name || 'Error';
    stack = err.stack || '';
  } else {
    message = String(err);
    stack = '';
  }
  
  const payload: CrashReport = {
    message: message,
    level: opts.level || 'error',
    stack: opts.stack || stack || undefined,
    environment: config.environment || undefined,
    release: config.release || undefined,
    fingerprint: opts.fingerprint || undefined,
    context: opts.context || undefined,
  };
  
  try {
    fetch(config.url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'X-Ingest-Key': config.key 
      },
      body: JSON.stringify(payload),
    }).catch(function () {
      /* fail safe: drop ingest errors */
    });
  } catch (_) {
    /* fail safe: never throw from the reporter */
  }
}

/**
 * Get the current configuration (for debugging/testing)
 */
export function getStatusReportConfig(): StatusReportConfig | null {
  return config;
}

/**
 * Check if status reporting is initialized
 */
export function isStatusReportInitialized(): boolean {
  return initialized;
}

export default {
  init: initStatusReport,
  report: reportStatusError,
  getConfig: getStatusReportConfig,
  isInitialized: isStatusReportInitialized,
};