import { query } from './src/config/db.js';

async function migrate() {
  try {
    console.log('Creating public.user_settings table...');
    await query(`
      CREATE TABLE IF NOT EXISTS public.user_settings (
        user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
        goal_updates BOOLEAN DEFAULT true,
        approval_notifications BOOLEAN DEFAULT true,
        weekly_summary BOOLEAN DEFAULT false,
        profile_visibility TEXT DEFAULT 'public',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('Table created successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
