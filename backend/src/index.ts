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

const app = express();

app.use(cors());
app.use(express.json());

// API Routes
app.use('/auth', authRoutes);
app.use('/services', serviceRoutes);
app.use('/appointments', appointmentRoutes);
app.use('/clients', clientRoutes);
app.use('/analytics', analyticsRoutes);
app.use('/portfolio', portfolioRoutes);
app.use('/profile', profileRoutes);
app.use('/public', publicBookingRoutes);
app.use('/salons', salonRoutes);
app.use('/booking-requests', bookingRequestRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    appName: APP_NAME,
    appBaseUrl: APP_BASE_URL,
    version: '1.0.9',
    timestamp: new Date().toISOString(),
  });
});

app.listen(config.port, () => {
  console.log(`===============================================`);
  console.log(`🚀 ${APP_NAME} Backend Server running on port ${config.port}`);
  console.log(`📍 PostGIS Salons 50m Geolocation integration active`);
  console.log(`✨ Health: http://localhost:${config.port}/health`);
  console.log(`===============================================`);
});

export default app;
