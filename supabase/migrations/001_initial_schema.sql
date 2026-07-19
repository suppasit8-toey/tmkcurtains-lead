-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- ENUMS
-- =============================================

CREATE TYPE org_category AS ENUM (
  'international_school',
  'private_school',
  'private_university',
  'hospital',
  'healthcare_clinic',
  'government',
  'beauty_clinic',
  'other_clinic'
);

CREATE TYPE org_status AS ENUM (
  'new_lead',
  'contacted',
  'presented',
  'quoted',
  'negotiating',
  'won',
  'lost',
  'on_hold'
);

CREATE TYPE quotation_status AS ENUM (
  'pending',
  'approved',
  'rejected'
);

-- =============================================
-- ORGANIZATIONS
-- =============================================

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category org_category NOT NULL,
  status org_status NOT NULL DEFAULT 'new_lead',
  name TEXT NOT NULL,
  building_age INTEGER,
  org_info TEXT,
  phone_main TEXT,
  email_main TEXT,
  building_dept JSONB,
  purchase_dept JSONB,
  accounting_dept JSONB,
  pitch_technique TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- CONVERSATION HISTORY
-- =============================================

CREATE TABLE conversation_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  channel TEXT NOT NULL,
  summary TEXT NOT NULL,
  next_action TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- QUOTATIONS
-- =============================================

CREATE TABLE quotations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quote_number TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  date_sent DATE NOT NULL DEFAULT CURRENT_DATE,
  status quotation_status NOT NULL DEFAULT 'pending',
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- COMPLETED ORDERS
-- =============================================

CREATE TABLE completed_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  completed_date DATE NOT NULL DEFAULT CURRENT_DATE,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE completed_orders ENABLE ROW LEVEL SECURITY;

-- Organizations policies
CREATE POLICY "Users can view all organizations" ON organizations
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert organizations" ON organizations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update organizations" ON organizations
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete organizations" ON organizations
  FOR DELETE USING (auth.role() = 'authenticated');

-- Conversation history policies
CREATE POLICY "Users can view all conversations" ON conversation_history
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert conversations" ON conversation_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update conversations" ON conversation_history
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete conversations" ON conversation_history
  FOR DELETE USING (auth.role() = 'authenticated');

-- Quotations policies
CREATE POLICY "Users can view all quotations" ON quotations
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert quotations" ON quotations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update quotations" ON quotations
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete quotations" ON quotations
  FOR DELETE USING (auth.role() = 'authenticated');

-- Completed orders policies
CREATE POLICY "Users can view all orders" ON completed_orders
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert orders" ON completed_orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update orders" ON completed_orders
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete orders" ON completed_orders
  FOR DELETE USING (auth.role() = 'authenticated');

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX idx_organizations_category ON organizations(category);
CREATE INDEX idx_organizations_status ON organizations(status);
CREATE INDEX idx_organizations_name ON organizations(name);
CREATE INDEX idx_conversations_org_id ON conversation_history(org_id);
CREATE INDEX idx_conversations_date ON conversation_history(date DESC);
CREATE INDEX idx_quotations_org_id ON quotations(org_id);
CREATE INDEX idx_orders_org_id ON completed_orders(org_id);
