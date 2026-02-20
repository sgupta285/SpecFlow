
-- Projects table
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  repo_url text NOT NULL,
  repo_branch text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects" ON public.projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projects" ON public.projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects" ON public.projects FOR DELETE USING (auth.uid() = user_id);

-- Feedback table
CREATE TABLE public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  source text NOT NULL DEFAULT 'paste',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Security definer function to check project ownership
CREATE OR REPLACE FUNCTION public.user_owns_project(p_project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects WHERE id = p_project_id AND user_id = auth.uid()
  );
$$;

CREATE POLICY "Users can view own feedback" ON public.feedback FOR SELECT USING (public.user_owns_project(project_id));
CREATE POLICY "Users can insert own feedback" ON public.feedback FOR INSERT WITH CHECK (public.user_owns_project(project_id));
CREATE POLICY "Users can update own feedback" ON public.feedback FOR UPDATE USING (public.user_owns_project(project_id));
CREATE POLICY "Users can delete own feedback" ON public.feedback FOR DELETE USING (public.user_owns_project(project_id));

-- Runs table
CREATE TABLE public.runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  feedback_id uuid NOT NULL REFERENCES public.feedback(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'queued',
  result_files jsonb,
  result_spec text,
  cursor_prompt text,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own runs" ON public.runs FOR SELECT USING (public.user_owns_project(project_id));
CREATE POLICY "Users can insert own runs" ON public.runs FOR INSERT WITH CHECK (public.user_owns_project(project_id));
CREATE POLICY "Users can update own runs" ON public.runs FOR UPDATE USING (public.user_owns_project(project_id));
CREATE POLICY "Users can delete own runs" ON public.runs FOR DELETE USING (public.user_owns_project(project_id));
