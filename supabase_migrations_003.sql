-- ============================================================
-- Trackit — Migration 003: calendar subscription feed
-- Run after supabase_migrations_002.sql. Safe to re-run.
-- See docs/adr/0006-calendar-feed.md.
-- ============================================================

-- 1. One feed token per user
-- Calendar apps cannot send an Authorization header, so a subscription is a
-- secret URL. Only the SHA-256 hash of the token is stored: a leaked backup or
-- a policy mistake reveals hashes, which cannot be turned back into a URL.
-- Rotating replaces the row; revoking deletes it.
CREATE TABLE IF NOT EXISTS public.calendar_feeds (
  user_id    UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE CHECK (token_hash ~ '^[0-9a-f]{64}$'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.calendar_feeds ENABLE ROW LEVEL SECURITY;

-- The API creates, rotates (upsert) and revokes the row as the signed-in user.
DROP POLICY IF EXISTS "Users can view own calendar feed" ON public.calendar_feeds;
CREATE POLICY "Users can view own calendar feed" ON public.calendar_feeds
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create own calendar feed" ON public.calendar_feeds;
CREATE POLICY "Users can create own calendar feed" ON public.calendar_feeds
  FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can rotate own calendar feed" ON public.calendar_feeds;
CREATE POLICY "Users can rotate own calendar feed" ON public.calendar_feeds
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can revoke own calendar feed" ON public.calendar_feeds;
CREATE POLICY "Users can revoke own calendar feed" ON public.calendar_feeds
  FOR DELETE USING (auth.uid() = user_id);

REVOKE ALL ON public.calendar_feeds FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.calendar_feeds TO authenticated;
GRANT ALL ON public.calendar_feeds TO service_role;

-- 2. Feed lookup
-- The feed request carries no user session, so RLS cannot select the user's
-- rows. This function is the one narrow exception: given the raw token, it
-- hashes it, finds the owner, and returns only the fields the feed shows
-- (open tasks with a due date, and exams with a date). An unknown token
-- returns NULL. It runs as its owner, so it needs no service-role key.
CREATE OR REPLACE FUNCTION public.calendar_feed(p_token TEXT)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  WITH feed AS (
    SELECT f.user_id
    FROM public.calendar_feeds f
    WHERE f.token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex')
  )
  SELECT jsonb_build_object(
    'tasks', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', t.id, 'title', t.title, 'description', t.description,
        'due_date', t.due_date, 'course_code', t.course_code, 'status', t.status,
        'grade_weight', t.grade_weight, 'updated_at', t.updated_at
      ) ORDER BY t.due_date)
      FROM public.tasks t
      WHERE t.user_id = feed.user_id AND t.status <> 'done' AND t.due_date IS NOT NULL
    ), '[]'::jsonb),
    'exams', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', e.id, 'subject', e.subject, 'course_code', e.course_code,
        'exam_date', e.exam_date, 'topics', e.topics, 'updated_at', e.updated_at
      ) ORDER BY e.exam_date)
      FROM public.exams e
      WHERE e.user_id = feed.user_id AND e.exam_date IS NOT NULL
    ), '[]'::jsonb)
  )
  FROM feed;
$$;

-- Callable by the API without a user session (anon key), and by the service
-- role as a fallback when no anon key is configured. Signed-in users manage
-- their feed through the table, not this function.
REVOKE EXECUTE ON FUNCTION public.calendar_feed(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.calendar_feed(TEXT) TO anon, service_role;
