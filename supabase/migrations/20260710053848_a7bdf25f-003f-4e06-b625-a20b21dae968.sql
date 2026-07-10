
CREATE TABLE public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL CHECK (action IN (
    'role.grant','role.revoke','role.change',
    'client.link','client.unlink','client.relink',
    'user.delete'
  )),
  actor_user_id uuid,
  actor_email text,
  target_user_id uuid,
  target_client_id uuid,
  before jsonb,
  after jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_admin_audit_created ON public.admin_audit_log(created_at DESC);
CREATE INDEX idx_admin_audit_target_user ON public.admin_audit_log(target_user_id);
CREATE INDEX idx_admin_audit_target_client ON public.admin_audit_log(target_client_id);
CREATE INDEX idx_admin_audit_action ON public.admin_audit_log(action);

GRANT SELECT ON public.admin_audit_log TO authenticated;
GRANT ALL ON public.admin_audit_log TO service_role;

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners read audit log"
  ON public.admin_audit_log FOR SELECT
  TO authenticated
  USING (private.has_role(auth.uid(), 'owner'::app_role));

CREATE OR REPLACE FUNCTION private.actor_email(_uid uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT email FROM auth.users WHERE id = _uid
$$;

CREATE OR REPLACE FUNCTION public.log_user_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE v_actor uuid := auth.uid();
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.admin_audit_log(action, actor_user_id, actor_email, target_user_id, after)
    VALUES ('role.grant', v_actor, private.actor_email(v_actor), NEW.user_id,
            jsonb_build_object('role', NEW.role));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.role IS DISTINCT FROM NEW.role THEN
      INSERT INTO public.admin_audit_log(action, actor_user_id, actor_email, target_user_id, before, after)
      VALUES ('role.change', v_actor, private.actor_email(v_actor), NEW.user_id,
              jsonb_build_object('role', OLD.role),
              jsonb_build_object('role', NEW.role));
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.admin_audit_log(action, actor_user_id, actor_email, target_user_id, before)
    VALUES ('role.revoke', v_actor, private.actor_email(v_actor), OLD.user_id,
            jsonb_build_object('role', OLD.role));
    RETURN OLD;
  END IF;
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS trg_log_user_role_change ON public.user_roles;
CREATE TRIGGER trg_log_user_role_change
AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.log_user_role_change();

CREATE OR REPLACE FUNCTION public.log_client_user_link()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_action text;
BEGIN
  IF OLD.user_id IS DISTINCT FROM NEW.user_id THEN
    IF OLD.user_id IS NULL THEN v_action := 'client.link';
    ELSIF NEW.user_id IS NULL THEN v_action := 'client.unlink';
    ELSE v_action := 'client.relink';
    END IF;
    INSERT INTO public.admin_audit_log(action, actor_user_id, actor_email, target_user_id, target_client_id, before, after)
    VALUES (v_action, v_actor, private.actor_email(v_actor), NEW.user_id, NEW.id,
            jsonb_build_object('user_id', OLD.user_id),
            jsonb_build_object('user_id', NEW.user_id));
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_log_client_user_link ON public.clients;
CREATE TRIGGER trg_log_client_user_link
AFTER UPDATE OF user_id ON public.clients
FOR EACH ROW EXECUTE FUNCTION public.log_client_user_link();
