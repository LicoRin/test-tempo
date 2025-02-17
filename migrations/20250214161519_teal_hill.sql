/*
  # Enhanced Schema for QR Code Management System

  1. New Tables
    - departments
      - Basic department information
    - positions
      - Job positions/roles
    - access_levels
      - System access levels
    - qr_codes
      - QR code information and tracking
    - audit_logs
      - System activity tracking

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated access
*/

-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Create positions table
CREATE TABLE IF NOT EXISTS positions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    department_id uuid REFERENCES departments(id),
    created_at timestamptz DEFAULT now()
);

-- Create access_levels table
CREATE TABLE IF NOT EXISTS access_levels (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    permissions jsonb NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Modify workers table with new fields
ALTER TABLE workers 
ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES departments(id),
ADD COLUMN IF NOT EXISTS position_id uuid REFERENCES positions(id),
ADD COLUMN IF NOT EXISTS access_level_id uuid REFERENCES access_levels(id),
ADD COLUMN IF NOT EXISTS email text UNIQUE,
ADD COLUMN IF NOT EXISTS worker_code text UNIQUE;

-- Create qr_codes table
CREATE TABLE IF NOT EXISTS qr_codes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id uuid REFERENCES workers(id),
    purpose text NOT NULL,
    target_url text NOT NULL,
    customization jsonb,
    expires_at timestamptz,
    is_active boolean DEFAULT true,
    scan_count integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id),
    action text NOT NULL,
    resource_type text NOT NULL,
    resource_id uuid NOT NULL,
    details jsonb,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Authenticated users can read departments"
    ON departments FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can read positions"
    ON positions FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can read access_levels"
    ON access_levels FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can read qr_codes"
    ON qr_codes FOR SELECT
    TO authenticated
    USING (auth.uid() IN (
        SELECT w.id FROM workers w WHERE w.id = qr_codes.worker_id
    ));

CREATE POLICY "Authenticated users can create qr_codes"
    ON qr_codes FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() IN (
        SELECT w.id FROM workers w WHERE w.id = worker_id
    ));

CREATE POLICY "Authenticated users can update their qr_codes"
    ON qr_codes FOR UPDATE
    TO authenticated
    USING (auth.uid() IN (
        SELECT w.id FROM workers w WHERE w.id = worker_id
    ));

CREATE POLICY "Only admins can read audit logs"
    ON audit_logs FOR SELECT
    TO authenticated
    USING (auth.uid() IN (
        SELECT w.id FROM workers w 
        JOIN access_levels al ON w.access_level_id = al.id 
        WHERE al.permissions->>'admin' = 'true'
    ));