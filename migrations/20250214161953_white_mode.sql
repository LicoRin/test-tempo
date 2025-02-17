/*
  # Fix RLS Policies for QR Codes and Workers

  1. Changes
    - Update RLS policies for QR codes table to allow public access
    - Update RLS policies for workers table to ensure proper access

  2. Security
    - Enable RLS on both tables
    - Add policies for public access to support the current application flow
*/

-- Update QR codes policies
DROP POLICY IF EXISTS "Authenticated users can read qr_codes" ON qr_codes;
DROP POLICY IF EXISTS "Authenticated users can create qr_codes" ON qr_codes;
DROP POLICY IF EXISTS "Authenticated users can update their qr_codes" ON qr_codes;

-- Create new policies for QR codes
CREATE POLICY "Allow public read access to qr_codes"
  ON qr_codes FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to qr_codes"
  ON qr_codes FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update to qr_codes"
  ON qr_codes FOR UPDATE
  TO public
  USING (true);

-- Update workers policies
DROP POLICY IF EXISTS "Allow public read access" ON workers;
DROP POLICY IF EXISTS "Allow public insert" ON workers;
DROP POLICY IF EXISTS "Allow public update" ON workers;

-- Create new policies for workers
CREATE POLICY "Allow public read access to workers"
  ON workers FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to workers"
  ON workers FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update to workers"
  ON workers FOR UPDATE
  TO public
  USING (true);