import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { pool } from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import goalRoutes from './routes/goal.routes.js';
import approvalRoutes from './routes/approval.routes.js';
import checkinRoutes from './routes/checkin.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import teamRoutes from './routes/team.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import employeeRoutes from './routes/employee.routes.js';

if (!process.env.JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET environment variable is not defined.');
  process.exit(1);
}

const app = express();
const port = process.env.PORT || 5001;

app.use(
  cors({
    origin: (process.env.CORS_ORIGIN || 'http://localhost:3000').split(','),
    credentials: true,
  })
);
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/checkins', checkinRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/employees', employeeRoutes);

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(503).json({ status: 'error', database: 'unreachable', detail: error.message });
  }
});

app.listen(port, async () => {
  console.log(`Server is running on port ${port}`);
  try {
    await pool.query('SELECT 1');
    console.log('Database connection OK');
  } catch (error) {
    console.error(`Database connection FAILED: ${error.message}`);
    console.error('Check DATABASE_URL in backend/.env (is the Supabase project paused or deleted?)');
  }
});
