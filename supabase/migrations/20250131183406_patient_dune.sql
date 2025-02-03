/*
  # Add client structure and update role-based access

  1. New Tables
    - `clients` table for storing client information
    - Add client_id to projects table
    - Add manager_id to users table for user-manager relationship

  2. Schema Updates
    - Update projects table to include client reference
    - Update users table to include manager reference
    - Add necessary indexes and constraints

  3. Security
    - Add RLS policies for client access
    - Update existing policies for new structure
*/

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES users(id)
);

-- Add client_id to projects
ALTER TABLE projects 
ADD COLUMN client_id uuid REFERENCES clients(id);

-- Add manager_id to users
ALTER TABLE users
ADD COLUMN manager_id uuid REFERENCES users(id);

-- Create index for better query performance
CREATE INDEX idx_projects_client_id ON projects(client_id);
CREATE INDEX idx_users_manager_id ON users(manager_id);

-- Enable RLS on clients table
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Client policies
CREATE POLICY "Admins and managers can manage clients"
  ON clients
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Users can view clients"
  ON clients
  FOR SELECT
  TO authenticated
  USING (true);

-- Update project policies to consider client relationship
CREATE POLICY "Managers can only manage their assigned projects"
  ON projects
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND (
        u.role = 'admin'
        OR (
          u.role = 'manager'
          AND EXISTS (
            SELECT 1 FROM project_users pu
            WHERE pu.project_id = projects.id
            AND pu.user_id = u.id
          )
        )
      )
    )
  );

-- Update user policies to consider manager relationship
CREATE POLICY "Managers can view and manage their assigned users"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND (
        u.role = 'admin'
        OR (
          u.role = 'manager'
          AND users.manager_id = u.id
        )
      )
    )
  );