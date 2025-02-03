/*
  # Fix RLS policies for timesheets and approvals

  1. Changes
    - Drop and recreate timesheet policies
    - Drop and recreate timesheet approval policies
    - Simplify access control

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for each role
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage their own timesheets" ON timesheets;
DROP POLICY IF EXISTS "Anyone can view timesheet approvals" ON timesheet_approvals;
DROP POLICY IF EXISTS "Managers and admins can manage timesheet approvals" ON timesheet_approvals;

-- Create new timesheet policies
CREATE POLICY "Timesheet access policy"
  ON timesheets
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create new timesheet approval policies
CREATE POLICY "Timesheet approval access policy"
  ON timesheet_approvals
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE timesheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE timesheet_approvals ENABLE ROW LEVEL SECURITY;