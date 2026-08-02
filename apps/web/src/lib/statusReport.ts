/*
 * statusReport.ts — browser crash reporter for status.tilcer.cz.
 * TypeScript adaptation of the original status-report.js client.
 *
 * Hooks window.onerror and unhandledrejection and posts to the ingest API with
 * fetch({ keepalive: true }) so reports survive a page unload. Fail-safe: an
 * ingest error is swallowed and never affects the host page.
 */

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

/**
 * Initialize the status reporter with configuration.
 * Must be called before any reports can be sent.
 */
export function initStatusReport(options: StatusReportConfig): void {
  if (!options || !options.url || !options.key) {
    // Misconfiguration must not throw in the host page.
    console.warn('StatusReport.init: url and key are required');
    return;
  }
  
  config = {
    url: options.url,
    key: options.key,
    environment: options.environment || '',
    release: options.release || '',
  };

  // Hook global error handlers
  window.addEventListener('error', function (e) {
    const err = e.error || e.message || 'unknown error';
    reportStatusError(err, {
      level: 'error',
      context: { 
        source: e.filename,
        line: e.lineno,
        col: e.colno,
        kind: 'window.error'
      },
    });
  });

  window.addEventListener('unhandledrejection', function (e) {
    const reason = e.reason;
    reportStatusError(reason instanceof Error ? reason : String(reason), {
      level: 'error',
      context: { kind: 'unhandledrejection' },
    });
  });
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
      keepalive: true, // survive page unload
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

export default {
  init: initStatusReport,
  report: reportStatusError,
  getConfig: getStatusReportConfig,
};