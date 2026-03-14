-- ============================================================
-- Trackit — Supabase Migration Script
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. Add weekly_schedule column to users table
-- Stores the parsed class schedule from the Upload page
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS weekly_schedule JSONB DEFAULT NULL;

-- 2. Create subtasks table
CREATE TABLE IF NOT EXISTS public.subtasks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id     UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  exam_id     UUID REFERENCES public.exams(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'done')),
  estimated_hours NUMERIC(5,2),
  order_index INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now(),

  -- Ensure exactly one parent
  CONSTRAINT subtask_has_one_parent CHECK (
    (task_id IS NOT NULL AND exam_id IS NULL) OR
    (task_id IS NULL AND exam_id IS NOT NULL)
  )
);

-- Index for fast lookups by parent
CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON public.subtasks(task_id);
CREATE INDEX IF NOT EXISTS idx_subtasks_exam_id ON public.subtasks(exam_id);
CREATE INDEX IF NOT EXISTS idx_subtasks_user_id ON public.subtasks(user_id);

-- RLS for subtasks
ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subtasks"
  ON public.subtasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subtasks"
  ON public.subtasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subtasks"
  ON public.subtasks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own subtasks"
  ON public.subtasks FOR DELETE
  USING (auth.uid() = user_id);


-- 3. Create chat_history table
CREATE TABLE IF NOT EXISTS public.chat_history (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast user-specific history retrieval
CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON public.chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_created_at ON public.chat_history(created_at);

-- RLS for chat_history
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chat history"
  ON public.chat_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat history"
  ON public.chat_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat history"
  ON public.chat_history FOR DELETE
  USING (auth.uid() = user_id);


-- 4. Grant service role full access (needed for backend operations)
-- The service_role key bypasses RLS, but these grants ensure
-- the tables are accessible.
GRANT ALL ON public.subtasks TO service_role;
GRANT ALL ON public.chat_history TO service_role;

-- Done! All tables and policies are created.
-- You can verify by running: SELECT * FROM information_schema.tables WHERE table_schema = 'public';
