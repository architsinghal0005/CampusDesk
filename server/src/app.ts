import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import resourceRoutes from './routes/resourceRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import { startBookingCron } from './utils/bookingCron.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'CampusDesk API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/bookings', bookingRoutes);

startBookingCron();

export default app;
