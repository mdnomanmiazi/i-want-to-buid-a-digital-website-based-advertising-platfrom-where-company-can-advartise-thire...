REVOKE EXECUTE ON FUNCTION public.expire_old_ads() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.expire_old_ads() TO service_role;