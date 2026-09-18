CREATE OR REPLACE FUNCTION public.process_paddle_subscription_event(
  _external_event_id text,
  _event_type text,
  _provider_created_at timestamptz,
  _payload jsonb,
  _payload_hash text,
  _environment text,
  _user_id uuid,
  _external_subscription_id text,
  _external_customer_id text,
  _product_id text,
  _price_id text,
  _plan text,
  _status text,
  _current_period_start timestamptz,
  _current_period_end timestamptz,
  _cancel_at_period_end boolean
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _event_row_id uuid;
BEGIN
  INSERT INTO public.billing_webhook_events (
    provider, external_event_id, event_type, external_subscription_id,
    provider_created_at, payload, payload_hash, processing_status
  ) VALUES (
    'paddle', _external_event_id, _event_type, _external_subscription_id,
    _provider_created_at, _payload, _payload_hash, 'received'
  )
  ON CONFLICT (provider, payload_hash)
  DO UPDATE SET attempt_count = public.billing_webhook_events.attempt_count + 1
  RETURNING id INTO _event_row_id;

  IF EXISTS (
    SELECT 1 FROM public.billing_webhook_events
    WHERE id = _event_row_id AND processing_status = 'processed'
  ) THEN
    RETURN 'duplicate';
  END IF;

  IF _event_type = 'subscription.created' THEN
    IF _user_id IS NULL OR _external_subscription_id IS NULL OR _external_customer_id IS NULL
       OR _product_id <> 'fluxo_app'
       OR _price_id NOT IN ('fluxo_app_monthly', 'fluxo_app_yearly')
       OR _plan NOT IN ('monthly', 'yearly') THEN
      UPDATE public.billing_webhook_events
      SET processing_status = 'failed', processed_at = now(), error_code = 'invalid_subscription_link'
      WHERE id = _event_row_id;
      RETURN 'invalid_subscription_link';
    END IF;

    INSERT INTO public.subscriptions (
      user_id, provider, plan, status, access_until, cancel_at_period_end,
      current_period_start, current_period_end, external_subscription_id,
      external_customer_id, paddle_subscription_id, paddle_customer_id,
      product_id, price_id, environment, last_event_at, started_at
    ) VALUES (
      _user_id, 'paddle', _plan, _status, _current_period_end,
      COALESCE(_cancel_at_period_end, false), _current_period_start, _current_period_end,
      _external_subscription_id, _external_customer_id, _external_subscription_id,
      _external_customer_id, _product_id, _price_id, _environment,
      _provider_created_at, COALESCE(_current_period_start, now())
    )
    ON CONFLICT (user_id) DO UPDATE SET
      provider = EXCLUDED.provider,
      plan = EXCLUDED.plan,
      status = EXCLUDED.status,
      access_until = EXCLUDED.access_until,
      cancel_at_period_end = EXCLUDED.cancel_at_period_end,
      current_period_start = EXCLUDED.current_period_start,
      current_period_end = EXCLUDED.current_period_end,
      external_subscription_id = EXCLUDED.external_subscription_id,
      external_customer_id = EXCLUDED.external_customer_id,
      paddle_subscription_id = EXCLUDED.paddle_subscription_id,
      paddle_customer_id = EXCLUDED.paddle_customer_id,
      product_id = EXCLUDED.product_id,
      price_id = EXCLUDED.price_id,
      environment = EXCLUDED.environment,
      last_event_at = EXCLUDED.last_event_at,
      updated_at = now()
    WHERE public.subscriptions.last_event_at IS NULL
       OR public.subscriptions.last_event_at <= EXCLUDED.last_event_at;
  ELSIF _event_type IN ('subscription.updated', 'subscription.canceled') THEN
    UPDATE public.subscriptions
    SET status = _status,
        access_until = _current_period_end,
        cancel_at_period_end = COALESCE(_cancel_at_period_end, false),
        current_period_start = _current_period_start,
        current_period_end = _current_period_end,
        last_event_at = _provider_created_at,
        updated_at = now()
    WHERE paddle_subscription_id = _external_subscription_id
      AND environment = _environment
      AND (last_event_at IS NULL OR last_event_at <= _provider_created_at);
  END IF;

  UPDATE public.billing_webhook_events
  SET processing_status = 'processed', processed_at = now(), error_code = NULL
  WHERE id = _event_row_id;
  RETURN 'processed';
EXCEPTION WHEN OTHERS THEN
  IF _event_row_id IS NOT NULL THEN
    UPDATE public.billing_webhook_events
    SET processing_status = 'failed', processed_at = now(), error_code = SQLSTATE
    WHERE id = _event_row_id;
  END IF;
  RAISE;
END;
$$;

REVOKE ALL ON FUNCTION public.process_paddle_subscription_event(text, text, timestamptz, jsonb, text, text, uuid, text, text, text, text, text, text, timestamptz, timestamptz, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_paddle_subscription_event(text, text, timestamptz, jsonb, text, text, uuid, text, text, text, text, text, text, timestamptz, timestamptz, boolean) TO service_role;