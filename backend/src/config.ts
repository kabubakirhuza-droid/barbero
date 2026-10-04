import dotenv from 'dotenv';
dotenv.config();

// Central Application Name and Base URL Configuration
export const APP_NAME = process.env.APP_NAME || 'Barbero';
export const APP_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:8081';

const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';

// Validate required environment variables in production
const jwtSecret = process.env.JWT_SECRET || (isProduction ? '' : 'dev_jwt_secret_change_in_production_key');
const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || (isProduction ? '' : 'dev_refresh_jwt_secret_change_in_production');
const telegramGatewayToken = process.env.TELEGRAM_GATEWAY_TOKEN || '';

if (isProduction && (!jwtSecret || !jwtRefreshSecret)) {
  console.error('FATAL: JWT_SECRET and JWT_REFRESH_SECRET must be set in environment variables.');
}

export const config = {
  appName: APP_NAME,
  appBaseUrl: APP_BASE_URL,
  port: parseInt(process.env.PORT || '5000', 10),
  jwtSecret: jwtSecret || 'dev_jwt_secret_change_in_production_key',
  jwtRefreshSecret: jwtRefreshSecret || 'dev_refresh_jwt_secret_change_in_production',
  telegramGatewayToken,
  demoAuth: process.env.DEMO_AUTH === 'true',
  salonMergeRadiusM: parseInt(process.env.SALON_MERGE_RADIUS_M || '50', 10), // 50 meters
  databaseUrl: process.env.DATABASE_URL || '',
  rateLimitSeconds: 60,
  maxVerificationAttempts: 5,
};
