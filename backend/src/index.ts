import express from 'express';
import cors from 'cors';
import path from 'path';
import { config, APP_NAME, isJwtReady, isGatewayReady, isVapidReady } from './config';
import authRoutes from './routes/auth';
import serviceRoutes from './routes/services';
import workingHoursRoutes from './routes/workingHours';
import settingsRoutes from './routes/settings';
import appointmentRoutes from './routes/appointments';
import blockedSlotsRoutes from './routes/blockedSlots';
import clientRoutes from './routes/clients';
import callLogRoutes from './routes/callLog';
import analyticsRoutes from './routes/analytics';
import portfolioRoutes from './routes/portfolio';
import profileRoutes from './routes/profile';
import publicBookingRoutes from './routes/publicBooking';
import salonRoutes from './routes/salons';
import bookingRequestRoutes from './routes/bookingRequests';
import pushRoutes from './routes/push';
import notificationRoutes from './routes/notifications';
import legalRoutes from './routes/legal';
import reviewRoutes from './routes/reviews';

import { pool, db } from './db';

const app = express();

app.use(cors());
app.use(express.json());

// Return JSON error for malformed JSON requests
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ error: "Noto'g'ri JSON formati" });
    return;
  }
  next(err);
});

// Auto-initialize DB schema on startup
db.initDb().catch((e) => console.warn('[DB AutoInit Notice]:', e.message));

// Register API Routes under both / and /api for maximum compatibility
const routes = [
  { path: '/auth', handler: authRoutes },
  { path: '/services', handler: serviceRoutes },
  { path: '/working-hours', handler: workingHoursRoutes },
  { path: '/settings', handler: settingsRoutes },
  { path: '/appointments', handler: appointmentRoutes },
  { path: '/blocked-slots', handler: blockedSlotsRoutes },
  { path: '/clients', handler: clientRoutes },
  { path: '/call-log', handler: callLogRoutes },
  { path: '/analytics', handler: analyticsRoutes },
  { path: '/portfolio', handler: portfolioRoutes },
  { path: '/profile', handler: profileRoutes },
  { path: '/public', handler: publicBookingRoutes },
  { path: '/salons', handler: salonRoutes },
  { path: '/booking-requests', handler: bookingRequestRoutes },
  { path: '/push', handler: pushRoutes },
  { path: '/notifications', handler: notificationRoutes },
  { path: '/legal', handler: legalRoutes },
  { path: '/reviews', handler: reviewRoutes },
];

routes.forEach(({ path: routePath, handler }) => {
  app.use(routePath, handler);
  app.use(`/api${routePath}`, handler);
});

// Health check endpoint (GET /health and GET /api/health)
const healthHandler = async (req: express.Request, res: express.Response) => {
  let dbStatus: 'connected' | 'configured' | 'missing' | 'disconnected' = config.databaseUrl ? 'missing' : 'missing';
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
    version: '1.0.0',
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
};

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// Serve Web Application bundle and PWA static assets
const distPath = path.resolve(__dirname, '../../mobile/dist');
app.use(express.static(distPath));

// SPA fallback for frontend client routing (non-API paths)
app.get('*', (req, res, next) => {
  if (
    req.path.startsWith('/api') ||
    req.path.startsWith('/auth') ||
    req.path.startsWith('/appointments') ||
    req.path.startsWith('/services') ||
    req.path.startsWith('/salons') ||
    req.path.startsWith('/call-log') ||
    req.path.startsWith('/notifications') ||
    req.path.startsWith('/legal')
  ) {
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
    console.log(`✨ Health: http://localhost:${config.port}/health`);
    console.log(`===============================================`);
  });
}

export default app;
