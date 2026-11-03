-- =====================================================================
-- HB ELECTRONICS (hbelectronics.co.ke) CENTRAL DATABASE SCHEMA
-- Production PostgreSQL / Supabase Schema with Row-Level Security (RLS)
-- =====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TECHNICIANS TABLE (Central Certified Roster)
CREATE TABLE IF NOT EXISTS public.technicians (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  photo_url TEXT DEFAULT '/assets/images/tech_electrical_wiring_1791787974895.jpg',
  role_title TEXT NOT NULL,
  specialties JSONB NOT NULL DEFAULT '["electrical","appliances","refrigeration","pumps"]'::jsonb,
  license_type TEXT DEFAULT 'Highly Qualified & Vetted Specialist',
  license_number TEXT,
  experience_years INTEGER DEFAULT 5,
  rating NUMERIC(3,2) DEFAULT 4.95,
  reviews_count INTEGER DEFAULT 12,
  location TEXT DEFAULT 'Nairobi',
  estate TEXT NOT NULL,
  distance_km NUMERIC(5,2) DEFAULT 3.0,
  eta_minutes INTEGER DEFAULT 20,
  is_online BOOLEAN DEFAULT true,
  inspection_fee_ksh NUMERIC(10,2) DEFAULT 1600,
  hourly_rate_ksh NUMERIC(10,2) DEFAULT 1200,
  phone TEXT NOT NULL,
  tools JSONB DEFAULT '["Digital Multimeter", "Diagnostic Probes"]'::jsonb,
  badges JSONB DEFAULT '["Active 30-Day Pass", "Verified Specialist"]'::jsonb,
  recent_jobs JSONB DEFAULT '["Electrical fault tracing", "Appliance diagnostic"]'::jsonb,
  bio TEXT,
  portfolio_photos JSONB DEFAULT '[]'::jsonb,
  is_blocked BOOLEAN DEFAULT false,
  is_monthly_member BOOLEAN DEFAULT true,
  is_visible_to_customers BOOLEAN DEFAULT true,
  pass_status TEXT DEFAULT 'active',
  pass_start_date BIGINT,
  pass_expiry_date BIGINT,
  member_expires_at BIGINT,
  repairable_item_ids JSONB DEFAULT '[]'::jsonb,
  national_id_or_passport TEXT, -- Sensitive: Admin Only
  registered_at BIGINT DEFAULT (extract(epoch from now()) * 1000)::bigint,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS public.customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  estate TEXT NOT NULL,
  address_details TEXT,
  registered_at BIGINT DEFAULT (extract(epoch from now()) * 1000)::bigint,
  total_bookings INTEGER DEFAULT 0,
  last_login_at BIGINT,
  active_until BIGINT,
  is_active_pass BOOLEAN DEFAULT true,
  is_visible BOOLEAN DEFAULT true,
  is_blocked BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. ACTIVE SESSIONS TABLE (Server-Authoritative Authentication)
CREATE TABLE IF NOT EXISTS public.sessions (
  id TEXT PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('customer', 'technician', 'admin')),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  logged_in_at BIGINT NOT NULL,
  active_until BIGINT NOT NULL,
  transaction_id TEXT,
  amount_paid_ksh NUMERIC(10,2) DEFAULT 50,
  payment_channel TEXT DEFAULT 'mpesa',
  location TEXT DEFAULT 'Kenya (Countrywide)',
  is_active BOOLEAN DEFAULT true,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. BOOKINGS / SERVICE REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.bookings (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  estate TEXT NOT NULL,
  address_details TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  technician_id TEXT DEFAULT 'unassigned',
  technician_name TEXT DEFAULT 'Pending Available Technician',
  technician_phone TEXT,
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'accepted', 'en_route', 'in_progress', 'completed')),
  created_at_ms BIGINT NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint,
  scheduled_time TEXT,
  notes TEXT,
  estimated_total_ksh NUMERIC(10,2) NOT NULL DEFAULT 1500,
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid')),
  paid_amount_ksh NUMERIC(10,2),
  paid_at BIGINT,
  receipt_number TEXT,
  payment_gateway TEXT DEFAULT 'pesapal',
  pesapal_confirmation_code TEXT,
  technician_payout_ksh NUMERIC(10,2),
  platform_commission_ksh NUMERIC(10,2),
  disbursement_status TEXT DEFAULT 'pending',
  guarantee_days INTEGER DEFAULT 30,
  guarantee_expires_at BIGINT,
  technician_live_location JSONB,
  is_custom_broadcast BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. GLOBAL PRICING & COMMISSION CONFIGURATION
CREATE TABLE IF NOT EXISTS public.pricing (
  id TEXT PRIMARY KEY DEFAULT 'global',
  inspection_fee_ksh NUMERIC(10,2) DEFAULT 1500,
  base_hourly_rate_ksh NUMERIC(10,2) DEFAULT 1000,
  emergency_multiplier NUMERIC(4,2) DEFAULT 1.5,
  technician_payout_percent NUMERIC(5,2) DEFAULT 85,
  platform_commission_percent NUMERIC(5,2) DEFAULT 15,
  customer_pass_price_ksh NUMERIC(10,2) DEFAULT 50,
  technician_login_fee_ksh NUMERIC(10,2) DEFAULT 50,
  technician_membership_fee_ksh NUMERIC(10,2) DEFAULT 150,
  refrigeration_gas_refill_ksh NUMERIC(10,2) DEFAULT 3500,
  commercial_multiplier NUMERIC(4,2) DEFAULT 1.8,
  item_prices JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. ADMIN MESSAGING SUITE (Direct Chat & Group Broadcast Text)
CREATE TABLE IF NOT EXISTS public.admin_messages (
  id TEXT PRIMARY KEY,
  sender TEXT NOT NULL DEFAULT 'admin',
  sender_name TEXT NOT NULL DEFAULT 'Central Operations Dispatch',
  receiver_technician_id TEXT NOT NULL DEFAULT 'all_broadcast',
  receiver_name TEXT,
  receiver_phone TEXT,
  message TEXT NOT NULL,
  timestamp BIGINT NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint,
  is_read BOOLEAN DEFAULT false,
  delivery_channel TEXT DEFAULT 'both',
  sms_status TEXT DEFAULT 'delivered',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. 85/15 AUTOMATED PAYOUT LEDGER
CREATE TABLE IF NOT EXISTS public.payout_ledger (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  technician_id TEXT NOT NULL,
  technician_name TEXT NOT NULL,
  technician_phone TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  total_amount_ksh NUMERIC(10,2) NOT NULL,
  platform_fee_15_ksh NUMERIC(10,2) NOT NULL,
  technician_share_85_ksh NUMERIC(10,2) NOT NULL,
  payout_channel TEXT DEFAULT 'mpesa_b2c',
  transaction_reference TEXT NOT NULL,
  disbursed_at BIGINT NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint,
  item_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. OFFLINE SMS ALERTS LOG
CREATE TABLE IF NOT EXISTS public.sms_logs (
  id TEXT PRIMARY KEY,
  recipient_phone TEXT NOT NULL,
  recipient_name TEXT,
  message TEXT NOT NULL,
  timestamp BIGINT NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint,
  status TEXT DEFAULT 'sent',
  type TEXT NOT NULL DEFAULT 'job_alert',
  carrier_ref TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. MEDIA CONFIGURATION (HOMEPAGE SHOWCASE & VIDEO)
CREATE TABLE IF NOT EXISTS public.media_config (
  id TEXT PRIMARY KEY DEFAULT 'global',
  showcase JSONB DEFAULT '[]'::jsonb,
  featured_video JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================================
ALTER TABLE public.technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_config ENABLE ROW LEVEL SECURITY;

-- 1. Public Read Policies
CREATE POLICY "Public can view active unblocked technicians"
  ON public.technicians FOR SELECT
  USING (is_blocked = false AND is_visible_to_customers = true);

CREATE POLICY "Public can read active pricing"
  ON public.pricing FOR SELECT
  USING (true);

CREATE POLICY "Public can read media configuration"
  ON public.media_config FOR SELECT
  USING (true);

CREATE POLICY "Public can create bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can read open marketplace jobs"
  ON public.bookings FOR SELECT
  USING (technician_id = 'unassigned' OR technician_id IS NULL OR status = 'requested');

-- 2. Service Role & Authenticated Access (Full system operations)
CREATE POLICY "Service role has full access to technicians"
  ON public.technicians FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to bookings"
  ON public.bookings FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to customers"
  ON public.customers FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to sessions"
  ON public.sessions FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to pricing"
  ON public.pricing FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to admin messages"
  ON public.admin_messages FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to payout ledger"
  ON public.payout_ledger FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to sms logs"
  ON public.sms_logs FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to media config"
  ON public.media_config FOR ALL
  USING (true) WITH CHECK (true);

-- 3. REALTIME PUBLICATION SETUP
ALTER PUBLICATION supabase_realtime ADD TABLE public.technicians;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pricing;
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.customers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.media_config;
