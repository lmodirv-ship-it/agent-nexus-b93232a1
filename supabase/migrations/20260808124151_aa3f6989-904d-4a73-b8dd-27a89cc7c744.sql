DROP FUNCTION IF EXISTS public.hn_resolve_dashboard(uuid, text);

CREATE OR REPLACE FUNCTION public.hn_my_dashboard(_app_code text DEFAULT 'HUB')
RETURNS text LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT COALESCE(
    (SELECT r.default_dashboard
       FROM public.hn_user_roles_apps ura
       JOIN public.hn_roles r ON r.id = ura.role_id
       LEFT JOIN public.hn_apps a ON a.id = ura.app_id
      WHERE ura.user_id = auth.uid() AND ura.is_active
        AND (a.app_code = _app_code OR ura.app_id IS NULL)
      ORDER BY r.access_level DESC
      LIMIT 1),
    (SELECT r.default_dashboard FROM public.user_roles ur
       JOIN public.hn_roles r ON r.code = ur.role::text
      WHERE ur.user_id = auth.uid() ORDER BY r.access_level DESC LIMIT 1),
    '/user/dashboard');
$$;
REVOKE ALL ON FUNCTION public.hn_my_dashboard(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.hn_my_dashboard(text) TO authenticated, service_role;