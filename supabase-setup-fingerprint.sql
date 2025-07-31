-- DevRadar Database Setup with Fingerprint Tracking
-- Copy and paste this entire script into your Supabase SQL Editor

-- Drop existing tables if they exist
DROP TABLE IF EXISTS developers CASCADE;
DROP TABLE IF EXISTS user_limits CASCADE;

-- Create user_limits table for fingerprint tracking
CREATE TABLE user_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fingerprint text UNIQUE NOT NULL,
  check_in_count integer DEFAULT 0,
  max_check_ins integer DEFAULT 5,
  last_check_in timestamptz,
  is_online boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create the developers table with fingerprint link
CREATE TABLE developers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  skills text[],
  latitude float8 NOT NULL,
  longitude float8 NOT NULL,
  fingerprint text NOT NULL,
  is_online boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE developers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_limits ENABLE ROW LEVEL SECURITY;

-- Create policies that allow all operations (for demo purposes)
CREATE POLICY "Allow all operations on developers" ON developers
  FOR ALL USING (true);

CREATE POLICY "Allow all operations on user_limits" ON user_limits
  FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX idx_developers_fingerprint ON developers (fingerprint);
CREATE INDEX idx_developers_location ON developers (latitude, longitude);
CREATE INDEX idx_developers_online ON developers (is_online);
CREATE INDEX idx_developers_created_at ON developers (created_at DESC);
CREATE INDEX idx_user_limits_fingerprint ON user_limits (fingerprint);
CREATE INDEX idx_user_limits_online ON user_limits (is_online);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_developers_updated_at 
    BEFORE UPDATE ON developers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_limits_updated_at 
    BEFORE UPDATE ON user_limits 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data for testing
INSERT INTO user_limits (fingerprint, check_in_count, max_check_ins, is_online) VALUES
  ('sample_fingerprint_1', 2, 5, true),
  ('sample_fingerprint_2', 1, 5, true),
  ('sample_fingerprint_3', 0, 5, false);

INSERT INTO developers (name, skills, latitude, longitude, fingerprint, is_online) VALUES
  ('Alice Johnson', ARRAY['React', 'Node.js', 'TypeScript'], 40.7128, -74.0060, 'sample_fingerprint_1', true),
  ('Bob Smith', ARRAY['Python', 'Django', 'PostgreSQL'], 34.0522, -118.2437, 'sample_fingerprint_2', true),
  ('Carol Davis', ARRAY['Vue.js', 'Go', 'Docker'], 51.5074, -0.1278, 'sample_fingerprint_1', true);

-- Verify the tables were created
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name IN ('developers', 'user_limits')
ORDER BY table_name, ordinal_position;

-- Show sample data
SELECT 'developers' as table_name, count(*) as count FROM developers
UNION ALL
SELECT 'user_limits' as table_name, count(*) as count FROM user_limits;

-- Show developers with their limits
SELECT 
  d.name,
  d.skills,
  d.latitude,
  d.longitude,
  d.is_online as dev_online,
  ul.check_in_count,
  ul.max_check_ins,
  ul.is_online as user_online
FROM developers d
LEFT JOIN user_limits ul ON d.fingerprint = ul.fingerprint
ORDER BY d.created_at DESC; 