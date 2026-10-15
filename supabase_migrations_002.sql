-- ============================================================
-- Trackit — Migration 002 (v1.2.0)
-- Run after supabase_schema.sql and supabase_migrations.sql.
-- Safe to re-run.
-- ============================================================

-- 1. Shared rate-limit counters
-- Serverless instances do not share memory, so per-user AI limits are counted
-- here instead. One row per (limiter, user); a row is reused when its window
-- expires, so the table stays at most two rows per user.
CREATE TABLE IF NOT EXISTS public.rate_limits (
  key      TEXT PRIMARY KEY,
  hits     INTEGER NOT NULL,
  reset_at TIMESTAMPTZ NOT NULL
);

-- RLS with no policies: only the service role (which bypasses RLS) can read
-- or write counters.
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.rate_limits FROM anon, authenticated;

-- Count one hit for `p_key` and return the running total and window end.
-- A single upsert, so concurrent requests from different instances cannot
-- lose an increment.
CREATE OR REPLACE FUNCTION public.rate_limit_hit(p_key TEXT, p_window_ms BIGINT)
RETURNS TABLE (total_hits INTEGER, resets_at TIMESTAMPTZ)
LANGUAGE sql
SET search_path = public
AS $$
  INSERT INTO public.rate_limits AS rl (key, hits, reset_at)
  VALUES (p_key, 1, now() + p_window_ms * INTERVAL '1 millisecond')
  ON CONFLICT (key) DO UPDATE SET
    hits     = CASE WHEN rl.reset_at <= now() THEN 1 ELSE rl.hits + 1 END,
    reset_at = CASE WHEN rl.reset_at <= now() THEN EXCLUDED.reset_at ELSE rl.reset_at END
  RETURNING rl.hits, rl.reset_at;
$$;

-- Undo one hit (used when a limiter is configured to skip some requests).
CREATE OR REPLACE FUNCTION public.rate_limit_decrement(p_key TEXT)
RETURNS VOID
LANGUAGE sql
SET search_path = public
AS $$
  UPDATE public.rate_limits SET hits = GREATEST(hits - 1, 0)
  WHERE key = p_key AND reset_at > now();
$$;

REVOKE EXECUTE ON FUNCTION public.rate_limit_hit(TEXT, BIGINT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rate_limit_decrement(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rate_limit_hit(TEXT, BIGINT) TO service_role;
GRANT EXECUTE ON FUNCTION public.rate_limit_decrement(TEXT) TO service_role;
GRANT ALL ON public.rate_limits TO service_role;
