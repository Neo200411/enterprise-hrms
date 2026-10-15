import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false },
  // Fail fast instead of hanging requests when the database is unreachable
  connectionTimeoutMillis: 10000,
});

export const query = (text, params) => pool.query(text, params);
