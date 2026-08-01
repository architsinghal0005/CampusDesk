import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import resourceRoutes from './routes/resourceRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import { startBookingCron } from './utils/bookingCron.js';

const app = express();
console.log("CLIENT_URL:", process.env.CLIENT_URL);
app.use((req, res, next) => {
  console.log("Origin:", req.headers.origin);
  next();
});

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'CampusDesk API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/bookings', bookingRoutes);

startBookingCron();

export default app;
