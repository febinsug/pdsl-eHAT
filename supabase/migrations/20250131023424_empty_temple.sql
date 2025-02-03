/*
  # Initial Schema Setup for PDSL Hour Tracker

  1. New Tables
    - `users`
      - Basic user information and authentication
      - Stores username, password (hashed), role, and metadata
    - `projects`
      - Project details including name, description, and allocated hours
    - `project_users`
      - Maps users to projects (many-to-many relationship)
    - `timesheets`
      - Weekly timesheet entries with daily hours
    - `timesheet_approvals`
      - Tracks approval status of timesheets

  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access
*/

-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('user', 'manager', 'admin');

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role user_role NOT NULL DEFAULT 'user',
  full_name text,
  email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  allocated_hours integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);

-- Project Users mapping
CREATE TABLE IF NOT EXISTS project_users (
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT now(),
  PRIMARY KEY (project_id, user_id)
);

-- Timesheets table
CREATE TABLE IF NOT EXISTS timesheets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  project_id uuid REFERENCES projects(id),
  week_number integer NOT NULL,
  year integer NOT NULL,
  monday_hours numeric(4,2) DEFAULT 0,
  tuesday_hours numeric(4,2) DEFAULT 0,
  wednesday_hours numeric(4,2) DEFAULT 0,
  thursday_hours numeric(4,2) DEFAULT 0,
  friday_hours numeric(4,2) DEFAULT 0,
  status text DEFAULT 'pending',
  submitted_at timestamptz DEFAULT now(),
  UNIQUE (user_id, project_id, week_number, year)
);

-- Timesheet approvals
CREATE TABLE IF NOT EXISTS timesheet_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timesheet_id uuid REFERENCES timesheets(id),
  approved_by uuid REFERENCES users(id),
  approved_at timestamptz DEFAULT now(),
  status text NOT NULL,
  comments text
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE timesheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE timesheet_approvals ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read their own data"
  ON users
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Managers and admins can read all users"
  ON users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('manager', 'admin')
    )
  );

CREATE POLICY "Admin can manage users"
  ON users
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'admin'
    )
  );

-- Insert dummy data
INSERT INTO users (username, password_hash, role, full_name) VALUES
('admin', '$2a$10$xxxxxxxxxxx', 'admin', 'Admin User'),
('manager', '$2a$10$xxxxxxxxxxx', 'manager', 'Manager User'),
('user', '$2a$10$xxxxxxxxxxx', 'user', 'Regular User');

INSERT INTO projects (name, description, allocated_hours, created_by) VALUES
('Project Alpha', 'Main development project', 160, (SELECT id FROM users WHERE username = 'admin')),
('Project Beta', 'Support and maintenance', 80, (SELECT id FROM users WHERE username = 'manager'));

-- Assign users to projects
INSERT INTO project_users (project_id, user_id)
SELECT p.id, u.id
FROM projects p
CROSS JOIN users u
WHERE u.username IN ('user', 'manager');