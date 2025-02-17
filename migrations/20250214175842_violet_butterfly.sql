/*
  # QR Code Functions Migration
  
  1. New Functions
    - increment_scan_count: Atomically increments scan count for QR codes
    - increment_worker_visits: Atomically increments worker visit count
    - log_qr_scan: Handles logging of QR code scans with tracking data
  
  2. Triggers
    - qr_scan_trigger: Automatically updates counts when a scan is logged
    
  3. Security
    - Functions are set to SECURITY DEFINER to ensure they can run with elevated privileges
    - RLS policies remain in effect for table access
*/

-- Function to increment QR code scan count
CREATE OR REPLACE FUNCTION increment_scan_count(qr_code_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE qr_codes
  SET 
    scan_count = COALESCE(scan_count, 0) + 1,
    updated_at = now()
  WHERE id = qr_code_id;
END;
$$;

-- Function to increment worker visit count
CREATE OR REPLACE FUNCTION increment_worker_visits(worker_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE workers
  SET visits_count = COALESCE(visits_count, 0) + 1
  WHERE id = worker_id;
END;
$$;

-- Function to log QR scan with tracking data
CREATE OR REPLACE FUNCTION log_qr_scan(
  qr_code_id uuid,
  ip_addr text,
  user_agent text,
  referrer text,
  utm_source text DEFAULT NULL,
  utm_medium text DEFAULT NULL,
  utm_campaign text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  scan_id uuid;
  worker_id uuid;
BEGIN
  -- Insert scan record
  INSERT INTO qr_scans (
    qr_code_id,
    ip_address,
    user_agent,
    referrer,
    utm_source,
    utm_medium,
    utm_campaign
  )
  VALUES (
    qr_code_id,
    ip_addr,
    user_agent,
    referrer,
    utm_source,
    utm_medium,
    utm_campaign
  )
  RETURNING id INTO scan_id;

  -- Get worker_id from qr_code
  SELECT worker_id INTO worker_id
  FROM qr_codes
  WHERE id = qr_code_id;

  -- Update counts
  PERFORM increment_scan_count(qr_code_id);
  PERFORM increment_worker_visits(worker_id);

  RETURN scan_id;
END;
$$;

-- Create trigger function for scan logging
CREATE OR REPLACE FUNCTION qr_scan_trigger_func()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  worker_id uuid;
BEGIN
  -- Get worker_id from qr_code
  SELECT qc.worker_id INTO worker_id
  FROM qr_codes qc
  WHERE qc.id = NEW.qr_code_id;

  -- Update QR code scan count
  PERFORM increment_scan_count(NEW.qr_code_id);
  
  -- Update worker visits count
  IF worker_id IS NOT NULL THEN
    PERFORM increment_worker_visits(worker_id);
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS qr_scan_trigger ON qr_scans;
CREATE TRIGGER qr_scan_trigger
  AFTER INSERT ON qr_scans
  FOR EACH ROW
  EXECUTE FUNCTION qr_scan_trigger_func();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION increment_scan_count(uuid) TO public;
GRANT EXECUTE ON FUNCTION increment_worker_visits(uuid) TO public;
GRANT EXECUTE ON FUNCTION log_qr_scan(uuid, text, text, text, text, text, text) TO public;