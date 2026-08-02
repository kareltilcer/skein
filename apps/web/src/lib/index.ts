// Re-export status reporting utilities for convenient importing
export { initStatusReport, reportStatusError, getStatusReportConfig } from './statusReport';
export { default as initStatusReporting } from './statusReportInit';

// Also provide a simple report function for convenience
export function reportError(err: unknown, context?: Record<string, unknown>) {
  // Import here to avoid circular dependencies
  const { reportStatusError } = require('./statusReport');
  reportStatusError(err, { context });
}