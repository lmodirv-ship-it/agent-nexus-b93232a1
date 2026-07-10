
-- Protected owners function
CREATE OR REPLACE FUNCTION private.is_protected_owner_email(_email text)
RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
  SELECT lower(_email) IN ('lmodirv@gmail.com','info@hnchat.net')
$$;

CREATE OR REPLACE FUNCTION private.is_protected_owner(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,auth AS $$
  SELECT EXISTS (SELECT 1 FROM auth.users WHERE id=_user_id AND private.is_protected_owner_email(email))
$$;

-- Update handle_new_user: protected emails get owner, first user gets owner, else visitor
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE user_count int; assigned_role app_role;
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (NEW.id,
          COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
          NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;

  IF private.is_protected_owner_email(NEW.email) THEN
    assigned_role := 'owner';
  ELSE
    SELECT COUNT(*) INTO user_count FROM public.user_roles;
    IF user_count = 0 THEN
      assigned_role := 'owner';
    ELSE
      assigned_role := 'visitor';
    END IF;
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, assigned_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END $$;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Protect protected owners: cannot remove owner role, cannot delete auth user
CREATE OR REPLACE FUNCTION public.protect_owner_role()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,auth AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.role = 'owner' AND private.is_protected_owner(OLD.user_id) THEN
      RAISE EXCEPTION 'Cannot remove owner role from protected account';
    END IF;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.role = 'owner' AND private.is_protected_owner(OLD.user_id) AND NEW.role <> 'owner' THEN
      RAISE EXCEPTION 'Cannot change owner role of protected account';
    END IF;
    RETURN NEW;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_protect_owner_role ON public.user_roles;
CREATE TRIGGER trg_protect_owner_role
  BEFORE UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.protect_owner_role();

CREATE OR REPLACE FUNCTION public.protect_owner_user_delete()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,auth AS $$
BEGIN
  IF private.is_protected_owner_email(OLD.email) THEN
    RAISE EXCEPTION 'Cannot delete protected owner account: %', OLD.email;
  END IF;
  RETURN OLD;
END $$;

DROP TRIGGER IF EXISTS trg_protect_owner_user_delete ON auth.users;
CREATE TRIGGER trg_protect_owner_user_delete
  BEFORE DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.protect_owner_user_delete();

-- Backfill: if any protected owner already exists in auth.users, grant owner role
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'owner'::app_role
FROM auth.users u
WHERE private.is_protected_owner_email(u.email)
ON CONFLICT (user_id, role) DO NOTHING;

-- Link clients to auth users so a "client" role account can see their record
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS clients_user_id_idx ON public.clients(user_id);

-- Client can read their own client row + their sites
DROP POLICY IF EXISTS clients_self_read ON public.clients;
CREATE POLICY clients_self_read ON public.clients FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS sites_client_read ON public.sites;
CREATE POLICY sites_client_read ON public.sites FOR SELECT TO authenticated
  USING (client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid()));
