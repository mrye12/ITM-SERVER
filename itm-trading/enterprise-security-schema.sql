-- ITM TRADING ENTERPRISE SECURITY SCHEMA
-- RBAC + RLS + Audit Trail + Defense in Depth
-- Copy-paste ke Supabase SQL Editor

-- ===== 1. ROLES =====
CREATE TABLE IF NOT EXISTS public.roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL CHECK (code IN ('admin','staff','viewer')),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.roles (code, name)
VALUES ('admin','Administrator'),
       ('staff','Staff'),
       ('viewer','Viewer')
ON CONFLICT (code) DO NOTHING;

-- ===== 2. PROFILES (Enhanced) =====
DROP TABLE IF EXISTS public.profiles CASCADE;
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  role_id uuid NOT NULL REFERENCES public.roles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles(email);

-- Auto-create profile after signup (default: viewer)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role_id)
  VALUES (NEW.id, NEW.email,
          (SELECT id FROM public.roles WHERE code='viewer' LIMIT 1));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ===== 3. ACTIVITY LOGS (Audit Trail) =====
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id bigserial PRIMARY KEY,
  actor_id uuid REFERENCES auth.users(id),
  actor_email text,
  action text NOT NULL,            -- 'login','logout','insert','update','delete'
  target_table text,               -- table name
  target_id text,                  -- pk/id target
  payload jsonb,                   -- context data
  ip_address inet,                 -- client IP
  user_agent text,                 -- browser info
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS activity_logs_actor_idx ON public.activity_logs(actor_id);
CREATE INDEX IF NOT EXISTS activity_logs_action_idx ON public.activity_logs(action);
CREATE INDEX IF NOT EXISTS activity_logs_table_idx ON public.activity_logs(target_table);
CREATE INDEX IF NOT EXISTS activity_logs_created_idx ON public.activity_logs(created_at DESC);

-- ===== 4. OPERATIONAL TABLES (Enhanced for Enterprise) =====

-- Fuel Entries
CREATE TABLE IF NOT EXISTS public.fuel_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid REFERENCES auth.users(id),
  date date NOT NULL,
  equipment_id text,
  volume numeric(14,3) NOT NULL CHECK (volume >= 0),
  cost_per_liter numeric(12,2),
  total_cost numeric(16,2) GENERATED ALWAYS AS (volume * COALESCE(cost_per_liter, 0)) STORED,
  supplier text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Shipments (Enhanced) - Update existing table if needed
DO $$ BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'shipments' AND column_name = 'created_by') THEN
        ALTER TABLE public.shipments ADD COLUMN created_by uuid REFERENCES auth.users(id);
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'shipments' AND column_name = 'vessel') THEN
        ALTER TABLE public.shipments ADD COLUMN vessel text;
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'shipments' AND column_name = 'port_origin') THEN
        ALTER TABLE public.shipments ADD COLUMN port_origin text;
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'shipments' AND column_name = 'port_destination') THEN
        ALTER TABLE public.shipments ADD COLUMN port_destination text;
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'shipments' AND column_name = 'tonnage') THEN
        ALTER TABLE public.shipments ADD COLUMN tonnage numeric(16,3);
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'shipments' AND column_name = 'status') THEN
        ALTER TABLE public.shipments ADD COLUMN status text DEFAULT 'planned';
    END IF;
END $$;

-- Equipment (Enhanced)
CREATE TABLE IF NOT EXISTS public.equipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text,
  model text,
  serial_number text,
  purchase_date date,
  purchase_cost numeric(16,2),
  status text CHECK (status IN ('active','maintenance','retired')) DEFAULT 'active',
  location text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ===== 5. ENABLE ROW LEVEL SECURITY =====
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipments ENABLE ROW LEVEL SECURITY;

-- Professional tables (if they exist)
DO $$ BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customers') THEN
        ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'suppliers') THEN
        ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
        ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sales_orders') THEN
        ALTER TABLE public.sales_orders ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'office_stock') THEN
        ALTER TABLE public.office_stock ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- ===== 6. RLS POLICIES =====

-- Profiles: user can read own profile; admin can read all
DROP POLICY IF EXISTS "profiles_select_self" ON public.profiles;
CREATE POLICY "profiles_select_self"
ON public.profiles
FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
CREATE POLICY "profiles_admin_all"
ON public.profiles
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.roles r ON p.role_id = r.id
    WHERE p.id = auth.uid() AND r.code = 'admin'
  )
);

-- Activity logs: only admin can select/insert
DROP POLICY IF EXISTS "logs_admin_select" ON public.activity_logs;
CREATE POLICY "logs_admin_select"
ON public.activity_logs
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.roles r ON p.role_id = r.id
    WHERE p.id = auth.uid() AND r.code = 'admin'
  )
);

-- Fuel Entries: owner can CRUD their own; admin can do all
DROP POLICY IF EXISTS "fuel_owner_crud" ON public.fuel_entries;
CREATE POLICY "fuel_owner_crud"
ON public.fuel_entries
FOR ALL USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "fuel_admin_all" ON public.fuel_entries;
CREATE POLICY "fuel_admin_all"
ON public.fuel_entries
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.roles r ON p.role_id = r.id
    WHERE p.id = auth.uid() AND r.code = 'admin'
  )
);

-- Shipments: owner can CRUD; admin can do all; staff can read all; viewer can read
DROP POLICY IF EXISTS "ship_owner_crud" ON public.shipments;
CREATE POLICY "ship_owner_crud"
ON public.shipments
FOR ALL USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "ship_admin_all" ON public.shipments;
CREATE POLICY "ship_admin_all"
ON public.shipments
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.roles r ON p.role_id = r.id
    WHERE p.id = auth.uid() AND r.code = 'admin'
  )
);

DROP POLICY IF EXISTS "ship_staff_read" ON public.shipments;
CREATE POLICY "ship_staff_read"
ON public.shipments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.roles r ON p.role_id = r.id
    WHERE p.id = auth.uid() AND r.code IN ('staff', 'viewer')
  )
);

-- Equipment: all can read; admin can CRUD; staff can update status
DROP POLICY IF EXISTS "equip_all_select" ON public.equipments;
CREATE POLICY "equip_all_select"
ON public.equipments
FOR SELECT USING (true);

DROP POLICY IF EXISTS "equip_admin_all" ON public.equipments;
CREATE POLICY "equip_admin_all"
ON public.equipments
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.roles r ON p.role_id = r.id
    WHERE p.id = auth.uid() AND r.code = 'admin'
  )
);

DROP POLICY IF EXISTS "equip_staff_update" ON public.equipments;
CREATE POLICY "equip_staff_update"
ON public.equipments
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.roles r ON p.role_id = r.id
    WHERE p.id = auth.uid() AND r.code = 'staff'
  )
);

-- Professional tables policies (if they exist)
DO $$ BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customers') THEN
        DROP POLICY IF EXISTS "customers_access" ON public.customers;
        CREATE POLICY "customers_access" ON public.customers FOR ALL TO authenticated USING (true);
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'suppliers') THEN
        DROP POLICY IF EXISTS "suppliers_access" ON public.suppliers;
        CREATE POLICY "suppliers_access" ON public.suppliers FOR ALL TO authenticated USING (true);
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
        DROP POLICY IF EXISTS "products_access" ON public.products;
        CREATE POLICY "products_access" ON public.products FOR ALL TO authenticated USING (true);
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sales_orders') THEN
        DROP POLICY IF EXISTS "sales_orders_access" ON public.sales_orders;
        CREATE POLICY "sales_orders_access" ON public.sales_orders FOR ALL TO authenticated USING (true);
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'office_stock') THEN
        DROP POLICY IF EXISTS "office_stock_access" ON public.office_stock;
        CREATE POLICY "office_stock_access" ON public.office_stock FOR ALL TO authenticated USING (true);
    END IF;
END $$;

-- ===== 7. AUDIT TRIGGER (Auto-log CRUD operations) =====
CREATE OR REPLACE FUNCTION public.log_table_changes()
RETURNS trigger AS $$
DECLARE
  actor uuid := auth.uid();
  actor_email text;
  tgt_id text;
  payload jsonb;
BEGIN
  SELECT email INTO actor_email FROM public.profiles WHERE id = actor;

  IF (TG_OP = 'INSERT') THEN
    tgt_id := COALESCE((to_jsonb(NEW)->>'id'), 'n/a');
    payload := to_jsonb(NEW);
  ELSIF (TG_OP = 'UPDATE') THEN
    tgt_id := COALESCE((to_jsonb(NEW)->>'id'), (to_jsonb(OLD)->>'id'), 'n/a');
    payload := jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW));
  ELSIF (TG_OP = 'DELETE') THEN
    tgt_id := COALESCE((to_jsonb(OLD)->>'id'), 'n/a');
    payload := to_jsonb(OLD);
  END IF;

  INSERT INTO public.activity_logs (actor_id, actor_email, action, target_table, target_id, payload)
  VALUES (actor, actor_email, LOWER(TG_OP), TG_TABLE_NAME, tgt_id, payload);

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach triggers to critical tables
DROP TRIGGER IF EXISTS trg_log_fuel ON public.fuel_entries;
CREATE TRIGGER trg_log_fuel
AFTER INSERT OR UPDATE OR DELETE ON public.fuel_entries
FOR EACH ROW EXECUTE PROCEDURE public.log_table_changes();

DROP TRIGGER IF EXISTS trg_log_ship ON public.shipments;
CREATE TRIGGER trg_log_ship
AFTER INSERT OR UPDATE OR DELETE ON public.shipments
FOR EACH ROW EXECUTE PROCEDURE public.log_table_changes();

DROP TRIGGER IF EXISTS trg_log_equip ON public.equipments;
CREATE TRIGGER trg_log_equip
AFTER INSERT OR UPDATE OR DELETE ON public.equipments
FOR EACH ROW EXECUTE PROCEDURE public.log_table_changes();

-- Professional tables triggers (if they exist)
DO $$ BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customers') THEN
        DROP TRIGGER IF EXISTS trg_log_customers ON public.customers;
        CREATE TRIGGER trg_log_customers
        AFTER INSERT OR UPDATE OR DELETE ON public.customers
        FOR EACH ROW EXECUTE PROCEDURE public.log_table_changes();
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sales_orders') THEN
        DROP TRIGGER IF EXISTS trg_log_sales_orders ON public.sales_orders;
        CREATE TRIGGER trg_log_sales_orders
        AFTER INSERT OR UPDATE OR DELETE ON public.sales_orders
        FOR EACH ROW EXECUTE PROCEDURE public.log_table_changes();
    END IF;
END $$;

-- ===== 8. ENABLE REALTIME =====
-- Add tables to realtime publication if not already added
DO $$ BEGIN
    -- Check and add profiles
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'profiles'
    ) THEN
        ALTER publication supabase_realtime ADD TABLE public.profiles;
    END IF;
    
    -- Check and add activity_logs
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'activity_logs'
    ) THEN
        ALTER publication supabase_realtime ADD TABLE public.activity_logs;
    END IF;
    
    -- Check and add fuel_entries
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'fuel_entries'
    ) THEN
        ALTER publication supabase_realtime ADD TABLE public.fuel_entries;
    END IF;
    
    -- Check and add shipments
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'shipments'
    ) THEN
        ALTER publication supabase_realtime ADD TABLE public.shipments;
    END IF;
    
    -- Check and add equipments
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'equipments'
    ) THEN
        ALTER publication supabase_realtime ADD TABLE public.equipments;
    END IF;
END $$;

-- ===== 9. CREATE SUPERADMIN USER =====
-- This will create the superadmin with proper role
DO $$
DECLARE
  admin_role_id uuid;
  existing_profile_count int;
BEGIN
  SELECT id INTO admin_role_id FROM public.roles WHERE code = 'admin';
  
  SELECT COUNT(*) INTO existing_profile_count 
  FROM public.profiles p 
  JOIN public.roles r ON p.role_id = r.id 
  WHERE r.code = 'admin';
  
  -- Only create if no admin exists
  IF existing_profile_count = 0 THEN
    -- Try to update existing superadmin to admin role
    UPDATE public.profiles 
    SET role_id = admin_role_id 
    WHERE email = 'ilhamyahyaaji@infinitytrademineral.id';
    
    -- If no update happened, the profile will be created by trigger when user signs up
  END IF;
END $$;

-- ===== SUCCESS MESSAGE =====
SELECT 'ITM TRADING ENTERPRISE SECURITY SCHEMA INSTALLED SUCCESSFULLY!' as status;

