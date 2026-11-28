-- Migration 003: Save student answers in attempts + SQL RANK() Leaderboard functions

-- 1. Add answers jsonb column to attempts table for storing student responses
ALTER TABLE public.attempts
  ADD COLUMN IF NOT EXISTS answers jsonb DEFAULT '{}'::jsonb;

-- 2. Leaderboard RPC: returns all students ranked using SQL RANK() window function
-- Uses SECURITY DEFINER so students can see global rankings safely despite profiles RLS
CREATE OR REPLACE FUNCTION public.get_leaderboard()
RETURNS TABLE (
  id uuid,
  name text,
  total_score integer,
  rank bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    COALESCE(NULLIF(TRIM(p.name), ''), split_part(p.email, '@', 1), 'Student') AS name,
    p.total_score,
    RANK() OVER (ORDER BY p.total_score DESC) AS rank
  FROM public.profiles p
  WHERE p.role = 'student'
  ORDER BY p.total_score DESC, p.created_at ASC;
$$;

-- 3. Get single user's rank and score using the same RANK() window logic
CREATE OR REPLACE FUNCTION public.get_my_rank(target_user_id uuid)
RETURNS TABLE (
  rank bigint,
  total_score integer
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH ranked AS (
    SELECT
      p.id,
      p.total_score,
      RANK() OVER (ORDER BY p.total_score DESC) AS rank
    FROM public.profiles p
    WHERE p.role = 'student'
  )
  SELECT r.rank, r.total_score
  FROM ranked r
  WHERE r.id = target_user_id;
$$;

-- Allow authenticated users to execute the leaderboard RPCs
GRANT EXECUTE ON FUNCTION public.get_leaderboard() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_my_rank(uuid) TO authenticated;
