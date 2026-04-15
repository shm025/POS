-- ============================================================
-- MIGRATION 001 — Phase 1: Foundation
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1.1 ALTER companies
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Asia/Beirut',
  ADD COLUMN IF NOT EXISTS base_currency CHAR(3) DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS secondary_currency CHAR(3) DEFAULT 'LBP',
  ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC(15,4) DEFAULT 89500,
  ADD COLUMN IF NOT EXISTS exchange_rate_updated_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS active_modules JSONB DEFAULT '["retail"]',
  ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'starter';

-- 1.2 ALTER profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS pin_hash TEXT,
  ADD COLUMN IF NOT EXISTS location_ids JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;

-- 1.2 CREATE customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  dob DATE,
  loyalty_points INT DEFAULT 0,
  loyalty_tier TEXT DEFAULT 'bronze',
  total_visits INT DEFAULT 0,
  lifetime_spend NUMERIC DEFAULT 0,
  whatsapp_opted_in BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_customers_company_phone ON customers(company_id, phone);

-- 1.3 CREATE terminals table
CREATE TABLE IF NOT EXISTS terminals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'pos' CHECK (type IN ('pos','kiosk','mobile')),
  location_id UUID,
  last_seen_at TIMESTAMP,
  offline_queue_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now()
);

-- 1.4 CREATE exchange_rates table
CREATE TABLE IF NOT EXISTS exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  from_currency CHAR(3) NOT NULL,
  to_currency CHAR(3) NOT NULL,
  rate NUMERIC(15,4) NOT NULL,
  effective_date DATE NOT NULL,
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(company_id, from_currency, to_currency, effective_date)
);

-- 1.5 CREATE audit_log table
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  terminal_id UUID,
  created_at TIMESTAMP DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_log_company_date ON audit_log(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_table_record ON audit_log(company_id, table_name, record_id);

-- 1.6 CREATE sync_queue table
CREATE TABLE IF NOT EXISTS sync_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  terminal_id UUID,
  operation TEXT CHECK (operation IN ('INSERT','UPDATE','DELETE')),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  payload JSONB NOT NULL,
  retry_count INT DEFAULT 0,
  synced_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- 1.7 ALTER invoices (add missing columns)
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS cashier_id UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cash',
  ADD COLUMN IF NOT EXISTS paid_amount_usd NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS paid_amount_lbp NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS change_given_usd NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS change_given_lbp NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS exchange_rate_used NUMERIC,
  ADD COLUMN IF NOT EXISTS synced_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS terminal_id UUID REFERENCES terminals(id),
  ADD COLUMN IF NOT EXISTS doc_type TEXT DEFAULT 'sale',
  ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id);

-- 1.8 ALTER invoice_items
ALTER TABLE invoice_items
  ADD COLUMN IF NOT EXISTS cost_price NUMERIC DEFAULT 0;

-- CREATE stock_movements table
CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  item_id UUID REFERENCES items(id),
  movement_type TEXT CHECK (movement_type IN ('sale','return','receive','adjust','transfer_in','transfer_out','waste')),
  quantity INT NOT NULL,
  cost_at_time NUMERIC,
  user_id UUID REFERENCES profiles(id),
  location_id UUID,
  reference_id UUID,
  notes TEXT,
  created_at TIMESTAMP DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_stock_movements_company_item ON stock_movements(company_id, item_id, created_at DESC);
