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

-- 2. Row Level Security gaps
-- From v1.2.0 the API queries as the signed-in user, so RLS must allow every
-- operation the API performs and nothing more.

-- The API creates workload suggestions for the signed-in user.
DROP POLICY IF EXISTS "Users can insert their own notifications" ON public.notifications;
CREATE POLICY "Users can insert their own notifications" ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- The subtask policies only check the subtask's own user_id, so a user could
-- attach a subtask to someone else's task or exam by id. A restrictive policy
-- is ANDed with the existing permissive ones.
DROP POLICY IF EXISTS "Subtask parent must belong to the user" ON public.subtasks;
CREATE POLICY "Subtask parent must belong to the user" ON public.subtasks
  AS RESTRICTIVE FOR ALL
  USING (true)
  WITH CHECK (
    (subtasks.task_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.tasks t WHERE t.id = subtasks.task_id AND t.user_id = auth.uid()))
    OR
    (subtasks.exam_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.exams e WHERE e.id = subtasks.exam_id AND e.user_id = auth.uid()))
  );

-- 3. Task completion time
-- The analytics velocity endpoint counts tasks by when they were completed,
-- but the column did not exist, so the endpoint always failed.
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Best available estimate for tasks already done.
UPDATE public.tasks SET completed_at = updated_at
WHERE status = 'done' AND completed_at IS NULL;

-- Stamp the time a task becomes done; clear it if the task is reopened.
CREATE OR REPLACE FUNCTION public.set_task_completed_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'done' THEN
    IF TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'done' THEN
      NEW.completed_at = now();
    END IF;
  ELSE
    NEW.completed_at = NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_tasks_completed_at ON public.tasks;
CREATE TRIGGER set_tasks_completed_at
  BEFORE INSERT OR UPDATE OF status ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_task_completed_at();
