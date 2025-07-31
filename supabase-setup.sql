-- DevRadar Database Setup
-- Copy and paste this entire script into your Supabase SQL Editor

-- Create the developers table
CREATE TABLE IF NOT EXISTS developers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  skills text[],
  latitude float8 NOT NULL,
  longitude float8 NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE developers ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations (for demo purposes)
-- In production, you might want more restrictive policies
CREATE POLICY "Allow all operations on developers" ON developers
  FOR ALL USING (true);

-- Create an index on location for better performance
CREATE INDEX IF NOT EXISTS idx_developers_location ON developers (latitude, longitude);

-- Create an index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_developers_created_at ON developers (created_at DESC);

-- Insert some sample data (optional - for testing)
INSERT INTO developers (name, skills, latitude, longitude) VALUES
  ('Alice Johnson', ARRAY['React', 'Node.js', 'TypeScript'], 40.7128, -74.0060),
  ('Bob Smith', ARRAY['Python', 'Django', 'PostgreSQL'], 34.0522, -118.2437),
  ('Carol Davis', ARRAY['Vue.js', 'Go', 'Docker'], 51.5074, -0.1278);

-- Verify the table was created
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'developers'
ORDER BY ordinal_position;

-- Show sample data
SELECT * FROM developers LIMIT 5; 