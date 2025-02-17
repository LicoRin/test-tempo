/*
  # Create workers table and security policies

  1. New Tables
    - `workers`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `code` (text, unique, required)
      - `visits_count` (integer, default: 0)
      - `created_at` (timestamp with time zone, default: now())

  2. Security
    - Enable RLS on workers table
    - Add policies for:
      - Select: Allow anyone to read workers data
      - Insert/Update: Only authenticated users can modify workers
*/

-- Create workers table
CREATE TABLE workers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  visits_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access"
  ON workers
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated insert"
  ON workers
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update"
  ON workers
  FOR UPDATE
  TO authenticated
  USING (true);