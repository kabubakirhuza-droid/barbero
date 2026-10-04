import express from 'express';
import cors from 'cors';
import { config, APP_NAME, APP_BASE_URL } from './config';
import authRoutes from './routes/auth';
import serviceRoutes from './routes/services';
import appointmentRoutes from './routes/appointments';
import clientRoutes from './routes/clients';
import analyticsRoutes from './routes/analytics';
import portfolioRoutes from './routes/portfolio';
import profileRoutes from './routes/profile';
import publicBookingRoutes from './routes/publicBooking';
import salonRoutes from './routes/salons';
import bookingRequestRoutes from './routes/bookingRequests';
import pushRoutes from './routes/push';
import reviewRoutes from './routes/reviews';

const app = express();

app.use(cors());
app.use(express.json());

// Register API Routes under both / and /api for maximum compatibility
const routes = [
  { path: '/auth', handler: authRoutes },
  { path: '/services', handler: serviceRoutes },
  { path: '/appointments', handler: appointmentRoutes },
  { path: '/clients', handler: clientRoutes },
  { path: '/analytics', handler: analyticsRoutes },
  { path: '/portfolio', handler: portfolioRoutes },
  { path: '/profile', handler: profileRoutes },
  { path: '/public', handler: publicBookingRoutes },
  { path: '/salons', handler: salonRoutes },
  { path: '/booking-requests', handler: bookingRequestRoutes },
  { path: '/push', handler: pushRoutes },
  { path: '/reviews', handler: reviewRoutes },
];

routes.forEach(({ path, handler }) => {
  app.use(path, handler);
  app.use(`/api${path}`, handler);
});

import path from 'path';

// Serve Web Application bundle and PWA static assets
const distPath = path.resolve(__dirname, '../../mobile/dist');
app.use(express.static(distPath));

import { pool } from './db';
import { isJwtReady, isGatewayReady, isVapidReady } from './config';

// Health check endpoint
app.get(['/health', '/api/health'], async (req, res) => {
  let dbStatus = config.databaseUrl ? 'missing' : 'missing';
  if (config.databaseUrl) {
    try {
      await pool.query('SELECT 1');
      dbStatus = 'connected';
    } catch {
      dbStatus = 'disconnected';
    }
  }

  res.json({
    status: 'ok',
    app: APP_NAME,
    appName: APP_NAME,
    version: '1.0.9',
    timestamp: new Date().toISOString(),
    db: dbStatus,
    gateway: isGatewayReady ? 'configured' : 'missing',
    jwt: isJwtReady ? 'configured' : 'missing',
    vapid: isVapidReady ? 'configured' : 'missing',
    diagnostics: {
      db: dbStatus,
      gateway: isGatewayReady ? 'configured' : 'missing',
      jwt: isJwtReady ? 'configured' : 'missing',
      vapid: isVapidReady ? 'configured' : 'missing',
    },
  });
});

// SPA fallback for frontend client routing (non-API paths)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/auth') || req.path.startsWith('/appointments')) {
    return next();
  }
  const indexPath = path.join(distPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) next();
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(config.port, () => {
    console.log(`===============================================`);
    console.log(`🚀 ${APP_NAME} Backend Server running on port ${config.port}`);
    console.log(`📍 PostGIS Salons 50m Geolocation integration active`);
    console.log(`🔔 WebPush VAPID push notification support enabled`);
    console.log(`✨ Health: http://localhost:${config.port}/health`);
    console.log(`===============================================`);
  });
}

export default app;
