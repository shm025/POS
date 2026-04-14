-- ============================================================
-- MIGRATION 004 — Phase 3: Promotions & Loyalty
-- Run AFTER migration 003
-- ============================================================

-- 3.1 CREATE promotions table
CREATE TABLE IF NOT EXISTS promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  type TEXT CHECK (type IN ('pct_off','fixed_off','bogo','qty_break','free_item','meal_deal')),
  conditions JSONB DEFAULT '{}',
  value NUMERIC DEFAULT 0,
  max_discount NUMERIC,
  priority INT DEFAULT 0,
  is_stackable BOOLEAN DEFAULT false,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  usage_limit INT,
  usage_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now()
);

-- 3.2 CREATE loyalty_transactions table
CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id),
  invoice_id UUID,
  type TEXT CHECK (type IN ('earn','redeem','expire','adjust')),
  points INT NOT NULL,
  balance_after INT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- 3.2 CREATE gift_cards table
CREATE TABLE IF NOT EXISTS gift_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  card_number TEXT UNIQUE NOT NULL,
  initial_balance NUMERIC NOT NULL,
  current_balance NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  issued_to UUID REFERENCES customers(id),
  issued_by UUID REFERENCES profiles(id),
  issued_at TIMESTAMP DEFAULT now(),
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

-- ============================================================
-- MIGRATION 005 — Phase 7: Reporting
-- ============================================================

-- 7.1 CREATE report_snapshots table
CREATE TABLE IF NOT EXISTS report_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  revenue_usd NUMERIC DEFAULT 0,
  revenue_lbp NUMERIC DEFAULT 0,
  transaction_count INT DEFAULT 0,
  avg_basket_usd NUMERIC DEFAULT 0,
  top_items JSONB DEFAULT '[]',
  top_employees JSONB DEFAULT '[]',
  hourly_heatmap JSONB DEFAULT '{}',
  new_customers INT DEFAULT 0,
  returning_customers INT DEFAULT 0,
  discount_total_usd NUMERIC DEFAULT 0,
  void_total_usd NUMERIC DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(company_id, snapshot_date)
);

-- ============================================================
-- MIGRATION 006 — Phase 10: Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_invoices_company_date ON invoices(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_company_status ON invoices(company_id, status);
CREATE INDEX IF NOT EXISTS idx_stock_movements_company_item_date ON stock_movements(company_id, item_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_company_date2 ON audit_log(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customers_company_phone2 ON customers(company_id, phone);
