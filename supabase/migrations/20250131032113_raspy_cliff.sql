/*
  # Update timesheet policies

  1. Changes
    - Drop existing timesheet policies
    - Create new simplified policies that allow users to:
      - Insert their own timesheets
      - Update their own timesheets
      - Delete their own timesheets
      - View their own timesheets
    - Managers and admins can view and manage all timesheets
  
  2. Security
    - Enable RLS on timesheets table
    - Ensure proper user access control
*/

-- Drop existing timesheet policies
DROP POLICY IF EXISTS "Users can manage their own timesheets" ON timesheets;

-- Create new timesheet policies
CREATE POLICY "Users can manage their own timesheets"
  ON timesheets
  FOR ALL
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('manager', 'admin')
    )
  );

-- Ensure RLS is enabled
ALTER TABLE timesheets ENABLE ROW LEVEL SECURITY;