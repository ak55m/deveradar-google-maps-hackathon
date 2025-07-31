import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Configuration - Update these with your Supabase details
const SUPABASE_URL = 'YOUR_SUPABASE_URL_HERE';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY_HERE';

async function setupDatabase() {
  console.log('🚀 Setting up DevRadar database...\n');
  
  if (SUPABASE_URL === 'YOUR_SUPABASE_URL_HERE' || SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY_HERE') {
    console.log('❌ Please update the configuration in setup-database.js first!');
    console.log('1. Get your Supabase URL and anon key from your project settings');
    console.log('2. Update the constants at the top of this file');
    console.log('3. Run this script again');
    return;
  }
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  try {
    // Test connection first
    console.log('🔍 Testing connection...');
    const { error: testError } = await supabase
      .from('developers')
      .select('count')
      .limit(1);
    
    if (testError && testError.message.includes('relation')) {
      console.log('📊 Table not found, creating developers table...');
      
      // Create table using SQL
      const { error: createError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE developers (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            name text NOT NULL,
            skills text[],
            latitude float8 NOT NULL,
            longitude float8 NOT NULL,
            created_at timestamptz DEFAULT now()
          );
        `
      });
      
      if (createError) {
        console.log('⚠️  Could not create table automatically.');
        console.log('Please run this SQL manually in your Supabase SQL Editor:');
        console.log(`
CREATE TABLE developers (
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
    } else if (testError) {
      console.log('❌ Connection error:', testError.message);
      return;
    } else {
      console.log('✅ Table already exists!');
    }
    
    // Test inserting a sample record
    console.log('\n🧪 Testing data insertion...');
    const { error: insertError } = await supabase
      .from('developers')
      .insert([{
        name: 'Test Developer',
        skills: ['JavaScript', 'React'],
        latitude: 40.7128,
        longitude: -74.0060
      }]);
    
    if (insertError) {
      console.log('⚠️  Insert test failed:', insertError.message);
    } else {
      console.log('✅ Data insertion test successful!');
      
      // Clean up test data
      await supabase
        .from('developers')
        .delete()
        .eq('name', 'Test Developer');
    }
    
    // Update .env file
    console.log('\n📝 Creating .env file...');
    const envContent = `# Supabase Configuration
VITE_SUPABASE_URL=${SUPABASE_URL}
VITE_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}

# Google Maps API Key
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
`;
    
    try {
      fs.writeFileSync('.env', envContent);
      console.log('✅ .env file created successfully!');
    } catch (writeError) {
      console.log('⚠️  Could not write .env file automatically.');
      console.log('Please create .env manually with this content:');
      console.log('\n' + '='.repeat(50));
      console.log(envContent);
      console.log('='.repeat(50));
    }
    
    console.log('\n🎉 Database setup complete!');
    console.log('1. Restart your dev server: npm run dev');
    console.log('2. Try checking in a developer!');
    
  } catch (error) {
    console.log('❌ Setup failed:', error.message);
  }
}

setupDatabase().catch(console.error); 