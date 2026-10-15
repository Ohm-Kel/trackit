-- ============================================================
-- Trackit — Roll back migration 002
-- Only needed if v1.2.0 is rolled back. Run the v1.1.0 API first: v1.2.0
-- relies on everything below. Safe to re-run. Rate-limit counters and
-- task completion times are discarded.
-- ============================================================

DROP TRIGGER IF EXISTS set_tasks_completed_at ON public.tasks;
DROP FUNCTION IF EXISTS public.set_task_completed_at();
ALTER TABLE public.tasks DROP COLUMN IF EXISTS completed_at;

DROP POLICY IF EXISTS "Subtask parent must belong to the user" ON public.subtasks;
DROP POLICY IF EXISTS "Users can insert their own notifications" ON public.notifications;

DROP FUNCTION IF EXISTS public.rate_limit_decrement(TEXT);
DROP FUNCTION IF EXISTS public.rate_limit_hit(TEXT, BIGINT);
DROP TABLE IF EXISTS public.rate_limits;
