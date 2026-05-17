const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  const usersToCreate = [
    { email: 'employee123@atomberg.com', password: 'Password@123', role: 'employee', first_name: 'John', last_name: 'Doe' },
    { email: 'manager123@atomberg.com', password: 'Password@123', role: 'manager', first_name: 'Jane', last_name: 'Smith' },
  ];

  for (const u of usersToCreate) {
    console.log(`Creating user ${u.email}...`);
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: u.email,
      password: u.password,
    });

    if (authError) {
      console.log(`Error signing up ${u.email}:`, authError.message);
    }
    
    // Auth success or already exists. Let's try to upsert anyway.
    // If authError was "User already registered", we need the ID.
    let userId = authData?.user?.id;
    if (!userId) {
      // Need to login to get ID
      const { data: signInData } = await supabase.auth.signInWithPassword({
        email: u.email,
        password: u.password,
      });
      userId = signInData?.user?.id;
    }

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
        console.log(`Successfully configured ${u.email} as ${u.role}`);
      }
    }
  }
}

seed();
