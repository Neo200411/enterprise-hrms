import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { pool } from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import goalRoutes from './routes/goal.routes.js';
import approvalRoutes from './routes/approval.routes.js';
import checkinRoutes from './routes/checkin.routes.js';
import reportRoutes from './routes/reports.routes.js';

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('FATAL ERROR: JWT_SECRET must be set to a random string of at least 32 characters.');
  console.error("Generate one with: node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\"");
  process.exit(1);
}

const app = express();
app.set('trust proxy', 1); // so req.ip is the real client IP behind a proxy (used for rate limiting)
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
app.use('/api/reports', reportRoutes);

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(503).json({ status: 'error', database: 'unreachable', detail: error.message });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Central error handler: malformed JSON, invalid IDs, and anything a controller passed to next()
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Request body must be valid JSON' });
  }
  if (err.code === '22P02') {
    return res.status(400).json({ error: 'Invalid ID or value format' });
  }
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
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
