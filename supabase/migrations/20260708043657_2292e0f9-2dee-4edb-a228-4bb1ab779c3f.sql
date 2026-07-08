
-- ============ ENUM & ROLES ============
CREATE TYPE public.app_role AS ENUM ('owner','admin','agent','viewer');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ============ has_role() SECURITY DEFINER ============
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('owner','admin'));
$$;

CREATE OR REPLACE FUNCTION public.can_write(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('owner','admin','agent'));
$$;

-- ============ Handle new user (auto profile + role) ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_count int;
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)), NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;

  SELECT COUNT(*) INTO user_count FROM public.user_roles;
  IF user_count = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'owner');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'viewer');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ updated_at trigger ============
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ CLIENTS ============
CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  company text,
  status text NOT NULL DEFAULT 'active',
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO authenticated;
GRANT ALL ON public.clients TO service_role;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_clients_updated BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ SITES: add client_id ============
ALTER TABLE public.sites ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL;
ALTER TABLE public.sites ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
CREATE TRIGGER trg_sites_updated BEFORE UPDATE ON public.sites
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ SERVICES ============
CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid REFERENCES public.sites(id) ON DELETE CASCADE,
  name text NOT NULL,
  endpoint_url text,
  health text NOT NULL DEFAULT 'online',
  version text DEFAULT '1.0.0',
  rate_limit int DEFAULT 1000,
  is_public boolean DEFAULT false,
  calls_today int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT ALL ON public.services TO service_role;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_services_updated BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.service_dependencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consumer_site_id uuid REFERENCES public.sites(id) ON DELETE CASCADE,
  provider_service_id uuid REFERENCES public.services(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_dependencies TO authenticated;
GRANT ALL ON public.service_dependencies TO service_role;
ALTER TABLE public.service_dependencies ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.service_call_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_service_id uuid REFERENCES public.services(id) ON DELETE CASCADE,
  endpoint text,
  response_code int,
  response_time_ms int,
  status text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.service_call_logs TO authenticated;
GRANT ALL ON public.service_call_logs TO service_role;
ALTER TABLE public.service_call_logs ENABLE ROW LEVEL SECURITY;

-- ============ API KEYS ============
CREATE TABLE public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  prefix text NOT NULL,
  hashed_secret text NOT NULL,
  scopes text[] DEFAULT ARRAY['read']::text[],
  active boolean DEFAULT true,
  last_used_at timestamptz,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.api_keys TO authenticated;
GRANT ALL ON public.api_keys TO service_role;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- ============ AUDIT LOG ============
CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id),
  actor_email text,
  action text NOT NULL,
  target text,
  details jsonb,
  ip text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- ============ ATTACK ATTEMPTS ============
CREATE TABLE public.attack_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip text NOT NULL,
  country text,
  kind text,
  target text,
  blocked boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.attack_attempts TO authenticated;
GRANT ALL ON public.attack_attempts TO service_role;
ALTER TABLE public.attack_attempts ENABLE ROW LEVEL SECURITY;

-- ============ DROP OLD OPEN POLICIES ============
DROP POLICY IF EXISTS "public sites all" ON public.sites;
DROP POLICY IF EXISTS "public db all" ON public.databases_registry;
DROP POLICY IF EXISTS "public backups all" ON public.backups;
DROP POLICY IF EXISTS "public folders all" ON public.storage_folders;
DROP POLICY IF EXISTS "public sec all" ON public.security_events;
DROP POLICY IF EXISTS "public notif all" ON public.notifications;
DROP POLICY IF EXISTS "public act all" ON public.activity_log;
DROP POLICY IF EXISTS "public cat all" ON public.agents_catalog;
DROP POLICY IF EXISTS "public sessions all" ON public.agent_sessions;
DROP POLICY IF EXISTS "public tasks all" ON public.agent_tasks;

-- ============ POLICIES: PROFILES ============
CREATE POLICY "profiles_select_own_or_staff" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_staff_all" ON public.profiles FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- ============ POLICIES: USER ROLES ============
CREATE POLICY "user_roles_read_own" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "user_roles_staff_manage" ON public.user_roles FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- ============ Helper macro: apply standard role policies ============
-- staff full, agent write logs, viewer read
DO $$
DECLARE tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'sites','databases_registry','backups','storage_folders','clients',
    'services','service_dependencies','api_keys','agents_catalog','agent_sessions','agent_tasks'
  ]) LOOP
    EXECUTE format('CREATE POLICY "%1$s_read_auth" ON public.%1$s FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);', tbl);
    EXECUTE format('CREATE POLICY "%1$s_staff_write" ON public.%1$s FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));', tbl);
  END LOOP;
END $$;

-- log tables: any authenticated can read + insert (agents write logs)
CREATE POLICY "notif_read" ON public.notifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "notif_write" ON public.notifications FOR INSERT TO authenticated WITH CHECK (public.can_write(auth.uid()));
CREATE POLICY "notif_staff_all" ON public.notifications FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "sec_read" ON public.security_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "sec_write" ON public.security_events FOR INSERT TO authenticated WITH CHECK (public.can_write(auth.uid()));
CREATE POLICY "sec_staff_all" ON public.security_events FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "activity_read" ON public.activity_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "activity_write" ON public.activity_log FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "call_logs_read" ON public.service_call_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "call_logs_write" ON public.service_call_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "audit_read" ON public.audit_log FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "audit_insert" ON public.audit_log FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "attack_read" ON public.attack_attempts FOR SELECT TO authenticated USING (true);
CREATE POLICY "attack_write" ON public.attack_attempts FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
