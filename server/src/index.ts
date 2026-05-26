import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import authRoutes from './routes/auth.routes';
import chamaRoutes from './routes/chama.routes';
import contributionRoutes from './routes/contribution.routes';
import loanRoutes from './routes/loan.routes';
import investmentRoutes from './routes/investment.routes';
import meetingRoutes from './routes/meeting.routes';
import reportRoutes from './routes/report.routes';
import notificationRoutes from './routes/notification.routes';
import mpesaRoutes from './routes/mpesa.routes';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(helmet());
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ─── Routes ─────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'Chama OS API', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/chamas', chamaRoutes);
app.use('/api/chamas', contributionRoutes);
app.use('/api/chamas', loanRoutes);
app.use('/api/chamas', investmentRoutes);
app.use('/api/chamas', meetingRoutes);
app.use('/api/chamas', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/mpesa', mpesaRoutes);

// ─── Error Handler ──────────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ───────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║         🏦 CHAMA OS API SERVER          ║
  ║                                          ║
  ║  Running on: http://localhost:${PORT}      ║
  ║  Environment: ${process.env.NODE_ENV || 'development'}            ║
  ╚══════════════════════════════════════════╝
  `);
});

export default app;
