/*
  # Add Location Tracking

  1. New Tables
    - `scan_locations`
      - `id` (uuid, primary key)
      - `scan_id` (uuid, references qr_scans)
      - `latitude` (numeric)
      - `longitude` (numeric)
      - `accuracy` (numeric)
      - `city` (text)
      - `country` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on scan_locations table
    - Add policies for public access to support anonymous scanning
*/

-- Create scan_locations table
CREATE TABLE IF NOT EXISTS scan_locations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_id uuid REFERENCES qr_scans(id) ON DELETE CASCADE,
    latitude numeric,
    longitude numeric,
    accuracy numeric,
    city text,
    country text,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE scan_locations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public to insert scan locations"
    ON scan_locations
    FOR INSERT
    TO public
    WITH CHECK (true);

CREATE POLICY "Allow public to read scan locations"
    ON scan_locations
    FOR SELECT
    TO public
    USING (true);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_scan_locations_scan_id ON scan_locations(scan_id);