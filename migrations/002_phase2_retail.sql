-- ============================================================
-- MIGRATION 002 — Phase 2: Retail
-- Run AFTER migration 001
-- ============================================================

-- 2.1 ALTER items table
ALTER TABLE items
  ADD COLUMN IF NOT EXISTS barcode TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS brand TEXT,
  ADD COLUMN IF NOT EXISTS tax_rate NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS sell_by_weight BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS reorder_qty INT DEFAULT 10,
  ADD COLUMN IF NOT EXISTS reorder_point INT DEFAULT 5,
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS cost_price NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS selling_price NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stock INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'piece',
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS code TEXT,
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS last_sold_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_items_company_active ON items(company_id, is_active);
CREATE UNIQUE INDEX IF NOT EXISTS idx_items_barcode ON items(company_id, barcode) WHERE barcode IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_items_fts ON items USING gin(to_tsvector('english', coalesce(name, '')));

-- 2.2 CREATE product_variants table
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  barcode TEXT UNIQUE,
  sku TEXT,
  attributes JSONB DEFAULT '{}',
  stock_qty INT DEFAULT 0,
  reorder_point INT DEFAULT 5,
  location_id UUID,
  created_at TIMESTAMP DEFAULT now()
);

-- 2.3 CREATE purchase_orders table
CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  supplier_id UUID,
  location_id UUID,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','sent','partial','received','cancelled')),
  expected_date DATE,
  received_date DATE,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  items JSONB DEFAULT '[]',
  total_cost NUMERIC DEFAULT 0,
  created_at TIMESTAMP DEFAULT now()
);

-- ALTER suppliers (if table exists)
ALTER TABLE suppliers
  ADD COLUMN IF NOT EXISTS payment_terms TEXT,
  ADD COLUMN IF NOT EXISTS credit_limit NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';

-- ALTER accounts
ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES accounts(id),
  ADD COLUMN IF NOT EXISTS currency TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

-- ALTER vouchers
ALTER TABLE vouchers
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS lbp_amount NUMERIC;

-- ALTER bills
ALTER TABLE bills
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS recurring BOOLEAN DEFAULT false;

-- ALTER warehouses
ALTER TABLE warehouses
  ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'store',
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS phone TEXT;

-- ALTER supplies
ALTER TABLE supplies
  ADD COLUMN IF NOT EXISTS supplier_id UUID;
