-- =============================================
-- PROFILES (User Settings)
-- =============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger to create a profile automatically (optional, but good for robust systems)
-- However, we can just upsert it in the app.
-- Enable RLS for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view and edit their own profile" ON profiles
  FOR ALL USING (auth.uid() = id);

-- =============================================
-- ORG CATEGORIES
-- =============================================
CREATE TABLE org_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  value TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  icon TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default categories
INSERT INTO org_categories (value, label, icon) VALUES
  ('international_school', 'โรงเรียนนานาชาติ', '🏫'),
  ('private_school', 'โรงเรียนเอกชนชื่อดัง', '📚'),
  ('private_university', 'มหาลัยเอกชน', '🎓'),
  ('hospital', 'โรงพยาบาล', '🏥'),
  ('healthcare_clinic', 'คลินิกเฮลท์แคร์', '⚕️'),
  ('government', 'สถานที่ราชการ', '🏛️'),
  ('beauty_clinic', 'คลินิกเสริมความงาม', '✨'),
  ('other_clinic', 'คลินิกอื่นๆ', '🏥');

-- Enable RLS for org_categories (shared workspace)
ALTER TABLE org_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All authenticated users can view and edit categories" ON org_categories
  FOR ALL USING (auth.role() = 'authenticated');

-- Modify organizations table to use text category
ALTER TABLE organizations ALTER COLUMN category DROP DEFAULT;
ALTER TABLE organizations ALTER COLUMN category TYPE TEXT USING category::text;
DROP TYPE IF EXISTS org_category CASCADE;

-- =============================================
-- TASKS
-- =============================================
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  due_date DATE NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for tasks
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view and edit their own tasks" ON tasks
  FOR ALL USING (auth.uid() = user_id);
