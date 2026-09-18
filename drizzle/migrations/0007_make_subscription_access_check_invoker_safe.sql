CREATE OR REPLACE FUNCTION public.has_paid_access()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.subscriptions s
    WHERE s.user_id = auth.uid()
      AND s.status IN ('active', 'canceled')
      AND COALESCE(s.access_until, s.current_period_end) > now()
  );
$$;

REVOKE ALL ON FUNCTION public.has_paid_access() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_paid_access() TO authenticated, service_role;