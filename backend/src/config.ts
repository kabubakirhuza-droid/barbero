import dotenv from 'dotenv';
dotenv.config();

export const APP_NAME = process.env.APP_NAME || 'BarberPlan';
export const APP_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:8081';

export const isProduction =
  process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';

// In production, secrets MUST come from environment variables.
// Fallback keys are only allowed in local development.
const jwtSecret = isProduction
  ? process.env.JWT_SECRET || ''
  : process.env.JWT_SECRET || 'dev_jwt_secret_change_in_production_key';

const jwtRefreshSecret = isProduction
  ? process.env.JWT_REFRESH_SECRET || ''
  : process.env.JWT_REFRESH_SECRET || 'dev_refresh_jwt_secret_change_in_production';

const telegramGatewayToken = process.env.TELEGRAM_GATEWAY_TOKEN || '';
const databaseUrl = process.env.DATABASE_URL || '';

export const config = {
  appName: APP_NAME,
  appBaseUrl: APP_BASE_URL,
  port: parseInt(process.env.PORT || '5000', 10),
  isProduction,
  jwtSecret,
  jwtRefreshSecret,
  telegramGatewayToken,
  databaseUrl,
  salonMergeRadiusM: parseInt(process.env.SALON_MERGE_RADIUS_M || '50', 10), // 50 meters
  rateLimitSeconds: 60,
  maxVerificationAttempts: 5,
  vapidPublicKey: process.env.VAPID_PUBLIC_KEY || '',
  vapidPrivateKey: process.env.VAPID_PRIVATE_KEY || '',
  vapidSubject: process.env.VAPID_SUBJECT || 'mailto:support@barbero.uz',
};

// Check readiness
export const isJwtReady = Boolean(config.jwtSecret && config.jwtRefreshSecret);
export const isGatewayReady = Boolean(config.telegramGatewayToken);
export const isDbReady = Boolean(config.databaseUrl);
export const isVapidReady = Boolean(config.vapidPublicKey && config.vapidPrivateKey);

export function getDiagnostics() {
  return {
    environment: isProduction ? 'production' : 'development',
    db: isDbReady ? 'configured' : 'missing',
    gateway: isGatewayReady ? 'configured' : 'missing',
    jwt: isJwtReady ? 'configured' : 'missing',
    vapid: isVapidReady ? 'configured' : 'missing',
  };
}
