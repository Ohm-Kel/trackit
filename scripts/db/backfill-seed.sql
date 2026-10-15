-- Run between supabase_migrations.sql and migration 002: tasks that existed
-- before the upgrade, with known last-edit times.
INSERT INTO auth.users (id, email) VALUES ('cccccccc-0000-4000-8000-000000000003', 'old@example.com');
INSERT INTO public.tasks (id, user_id, title, status, updated_at) VALUES
  ('cccccccc-1111-4000-8000-000000000001', 'cccccccc-0000-4000-8000-000000000003', 'Old done task', 'done', '2026-01-15 10:00:00+00'),
  ('cccccccc-1111-4000-8000-000000000002', 'cccccccc-0000-4000-8000-000000000003', 'Old open task', 'not_started', '2026-02-01 10:00:00+00');
