const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// Note: Normally we'd use service_role key to bypass email confirmation,
// but we will try with anon key and assume email confirmation is disabled.
const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  const usersToCreate = [
    { email: 'demo@example.com', password: 'Test@123', role: 'employee', first_name: 'Employee', last_name: 'User' },
    { email: 'manager@example.com', password: 'Test@123', role: 'manager', first_name: 'Manager', last_name: 'User' },
    { email: 'admin@example.com', password: 'Test@123', role: 'admin', first_name: 'Admin', last_name: 'User' }
  ];

  for (const u of usersToCreate) {
    console.log(`Creating user ${u.email}...`);
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: u.email,
      password: u.password,
    });

    if (authError) {
      console.log(`Error signing up ${u.email}:`, authError.message);
      continue;
    }
    
    // Auth success. Let's wait a bit to ensure triggers (if any) have run,
    // though the app might require us to insert them manually if no trigger exists.
    const userId = authData.user?.id;
    if (userId) {
      console.log(`Inserting into public.users table...`);
      const { error: dbError } = await supabase.from('users').upsert({
        id: userId,
        email: u.email,
        role: u.role,
        first_name: u.first_name,
        last_name: u.last_name
      });
      
      if (dbError) {
        console.log(`Error inserting into public.users:`, dbError.message);
      } else {
        console.log(`Successfully created ${u.email}`);
      }
    }
  }
}

seed();
