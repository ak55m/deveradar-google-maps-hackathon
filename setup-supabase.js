import { createClient } from '@supabase/supabase-js';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupSupabase() {
  console.log('🚀 DevRadar Supabase Setup\n');
  
  // Get Supabase credentials
  const supabaseUrl = await question('Enter your Supabase URL (e.g., https://your-project.supabase.co): ');
  const supabaseKey = await question('Enter your Supabase anon key: ');
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Please provide both URL and key');
    rl.close();
    return;
  }
  
  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  console.log('\n📊 Creating developers table...');
  
  try {
    // Create the developers table
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS developers (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          name text NOT NULL,
          skills text[],
          latitude float8 NOT NULL,
          longitude float8 NOT NULL,
          created_at timestamptz DEFAULT now()
        );
      `
    });
    
    if (error) {
      // If RPC doesn't work, try direct SQL (this might not work due to permissions)
      console.log('⚠️  RPC method failed, trying alternative approach...');
      console.log('Please run this SQL manually in your Supabase SQL Editor:');
      console.log(`
CREATE TABLE IF NOT EXISTS developers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  skills text[],
  latitude float8 NOT NULL,
  longitude float8 NOT NULL,
  created_at timestamptz DEFAULT now()
);
      `);
    } else {
      console.log('✅ Developers table created successfully!');
    }
    
    // Test the connection
    console.log('\n🔍 Testing connection...');
    const { data, error: testError } = await supabase
      .from('developers')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.log('⚠️  Connection test failed. Please check your credentials.');
      console.log('Error:', testError.message);
    } else {
      console.log('✅ Connection successful!');
    }
    
    // Update .env file
    console.log('\n📝 Updating .env file...');
    const envContent = `# Supabase Configuration
VITE_SUPABASE_URL=${supabaseUrl}
VITE_SUPABASE_ANON_KEY=${supabaseKey}

# Google Maps API Key
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
`;
    
    // Note: We can't write to .env directly, so we'll show the content
    console.log('Please update your .env file with this content:');
    console.log('\n' + '='.repeat(50));
    console.log(envContent);
    console.log('='.repeat(50));
    
    console.log('\n🎉 Setup complete!');
    console.log('1. Copy the .env content above to your .env file');
    console.log('2. Restart your dev server: npm run dev');
    console.log('3. Try checking in a developer!');
    
  } catch (error) {
    console.log('❌ Setup failed:', error.message);
  }
  
  rl.close();
}

setupSupabase().catch(console.error); 