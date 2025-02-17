/*
  # Update RLS policies for workers table

  1. Changes
    - Modify RLS policies to allow anonymous access for all operations
    - This is necessary because we're not implementing authentication in this demo

  2. Security Note
    - In a production environment, you would typically want to restrict these operations to authenticated users
    - For this demo, we're allowing public access to simplify the implementation
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public read access" ON workers;
DROP POLICY IF EXISTS "Allow authenticated insert" ON workers;
DROP POLICY IF EXISTS "Allow authenticated update" ON workers;

-- Create new policies that allow public access
CREATE POLICY "Allow public read access"
  ON workers
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert"
  ON workers
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update"
  ON workers
  FOR UPDATE
  TO public
  USING (true);