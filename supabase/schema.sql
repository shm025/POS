-- ============================================================
-- POS FULL SCHEMA MIGRATION
-- Run this in Supabase SQL Editor (safe to re-run: IF NOT EXISTS)
-- ============================================================

-- ============================================================
-- SECTION 1: EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ============================================================
-- SECTION 2: CORE TABLES (companies + profiles first — all others FK to these)
-- ============================================================

CREATE TABLE IF NOT EXISTS companies (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                    text NOT NULL,
  name_en                 text,
  address                 text,
  phone                   text,
  email                   text,
  website                 text,
  tax_rate                numeric(5,2) DEFAULT 11,
  reg_number              text,
  exchange_rate           numeric(12,2) DEFAULT 89500,
  exchange_rate_updated_at timestamptz,
  timezone                text DEFAULT 'Asia/Beirut',
  plan                    text DEFAULT 'starter',
  business_type           text DEFAULT 'retail',   -- 'retail' | 'barber'
  created_at              timestamptz DEFAULT now()
);

-- Add business_type if schema already existed without it
DO $$ BEGIN
  ALTER TABLE companies ADD COLUMN IF NOT EXISTS business_type text DEFAULT 'retail';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE companies ADD COLUMN IF NOT EXISTS name_en text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE companies ADD COLUMN IF NOT EXISTS exchange_rate_updated_at timestamptz;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE companies ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'Asia/Beirut';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE companies ADD COLUMN IF NOT EXISTS plan text DEFAULT 'starter';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;


-- profiles: links auth.users → companies
CREATE TABLE IF NOT EXISTS profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id  uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  role        text NOT NULL DEFAULT 'owner',
  created_at  timestamptz DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'owner';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;


-- ============================================================
-- SECTION 3: ACCOUNTING
-- ============================================================

CREATE TABLE IF NOT EXISTS accounts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  code        text,
  name        text NOT NULL,
  type        text,           -- asset | liability | equity | income | expense
  debit       numeric(14,2) DEFAULT 0,
  credit      numeric(14,2) DEFAULT 0,
  balance     numeric(14,2) DEFAULT 0,
  parent_id   uuid REFERENCES accounts(id) ON DELETE SET NULL,
  currency    text DEFAULT 'USD',
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE accounts ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE accounts ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;


CREATE TABLE IF NOT EXISTS journal_entries (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id     uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  date           date NOT NULL,
  description    text,
  debit_acc_id   uuid REFERENCES accounts(id) ON DELETE SET NULL,
  credit_acc_id  uuid REFERENCES accounts(id) ON DELETE SET NULL,
  amount         numeric(14,2) NOT NULL DEFAULT 0,
  created_at     timestamptz DEFAULT now()
);


CREATE TABLE IF NOT EXISTS vouchers (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  type        text NOT NULL,   -- receipt | payment
  number      text,
  date        date,
  amount      numeric(14,2) DEFAULT 0,
  party       text,
  description text,
  method      text,
  created_at  timestamptz DEFAULT now()
);


-- ============================================================
-- SECTION 4: INVENTORY
-- ============================================================

CREATE TABLE IF NOT EXISTS warehouses (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name        text NOT NULL,
  location    text,
  manager     text,
  created_at  timestamptz DEFAULT now()
);


CREATE TABLE IF NOT EXISTS items (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  code          text,
  name          text NOT NULL,
  category      text,
  unit          text DEFAULT 'piece',
  cost_price    numeric(14,2) DEFAULT 0,
  selling_price numeric(14,2) DEFAULT 0,
  stock         numeric(14,3) DEFAULT 0,
  min_stock     numeric(14,3) DEFAULT 0,
  reorder_point numeric(14,3) DEFAULT 0,
  reorder_qty   numeric(14,3) DEFAULT 0,
  barcode       text,
  brand         text,
  tax_rate      numeric(5,2) DEFAULT 0,
  sell_by_weight boolean DEFAULT false,
  is_active     boolean DEFAULT true,
  last_sold_at  timestamptz,
  description   text,
  created_at    timestamptz DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE items ADD COLUMN IF NOT EXISTS barcode text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE items ADD COLUMN IF NOT EXISTS brand text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE items ADD COLUMN IF NOT EXISTS reorder_point numeric(14,3) DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE items ADD COLUMN IF NOT EXISTS reorder_qty numeric(14,3) DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE items ADD COLUMN IF NOT EXISTS tax_rate numeric(5,2) DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE items ADD COLUMN IF NOT EXISTS sell_by_weight boolean DEFAULT false;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE items ADD COLUMN IF NOT EXISTS last_sold_at timestamptz;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE items ADD COLUMN IF NOT EXISTS description text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE items ADD COLUMN IF NOT EXISTS min_stock numeric(14,3) DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;


CREATE TABLE IF NOT EXISTS stock_movements (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id     uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  item_id        uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  movement_type  text NOT NULL,  -- sale|return|receive|adjust|transfer_in|transfer_out|waste
  quantity       numeric(14,3) NOT NULL,
  cost_at_time   numeric(14,2),
  user_id        uuid,
  reference_id   uuid,
  invoice_id     uuid,           -- FK added below after invoices table
  notes          text,
  created_at     timestamptz DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE stock_movements ADD COLUMN IF NOT EXISTS notes text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;


-- ============================================================
-- SECTION 5: CUSTOMERS & SUPPLIERS
-- ============================================================

CREATE TABLE IF NOT EXISTS customers (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  code            text,
  name            text NOT NULL,
  phone           text,
  email           text,
  dob             date,
  notes           text,
  loyalty_points  integer DEFAULT 0,
  loyalty_tier    text DEFAULT 'bronze',
  total_visits    integer DEFAULT 0,
  lifetime_spend  numeric(14,2) DEFAULT 0,
  created_at      timestamptz DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE customers ADD COLUMN IF NOT EXISTS code text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE customers ADD COLUMN IF NOT EXISTS dob date;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE customers ADD COLUMN IF NOT EXISTS loyalty_points integer DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE customers ADD COLUMN IF NOT EXISTS loyalty_tier text DEFAULT 'bronze';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE customers ADD COLUMN IF NOT EXISTS total_visits integer DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE customers ADD COLUMN IF NOT EXISTS lifetime_spend numeric(14,2) DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;


CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  customer_id   uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  invoice_id    uuid,           -- FK added below after invoices
  type          text NOT NULL,  -- earn | redeem
  points        integer NOT NULL,
  balance_after integer NOT NULL,
  description   text,
  created_at    timestamptz DEFAULT now()
);


CREATE TABLE IF NOT EXISTS suppliers (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id     uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  code           text,
  name           text NOT NULL,
  phone          text,
  email          text,
  address        text,
  payment_terms  text,
  credit_limit   numeric(14,2) DEFAULT 0,
  currency       text DEFAULT 'USD',
  created_at     timestamptz DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS code text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS credit_limit numeric(14,2) DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;


-- ============================================================
-- SECTION 6: INVOICES
-- ============================================================

CREATE TABLE IF NOT EXISTS invoices (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id          uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  doc_type            text NOT NULL,  -- invoices|sale|purchases|sales-return|purchase-return|order
  number              text,
  customer_name       text,
  customer_id         uuid REFERENCES customers(id) ON DELETE SET NULL,
  cashier_id          uuid,
  terminal_id         uuid,
  date                date,
  due_date            date,
  warehouse           text,
  status              text DEFAULT 'unpaid',
  subtotal            numeric(14,2) DEFAULT 0,
  discount            numeric(14,2) DEFAULT 0,
  tax                 numeric(14,2) DEFAULT 0,
  total               numeric(14,2) DEFAULT 0,
  notes               text,
  payment_method      text,
  paid_amount_usd     numeric(14,2) DEFAULT 0,
  paid_amount_lbp     numeric(14,2) DEFAULT 0,
  change_given_usd    numeric(14,2) DEFAULT 0,
  change_given_lbp    numeric(14,2) DEFAULT 0,
  currency            text DEFAULT 'USD',
  exchange_rate_used  numeric(12,2),
  created_at          timestamptz DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE invoices ADD COLUMN IF NOT EXISTS cashier_id uuid;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE invoices ADD COLUMN IF NOT EXISTS terminal_id uuid;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paid_amount_usd numeric(14,2) DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paid_amount_lbp numeric(14,2) DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE invoices ADD COLUMN IF NOT EXISTS change_given_usd numeric(14,2) DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE invoices ADD COLUMN IF NOT EXISTS change_given_lbp numeric(14,2) DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE invoices ADD COLUMN IF NOT EXISTS exchange_rate_used numeric(12,2);
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_method text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;


CREATE TABLE IF NOT EXISTS invoice_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id  uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  company_id  uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  item_id     uuid REFERENCES items(id) ON DELETE SET NULL,
  item_name   text,
  quantity    numeric(14,3) DEFAULT 1,
  unit_price  numeric(14,2) DEFAULT 0,
  cost_price  numeric(14,2) DEFAULT 0,
  discount    numeric(5,2) DEFAULT 0,
  total       numeric(14,2) DEFAULT 0
);

DO $$ BEGIN
  ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES companies(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS cost_price numeric(14,2) DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;


-- Back-fill FKs that needed invoices to exist first
DO $$ BEGIN
  ALTER TABLE stock_movements ADD CONSTRAINT fk_stock_movements_invoice
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE loyalty_transactions ADD CONSTRAINT fk_loyalty_invoice
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;


-- ============================================================
-- SECTION 7: BARBER / SERVICES
-- ============================================================

CREATE TABLE IF NOT EXISTS services (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name             text NOT NULL,
  base_price       numeric(14,2) DEFAULT 0,
  junior_price     numeric(14,2) DEFAULT 0,
  senior_price     numeric(14,2) DEFAULT 0,
  master_price     numeric(14,2) DEFAULT 0,
  duration_minutes integer DEFAULT 30,
  tax_rate         numeric(5,2) DEFAULT 0,
  is_active        boolean DEFAULT true,
  created_at       timestamptz DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE services ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE services ADD COLUMN IF NOT EXISTS junior_price numeric(14,2) DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE services ADD COLUMN IF NOT EXISTS senior_price numeric(14,2) DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE services ADD COLUMN IF NOT EXISTS master_price numeric(14,2) DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE services ADD COLUMN IF NOT EXISTS duration_minutes integer DEFAULT 30;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE services ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
EXCEPTION WHEN duplicate_column THEN NULL; END $$;


CREATE TABLE IF NOT EXISTS employees (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name             text NOT NULL,
  phone            text,
  level            text,
  salary_type      text DEFAULT 'fixed',   -- fixed | commission
  base_salary      numeric(14,2) DEFAULT 0,
  commission_rate  numeric(5,2) DEFAULT 0,
  calendar_color   text DEFAULT '#3B82F6',
  working_hours    jsonb,
  active           boolean DEFAULT true,
  created_at       timestamptz DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE employees ADD COLUMN IF NOT EXISTS calendar_color text DEFAULT '#3B82F6';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE employees ADD COLUMN IF NOT EXISTS working_hours jsonb;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE employees ADD COLUMN IF NOT EXISTS salary_type text DEFAULT 'fixed';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE employees ADD COLUMN IF NOT EXISTS commission_rate numeric(5,2) DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;


CREATE TABLE IF NOT EXISTS reservations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  customer_name   text,
  customer_phone  text,
  service_id      uuid REFERENCES services(id) ON DELETE SET NULL,
  service_name    text,
  employee_id     uuid REFERENCES employees(id) ON DELETE SET NULL,
  employee_name   text,
  price           numeric(14,2) DEFAULT 0,
  date            date,
  time            text,
  end_time        text,
  status          text DEFAULT 'pending',  -- pending|confirmed|completed|cancelled
  source          text DEFAULT 'walk_in',  -- walk_in|phone|whatsapp|online
  deposit_amount  numeric(14,2) DEFAULT 0,
  deposit_paid    boolean DEFAULT false,
  no_show         boolean DEFAULT false,
  notes           text,
  created_at      timestamptz DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE reservations ADD COLUMN IF NOT EXISTS source text DEFAULT 'walk_in';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE reservations ADD COLUMN IF NOT EXISTS deposit_amount numeric(14,2) DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE reservations ADD COLUMN IF NOT EXISTS deposit_paid boolean DEFAULT false;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE reservations ADD COLUMN IF NOT EXISTS no_show boolean DEFAULT false;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE reservations ADD COLUMN IF NOT EXISTS end_time text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;


CREATE TABLE IF NOT EXISTS commissions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id       uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  reservation_id    uuid REFERENCES reservations(id) ON DELETE SET NULL,
  invoice_id        uuid REFERENCES invoices(id) ON DELETE SET NULL,
  service_amount    numeric(14,2) DEFAULT 0,
  commission_rate   numeric(5,2) DEFAULT 0,
  commission_amount numeric(14,2) DEFAULT 0,
  tip_amount        numeric(14,2) DEFAULT 0,
  period_start      date,
  period_end        date,
  paid_out          boolean DEFAULT false,
  paid_at           timestamptz,
  created_at        timestamptz DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE commissions ADD COLUMN IF NOT EXISTS tip_amount numeric(14,2) DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;


-- ============================================================
-- SECTION 8: BILLS & SUPPLIES (barber overhead)
-- ============================================================

CREATE TABLE IF NOT EXISTS bills (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  amount      numeric(14,2) DEFAULT 0,
  date        date,
  month       text,
  paid        boolean DEFAULT false,
  description text,
  created_at  timestamptz DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE bills ADD COLUMN IF NOT EXISTS month text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;


CREATE TABLE IF NOT EXISTS supplies (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  amount      numeric(14,2) DEFAULT 0,
  date        date,
  description text,
  created_at  timestamptz DEFAULT now()
);


-- ============================================================
-- SECTION 9: AUDIT LOG
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id     uuid,
  action      text,
  table_name  text,
  record_id   uuid,
  old_values  jsonb,
  new_values  jsonb,
  terminal_id uuid,
  created_at  timestamptz DEFAULT now()
);


-- ============================================================
-- SECTION 10: INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_accounts_company        ON accounts(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_company       ON audit_log(company_id);
CREATE INDEX IF NOT EXISTS idx_bills_company           ON bills(company_id);
CREATE INDEX IF NOT EXISTS idx_commissions_company     ON commissions(company_id);
CREATE INDEX IF NOT EXISTS idx_commissions_employee    ON commissions(employee_id);
CREATE INDEX IF NOT EXISTS idx_commissions_period      ON commissions(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_customers_company       ON customers(company_id);
CREATE INDEX IF NOT EXISTS idx_employees_company       ON employees(company_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice   ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_company   ON invoice_items(company_id);
CREATE INDEX IF NOT EXISTS idx_invoices_company        ON invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_invoices_doc_type       ON invoices(company_id, doc_type);
CREATE INDEX IF NOT EXISTS idx_invoices_date           ON invoices(company_id, date);
CREATE INDEX IF NOT EXISTS idx_items_company           ON items(company_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_company ON journal_entries(company_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_company         ON loyalty_transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_customer        ON loyalty_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_company        ON profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_reservations_company    ON reservations(company_id);
CREATE INDEX IF NOT EXISTS idx_reservations_date       ON reservations(company_id, date);
CREATE INDEX IF NOT EXISTS idx_services_company        ON services(company_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_company ON stock_movements(company_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_item    ON stock_movements(item_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_company       ON suppliers(company_id);
CREATE INDEX IF NOT EXISTS idx_supplies_company        ON supplies(company_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_company        ON vouchers(company_id);
CREATE INDEX IF NOT EXISTS idx_warehouses_company      ON warehouses(company_id);


-- ============================================================
-- SECTION 11: HELPER FUNCTION (used by RLS + checkout)
-- ============================================================

CREATE OR REPLACE FUNCTION get_user_company_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT company_id FROM profiles WHERE id = auth.uid()
$$;

-- Atomic stock deduction used by checkout.js
CREATE OR REPLACE FUNCTION deduct_stock(p_item_id uuid, p_qty numeric)
RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_stock numeric;
BEGIN
  UPDATE items
  SET stock = stock - p_qty
  WHERE id = p_item_id AND stock >= p_qty
  RETURNING stock INTO v_stock;
  RETURN v_stock;  -- NULL means insufficient stock
END;
$$;


-- ============================================================
-- SECTION 12: ROW LEVEL SECURITY (tenant isolation)
-- Every table: authenticated users see ONLY their company's rows.
-- ============================================================

ALTER TABLE companies          ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log          ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills              ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees          ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices           ENABLE ROW LEVEL SECURITY;
ALTER TABLE items              ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries    ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE services           ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements    ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplies           ENABLE ROW LEVEL SECURITY;
ALTER TABLE vouchers           ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses         ENABLE ROW LEVEL SECURITY;

-- Drop existing policies before recreating (idempotent)
DO $$ DECLARE r record;
BEGIN
  FOR r IN SELECT policyname, tablename FROM pg_policies
           WHERE schemaname = 'public'
             AND policyname IN (
               'company_isolation','profiles_own_row',
               'companies_own_row'
             )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- companies: users can only read/update their own company
CREATE POLICY companies_own_row ON companies
  FOR ALL TO authenticated
  USING  (id = get_user_company_id())
  WITH CHECK (id = get_user_company_id());

-- profiles: users can only see their own profile row
CREATE POLICY profiles_own_row ON profiles
  FOR ALL TO authenticated
  USING  (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- All other tables: filter by company_id
CREATE POLICY company_isolation ON accounts
  FOR ALL TO authenticated
  USING (company_id = get_user_company_id())
  WITH CHECK (company_id = get_user_company_id());

CREATE POLICY company_isolation ON audit_log
  FOR ALL TO authenticated
  USING (company_id = get_user_company_id())
  WITH CHECK (company_id = get_user_company_id());

CREATE POLICY company_isolation ON bills
  FOR ALL TO authenticated
  USING (company_id = get_user_company_id())
  WITH CHECK (company_id = get_user_company_id());

CREATE POLICY company_isolation ON commissions
  FOR ALL TO authenticated
  USING (company_id = get_user_company_id())
  WITH CHECK (company_id = get_user_company_id());

CREATE POLICY company_isolation ON customers
  FOR ALL TO authenticated
  USING (company_id = get_user_company_id())
  WITH CHECK (company_id = get_user_company_id());

CREATE POLICY company_isolation ON employees
  FOR ALL TO authenticated
  USING (company_id = get_user_company_id())
  WITH CHECK (company_id = get_user_company_id());

CREATE POLICY company_isolation ON invoice_items
  FOR ALL TO authenticated
  USING (company_id = get_user_company_id())
  WITH CHECK (company_id = get_user_company_id());

CREATE POLICY company_isolation ON invoices
  FOR ALL TO authenticated
  USING (company_id = get_user_company_id())
  WITH CHECK (company_id = get_user_company_id());

CREATE POLICY company_isolation ON items
  FOR ALL TO authenticated
  USING (company_id = get_user_company_id())
  WITH CHECK (company_id = get_user_company_id());

CREATE POLICY company_isolation ON journal_entries
  FOR ALL TO authenticated
  USING (company_id = get_user_company_id())
  WITH CHECK (company_id = get_user_company_id());

CREATE POLICY company_isolation ON loyalty_transactions
  FOR ALL TO authenticated
  USING (company_id = get_user_company_id())
  WITH CHECK (company_id = get_user_company_id());

CREATE POLICY company_isolation ON reservations
  FOR ALL TO authenticated
  USING (company_id = get_user_company_id())
  WITH CHECK (company_id = get_user_company_id());

CREATE POLICY company_isolation ON services
  FOR ALL TO authenticated
  USING (company_id = get_user_company_id())
  WITH CHECK (company_id = get_user_company_id());

CREATE POLICY company_isolation ON stock_movements
  FOR ALL TO authenticated
  USING (company_id = get_user_company_id())
  WITH CHECK (company_id = get_user_company_id());

CREATE POLICY company_isolation ON suppliers
  FOR ALL TO authenticated
  USING (company_id = get_user_company_id())
  WITH CHECK (company_id = get_user_company_id());

CREATE POLICY company_isolation ON supplies
  FOR ALL TO authenticated
  USING (company_id = get_user_company_id())
  WITH CHECK (company_id = get_user_company_id());

CREATE POLICY company_isolation ON vouchers
  FOR ALL TO authenticated
  USING (company_id = get_user_company_id())
  WITH CHECK (company_id = get_user_company_id());

CREATE POLICY company_isolation ON warehouses
  FOR ALL TO authenticated
  USING (company_id = get_user_company_id())
  WITH CHECK (company_id = get_user_company_id());


-- ============================================================
-- SECTION 13: HOW TO REGISTER A NEW CLIENT (run per new signup)
-- ============================================================
-- Replace the values below and run once per new client:
--
-- 1. Create company row:
--    INSERT INTO companies (name, business_type, plan)
--    VALUES ('My Barbershop', 'barber', 'starter')
--    RETURNING id;   -- copy this UUID as <COMPANY_ID>
--
-- 2. Create auth user via Supabase Dashboard or Auth API,
--    then link profile:
--    INSERT INTO profiles (id, company_id, role)
--    VALUES ('<AUTH_USER_ID>', '<COMPANY_ID>', 'owner');
--
-- Done. RLS ensures that user sees only their company's data.
-- ============================================================
