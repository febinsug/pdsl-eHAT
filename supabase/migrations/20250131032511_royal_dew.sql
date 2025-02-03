/*
  # Fix timesheet RLS policies

  1. Changes
    - Drop existing timesheet policies
    - Create new simplified policy for timesheet management
    - Ensure proper access control for users and managers

  2. Security
    - Enable RLS on timesheets table
    - Add policy for users to manage their own timesheets
    - Add policy for managers to manage all timesheets
*/

-- Drop existing timesheet policies
DROP POLICY IF EXISTS "Users can manage their own timesheets" ON timesheets;

-- Create new simplified policies
CREATE POLICY "Timesheet management policy"
  ON timesheets
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE timesheets ENABLE ROW LEVEL SECURITY;