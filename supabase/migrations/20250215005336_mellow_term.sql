/*
  # Create Triggers for QR Code Management System

  1. Triggers
    - Update scan count on QR codes when new scans are added
    - Update visit count on workers when QR codes are scanned

  2. Functions
    - Function to update QR code scan count
    - Function to update worker visit count
*/

-- Function to update QR code scan count
CREATE OR REPLACE FUNCTION update_qr_code_scan_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE qr_codes
  SET scan_count = scan_count + 1
  WHERE id = NEW.qr_code_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update worker visit count
CREATE OR REPLACE FUNCTION update_worker_visit_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE workers w
  SET visits_count = visits_count + 1
  FROM qr_codes q
  WHERE q.id = NEW.qr_code_id AND w.id = q.worker_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update QR code scan count
DO $$ BEGIN
  CREATE TRIGGER update_qr_code_scan_count_trigger
  AFTER INSERT ON qr_scans
  FOR EACH ROW
  EXECUTE FUNCTION update_qr_code_scan_count();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Trigger to update worker visit count
DO $$ BEGIN
  CREATE TRIGGER update_worker_visit_count_trigger
  AFTER INSERT ON qr_scans
  FOR EACH ROW
  EXECUTE FUNCTION update_worker_visit_count();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;