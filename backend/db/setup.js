// Creates all tables (db/schema.sql) and the demo accounts listed in the README.
// Usage: npm run db:setup
import fs from 'node:fs';
import bcrypt from 'bcrypt';
import { pool } from '../src/config/db.js';

const DEMO_PASSWORD = 'Test@123';
const DEMO_USERS = [
  { email: 'employee@test.com', name: 'Demo Employee', role: 'employee' },
  { email: 'manager@test.com', name: 'Demo Manager', role: 'manager' },
  { email: 'admin@test.com', name: 'Demo Admin', role: 'admin' },
];

async function setup() {
  const schema = fs.readFileSync(new URL('./schema.sql', import.meta.url), 'utf8');
  await pool.query(schema);
  console.log('Schema applied.');

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  for (const user of DEMO_USERS) {
    await pool.query(
      `INSERT INTO public.users (email, password_hash, name, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO NOTHING`,
      [user.email, passwordHash, user.name, user.role]
    );
    console.log(`Demo user ready: ${user.email} (${user.role})`);
  }
}

setup()
  .then(() => pool.end())
  .catch(async (error) => {
    console.error('Database setup failed:', error.message);
    await pool.end();
    process.exit(1);
  });
