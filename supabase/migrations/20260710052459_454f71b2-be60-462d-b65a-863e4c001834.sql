
REVOKE ALL ON FUNCTION private.is_protected_owner_email(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.is_protected_owner(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.protect_owner_role() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.protect_owner_user_delete() FROM PUBLIC, anon, authenticated;
ALTER FUNCTION private.is_protected_owner_email(text) SET search_path = public;
