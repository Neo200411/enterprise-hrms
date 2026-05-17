const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  const usersToCreate = [
    { email: 'employee@test.com', password: 'Test@123', role: 'employee', first_name: 'Employee', last_name: 'Demo' },
    { email: 'manager@test.com', password: 'Test@123', role: 'manager', first_name: 'Manager', last_name: 'Demo' },
    { email: 'admin@test.com', password: 'Test@123', role: 'admin', first_name: 'Admin', last_name: 'Demo' }
  ];

  for (const u of usersToCreate) {
    console.log(`\nProcessing user ${u.email}...`);
    
    // Attempt sign up with metadata
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: u.email,
      password: u.password,
      options: {
        data: {
          role: u.role,
          name: `${u.first_name} ${u.last_name}`
        }
      }
    });

    if (authError) {
      console.log(`Error signing up ${u.email}:`, authError.message);
    } else {
      console.log(`Sign up successful for ${u.email}`);
    }
    
    // Wait a bit to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Sign in to get the session and User ID in case they were already created
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: u.email,
      password: u.password,
    });

    const userId = signInData?.user?.id || authData?.user?.id;

    if (userId) {
      console.log(`User ID: ${userId}`);
      console.log(`Inserting into public.users table...`);
      const { error: dbError } = await supabase.from('users').upsert({
        id: userId,
        email: u.email,
        role: u.role,
        name: `${u.first_name} ${u.last_name}`
      });
      
      if (dbError) {
        console.log(`Error inserting into public.users:`, dbError.message);
      } else {
        console.log(`Successfully configured public.users for ${u.email}`);
      }
    } else {
      console.log(`Could not get User ID for ${u.email}. Login error:`, signInError?.message);
    }
  }
}

seed();
