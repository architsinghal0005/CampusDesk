import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import resourceRoutes from './routes/resourceRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import { startBookingCron } from './utils/bookingCron.js';

dotenv.config();

const app = express();

const defaultClientUrl = 'https://campus-desk-sand.vercel.app';
const clientUrl = process.env.CLIENT_URL?.trim().replace(/^['"]|['"]$/g, '') || defaultClientUrl;

const allowedOrigins = new Set([
  clientUrl,
  'http://localhost:5173',
  'http://127.0.0.1:5173'
]);

const corsOptions: cors.CorsOptions = {
  origin(origin, callback) {
    // Allow non-browser requests (health checks, curl, server-to-server)
    if (!origin) {
      callback(null, true);
      return;
    }

    callback(null, allowedOrigins.has(origin));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'CampusDesk API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/bookings', bookingRoutes);

startBookingCron();

export default app;
