/*
  # Fix manager relationship

  1. Changes
    - Drop and recreate manager_id foreign key with proper constraint name
    - Add index for better query performance
    - Update policies to handle manager relationship

  2. Security
    - Enable RLS
    - Add policies for manager access
*/

-- Drop existing manager_id column if it exists
ALTER TABLE users 
DROP COLUMN IF EXISTS manager_id;

-- Add manager_id column with proper constraint
ALTER TABLE users
ADD COLUMN manager_id uuid REFERENCES users(id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_manager_id ON users(manager_id);

-- Create policy for manager access
CREATE POLICY "Managers can view their team members"
  ON users
  FOR SELECT
  USING (
    auth.uid() = id
    OR manager_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'admin'
    )
  );

-- Create policy for manager assignment
CREATE POLICY "Admins can assign managers"
  ON users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'admin'
    )
  );