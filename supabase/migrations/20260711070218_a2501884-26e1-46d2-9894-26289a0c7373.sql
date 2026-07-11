
-- Rate-limit bookkeeping (used only by edge functions via service role).
CREATE TABLE IF NOT EXISTS public.rate_limits (
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, endpoint, window_start)
);

-- No end-user access. Service role only.
GRANT ALL ON public.rate_limits TO service_role;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Explicit deny-by-default: no policies for authenticated/anon means no access.
-- (RLS with zero policies = no rows readable/writable via the Data API.)

-- Increment-and-check function. Buckets are per-minute; caller supplies the max.
-- SECURITY DEFINER so it can maintain state without granting table access.
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  _user_id UUID,
  _endpoint TEXT,
  _max INTEGER
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _bucket TIMESTAMPTZ := date_trunc('minute', now());
  _count INTEGER;
BEGIN
  INSERT INTO public.rate_limits (user_id, endpoint, window_start, count)
  VALUES (_user_id, _endpoint, _bucket, 1)
  ON CONFLICT (user_id, endpoint, window_start)
    DO UPDATE SET count = public.rate_limits.count + 1
  RETURNING count INTO _count;

  -- Best-effort cleanup of old buckets (keep last hour)
  DELETE FROM public.rate_limits WHERE window_start < now() - interval '1 hour';

  RETURN _count <= _max;
END;
$$;

REVOKE ALL ON FUNCTION public.check_rate_limit(UUID, TEXT, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(UUID, TEXT, INTEGER) TO service_role;
