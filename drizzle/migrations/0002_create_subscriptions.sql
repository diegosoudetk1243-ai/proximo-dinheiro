CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  plan text NOT NULL DEFAULT 'monthly',
  status text NOT NULL DEFAULT 'past_due',
  gateway_subscription_id text,
  gateway_customer_id text,
  started_at timestamptz NOT NULL DEFAULT now(),
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT subscriptions_plan_check CHECK (plan IN ('monthly','yearly')),
  CONSTRAINT subscriptions_status_check CHECK (status IN ('active','canceled','past_due'))
);

GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own subscription select" ON public.subscriptions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX subscriptions_gateway_subscription_id_idx
  ON public.subscriptions (gateway_subscription_id);

CREATE TRIGGER subscriptions_updated
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
