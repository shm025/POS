-- ============================================================
-- MIGRATION 003 — Phase 4: Salon & Barber
-- Run AFTER migration 002
-- ============================================================

-- 4.1 ALTER reservations
ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS end_time TEXT,
  ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS deposit_paid BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'walk_in',
  ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
  ADD COLUMN IF NOT EXISTS no_show BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS invoice_id UUID,
  ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id);

-- 4.1 ALTER services
ALTER TABLE services
  ADD COLUMN IF NOT EXISTS buffer_minutes INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS requires_patch_test BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS tax_rate NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS duration INT DEFAULT 30,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 4.2 ALTER employees
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS pin_hash TEXT,
  ADD COLUMN IF NOT EXISTS working_hours JSONB DEFAULT '{"mon":{"start":"09:00","end":"18:00"},"tue":{"start":"09:00","end":"18:00"},"wed":{"start":"09:00","end":"18:00"},"thu":{"start":"09:00","end":"18:00"},"fri":{"start":"09:00","end":"18:00"},"sat":{"start":"09:00","end":"14:00"},"sun":null}',
  ADD COLUMN IF NOT EXISTS break_times JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS calendar_color TEXT DEFAULT '#3B82F6',
  ADD COLUMN IF NOT EXISTS location_id UUID;

-- 4.3 CREATE commissions table
CREATE TABLE IF NOT EXISTS commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id),
  reservation_id UUID REFERENCES reservations(id),
  invoice_id UUID,
  service_amount NUMERIC DEFAULT 0,
  product_amount NUMERIC DEFAULT 0,
  commission_rate NUMERIC DEFAULT 0,
  commission_amount NUMERIC DEFAULT 0,
  tip_amount NUMERIC DEFAULT 0,
  period_start DATE,
  period_end DATE,
  paid_out BOOLEAN DEFAULT false,
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_commissions_company_employee ON commissions(company_id, employee_id);
CREATE INDEX IF NOT EXISTS idx_commissions_period ON commissions(company_id, period_start, period_end);

-- 4.1 ALTER reservations index
CREATE INDEX IF NOT EXISTS idx_reservations_company_date ON reservations(company_id, date, status);
