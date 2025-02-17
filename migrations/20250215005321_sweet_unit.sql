/*
  # Initial Schema Setup for QR Code Management System

  1. New Tables
    - `workers`
      - `id` (uuid, primary key)
      - `name` (text)
      - `code` (text, unique)
      - `visits_count` (integer)
      - `created_at` (timestamp)
    
    - `qr_codes`
      - `id` (uuid, primary key)
      - `worker_id` (uuid, foreign key)
      - `purpose` (text)
      - `target_url` (text)
      - `tracking_url` (text, unique)
      - `customization` (jsonb)
      - `scan_count` (integer)
      - `created_at` (timestamp)
    
    - `qr_scans`
      - `id` (uuid, primary key)
      - `qr_code_id` (uuid, foreign key)
      - `user_agent` (text)
      - `referrer` (text)
      - `ip_address` (text)
      - `utm_source` (text)
      - `utm_medium` (text)
      - `utm_campaign` (text)
      - `scanned_at` (timestamp)
    
    - `audit_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid)
      - `action` (text)
      - `resource_type` (text)
      - `resource_id` (uuid)
      - `details` (jsonb)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create workers table
CREATE TABLE IF NOT EXISTS workers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  visits_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create qr_codes table
CREATE TABLE IF NOT EXISTS qr_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id uuid REFERENCES workers(id) ON DELETE CASCADE,
  purpose text NOT NULL,
  target_url text NOT NULL,
  tracking_url text UNIQUE NOT NULL,
  customization jsonb DEFAULT '{}',
  scan_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create qr_scans table
CREATE TABLE IF NOT EXISTS qr_scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_code_id uuid REFERENCES qr_codes(id) ON DELETE CASCADE,
  user_agent text,
  referrer text,
  ip_address text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  scanned_at timestamptz DEFAULT now()
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid NOT NULL,
  details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for workers table
CREATE POLICY "Allow authenticated users to read workers"
  ON workers
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to create workers"
  ON workers
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update workers"
  ON workers
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete workers"
  ON workers
  FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for qr_codes table
CREATE POLICY "Allow authenticated users to read qr_codes"
  ON qr_codes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to create qr_codes"
  ON qr_codes
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update qr_codes"
  ON qr_codes
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete qr_codes"
  ON qr_codes
  FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for qr_scans table
CREATE POLICY "Allow authenticated users to read qr_scans"
  ON qr_scans
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow public to create qr_scans"
  ON qr_scans
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Create policies for audit_logs table
CREATE POLICY "Allow authenticated users to read audit_logs"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to create audit_logs"
  ON audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_workers_code ON workers(code);
CREATE INDEX IF NOT EXISTS idx_qr_codes_tracking_url ON qr_codes(tracking_url);
CREATE INDEX IF NOT EXISTS idx_qr_codes_worker_id ON qr_codes(worker_id);
CREATE INDEX IF NOT EXISTS idx_qr_scans_qr_code_id ON qr_scans(qr_code_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_id ON audit_logs(resource_id);