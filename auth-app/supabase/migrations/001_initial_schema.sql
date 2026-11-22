-- ============================================================
-- MIGRATION 001: Full Schema for SkillFlow Quiz Platform
-- Supabase SQL Editor mein ya supabase CLI se run karo
-- ============================================================


-- ============================================================
-- STEP 1: profiles table mein naye columns add karo
-- (table already exist karti hai: id, role, name, phone, email, created_at)
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS total_score  integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS has_seen_welcome boolean NOT NULL DEFAULT false;


-- ============================================================
-- STEP 2: quizzes table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.quizzes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  is_active   boolean NOT NULL DEFAULT false,
  created_by  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);


-- ============================================================
-- STEP 3: questions table
-- options jsonb = ["Option A", "Option B", "Option C", "Option D"]
-- correct_option = 0-indexed (0,1,2,3)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.questions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id         uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_text   text NOT NULL,
  options         jsonb NOT NULL,  -- ["A","B","C","D"]
  correct_option  integer NOT NULL CHECK (correct_option BETWEEN 0 AND 3),
  created_at      timestamptz NOT NULL DEFAULT now()
);


-- ============================================================
-- STEP 4: attempts table + trigger to update total_score
-- ============================================================

CREATE TABLE IF NOT EXISTS public.attempts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quiz_id     uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  score       integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Trigger function: attempt insert hote hi profiles.total_score mein add karo
CREATE OR REPLACE FUNCTION public.increment_total_score()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET total_score = total_score + NEW.score
  WHERE id = NEW.student_id;
  RETURN NEW;
END;
$$;

-- Trigger attach karo (drop first to avoid duplicate)
DROP TRIGGER IF EXISTS trg_increment_total_score ON public.attempts;

CREATE TRIGGER trg_increment_total_score
  AFTER INSERT ON public.attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_total_score();


-- ============================================================
-- STEP 5: community_messages table
-- sender_id MUST be admin (enforced via RLS)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.community_messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message     text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);


-- ============================================================
-- STEP 6: Row Level Security (RLS) Policies
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;


-- ----------------------------------------------------------
-- profiles RLS
-- ----------------------------------------------------------

-- Drop old policies agar exist karti hain (re-runnable migration ke liye)
DROP POLICY IF EXISTS "profiles_self_read"        ON public.profiles;
DROP POLICY IF EXISTS "profiles_self_update"       ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_read_all"    ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_update_all"  ON public.profiles;

-- Student: apni row read kar sake
CREATE POLICY "profiles_self_read"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Student: apni row update kar sake BUT role column nahi (role khud se change nahi kar sakta)
CREATE POLICY "profiles_self_update"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    -- role column ka naya value wahi hona chahiye jo pehle tha (sirf admin role change kar sakta hai)
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
  );

-- Admin: sabki rows read kar sake
CREATE POLICY "profiles_admin_read_all"
  ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admin: sabki rows update kar sake (role change bhi)
CREATE POLICY "profiles_admin_update_all"
  ON public.profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );


-- ----------------------------------------------------------
-- quizzes RLS
-- ----------------------------------------------------------

DROP POLICY IF EXISTS "quizzes_admin_all"       ON public.quizzes;
DROP POLICY IF EXISTS "quizzes_student_active"  ON public.quizzes;

-- Admin: full CRUD
CREATE POLICY "quizzes_admin_all"
  ON public.quizzes
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Student: sirf active quizzes read kar sake
CREATE POLICY "quizzes_student_active"
  ON public.quizzes
  FOR SELECT
  USING (is_active = true);


-- ----------------------------------------------------------
-- questions RLS
-- ----------------------------------------------------------

DROP POLICY IF EXISTS "questions_admin_all"      ON public.questions;
DROP POLICY IF EXISTS "questions_student_active" ON public.questions;

-- Admin: full CRUD
CREATE POLICY "questions_admin_all"
  ON public.questions
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Student: sirf active quiz ke questions read kar sake
CREATE POLICY "questions_student_active"
  ON public.questions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quizzes
      WHERE quizzes.id = questions.quiz_id AND quizzes.is_active = true
    )
  );


-- ----------------------------------------------------------
-- attempts RLS
-- ----------------------------------------------------------

DROP POLICY IF EXISTS "attempts_student_insert" ON public.attempts;
DROP POLICY IF EXISTS "attempts_student_read"   ON public.attempts;
DROP POLICY IF EXISTS "attempts_admin_read_all" ON public.attempts;

-- Student: apna attempt insert kar sake
CREATE POLICY "attempts_student_insert"
  ON public.attempts
  FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- Student: apne attempts read kar sake
CREATE POLICY "attempts_student_read"
  ON public.attempts
  FOR SELECT
  USING (auth.uid() = student_id);

-- Admin: sabke attempts read kar sake
CREATE POLICY "attempts_admin_read_all"
  ON public.attempts
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- ----------------------------------------------------------
-- community_messages RLS
-- ----------------------------------------------------------

DROP POLICY IF EXISTS "community_admin_insert" ON public.community_messages;
DROP POLICY IF EXISTS "community_all_read"     ON public.community_messages;

-- Sirf admin insert kar sake
CREATE POLICY "community_admin_insert"
  ON public.community_messages
  FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    AND sender_id = auth.uid()
  );

-- Sab (authenticated users) read kar sake
CREATE POLICY "community_all_read"
  ON public.community_messages
  FOR SELECT
  USING (auth.role() = 'authenticated');


-- ============================================================
-- STEP 7: Leaderboard helper function (optional - DB side)
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_leaderboard(requesting_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  top3     jsonb;
  my_rank  bigint;
  my_score integer;
BEGIN
  -- Top 3
  SELECT jsonb_agg(row_to_json(t))
  INTO top3
  FROM (
    SELECT id, name, total_score
    FROM public.profiles
    ORDER BY total_score DESC
    LIMIT 3
  ) t;

  -- Current user ka rank
  SELECT rank_num, total_score
  INTO my_rank, my_score
  FROM (
    SELECT id, total_score,
           RANK() OVER (ORDER BY total_score DESC) AS rank_num
    FROM public.profiles
  ) ranked
  WHERE id = requesting_user_id;

  RETURN jsonb_build_object(
    'top3',    COALESCE(top3, '[]'::jsonb),
    'my_rank', my_rank,
    'my_score', my_score
  );
END;
$$;
