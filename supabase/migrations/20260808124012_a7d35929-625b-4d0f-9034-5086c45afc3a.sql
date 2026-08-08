-- ============ hn_roles ============
CREATE TABLE public.hn_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name_ar text NOT NULL,
  access_level int NOT NULL DEFAULT 10,
  default_dashboard text NOT NULL DEFAULT '/user/dashboard',
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.hn_roles TO authenticated;
GRANT ALL ON public.hn_roles TO service_role;
ALTER TABLE public.hn_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hn_roles_read_auth" ON public.hn_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "hn_roles_manage_owner" ON public.hn_roles FOR ALL TO authenticated
  USING (private.has_role(auth.uid(),'owner')) WITH CHECK (private.has_role(auth.uid(),'owner'));

INSERT INTO public.hn_roles (code, name_ar, access_level, default_dashboard, description) VALUES
  ('owner','المالك',100,'/owner/dashboard','صلاحية كاملة على المنظومة'),
  ('admin','مدير',80,'/owner/dashboard','إدارة التطبيقات والمستخدمين'),
  ('agent','مشرف',60,'/owner/dashboard','متابعة تشغيلية'),
  ('subscriber','مشترك',30,'/user/dashboard','مستخدم مشترك في تطبيق'),
  ('client','عميل',30,'/user/dashboard','عميل مرتبط بمواقع'),
  ('visitor','زائر',10,'/user/dashboard','بانتظار منح دور');

-- ============ hn_apps ============
CREATE TABLE public.hn_apps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_code text NOT NULL UNIQUE,
  name text NOT NULL,
  url text,
  site_id uuid REFERENCES public.sites(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.hn_apps TO authenticated;
GRANT ALL ON public.hn_apps TO service_role;
ALTER TABLE public.hn_apps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hn_apps_read_auth" ON public.hn_apps FOR SELECT TO authenticated USING (true);
CREATE POLICY "hn_apps_manage_staff" ON public.hn_apps FOR ALL TO authenticated
  USING (private.has_role(auth.uid(),'owner') OR private.has_role(auth.uid(),'admin'))
  WITH CHECK (private.has_role(auth.uid(),'owner') OR private.has_role(auth.uid(),'admin'));

INSERT INTO public.hn_apps (app_code, name, url) VALUES ('HUB','قلب مجموعة HN', 'https://hn-groupe.net');
INSERT INTO public.hn_apps (app_code, name, url, site_id)
SELECT 'APP-' || s.site_code, s.domain, s.domain, s.id FROM public.sites s WHERE s.site_code IS NOT NULL
ON CONFLICT (app_code) DO NOTHING;

-- ============ hn_users ============
CREATE TABLE public.hn_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  origin_app_id uuid REFERENCES public.hn_apps(id) ON DELETE SET NULL,
  origin_domain text,
  status text NOT NULL DEFAULT 'active',
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.hn_users TO authenticated;
GRANT ALL ON public.hn_users TO service_role;
ALTER TABLE public.hn_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hn_users_read_self" ON public.hn_users FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "hn_users_update_self" ON public.hn_users FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "hn_users_staff_all" ON public.hn_users FOR ALL TO authenticated
  USING (private.has_role(auth.uid(),'owner') OR private.has_role(auth.uid(),'admin'))
  WITH CHECK (private.has_role(auth.uid(),'owner') OR private.has_role(auth.uid(),'admin'));

-- ============ hn_user_roles_apps ============
CREATE TABLE public.hn_user_roles_apps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  app_id uuid REFERENCES public.hn_apps(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES public.hn_roles(id) ON DELETE RESTRICT,
  is_active boolean NOT NULL DEFAULT true,
  granted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, app_id, role_id)
);
GRANT SELECT ON public.hn_user_roles_apps TO authenticated;
GRANT ALL ON public.hn_user_roles_apps TO service_role;
ALTER TABLE public.hn_user_roles_apps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hnura_read_self" ON public.hn_user_roles_apps FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "hnura_staff_all" ON public.hn_user_roles_apps FOR ALL TO authenticated
  USING (private.has_role(auth.uid(),'owner') OR private.has_role(auth.uid(),'admin'))
  WITH CHECK (private.has_role(auth.uid(),'owner') OR private.has_role(auth.uid(),'admin'));

CREATE INDEX hn_ura_user_idx ON public.hn_user_roles_apps(user_id);
CREATE INDEX hn_ura_app_idx ON public.hn_user_roles_apps(app_id);

CREATE TRIGGER hn_roles_updated BEFORE UPDATE ON public.hn_roles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER hn_apps_updated BEFORE UPDATE ON public.hn_apps FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER hn_users_updated BEFORE UPDATE ON public.hn_users FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER hn_ura_updated BEFORE UPDATE ON public.hn_user_roles_apps FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ dashboard resolver ============
CREATE OR REPLACE FUNCTION public.hn_resolve_dashboard(_user_id uuid, _app_code text DEFAULT 'HUB')
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(
    (SELECT r.default_dashboard
       FROM public.hn_user_roles_apps ura
       JOIN public.hn_roles r ON r.id = ura.role_id
       LEFT JOIN public.hn_apps a ON a.id = ura.app_id
      WHERE ura.user_id = _user_id AND ura.is_active
        AND (a.app_code = _app_code OR ura.app_id IS NULL)
      ORDER BY r.access_level DESC
      LIMIT 1),
    (SELECT r.default_dashboard FROM public.user_roles ur
       JOIN public.hn_roles r ON r.code = ur.role::text
      WHERE ur.user_id = _user_id ORDER BY r.access_level DESC LIMIT 1),
    '/user/dashboard');
$$;
REVOKE ALL ON FUNCTION public.hn_resolve_dashboard(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.hn_resolve_dashboard(uuid, text) TO authenticated, service_role;

-- ============ sync new/existing users into hn_users + hn_user_roles_apps ============
CREATE OR REPLACE FUNCTION public.hn_sync_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_role_code text; v_role_id uuid; v_hub uuid;
BEGIN
  INSERT INTO public.hn_users (user_id, email, full_name, origin_domain)
  VALUES (NEW.id, NEW.email,
          COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
          NEW.raw_user_meta_data->>'origin_domain')
  ON CONFLICT (user_id) DO UPDATE SET email = EXCLUDED.email;

  SELECT ur.role::text INTO v_role_code FROM public.user_roles ur WHERE ur.user_id = NEW.id LIMIT 1;
  IF v_role_code IS NULL THEN v_role_code := 'visitor'; END IF;
  SELECT id INTO v_role_id FROM public.hn_roles WHERE code = v_role_code;
  SELECT id INTO v_hub FROM public.hn_apps WHERE app_code = 'HUB';
  IF v_role_id IS NOT NULL THEN
    INSERT INTO public.hn_user_roles_apps (user_id, app_id, role_id)
    VALUES (NEW.id, v_hub, v_role_id) ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER hn_on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.hn_sync_user();

-- keep hn_user_roles_apps in sync with user_roles changes
CREATE OR REPLACE FUNCTION public.hn_sync_role_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_role_id uuid; v_hub uuid;
BEGIN
  SELECT id INTO v_hub FROM public.hn_apps WHERE app_code = 'HUB';
  IF TG_OP = 'DELETE' THEN
    SELECT id INTO v_role_id FROM public.hn_roles WHERE code = OLD.role::text;
    DELETE FROM public.hn_user_roles_apps WHERE user_id = OLD.user_id AND app_id = v_hub AND role_id = v_role_id;
    RETURN OLD;
  END IF;
  SELECT id INTO v_role_id FROM public.hn_roles WHERE code = NEW.role::text;
  IF v_role_id IS NOT NULL THEN
    INSERT INTO public.hn_user_roles_apps (user_id, app_id, role_id, granted_by)
    VALUES (NEW.user_id, v_hub, v_role_id, auth.uid()) ON CONFLICT DO NOTHING;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.role IS DISTINCT FROM NEW.role THEN
    DELETE FROM public.hn_user_roles_apps
     WHERE user_id = NEW.user_id AND app_id = v_hub
       AND role_id = (SELECT id FROM public.hn_roles WHERE code = OLD.role::text);
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER hn_sync_user_roles AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.hn_sync_role_change();

-- backfill existing users
INSERT INTO public.hn_users (user_id, email, full_name)
SELECT u.id, u.email, COALESCE(p.display_name, split_part(u.email,'@',1))
FROM auth.users u LEFT JOIN public.profiles p ON p.id = u.id
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.hn_user_roles_apps (user_id, app_id, role_id)
SELECT ur.user_id, (SELECT id FROM public.hn_apps WHERE app_code='HUB'), r.id
FROM public.user_roles ur JOIN public.hn_roles r ON r.code = ur.role::text
ON CONFLICT DO NOTHING;

-- ensure protected owner has owner role once registered
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'owner'::app_role FROM auth.users u
WHERE lower(u.email) IN ('lmodirv@gmail.com','info@hnchat.net')
ON CONFLICT (user_id, role) DO NOTHING;