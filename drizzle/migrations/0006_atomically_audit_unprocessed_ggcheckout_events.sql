CREATE OR REPLACE FUNCTION public.register_ignored_billing_webhook_event(
  _event_type text,
  _external_payment_id text,
  _provider_created_at timestamptz,
  _payload jsonb,
  _payload_hash text,
  _error_code text
)
RETURNS TABLE(event_id uuid, is_new boolean, attempts integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  INSERT INTO public.billing_webhook_events (
    provider,
    external_event_id,
    event_type,
    external_payment_id,
    external_subscription_id,
    provider_created_at,
    payload,
    payload_hash,
    processing_status,
    processed_at,
    error_code
  ) VALUES (
    'ggcheckout',
    NULL,
    _event_type,
    NULLIF(_external_payment_id, ''),
    NULL,
    _provider_created_at,
    _payload,
    _payload_hash,
    'ignored',
    now(),
    _error_code
  )
  ON CONFLICT (provider, payload_hash)
  DO UPDATE SET attempt_count = public.billing_webhook_events.attempt_count + 1
  RETURNING
    public.billing_webhook_events.id,
    (xmax = 0),
    public.billing_webhook_events.attempt_count;
END;
$$;

REVOKE ALL ON FUNCTION public.register_ignored_billing_webhook_event(text, text, timestamptz, jsonb, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_ignored_billing_webhook_event(text, text, timestamptz, jsonb, text, text)
  TO service_role;