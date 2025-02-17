/*
  # Fix QR Code Policies

  1. Changes
    - Drop existing policies
    - Create new policies with correct syntax
    - Ensure public access for QR redirects
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public to read QR codes by tracking URL" ON qr_codes;
DROP POLICY IF EXISTS "Allow public to read QR scans" ON qr_scans;

-- Create new policies with correct syntax
CREATE POLICY "Allow public to read QR codes by tracking URL"
  ON qr_codes
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public to read QR scans"
  ON qr_scans
  FOR SELECT
  TO public
  USING (true);

-- Ensure product_code column exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'qr_codes' 
    AND column_name = 'product_code'
  ) THEN
    ALTER TABLE qr_codes ADD COLUMN product_code text;
  END IF;
END $$;