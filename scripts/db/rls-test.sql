-- Row Level Security checks for the operations the API performs as a signed-in
-- user, plus the columns the API relies on. Run by scripts/db/test.sh after the schema and migrations.
\set ON_ERROR_STOP 1
\set alice '''aaaaaaaa-0000-4000-8000-000000000001'''
\set bob   '''bbbbbbbb-0000-4000-8000-000000000002'''

-- Seed as the database owner. The sign-up trigger creates public.users rows.
INSERT INTO auth.users (id, email) VALUES (:alice, 'alice@example.com'), (:bob, 'bob@example.com');
INSERT INTO public.tasks (id, user_id, title) VALUES
  ('aaaaaaaa-1111-4000-8000-000000000001', :alice, 'Alice essay'),
  ('bbbbbbbb-1111-4000-8000-000000000002', :bob, 'Bob essay');
INSERT INTO public.exams (id, user_id, subject) VALUES
  ('bbbbbbbb-2222-4000-8000-000000000002', :bob, 'Bob exam');

-- Act as Alice, the way PostgREST does for a request carrying her JWT.
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', :alice, true);

DO $$
BEGIN
  ASSERT (SELECT count(*) FROM public.users) = 1, 'Alice sees only her own profile';
  ASSERT (SELECT count(*) FROM public.tasks) = 1, 'Alice sees only her own tasks';
  ASSERT (SELECT count(*) FROM public.exams) = 0, 'Alice cannot see Bob''s exams';

  -- Writes the API makes on her behalf succeed.
  INSERT INTO public.tasks (user_id, title) VALUES (auth.uid(), 'New task');
  INSERT INTO public.exams (user_id, subject) VALUES (auth.uid(), 'New exam');
  INSERT INTO public.subtasks (user_id, task_id, title)
    VALUES (auth.uid(), 'aaaaaaaa-1111-4000-8000-000000000001', 'Outline');
  INSERT INTO public.chat_history (user_id, role, content) VALUES (auth.uid(), 'user', 'hi');
  INSERT INTO public.notifications (user_id, type, message) VALUES (auth.uid(), 'info', 'Due soon');
  UPDATE public.notifications SET read_status = true WHERE user_id = auth.uid();
  INSERT INTO public.users (id, email, display_name) VALUES (auth.uid(), 'alice@example.com', 'Alice')
    ON CONFLICT (id) DO UPDATE SET display_name = EXCLUDED.display_name;
  ASSERT (SELECT display_name FROM public.users) = 'Alice', 'Alice can update her profile';

  -- Every column list the API selects exists (a missing column fails here).
  PERFORM title, status, due_date, grade_weight, estimated_hours, course_code, description,
          completed_at, priority_score, ai_reasoning
    FROM public.tasks;
  PERFORM subject, exam_date, confidence_level, topics, course_code, daily_study_hours,
          preparation_percent
    FROM public.exams;
  PERFORM role, content, created_at FROM public.chat_history;
  PERFORM weekly_schedule FROM public.users;

  -- completed_at follows the status.
  UPDATE public.tasks SET status = 'done' WHERE title = 'New task';
  ASSERT (SELECT completed_at FROM public.tasks WHERE title = 'New task') IS NOT NULL,
    'completed_at is set when a task is done';
  UPDATE public.tasks SET status = 'in_progress' WHERE title = 'New task';
  ASSERT (SELECT completed_at FROM public.tasks WHERE title = 'New task') IS NULL,
    'completed_at is cleared when a task is reopened';

  -- Updates and deletes on Bob's rows match nothing.
  UPDATE public.tasks SET title = 'hijacked' WHERE id = 'bbbbbbbb-1111-4000-8000-000000000002';
  DELETE FROM public.tasks WHERE id = 'bbbbbbbb-1111-4000-8000-000000000002';
END $$;

-- Each of these must be rejected by RLS.
DO $$
DECLARE
  attempt TEXT;
  attempts TEXT[] := ARRAY[
    $q$INSERT INTO public.tasks (user_id, title) VALUES ('bbbbbbbb-0000-4000-8000-000000000002', 'x')$q$,
    $q$INSERT INTO public.notifications (user_id, type, message) VALUES ('bbbbbbbb-0000-4000-8000-000000000002', 'info', 'x')$q$,
    $q$INSERT INTO public.chat_history (user_id, role, content) VALUES ('bbbbbbbb-0000-4000-8000-000000000002', 'user', 'x')$q$,
    -- Her own subtask, attached to Bob's task or exam.
    $q$INSERT INTO public.subtasks (user_id, task_id, title) VALUES (auth.uid(), 'bbbbbbbb-1111-4000-8000-000000000002', 'x')$q$,
    $q$INSERT INTO public.subtasks (user_id, exam_id, title) VALUES (auth.uid(), 'bbbbbbbb-2222-4000-8000-000000000002', 'x')$q$,
    $q$UPDATE public.subtasks SET task_id = 'bbbbbbbb-1111-4000-8000-000000000002' WHERE user_id = auth.uid()$q$,
    $q$SELECT * FROM public.rate_limit_hit('chat:x', 1000)$q$,
    $q$SELECT * FROM public.rate_limits$q$
  ];
BEGIN
  FOREACH attempt IN ARRAY attempts LOOP
    BEGIN
      EXECUTE attempt;
      RAISE EXCEPTION 'Expected RLS to reject: %', attempt;
    EXCEPTION WHEN insufficient_privilege THEN
      NULL;
    END;
  END LOOP;
END $$;
COMMIT;

-- Bob's data is untouched.
DO $$
BEGIN
  ASSERT (SELECT title FROM public.tasks WHERE id = 'bbbbbbbb-1111-4000-8000-000000000002') = 'Bob essay',
    'Bob''s task was modified';
  ASSERT (SELECT count(*) FROM public.subtasks) = 1, 'Only Alice''s valid subtask exists';
END $$;

-- Calendar feed (migration 003). Seed as the owner: Bob has a feed, and both
-- users have dated tasks and exams.
INSERT INTO public.calendar_feeds (user_id, token_hash)
  VALUES (:bob, encode(sha256('bob-token'::bytea), 'hex'));
INSERT INTO public.tasks (user_id, title, status, due_date) VALUES
  (:alice, 'Alice open; task, with \ text', 'in_progress', '2026-11-02'),
  (:alice, 'Alice done task', 'done', '2026-11-03'),
  (:bob, 'Bob dated task', 'not_started', '2026-11-04');
INSERT INTO public.exams (user_id, subject, exam_date) VALUES
  (:alice, 'Alice exam', '2026-12-01 09:00:00+00');

-- Alice manages only her own feed row.
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', :alice, true);
DO $$
BEGIN
  ASSERT (SELECT count(*) FROM public.calendar_feeds) = 0, 'Alice cannot see Bob''s feed';
  INSERT INTO public.calendar_feeds (user_id, token_hash)
    VALUES (auth.uid(), encode(sha256('alice-old'::bytea), 'hex'));
  -- Rotating is an upsert, the way the API does it.
  INSERT INTO public.calendar_feeds (user_id, token_hash)
    VALUES (auth.uid(), encode(sha256('alice-token'::bytea), 'hex'))
    ON CONFLICT (user_id) DO UPDATE SET token_hash = EXCLUDED.token_hash, created_at = now();
  ASSERT (SELECT count(*) FROM public.calendar_feeds) = 1, 'Alice has one feed';
  -- Bob's row matches nothing.
  UPDATE public.calendar_feeds SET token_hash = repeat('0', 64)
    WHERE user_id = 'bbbbbbbb-0000-4000-8000-000000000002';
  DELETE FROM public.calendar_feeds WHERE user_id = 'bbbbbbbb-0000-4000-8000-000000000002';
END $$;

DO $$
DECLARE
  attempt TEXT;
  attempts TEXT[] := ARRAY[
    $q$INSERT INTO public.calendar_feeds (user_id, token_hash) VALUES ('bbbbbbbb-0000-4000-8000-000000000002', repeat('1', 64))$q$,
    $q$UPDATE public.calendar_feeds SET user_id = 'bbbbbbbb-0000-4000-8000-000000000002'$q$,
    -- Signed-in users have no reason to call the feed lookup.
    $q$SELECT public.calendar_feed('bob-token')$q$
  ];
BEGIN
  FOREACH attempt IN ARRAY attempts LOOP
    BEGIN
      EXECUTE attempt;
      RAISE EXCEPTION 'Expected RLS to reject: %', attempt;
    EXCEPTION WHEN insufficient_privilege THEN
      NULL;
    END;
  END LOOP;
END $$;
COMMIT;

-- Without a session (the feed request), only the lookup function works.
BEGIN;
SET LOCAL ROLE anon;
DO $$
DECLARE
  feed JSONB := public.calendar_feed('alice-token');
BEGIN
  ASSERT jsonb_array_length(feed->'tasks') = 1, 'The feed has Alice''s one open, dated task';
  ASSERT feed->'tasks'->0->>'title' = 'Alice open; task, with \ text', 'The task title is returned as stored';
  ASSERT jsonb_array_length(feed->'exams') = 1, 'The feed has Alice''s dated exam';
  ASSERT feed->'exams'->0->>'subject' = 'Alice exam', 'The exam is Alice''s';
  ASSERT public.calendar_feed('alice-old') IS NULL, 'A rotated token no longer works';
  ASSERT public.calendar_feed('nope') IS NULL, 'An unknown token returns nothing';
  ASSERT public.calendar_feed(encode(sha256('alice-token'::bytea), 'hex')) IS NULL,
    'The stored hash is not itself a valid token';
  BEGIN
    PERFORM * FROM public.calendar_feeds;
    RAISE EXCEPTION 'Expected anon to be refused calendar_feeds';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;
END $$;
COMMIT;

-- Revoking deletes the row; the old link stops working.
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', :alice, true);
DELETE FROM public.calendar_feeds WHERE user_id = auth.uid();
COMMIT;
DO $$
BEGIN
  ASSERT public.calendar_feed('alice-token') IS NULL, 'A revoked token no longer works';
  ASSERT public.calendar_feed('bob-token') IS NOT NULL, 'Bob''s feed is untouched';
END $$;

\echo 'RLS checks passed'
