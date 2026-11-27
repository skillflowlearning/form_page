-- Migration 002: Add duration_minutes to quizzes table
ALTER TABLE public.quizzes
  ADD COLUMN IF NOT EXISTS duration_minutes integer NOT NULL DEFAULT 8;
