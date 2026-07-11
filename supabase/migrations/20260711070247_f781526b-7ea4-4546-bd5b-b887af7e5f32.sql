
-- Explicit deny policies (documented intent — the function alone was enough,
-- but a policy makes it clear to auditors that access is deliberately blocked).
CREATE POLICY "rate_limits blocked from clients (select)"
  ON public.rate_limits FOR SELECT
  USING (false);

CREATE POLICY "rate_limits blocked from clients (write)"
  ON public.rate_limits FOR ALL
  USING (false) WITH CHECK (false);

-- Belt-and-braces: strip execute from anon and authenticated on the
-- SECURITY DEFINER function. Only the service role (edge functions) may call it.
REVOKE EXECUTE ON FUNCTION public.check_rate_limit(UUID, TEXT, INTEGER) FROM anon, authenticated;
