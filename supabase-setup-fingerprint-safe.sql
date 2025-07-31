-- DevRadar Database Setup with Fingerprint Tracking (Safe Version)
-- Copy and paste this entire script into your Supabase SQL Editor

-- Create user_limits table for fingerprint tracking (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS user_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fingerprint text UNIQUE NOT NULL,
  check_in_count integer DEFAULT 0,
  max_check_ins integer DEFAULT 5,
  last_check_in timestamptz,
  is_online boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create the developers table if it doesn't exist
CREATE TABLE IF NOT EXISTS developers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  skills text[],
  latitude float8 NOT NULL,
  longitude float8 NOT NULL,
  fingerprint text,
  is_online boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add fingerprint column to existing developers table (only if it doesn't exist)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'developers') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'developers' AND column_name = 'fingerprint') THEN
            ALTER TABLE developers ADD COLUMN fingerprint text;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'developers' AND column_name = 'is_online') THEN
            ALTER TABLE developers ADD COLUMN is_online boolean DEFAULT true;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'developers' AND column_name = 'updated_at') THEN
            ALTER TABLE developers ADD COLUMN updated_at timestamptz DEFAULT now();
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'developers' AND column_name = 'communication') THEN
            ALTER TABLE developers ADD COLUMN communication text;
        END IF;
    END IF;
END $$;

-- Enable Row Level Security (RLS) if not already enabled
ALTER TABLE developers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_limits ENABLE ROW LEVEL SECURITY;

-- Create policies that allow all operations (only if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'developers' AND policyname = 'Allow all operations on developers') THEN
        CREATE POLICY "Allow all operations on developers" ON developers
          FOR ALL USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_limits' AND policyname = 'Allow all operations on user_limits') THEN
        CREATE POLICY "Allow all operations on user_limits" ON user_limits
          FOR ALL USING (true);
    END IF;
END $$;

-- Create indexes for better performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_developers_fingerprint ON developers (fingerprint);
CREATE INDEX IF NOT EXISTS idx_developers_location ON developers (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_developers_online ON developers (is_online);
CREATE INDEX IF NOT EXISTS idx_developers_created_at ON developers (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_limits_fingerprint ON user_limits (fingerprint);
CREATE INDEX IF NOT EXISTS idx_user_limits_online ON user_limits (is_online);

-- Create function to update updated_at timestamp (only if it doesn't exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at (only if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_developers_updated_at') THEN
        CREATE TRIGGER update_developers_updated_at 
            BEFORE UPDATE ON developers 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_limits_updated_at') THEN
        CREATE TRIGGER update_user_limits_updated_at 
            BEFORE UPDATE ON user_limits 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Insert sample data only if tables are empty
INSERT INTO user_limits (fingerprint, check_in_count, max_check_ins, is_online)
SELECT 'sample_fingerprint_1', 2, 5, true
WHERE NOT EXISTS (SELECT 1 FROM user_limits WHERE fingerprint = 'sample_fingerprint_1');

INSERT INTO user_limits (fingerprint, check_in_count, max_check_ins, is_online)
SELECT 'sample_fingerprint_2', 1, 5, true
WHERE NOT EXISTS (SELECT 1 FROM user_limits WHERE fingerprint = 'sample_fingerprint_2');

INSERT INTO user_limits (fingerprint, check_in_count, max_check_ins, is_online)
SELECT 'sample_fingerprint_3', 0, 5, false
WHERE NOT EXISTS (SELECT 1 FROM user_limits WHERE fingerprint = 'sample_fingerprint_3');

-- Insert sample developers only if they don't exist
INSERT INTO developers (name, skills, latitude, longitude, fingerprint, is_online, communication)
SELECT 'Alice Johnson', ARRAY['React', 'Node.js', 'TypeScript'], 40.7128, -74.0060, 'sample_fingerprint_1', true, 'Discord: alice.dev#1234, Reddit: u/alice_codes'
WHERE NOT EXISTS (SELECT 1 FROM developers WHERE name = 'Alice Johnson' AND fingerprint = 'sample_fingerprint_1');

INSERT INTO developers (name, skills, latitude, longitude, fingerprint, is_online, communication)
SELECT 'Bob Smith', ARRAY['Python', 'Django', 'PostgreSQL'], 34.0522, -118.2437, 'sample_fingerprint_2', true, 'Discord: bob.python#5678, GitHub: @bobsmith'
WHERE NOT EXISTS (SELECT 1 FROM developers WHERE name = 'Bob Smith' AND fingerprint = 'sample_fingerprint_2');

INSERT INTO developers (name, skills, latitude, longitude, fingerprint, is_online, communication)
SELECT 'Carol Davis', ARRAY['Vue.js', 'Go', 'Docker'], 51.5074, -0.1278, 'sample_fingerprint_1', true, 'Discord: carol.vue#9012, LinkedIn: carol-davis-dev'
WHERE NOT EXISTS (SELECT 1 FROM developers WHERE name = 'Carol Davis' AND fingerprint = 'sample_fingerprint_1');

-- Verify the tables were created/updated
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