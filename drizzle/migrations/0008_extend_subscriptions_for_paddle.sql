ALTER TABLE public.subscriptions
  ADD COLUMN environment text NOT NULL DEFAULT 'sandbox',
  ADD COLUMN product_id text,
  ADD COLUMN price_id text,
  ADD COLUMN paddle_subscription_id text,
  ADD COLUMN paddle_customer_id text;

ALTER TABLE public.subscriptions
  DROP CONSTRAINT subscriptions_provider_check,
  DROP CONSTRAINT subscriptions_status_check,
  ADD CONSTRAINT subscriptions_provider_check CHECK (provider IN ('ggcheckout', 'paddle')),
  ADD CONSTRAINT subscriptions_status_check CHECK (
    status IN ('pending', 'trialing', 'active', 'past_due', 'paused', 'canceled', 'expired', 'refunded')
  ),
  ADD CONSTRAINT subscriptions_environment_check CHECK (environment IN ('sandbox', 'live'));

CREATE UNIQUE INDEX subscriptions_paddle_subscription_id_key
  ON public.subscriptions (paddle_subscription_id)
  WHERE paddle_subscription_id IS NOT NULL;
CREATE INDEX subscriptions_user_environment_idx
  ON public.subscriptions (user_id, environment, created_at DESC);

ALTER TABLE public.billing_webhook_events
  DROP CONSTRAINT billing_events_provider_check,
  ADD CONSTRAINT billing_events_provider_check CHECK (provider IN ('ggcheckout', 'paddle'));

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
      AND (
        (s.status IN ('trialing', 'active', 'past_due')
          AND COALESCE(s.access_until, s.current_period_end) > now())
        OR (s.status = 'canceled'
          AND COALESCE(s.access_until, s.current_period_end) > now())
      )
  );
$$;

REVOKE ALL ON FUNCTION public.has_paid_access() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_paid_access() TO authenticated, service_role;