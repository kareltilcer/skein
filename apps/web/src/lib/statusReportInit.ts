/*
 * statusReportInit.ts — Early initialization of status reporting for the web app.
 * This should be imported as early as possible in the app entry point.
 */

import { initStatusReport } from './statusReport';

// Initialize status reporting if environment variables are available
// This is safe to call multiple times - it will only initialize once
function initializeStatusReporting() {
  const ingestUrl = import.meta.env.VITE_STATUS_INGEST_URL;
  const ingestKey = import.meta.env.VITE_STATUS_INGEST_KEY;
  const environment = import.meta.env.VITE_STATUS_ENVIRONMENT || 'prod';
  const release = import.meta.env.VITE_STATUS_RELEASE || 'web@' + import.meta.env.VITE_APP_VERSION || 'web@unknown';

  if (ingestUrl && ingestKey) {
    initStatusReport({
      url: ingestUrl,
      key: ingestKey,
      environment: environment,
      release: release,
    });
    console.log('Status reporting initialized for:', environment, release);
  } else {
    console.warn('Status reporting not initialized: missing VITE_STATUS_INGEST_URL or VITE_STATUS_INGEST_KEY');
  }
}

// Initialize immediately when this module is imported
initializeStatusReporting();

export default initializeStatusReporting;