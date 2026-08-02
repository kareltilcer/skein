/*
 * statusReportInit.ts — Early initialization of status reporting for the mobile app.
 * This should be imported as early as possible in the app entry point.
 */

import { initStatusReport } from './statusReport';
import Constants from 'expo-constants';

// Initialize status reporting if environment variables are available
// This is safe to call multiple times - it will only initialize once
function initializeStatusReporting() {
  // Get configuration from environment variables
  // For Expo, we can use Constants.expoConfig.extra for build-time configuration
  // or process.env for development
  const expoConfig = Constants.expoConfig;
  const manifest = Constants.manifest;
  
  // Try to get config from Expo extra (build-time) first
  const extra = expoConfig?.extra || manifest?.extra || {};
  const ingestUrl = extra.statusIngestUrl || process.env.EXPO_PUBLIC_STATUS_INGEST_URL;
  const ingestKey = extra.statusIngestKey || process.env.EXPO_PUBLIC_STATUS_INGEST_KEY;
  const environment = extra.statusEnvironment || process.env.EXPO_PUBLIC_STATUS_ENVIRONMENT || 'prod';
  const release = extra.statusRelease || process.env.EXPO_PUBLIC_STATUS_RELEASE || `mobile@${expoConfig?.version || manifest?.version || 'unknown'}`;

  if (ingestUrl && ingestKey) {
    initStatusReport({
      url: ingestUrl,
      key: ingestKey,
      environment: environment,
      release: release,
    });
    console.log('Status reporting initialized for:', environment, release);
  } else {
    console.warn('Status reporting not initialized: missing STATUS_INGEST_URL or STATUS_INGEST_KEY');
  }
}

// Initialize immediately when this module is imported
initializeStatusReporting();

export default initializeStatusReporting;