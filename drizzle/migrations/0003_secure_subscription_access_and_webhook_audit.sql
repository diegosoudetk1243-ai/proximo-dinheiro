ALTER TABLE public.subscriptions
  ADD COLUMN provider text NOT NULL DEFAULT 'ggcheckout',
  ADD COLUMN access_until timestamptz,
  ADD COLUMN cancel_at_period_end boolean NOT NULL DEFAULT false,
  ADD COLUMN current_period_start timestamptz,
  ADD COLUMN external_subscription_id text,
  ADD COLUMN external_customer_id text,
  ADD COLUMN last_event_at timestamptz;

UPDATE public.subscriptions
SET external_subscription_id = gateway_subscription_id,
    external_customer_id = gateway_customer_id,
    access_until = current_period_end
WHERE external_subscription_id IS NULL
   OR external_customer_id IS NULL
   OR access_until IS NULL;

ALTER TABLE public.subscriptions
  DROP CONSTRAINT subscriptions_status_check,
  ADD CONSTRAINT subscriptions_provider_check CHECK (provider = 'ggcheckout'),
  ADD CONSTRAINT subscriptions_status_check CHECK (
    status IN ('pending', 'active', 'past_due', 'canceled', 'expired', 'refunded')
  ),
  ADD CONSTRAINT subscriptions_user_profile_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

CREATE UNIQUE INDEX subscriptions_external_subscription_id_key
  ON public.subscriptions (provider, external_subscription_id)
  WHERE external_subscription_id IS NOT NULL;

CREATE INDEX subscriptions_access_idx
  ON public.subscriptions (user_id, status, access_until);

CREATE TABLE public.billing_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL DEFAULT 'ggcheckout',
  external_event_id text,
  event_type text NOT NULL,
  external_payment_id text,
  external_subscription_id text,
  received_at timestamptz NOT NULL DEFAULT now(),
  provider_created_at timestamptz,
  payload jsonb NOT NULL,
  payload_hash text NOT NULL,
  processing_status text NOT NULL DEFAULT 'received',
  processed_at timestamptz,
  error_code text,
  attempt_count integer NOT NULL DEFAULT 1,
  CONSTRAINT billing_events_provider_check CHECK (provider = 'ggcheckout'),
  CONSTRAINT billing_events_processing_status_check CHECK (
    processing_status IN ('received', 'processed', 'ignored', 'failed')
  ),
  CONSTRAINT billing_events_attempt_count_check CHECK (attempt_count > 0)
);

REVOKE ALL ON public.billing_webhook_events FROM anon, authenticated;
GRANT ALL ON public.billing_webhook_events TO service_role;
ALTER TABLE public.billing_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX billing_events_external_event_id_key
  ON public.billing_webhook_events (provider, external_event_id)
  WHERE external_event_id IS NOT NULL;
CREATE UNIQUE INDEX billing_events_payload_hash_key
  ON public.billing_webhook_events (provider, payload_hash);
CREATE INDEX billing_events_subscription_idx
  ON public.billing_webhook_events (provider, external_subscription_id, provider_created_at DESC);

ALTER TABLE public.accounts
  ADD CONSTRAINT accounts_user_profile_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD CONSTRAINT accounts_id_user_id_key UNIQUE (id, user_id);

ALTER TABLE public.categories
  ADD CONSTRAINT categories_user_profile_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.recurring_transactions
  ADD CONSTRAINT recurring_user_profile_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD CONSTRAINT recurring_account_owner_fkey
    FOREIGN KEY (account_id, user_id) REFERENCES public.accounts(id, user_id) ON DELETE CASCADE,
  ADD CONSTRAINT recurring_id_user_id_key UNIQUE (id, user_id);

ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_user_profile_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD CONSTRAINT transactions_account_owner_fkey
    FOREIGN KEY (account_id, user_id) REFERENCES public.accounts(id, user_id) ON DELETE CASCADE,
  ADD CONSTRAINT transactions_recurrence_owner_fkey
    FOREIGN KEY (recurrence_id, user_id)
    REFERENCES public.recurring_transactions(id, user_id) ON DELETE CASCADE;

CREATE OR REPLACE FUNCTION public.validate_owned_category()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.category_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.categories c
    WHERE c.id = NEW.category_id
      AND (c.user_id IS NULL OR c.user_id = NEW.user_id)
  ) THEN
    RAISE EXCEPTION 'category does not belong to user' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.validate_owned_category() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_owned_category() TO service_role;

CREATE TRIGGER transactions_validate_owned_category
  BEFORE INSERT OR UPDATE OF category_id, user_id ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.validate_owned_category();
CREATE TRIGGER recurring_validate_owned_category
  BEFORE INSERT OR UPDATE OF category_id, user_id ON public.recurring_transactions
  FOR EACH ROW EXECUTE FUNCTION public.validate_owned_category();

CREATE OR REPLACE FUNCTION public.has_paid_access()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
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

DROP POLICY "own accounts" ON public.accounts;
CREATE POLICY "paid own accounts" ON public.accounts
  FOR ALL TO authenticated
  USING (auth.uid() = user_id AND public.has_paid_access())
  WITH CHECK (auth.uid() = user_id AND public.has_paid_access());

DROP POLICY "own transactions" ON public.transactions;
CREATE POLICY "paid own transactions" ON public.transactions
  FOR ALL TO authenticated
  USING (auth.uid() = user_id AND public.has_paid_access())
  WITH CHECK (auth.uid() = user_id AND public.has_paid_access());

DROP POLICY "own recurrences" ON public.recurring_transactions;
CREATE POLICY "paid own recurrences" ON public.recurring_transactions
  FOR ALL TO authenticated
  USING (auth.uid() = user_id AND public.has_paid_access())
  WITH CHECK (auth.uid() = user_id AND public.has_paid_access());

DROP POLICY "categories select" ON public.categories;
DROP POLICY "categories write" ON public.categories;
CREATE POLICY "paid categories select" ON public.categories
  FOR SELECT TO authenticated
  USING (public.has_paid_access() AND (user_id IS NULL OR auth.uid() = user_id));
CREATE POLICY "paid categories write" ON public.categories
  FOR ALL TO authenticated
  USING (auth.uid() = user_id AND public.has_paid_access())
  WITH CHECK (auth.uid() = user_id AND public.has_paid_access());

REVOKE ALL ON public.profiles, public.accounts, public.categories,
  public.recurring_transactions, public.transactions, public.subscriptions FROM anon;
REVOKE ALL ON public.subscriptions FROM authenticated;
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;