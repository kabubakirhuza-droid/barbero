import dotenv from 'dotenv';
dotenv.config();

// Central Application Name and Base URL Configuration
export const APP_NAME = process.env.APP_NAME || 'BARBERO';
export const APP_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:8081';

export const config = {
  appName: APP_NAME,
  appBaseUrl: APP_BASE_URL,
  port: parseInt(process.env.PORT || '5000', 10),
  jwtSecret: process.env.JWT_SECRET || 'usta_super_jwt_secret_key_2026',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'usta_refresh_jwt_key_2026',
  telegramGatewayToken: process.env.TELEGRAM_GATEWAY_TOKEN || 'AAH_TwAA7jCfQBYKEhI1DNY_THRPV5YKQXkgYvcrQzbyVw',
  demoAuth: process.env.DEMO_AUTH === 'true',
  salonMergeRadiusM: parseInt(process.env.SALON_MERGE_RADIUS_M || '50', 10), // 50 meters
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/usta_db',
  rateLimitSeconds: 60,
  maxVerificationAttempts: 5,
};
