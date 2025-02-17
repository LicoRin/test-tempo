/*
  # Add username field to QR codes table

  1. Changes
    - Add username field to qr_codes table if it doesn't exist
    - Create index on username field for better performance
    - Update RLS policies to include username in queries

  2. Security
    - Maintain existing RLS policies
    - Add username to searchable fields
*/

-- Add username field if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'qr_codes' 
    AND column_name = 'username'
  ) THEN
    ALTER TABLE qr_codes ADD COLUMN username text;
  END IF;
END $$;

-- Create index for username field
CREATE INDEX IF NOT EXISTS idx_qr_codes_username ON qr_codes(username);

-- Update or create policy for searching QR codes
DROP POLICY IF EXISTS "Allow public to read QR codes by tracking URL" ON qr_codes;

CREATE POLICY "Allow public to read QR codes by tracking URL"
  ON qr_codes
  FOR SELECT
  TO public
  USING (true);

-- Add function to search QR codes by username
CREATE OR REPLACE FUNCTION search_qr_codes(search_term text)
RETURNS SETOF qr_codes AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM qr_codes
  WHERE 
    username ILIKE '%' || search_term || '%' OR
    purpose ILIKE '%' || search_term || '%' OR
    product_code ILIKE '%' || search_term || '%';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;