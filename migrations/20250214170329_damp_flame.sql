/*
  # Add QR Code Tracking

  1. New Tables
    - `qr_scans`
      - `id` (uuid, primary key)
      - `qr_code_id` (uuid, references qr_codes)
      - `scanned_at` (timestamptz)
      - `ip_address` (text)
      - `user_agent` (text)
      - `referrer` (text)
      - `utm_source` (text)
      - `utm_medium` (text)
      - `utm_campaign` (text)
  
  2. Changes
    - Add tracking_url column to qr_codes table
  
  3. Security
    - Enable RLS on qr_scans table
    - Add policies for public access to qr_scans
*/

-- Create qr_scans table
CREATE TABLE IF NOT EXISTS qr_scans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    qr_code_id uuid REFERENCES qr_codes(id),
    scanned_at timestamptz DEFAULT now(),
    ip_address text,
    user_agent text,
    referrer text,
    utm_source text,
    utm_medium text,
    utm_campaign text
);

-- Add tracking_url to qr_codes
ALTER TABLE qr_codes
ADD COLUMN IF NOT EXISTS tracking_url text;

-- Enable RLS
ALTER TABLE qr_scans ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public insert to qr_scans"
  ON qr_scans FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public read access to qr_scans"
  ON qr_scans FOR SELECT
  TO public
  USING (true);