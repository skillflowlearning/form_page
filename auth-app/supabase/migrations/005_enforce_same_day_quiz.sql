-- ============================================================
-- Migration 005: Enforce same-day (IST) quiz check in start_quiz_attempt
-- Old quizzes from previous days cannot be started
-- ============================================================

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
  v_created_at timestamptz;
  v_window_start time;
  v_window_end time;
  v_now_ist timestamp;
  v_quiz_date_ist date;
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

  SELECT duration_minutes, is_active, created_at
  INTO v_duration, v_is_active, v_created_at
  FROM public.quizzes
  WHERE id = p_quiz_id;

  IF NOT FOUND OR NOT v_is_active THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'Quiz is not active');
  END IF;

  v_now_ist := now() AT TIME ZONE 'Asia/Kolkata';
  v_quiz_date_ist := (v_created_at AT TIME ZONE 'Asia/Kolkata')::date;

  -- Block quizzes from previous days
  IF v_quiz_date_ist <> v_now_ist::date THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'This quiz has expired (only today''s quizzes can be attempted).'
    );
  END IF;

  SELECT window_start, window_end
  INTO v_window_start, v_window_end
  FROM public.quiz_schedule
  WHERE id = 1;

  IF v_now_ist::time < v_window_start OR v_now_ist::time >= v_window_end THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'Quiz window is closed. Active daily between ' || to_char(v_window_start, 'HH12:MI PM') || ' and ' || to_char(v_window_end, 'HH12:MI PM') || ' IST.',
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
