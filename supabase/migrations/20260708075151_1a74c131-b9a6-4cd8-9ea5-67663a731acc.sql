
-- 1) Private schema for SECURITY DEFINER helpers (not exposed via PostgREST)
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

-- 2) Recreate role helpers in private
CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION private.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('owner','admin'));
$$;

CREATE OR REPLACE FUNCTION private.can_write(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('owner','admin','agent'));
$$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_staff(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.can_write(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_staff(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.can_write(uuid) TO authenticated, service_role;

-- 3) Drop every policy that references the public helpers (we'll recreate)
-- audit_log
DROP POLICY IF EXISTS audit_read ON public.audit_log;
DROP POLICY IF EXISTS audit_insert ON public.audit_log;
-- activity_log
DROP POLICY IF EXISTS activity_read ON public.activity_log;
DROP POLICY IF EXISTS activity_write ON public.activity_log;
-- notifications
DROP POLICY IF EXISTS notif_read ON public.notifications;
DROP POLICY IF EXISTS notif_staff_all ON public.notifications;
DROP POLICY IF EXISTS notif_write ON public.notifications;
-- security_events
DROP POLICY IF EXISTS sec_read ON public.security_events;
DROP POLICY IF EXISTS sec_staff_all ON public.security_events;
DROP POLICY IF EXISTS sec_write ON public.security_events;
-- attack_attempts
DROP POLICY IF EXISTS attack_read ON public.attack_attempts;
DROP POLICY IF EXISTS attack_write ON public.attack_attempts;
-- service_call_logs
DROP POLICY IF EXISTS call_logs_read ON public.service_call_logs;
DROP POLICY IF EXISTS call_logs_write ON public.service_call_logs;
-- profiles / user_roles
DROP POLICY IF EXISTS profiles_select_own_or_staff ON public.profiles;
DROP POLICY IF EXISTS profiles_staff_all ON public.profiles;
DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
DROP POLICY IF EXISTS user_roles_read_own ON public.user_roles;
DROP POLICY IF EXISTS user_roles_staff_manage ON public.user_roles;

-- Auth-read + staff-write groups
DROP POLICY IF EXISTS sites_read_auth ON public.sites;
DROP POLICY IF EXISTS sites_staff_write ON public.sites;
DROP POLICY IF EXISTS databases_registry_read_auth ON public.databases_registry;
DROP POLICY IF EXISTS databases_registry_staff_write ON public.databases_registry;
DROP POLICY IF EXISTS backups_read_auth ON public.backups;
DROP POLICY IF EXISTS backups_staff_write ON public.backups;
DROP POLICY IF EXISTS storage_folders_read_auth ON public.storage_folders;
DROP POLICY IF EXISTS storage_folders_staff_write ON public.storage_folders;
DROP POLICY IF EXISTS clients_read_auth ON public.clients;
DROP POLICY IF EXISTS clients_staff_write ON public.clients;
DROP POLICY IF EXISTS services_read_auth ON public.services;
DROP POLICY IF EXISTS services_staff_write ON public.services;
DROP POLICY IF EXISTS service_dependencies_read_auth ON public.service_dependencies;
DROP POLICY IF EXISTS service_dependencies_staff_write ON public.service_dependencies;
DROP POLICY IF EXISTS api_keys_read_auth ON public.api_keys;
DROP POLICY IF EXISTS api_keys_staff_write ON public.api_keys;
DROP POLICY IF EXISTS agents_catalog_read_auth ON public.agents_catalog;
DROP POLICY IF EXISTS agents_catalog_staff_write ON public.agents_catalog;
DROP POLICY IF EXISTS agent_sessions_read_auth ON public.agent_sessions;
DROP POLICY IF EXISTS agent_sessions_staff_write ON public.agent_sessions;
DROP POLICY IF EXISTS agent_tasks_read_auth ON public.agent_tasks;
DROP POLICY IF EXISTS agent_tasks_staff_write ON public.agent_tasks;

-- 4) Drop the public helpers (nothing depends on them now)
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);
DROP FUNCTION IF EXISTS public.is_staff(uuid);
DROP FUNCTION IF EXISTS public.can_write(uuid);

-- 5) Recreate policies using private.* and tighter scopes

-- profiles
CREATE POLICY profiles_select_own_or_staff ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR private.is_staff(auth.uid()));
CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY profiles_staff_all ON public.profiles
  FOR ALL TO authenticated
  USING (private.is_staff(auth.uid())) WITH CHECK (private.is_staff(auth.uid()));

-- user_roles
CREATE POLICY user_roles_read_own ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR private.is_staff(auth.uid()));
CREATE POLICY user_roles_staff_manage ON public.user_roles
  FOR ALL TO authenticated
  USING (private.is_staff(auth.uid())) WITH CHECK (private.is_staff(auth.uid()));

-- audit_log: staff-only read; insert only by staff and must own actor_id
CREATE POLICY audit_read ON public.audit_log
  FOR SELECT TO authenticated USING (private.is_staff(auth.uid()));
CREATE POLICY audit_insert ON public.audit_log
  FOR INSERT TO authenticated
  WITH CHECK (private.is_staff(auth.uid()) AND actor_id = auth.uid());

-- activity_log: staff-only read; staff-only writes
CREATE POLICY activity_read ON public.activity_log
  FOR SELECT TO authenticated USING (private.is_staff(auth.uid()));
CREATE POLICY activity_write ON public.activity_log
  FOR INSERT TO authenticated WITH CHECK (private.can_write(auth.uid()));

-- notifications: staff-only
CREATE POLICY notif_read ON public.notifications
  FOR SELECT TO authenticated USING (private.is_staff(auth.uid()));
CREATE POLICY notif_write ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (private.can_write(auth.uid()));
CREATE POLICY notif_staff_all ON public.notifications
  FOR ALL TO authenticated
  USING (private.is_staff(auth.uid())) WITH CHECK (private.is_staff(auth.uid()));

-- security_events: staff-only
CREATE POLICY sec_read ON public.security_events
  FOR SELECT TO authenticated USING (private.is_staff(auth.uid()));
CREATE POLICY sec_write ON public.security_events
  FOR INSERT TO authenticated WITH CHECK (private.can_write(auth.uid()));
CREATE POLICY sec_staff_all ON public.security_events
  FOR ALL TO authenticated
  USING (private.is_staff(auth.uid())) WITH CHECK (private.is_staff(auth.uid()));

-- attack_attempts: staff-only read, staff-only write
CREATE POLICY attack_read ON public.attack_attempts
  FOR SELECT TO authenticated USING (private.is_staff(auth.uid()));
CREATE POLICY attack_write ON public.attack_attempts
  FOR INSERT TO authenticated WITH CHECK (private.can_write(auth.uid()));

-- service_call_logs: staff-only read, staff-only write
CREATE POLICY call_logs_read ON public.service_call_logs
  FOR SELECT TO authenticated USING (private.is_staff(auth.uid()));
CREATE POLICY call_logs_write ON public.service_call_logs
  FOR INSERT TO authenticated WITH CHECK (private.can_write(auth.uid()));

-- Business/infrastructure tables: staff-only SELECT + staff-only writes
CREATE POLICY sites_staff_read ON public.sites
  FOR SELECT TO authenticated USING (private.is_staff(auth.uid()));
CREATE POLICY sites_staff_write ON public.sites
  FOR ALL TO authenticated USING (private.is_staff(auth.uid())) WITH CHECK (private.is_staff(auth.uid()));

CREATE POLICY databases_registry_staff_read ON public.databases_registry
  FOR SELECT TO authenticated USING (private.is_staff(auth.uid()));
CREATE POLICY databases_registry_staff_write ON public.databases_registry
  FOR ALL TO authenticated USING (private.is_staff(auth.uid())) WITH CHECK (private.is_staff(auth.uid()));

CREATE POLICY backups_staff_read ON public.backups
  FOR SELECT TO authenticated USING (private.is_staff(auth.uid()));
CREATE POLICY backups_staff_write ON public.backups
  FOR ALL TO authenticated USING (private.is_staff(auth.uid())) WITH CHECK (private.is_staff(auth.uid()));

CREATE POLICY storage_folders_staff_read ON public.storage_folders
  FOR SELECT TO authenticated USING (private.is_staff(auth.uid()));
CREATE POLICY storage_folders_staff_write ON public.storage_folders
  FOR ALL TO authenticated USING (private.is_staff(auth.uid())) WITH CHECK (private.is_staff(auth.uid()));

CREATE POLICY clients_staff_read ON public.clients
  FOR SELECT TO authenticated USING (private.is_staff(auth.uid()));
CREATE POLICY clients_staff_write ON public.clients
  FOR ALL TO authenticated USING (private.is_staff(auth.uid())) WITH CHECK (private.is_staff(auth.uid()));

CREATE POLICY services_staff_read ON public.services
  FOR SELECT TO authenticated USING (private.is_staff(auth.uid()));
CREATE POLICY services_staff_write ON public.services
  FOR ALL TO authenticated USING (private.is_staff(auth.uid())) WITH CHECK (private.is_staff(auth.uid()));

CREATE POLICY service_dependencies_staff_read ON public.service_dependencies
  FOR SELECT TO authenticated USING (private.is_staff(auth.uid()));
CREATE POLICY service_dependencies_staff_write ON public.service_dependencies
  FOR ALL TO authenticated USING (private.is_staff(auth.uid())) WITH CHECK (private.is_staff(auth.uid()));

CREATE POLICY api_keys_staff_read ON public.api_keys
  FOR SELECT TO authenticated USING (private.is_staff(auth.uid()));
CREATE POLICY api_keys_staff_write ON public.api_keys
  FOR ALL TO authenticated USING (private.is_staff(auth.uid())) WITH CHECK (private.is_staff(auth.uid()));

CREATE POLICY agents_catalog_staff_read ON public.agents_catalog
  FOR SELECT TO authenticated USING (private.is_staff(auth.uid()));
CREATE POLICY agents_catalog_staff_write ON public.agents_catalog
  FOR ALL TO authenticated USING (private.is_staff(auth.uid())) WITH CHECK (private.is_staff(auth.uid()));

CREATE POLICY agent_sessions_staff_read ON public.agent_sessions
  FOR SELECT TO authenticated USING (private.is_staff(auth.uid()));
CREATE POLICY agent_sessions_staff_write ON public.agent_sessions
  FOR ALL TO authenticated USING (private.is_staff(auth.uid())) WITH CHECK (private.is_staff(auth.uid()));

CREATE POLICY agent_tasks_staff_read ON public.agent_tasks
  FOR SELECT TO authenticated USING (private.is_staff(auth.uid()));
CREATE POLICY agent_tasks_staff_write ON public.agent_tasks
  FOR ALL TO authenticated USING (private.is_staff(auth.uid())) WITH CHECK (private.is_staff(auth.uid()));

-- 6) Trigger-only SECURITY DEFINER functions: revoke EXECUTE from clients
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
