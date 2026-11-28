import { supabase } from '@/lib/supabase'

export interface QuizScheduleStatus {
  is_active: boolean
  current_ist_time: string
  window_start: string
  window_end: string
  today_window_end: string
}

export interface StartQuizAttemptResult {
  allowed: boolean
  reason?: string
  quiz_id?: string
  server_now?: string
  effective_end_time?: string
  today_window_end?: string
  remaining_seconds?: number
  window_start?: string
  window_end?: string
  current_ist_time?: string
}

export interface DelayedSubmitResult {
  attempt_id: string
  submitted?: boolean
  already_submitted?: boolean
  result_revealed?: boolean
  reveal_at?: string
  message: string
}

export interface AttemptResultResponse {
  available: boolean
  status: 'revealed' | 'not_yet_available' | 'not_found'
  reveal_at?: string
  message?: string
  attempt_id?: string
  quiz_id?: string
  score?: number
  total_questions?: number
  answers?: Record<string, number>
  review?: Array<{
    id: string
    question_text: string
    options: string[]
    correct_option: number
    selected_option: number | null
  }>
}

export interface WeeklyRankedStudent {
  student_id: string
  name: string
  weekly_score: number
  rank: number
}

/**
 * Admin-only: Update daily quiz window (e.g. '18:00:00', '18:25:00').
 */
export async function updateQuizWindow(startTime: string, endTime: string) {
  const { data, error } = await supabase.rpc('update_quiz_window', {
    p_window_start: startTime,
    p_window_end: endTime,
  })
  if (error) throw error
  return data as { success: boolean; window_start: string; window_end: string }
}

/**
 * Check if current server time (IST) is within quiz_schedule window_start and window_end.
 */
export async function isQuizCurrentlyActive(): Promise<QuizScheduleStatus> {
  const { data, error } = await supabase.rpc('is_quiz_currently_active')
  if (error) throw error
  return data as QuizScheduleStatus
}

/**
 * Server-side start attempt: calculates hard effective_end_time = MIN(now + duration, window_end).
 */
export async function startQuizAttempt(quizId: string): Promise<StartQuizAttemptResult> {
  const { data, error } = await supabase.rpc('start_quiz_attempt', {
    p_quiz_id: quizId,
  })
  if (error) throw error
  return data as StartQuizAttemptResult
}

/**
 * Delayed result submission: calculates & stores score server-side without revealing score before window_end.
 */
export async function submitQuizAttemptDelayed(
  quizId: string,
  answers: Record<string, number>
): Promise<DelayedSubmitResult> {
  const { data, error } = await supabase.rpc('submit_quiz_attempt_delayed', {
    p_quiz_id: quizId,
    p_answers: answers,
  })
  if (error) throw error
  return data as DelayedSubmitResult
}

/**
 * Fetch attempt result only if current IST time >= window_end; otherwise returns not_yet_available.
 */
export async function getAttemptResult(attemptId: string): Promise<AttemptResultResponse> {
  const { data, error } = await supabase.rpc('get_attempt_result', {
    p_attempt_id: attemptId,
  })
  if (error) throw error
  return data as AttemptResultResponse
}

/**
 * Weekly Top 3 Leaderboard (auto-resets every Monday IST via date_trunc('week', ...)).
 */
export async function getWeeklyLeaderboard(): Promise<WeeklyRankedStudent[]> {
  const { data, error } = await supabase.rpc('get_weekly_leaderboard')
  if (error) throw error
  return (data || []).map((row: any) => ({
    student_id: row.student_id,
    name: row.name || 'Student',
    weekly_score: Number(row.weekly_score ?? 0),
    rank: Number(row.rank ?? 1),
  }))
}

/**
 * Get current student's weekly rank and score (even if outside Top 3).
 */
export async function getMyWeeklyRank(studentId: string): Promise<WeeklyRankedStudent | null> {
  if (!studentId) return null
  const { data, error } = await supabase.rpc('get_my_weekly_rank', {
    p_student_id: studentId,
  })
  if (error) throw error
  if (!Array.isArray(data) || data.length === 0) return null
  const row = data[0]
  return {
    student_id: row.student_id,
    name: row.name || 'Student',
    weekly_score: Number(row.weekly_score ?? 0),
    rank: Number(row.rank ?? 1),
  }
}

export interface StudentWithScores {
  id: string
  name: string
  email: string
  total_score: number
  bonus_total: number
  claimed_reasons: string[]
}

/**
 * Admin-only: Award manual bonus points to a student (trigger updates profiles.total_score).
 */
export async function awardBonusPoints(
  studentId: string,
  points: number,
  reason: string
): Promise<{ success: boolean; student_id: string; points_awarded: number; new_total_score: number }> {
  const { data, error } = await supabase.rpc('award_bonus_points', {
    p_student_id: studentId,
    p_points: points,
    p_reason: reason,
  })
  if (error) throw error
  return data as { success: boolean; student_id: string; points_awarded: number; new_total_score: number }
}

/**
 * Admin-only: Get all students with their total_score, total bonus_points, and claimed reasons.
 */
export async function getAllStudentsWithScores(): Promise<StudentWithScores[]> {
  const { data, error } = await supabase.rpc('get_all_students_with_scores')
  if (error) throw error
  return (data || []).map((row: any) => ({
    id: row.id,
    name: row.name || 'Student',
    email: row.email || '',
    total_score: Number(row.total_score ?? 0),
    bonus_total: Number(row.bonus_total ?? 0),
    claimed_reasons: Array.isArray(row.claimed_reasons) ? row.claimed_reasons : [],
  }))
}
