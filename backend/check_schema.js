import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const res = await pool.query(`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `);
    console.log('Public Tables:');
    console.log(res.rows.map(r => r.table_name));

    // check if public.users exists and what columns it has
    const columns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND table_schema = 'public';
    `);
    console.log('\nColumns in public.users:');
    console.log(columns.rows);

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
run();
