export const APP_NAME = 'Barbero';

// Real URL where the app is running (no fake domains)
export const getAppBaseUrl = (): string => {
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return window.location.origin;
  }
  return process.env.APP_BASE_URL || 'http://localhost:8081';
};

export const APP_BASE_URL = getAppBaseUrl();

// Feature flags & limits
export const DEMO_AUTH = false;
export const SALON_MERGE_RADIUS_M = 50; // 50 meters PostGIS grouping threshold
