-- ============================================================
-- Migration 004: Daily Quiz Time Window, Hard End Time,
-- Delayed Result Reveal & Auto-Resetting Weekly Leaderboard
-- ============================================================

-- 1. Single-row daily quiz schedule table (IST: 6:00 PM to 6:25 PM default)
CREATE TABLE IF NOT EXISTS public.quiz_schedule (
  id integer PRIMARY KEY DEFAULT 1,
  window_start time NOT NULL DEFAULT '18:00:00',
  window_end time NOT NULL DEFAULT '18:25:00',
  CONSTRAINT single_row CHECK (id = 1)
);

INSERT INTO public.quiz_schedule (id, window_start, window_end)
VALUES (1, '18:00:00', '18:25:00')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.quiz_schedule ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "quiz_schedule_read_all" ON public.quiz_schedule;
CREATE POLICY "quiz_schedule_read_all"
  ON public.quiz_schedule
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "quiz_schedule_admin_update" ON public.quiz_schedule;
CREATE POLICY "quiz_schedule_admin_update"
  ON public.quiz_schedule
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 2. Add result_revealed column to attempts table
ALTER TABLE public.attempts
  ADD COLUMN IF NOT EXISTS result_revealed boolean NOT NULL DEFAULT false;

-- 3. Admin-only function to update the daily quiz window
CREATE OR REPLACE FUNCTION public.update_quiz_window(
  p_window_start time,
  p_window_end time
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  IF p_window_end <= p_window_start THEN
    RAISE EXCEPTION 'window_end must be after window_start';
  END IF;

  UPDATE public.quiz_schedule
  SET window_start = p_window_start,
      window_end = p_window_end
  WHERE id = 1;

  RETURN jsonb_build_object(
    'success', true,
    'window_start', p_window_start,
    'window_end', p_window_end
  );
END;
$$;

-- 4. Check if current server time (IST) is inside daily quiz window
CREATE OR REPLACE FUNCTION public.is_quiz_currently_active()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH sched AS (
    SELECT window_start, window_end
    FROM public.quiz_schedule
    WHERE id = 1
  ),
  ist_now AS (
    SELECT (now() AT TIME ZONE 'Asia/Kolkata') AS ts
  )
  SELECT jsonb_build_object(
    'is_active', (ist_now.ts::time >= sched.window_start AND ist_now.ts::time < sched.window_end),
    'current_ist_time', ist_now.ts::time,
    'window_start', sched.window_start,
    'window_end', sched.window_end,
    'today_window_end', ((ist_now.ts::date + sched.window_end) AT TIME ZONE 'Asia/Kolkata')
  )
  FROM sched, ist_now;
$$;

-- 5. Start Quiz Attempt: calculates hard effective_end_time = MIN(now + duration, today window_end)
CREATE OR REPLACE FUNCTION public.start_quiz_attempt(p_quiz_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_duration integer;
  v_is_active boolean;
  v_window_start time;
  v_window_end time;
  v_now_ist timestamp;
  v_today_window_end timestamptz;
  v_duration_end timestamptz;
  v_effective_end timestamptz;
  v_already_attempted boolean;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'Authentication required');
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.attempts
    WHERE student_id = v_user_id AND quiz_id = p_quiz_id
  ) INTO v_already_attempted;

  IF v_already_attempted THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'Quiz already attempted');
  END IF;

  SELECT duration_minutes, is_active
  INTO v_duration, v_is_active
  FROM public.quizzes
  WHERE id = p_quiz_id;

  IF NOT FOUND OR NOT v_is_active THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'Quiz is not active');
  END IF;

  SELECT window_start, window_end
  INTO v_window_start, v_window_end
  FROM public.quiz_schedule
  WHERE id = 1;

  v_now_ist := now() AT TIME ZONE 'Asia/Kolkata';

  IF v_now_ist::time < v_window_start OR v_now_ist::time >= v_window_end THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'Quiz window is closed',
      'window_start', v_window_start,
      'window_end', v_window_end,
      'current_ist_time', v_now_ist::time
    );
  END IF;

  v_today_window_end := (v_now_ist::date + v_window_end) AT TIME ZONE 'Asia/Kolkata';
  v_duration_end := now() + make_interval(mins => COALESCE(v_duration, 8));
  v_effective_end := LEAST(v_duration_end, v_today_window_end);

  RETURN jsonb_build_object(
    'allowed', true,
    'quiz_id', p_quiz_id,
    'server_now', now(),
    'effective_end_time', v_effective_end,
    'today_window_end', v_today_window_end,
    'remaining_seconds', GREATEST(0, floor(extract(epoch FROM (v_effective_end - now())))::integer)
  );
END;
$$;

-- 6. Submit Quiz Attempt (Delayed Result Reveal: saves score, does NOT return score before window_end)
CREATE OR REPLACE FUNCTION public.submit_quiz_attempt_delayed(
  p_quiz_id uuid,
  p_answers jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_score integer := 0;
  v_attempt_id uuid;
  v_window_end time;
  v_now_ist timestamp;
  v_today_window_end timestamptz;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Prevent duplicate attempt
  SELECT id INTO v_attempt_id
  FROM public.attempts
  WHERE student_id = v_user_id AND quiz_id = p_quiz_id;

  IF v_attempt_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'attempt_id', v_attempt_id,
      'already_submitted', true,
      'message', 'Quiz already submitted.'
    );
  END IF;

  -- Calculate score server-side from questions table
  SELECT COUNT(*)::integer
  INTO v_score
  FROM public.questions q
  WHERE q.quiz_id = p_quiz_id
    AND (p_answers ->> q.id::text) IS NOT NULL
    AND (p_answers ->> q.id::text)::integer = q.correct_option;

  INSERT INTO public.attempts (student_id, quiz_id, score, answers, result_revealed)
  VALUES (v_user_id, p_quiz_id, v_score, COALESCE(p_answers, '{}'::jsonb), false)
  RETURNING id INTO v_attempt_id;

  SELECT window_end INTO v_window_end FROM public.quiz_schedule WHERE id = 1;
  v_now_ist := now() AT TIME ZONE 'Asia/Kolkata';
  v_today_window_end := (v_now_ist::date + v_window_end) AT TIME ZONE 'Asia/Kolkata';

  RETURN jsonb_build_object(
    'attempt_id', v_attempt_id,
    'submitted', true,
    'result_revealed', false,
    'reveal_at', v_today_window_end,
    'message', 'Submitted. Results will be available after ' || to_char(v_window_end, 'HH12:MI PM')
  );
END;
$$;

-- 7. Get Attempt Result (only reveals score & correct answers if current IST time >= window_end)
CREATE OR REPLACE FUNCTION public.get_attempt_result(p_attempt_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_attempt record;
  v_window_end time;
  v_now_ist timestamp;
  v_attempt_date_ist date;
  v_reveal_time timestamptz;
  v_review jsonb;
  v_total integer;
BEGIN
  SELECT a.*
  INTO v_attempt
  FROM public.attempts a
  WHERE a.id = p_attempt_id
    AND (
      a.student_id = v_user_id
      OR EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id AND role = 'admin')
    );

  IF NOT FOUND THEN
    RETURN jsonb_build_object('available', false, 'status', 'not_found', 'message', 'Attempt not found');
  END IF;

  SELECT window_end INTO v_window_end FROM public.quiz_schedule WHERE id = 1;
  v_now_ist := now() AT TIME ZONE 'Asia/Kolkata';
  v_attempt_date_ist := (v_attempt.created_at AT TIME ZONE 'Asia/Kolkata')::date;
  v_reveal_time := (v_attempt_date_ist + v_window_end) AT TIME ZONE 'Asia/Kolkata';

  IF now() < v_reveal_time AND NOT v_attempt.result_revealed THEN
    RETURN jsonb_build_object(
      'available', false,
      'status', 'not_yet_available',
      'reveal_at', v_reveal_time,
      'message', 'Results not yet available. Check back after ' || to_char(v_window_end, 'HH12:MI PM')
    );
  END IF;

  IF NOT v_attempt.result_revealed THEN
    UPDATE public.attempts SET result_revealed = true WHERE id = p_attempt_id;
  END IF;

  SELECT
    COUNT(*)::integer,
    COALESCE(jsonb_agg(
      jsonb_build_object(
        'id', q.id,
        'question_text', q.question_text,
        'options', q.options,
        'correct_option', q.correct_option,
        'selected_option', CASE
          WHEN (v_attempt.answers ->> q.id::text) IS NOT NULL
          THEN (v_attempt.answers ->> q.id::text)::integer
          ELSE NULL
        END
      )
    ), '[]'::jsonb)
  INTO v_total, v_review
  FROM public.questions q
  WHERE q.quiz_id = v_attempt.quiz_id;

  RETURN jsonb_build_object(
    'available', true,
    'status', 'revealed',
    'attempt_id', v_attempt.id,
    'quiz_id', v_attempt.quiz_id,
    'score', v_attempt.score,
    'total_questions', v_total,
    'answers', v_attempt.answers,
    'review', v_review
  );
END;
$$;

-- 8. Weekly Leaderboard (Auto-resets every Monday IST using date_trunc('week', ...))
CREATE OR REPLACE FUNCTION public.get_weekly_leaderboard()
RETURNS TABLE(student_id uuid, name text, weekly_score bigint, rank bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id AS student_id,
    COALESCE(NULLIF(TRIM(p.name), ''), split_part(p.email, '@', 1), 'Student') AS name,
    COALESCE(SUM(a.score), 0)::bigint AS weekly_score,
    RANK() OVER (ORDER BY COALESCE(SUM(a.score), 0) DESC) AS rank
  FROM public.profiles p
  LEFT JOIN public.attempts a
    ON a.student_id = p.id
    AND a.created_at >= (date_trunc('week', now() AT TIME ZONE 'Asia/Kolkata') AT TIME ZONE 'Asia/Kolkata')
  WHERE p.role = 'student'
  GROUP BY p.id, p.name, p.email
  ORDER BY weekly_score DESC, p.created_at ASC
  LIMIT 3;
$$;

-- 9. Get specific student's weekly rank & score (even if outside Top 3)
CREATE OR REPLACE FUNCTION public.get_my_weekly_rank(p_student_id uuid)
RETURNS TABLE(student_id uuid, name text, weekly_score bigint, rank bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH weekly_ranked AS (
    SELECT
      p.id AS student_id,
      COALESCE(NULLIF(TRIM(p.name), ''), split_part(p.email, '@', 1), 'Student') AS name,
      COALESCE(SUM(a.score), 0)::bigint AS weekly_score,
      RANK() OVER (ORDER BY COALESCE(SUM(a.score), 0) DESC) AS rank
    FROM public.profiles p
    LEFT JOIN public.attempts a
      ON a.student_id = p.id
      AND a.created_at >= (date_trunc('week', now() AT TIME ZONE 'Asia/Kolkata') AT TIME ZONE 'Asia/Kolkata')
    WHERE p.role = 'student'
    GROUP BY p.id, p.name, p.email
  )
  SELECT wr.student_id, wr.name, wr.weekly_score, wr.rank
  FROM weekly_ranked wr
  WHERE wr.student_id = p_student_id;
$$;

GRANT EXECUTE ON FUNCTION public.update_quiz_window(time, time) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_quiz_currently_active() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.start_quiz_attempt(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_quiz_attempt_delayed(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_attempt_result(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_weekly_leaderboard() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_my_weekly_rank(uuid) TO authenticated;
