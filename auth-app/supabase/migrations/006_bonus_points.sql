-- ============================================================
-- Migration 006: Manual Bonus Points Table, Score Trigger,
-- Admin RPCs (award_bonus_points, get_all_students_with_scores),
-- and Weekly Leaderboard bonus integration
-- ============================================================

-- Ensure get_my_role() helper exists
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- 1. bonus_points table
CREATE TABLE IF NOT EXISTS public.bonus_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  points integer NOT NULL,
  reason text,
  awarded_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.bonus_points ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_manage_bonus_points" ON public.bonus_points;
CREATE POLICY "admin_manage_bonus_points"
  ON public.bonus_points
  FOR ALL
  USING (public.get_my_role() = 'admin');

DROP POLICY IF EXISTS "student_read_own_bonus" ON public.bonus_points;
CREATE POLICY "student_read_own_bonus"
  ON public.bonus_points
  FOR SELECT
  USING (auth.uid() = student_id);

-- 2. Trigger: automatically add bonus points to profiles.total_score
CREATE OR REPLACE FUNCTION public.increment_score_from_bonus()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET total_score = total_score + NEW.points
  WHERE id = NEW.student_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bonus_points_increment ON public.bonus_points;
CREATE TRIGGER trg_bonus_points_increment
  AFTER INSERT ON public.bonus_points
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_score_from_bonus();

-- 3. Server action RPC: award_bonus_points(student_id, points, reason) - Admin only
CREATE OR REPLACE FUNCTION public.award_bonus_points(
  p_student_id uuid,
  p_points integer,
  p_reason text DEFAULT 'Bonus Points'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id uuid := auth.uid();
  v_is_admin boolean;
  v_new_total integer;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = v_admin_id AND role = 'admin'
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Access denied: only admins can award bonus points';
  END IF;

  IF p_points IS NULL OR p_points <= 0 THEN
    RAISE EXCEPTION 'Points must be greater than 0';
  END IF;

  INSERT INTO public.bonus_points (student_id, points, reason, awarded_by)
  VALUES (p_student_id, p_points, COALESCE(NULLIF(TRIM(p_reason), ''), 'Bonus Points'), v_admin_id);

  SELECT total_score INTO v_new_total
  FROM public.profiles
  WHERE id = p_student_id;

  RETURN jsonb_build_object(
    'success', true,
    'student_id', p_student_id,
    'points_awarded', p_points,
    'new_total_score', COALESCE(v_new_total, 0)
  );
END;
$$;

-- 4. Server action RPC: get_all_students_with_scores() - Admin only
CREATE OR REPLACE FUNCTION public.get_all_students_with_scores()
RETURNS TABLE (
  id uuid,
  name text,
  email text,
  total_score integer,
  bonus_total bigint,
  claimed_reasons text[]
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    COALESCE(NULLIF(TRIM(p.name), ''), split_part(p.email, '@', 1), 'Student') AS name,
    p.email,
    p.total_score,
    COALESCE(SUM(bp.points), 0)::bigint AS bonus_total,
    COALESCE(ARRAY_AGG(DISTINCT bp.reason) FILTER (WHERE bp.reason IS NOT NULL), ARRAY[]::text[]) AS claimed_reasons
  FROM public.profiles p
  LEFT JOIN public.bonus_points bp ON bp.student_id = p.id
  WHERE p.role = 'student'
  GROUP BY p.id, p.name, p.email, p.total_score, p.created_at
  ORDER BY p.total_score DESC, p.created_at ASC;
END;
$$;

-- 5. Include this week's bonus_points in weekly leaderboard & weekly rank
CREATE OR REPLACE FUNCTION public.get_weekly_leaderboard()
RETURNS TABLE(student_id uuid, name text, weekly_score bigint, rank bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH week_start AS (
    SELECT (date_trunc('week', now() AT TIME ZONE 'Asia/Kolkata') AT TIME ZONE 'Asia/Kolkata') AS ts
  ),
  attempt_scores AS (
    SELECT a.student_id, COALESCE(SUM(a.score), 0)::bigint AS pts
    FROM public.attempts a, week_start ws
    WHERE a.created_at >= ws.ts
    GROUP BY a.student_id
  ),
  bonus_scores AS (
    SELECT b.student_id, COALESCE(SUM(b.points), 0)::bigint AS pts
    FROM public.bonus_points b, week_start ws
    WHERE b.created_at >= ws.ts
    GROUP BY b.student_id
  )
  SELECT
    p.id AS student_id,
    COALESCE(NULLIF(TRIM(p.name), ''), split_part(p.email, '@', 1), 'Student') AS name,
    (COALESCE(att.pts, 0) + COALESCE(bon.pts, 0))::bigint AS weekly_score,
    RANK() OVER (ORDER BY (COALESCE(att.pts, 0) + COALESCE(bon.pts, 0)) DESC) AS rank
  FROM public.profiles p
  LEFT JOIN attempt_scores att ON att.student_id = p.id
  LEFT JOIN bonus_scores bon ON bon.student_id = p.id
  WHERE p.role = 'student'
  ORDER BY weekly_score DESC, p.created_at ASC
  LIMIT 3;
$$;

CREATE OR REPLACE FUNCTION public.get_my_weekly_rank(p_student_id uuid)
RETURNS TABLE(student_id uuid, name text, weekly_score bigint, rank bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH week_start AS (
    SELECT (date_trunc('week', now() AT TIME ZONE 'Asia/Kolkata') AT TIME ZONE 'Asia/Kolkata') AS ts
  ),
  attempt_scores AS (
    SELECT a.student_id, COALESCE(SUM(a.score), 0)::bigint AS pts
    FROM public.attempts a, week_start ws
    WHERE a.created_at >= ws.ts
    GROUP BY a.student_id
  ),
  bonus_scores AS (
    SELECT b.student_id, COALESCE(SUM(b.points), 0)::bigint AS pts
    FROM public.bonus_points b, week_start ws
    WHERE b.created_at >= ws.ts
    GROUP BY b.student_id
  ),
  weekly_ranked AS (
    SELECT
      p.id AS student_id,
      COALESCE(NULLIF(TRIM(p.name), ''), split_part(p.email, '@', 1), 'Student') AS name,
      (COALESCE(att.pts, 0) + COALESCE(bon.pts, 0))::bigint AS weekly_score,
      RANK() OVER (ORDER BY (COALESCE(att.pts, 0) + COALESCE(bon.pts, 0)) DESC) AS rank
    FROM public.profiles p
    LEFT JOIN attempt_scores att ON att.student_id = p.id
    LEFT JOIN bonus_scores bon ON bon.student_id = p.id
    WHERE p.role = 'student'
  )
  SELECT wr.student_id, wr.name, wr.weekly_score, wr.rank
  FROM weekly_ranked wr
  WHERE wr.student_id = p_student_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.award_bonus_points(uuid, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_students_with_scores() TO authenticated;
