-- =============================================
-- UPDATE TASKS: Add Location & Fix RLS for Managers
-- =============================================

-- 1. Add location column
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS location TEXT;

-- 2. Update RLS policies to allow all authenticated users (team members) to view, insert, and update tasks.
-- This ensures a manager can assign a task to someone else.
DROP POLICY IF EXISTS "Users can view and edit their own tasks" ON tasks;

CREATE POLICY "All authenticated users can view and edit tasks" ON tasks
  FOR ALL USING (auth.role() = 'authenticated');
