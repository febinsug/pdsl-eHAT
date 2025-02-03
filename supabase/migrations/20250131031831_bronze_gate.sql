/*
  # Fix timesheet RLS policies

  1. Changes
    - Drop existing timesheet policies
    - Add new policies to allow users to:
      - Insert their own timesheets
      - Update their own timesheets
      - Delete their own timesheets
      - View their own timesheets
    - Allow managers and admins full access to all timesheets
*/

-- Drop existing timesheet policies
DROP POLICY IF EXISTS "Users can manage their own timesheets" ON timesheets;
DROP POLICY IF EXISTS "Anyone can manage timesheets" ON timesheets;

-- Create new timesheet policies
CREATE POLICY "Users can manage their own timesheets"
  ON timesheets
  FOR ALL
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('manager', 'admin')
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('manager', 'admin')
    )
  );

-- Ensure RLS is enabled
ALTER TABLE timesheets ENABLE ROW LEVEL SECURITY;