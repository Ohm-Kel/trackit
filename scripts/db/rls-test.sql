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

\echo 'RLS checks passed'
