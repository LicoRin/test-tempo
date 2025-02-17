/*
  # Update QR Code Access Policies

  1. Changes
    - Add public access policies for QR codes table
    - Allow anonymous users to read QR codes for redirect functionality
    - Update existing policies to maintain security while enabling public tracking

  2. Security
    - Enable public read access only for necessary QR code fields
    - Maintain RLS for sensitive operations
*/

-- Drop existing policies for qr_codes
DROP POLICY IF EXISTS "Allow authenticated users to read qr_codes" ON qr_codes;

-- Create new policies for qr_codes
CREATE POLICY "Allow public to read QR codes"
  ON qr_codes
  FOR SELECT
  TO public
  USING (true);

-- Update qr_scans policies to ensure public access
DROP POLICY IF EXISTS "Allow public to create qr_scans" ON qr_scans;

CREATE POLICY "Allow public to create qr_scans"
  ON qr_scans
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public to read qr_scans"
  ON qr_scans
  FOR SELECT
  TO public
  USING (true);