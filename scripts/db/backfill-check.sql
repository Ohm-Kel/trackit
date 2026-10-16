-- After migration 002: done tasks get completed_at from their last edit, and
-- the backfill leaves updated_at untouched.
\set ON_ERROR_STOP 1
DO $$
BEGIN
  ASSERT (SELECT completed_at FROM public.tasks WHERE title = 'Old done task') = '2026-01-15 10:00:00+00',
    'completed_at is backfilled from updated_at';
  ASSERT (SELECT updated_at FROM public.tasks WHERE title = 'Old done task') = '2026-01-15 10:00:00+00',
    'the backfill does not change updated_at';
  ASSERT (SELECT completed_at FROM public.tasks WHERE title = 'Old open task') IS NULL,
    'open tasks have no completed_at';
  -- The updated_at trigger is active again afterwards.
  UPDATE public.tasks SET title = 'Old open task (edited)' WHERE title = 'Old open task';
  ASSERT (SELECT updated_at FROM public.tasks WHERE title = 'Old open task (edited)') > '2026-02-01 10:00:00+00',
    'the updated_at trigger is re-enabled';
  DELETE FROM public.tasks WHERE user_id = 'cccccccc-0000-4000-8000-000000000003';
  DELETE FROM auth.users WHERE id = 'cccccccc-0000-4000-8000-000000000003';
END $$;
\echo 'Backfill checks passed'
