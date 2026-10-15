-- Trackit Database Schema for Supabase
-- Run this script in the Supabase SQL Editor

-- 1. Create a users table that links to Supabase Auth
CREATE TABLE public.users (
  id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  university TEXT,
  course TEXT,
  year TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Turn on Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow users to manage their own profiles
CREATE POLICY "Users can view own profile"   ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- Trigger to automatically create a user profile when they sign up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, avatar_url)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 2. Create the tasks table
--    Note: status values use snake_case to match the application layer.
CREATE TABLE public.tasks (
  id               UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID    REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title            TEXT    NOT NULL,
  description      TEXT,
  due_date         TIMESTAMP WITH TIME ZONE,
  estimated_hours  NUMERIC,
  grade_weight     NUMERIC,
  course_code      TEXT,                         -- was course_name in v1; renamed to match API
  status           TEXT    DEFAULT 'not_started'
                   CHECK (status IN ('not_started', 'in_progress', 'stuck', 'done')),
  priority_score   NUMERIC,
  ai_reasoning     TEXT,
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at       TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can fully manage their own tasks"
  ON public.tasks FOR ALL USING (auth.uid() = user_id);

-- 3. Create the exams table
CREATE TABLE public.exams (
  id                   UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id              UUID    REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  subject              TEXT    NOT NULL,
  course_code          TEXT,
  exam_date            TIMESTAMP WITH TIME ZONE,
  confidence_level     TEXT    DEFAULT 'medium'
                       CHECK (confidence_level IN ('low', 'medium', 'high')),
  daily_study_hours    NUMERIC,
  preparation_percent  NUMERIC DEFAULT 0 CHECK (preparation_percent >= 0 AND preparation_percent <= 100),
  topics               TEXT[],
  created_at           TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at           TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can fully manage their own exams"
  ON public.exams FOR ALL USING (auth.uid() = user_id);

-- 4. Create the subtasks table
CREATE TABLE public.subtasks (
  id            UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID    REFERENCES public.users(id)  ON DELETE CASCADE NOT NULL,
  task_id       UUID    REFERENCES public.tasks(id)  ON DELETE CASCADE,
  exam_id       UUID    REFERENCES public.exams(id)  ON DELETE CASCADE,
  title         TEXT    NOT NULL,
  estimated_hours NUMERIC,
  status        TEXT    DEFAULT 'not_started'
                CHECK (status IN ('not_started', 'done')),
  order_index   INTEGER DEFAULT 0,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Ensure subtask belongs to either a task or an exam, but not both or neither
  CONSTRAINT check_parent_id CHECK (
    (task_id IS NOT NULL AND exam_id IS NULL) OR
    (task_id IS NULL AND exam_id IS NOT NULL)
  )
);

ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can fully manage their own subtasks"
  ON public.subtasks FOR ALL USING (auth.uid() = user_id);

-- 5. Create the chat_history table
CREATE TABLE public.chat_history (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  role       TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content    TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can fully manage their own chat history"
  ON public.chat_history FOR ALL USING (auth.uid() = user_id);

-- Functions to automatically update the 'updated_at' timestamp
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE PROCEDURE set_current_timestamp_updated_at();

CREATE TRIGGER set_exams_updated_at
  BEFORE UPDATE ON public.exams
  FOR EACH ROW EXECUTE PROCEDURE set_current_timestamp_updated_at();
-- Notifications Table
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'ai_suggestion')),
    message TEXT NOT NULL,
    read_status BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications" ON public.notifications
    FOR DELETE USING (auth.uid() = user_id);
