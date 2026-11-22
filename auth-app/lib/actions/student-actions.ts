'use server'

// ============================================================
// Student / Shared Server Actions
// submitQuizAttempt, getLeaderboard, markWelcomeSeen
// ============================================================

import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth-helpers'
import { revalidatePath } from 'next/cache'

// ─────────────────────────────────────────────
// 5. submitQuizAttempt(quizId, selectedAnswers)
// selectedAnswers: { [questionId: string]: number }  (0-indexed choice)
// Score calculate, attempt insert, total_score increment (trigger se)
// ─────────────────────────────────────────────
export async function submitQuizAttempt(
  quizId: string,
  selectedAnswers: Record<string, number>
) {
  const user = await requireAuth()

  if (!quizId) {
    return { success: false, error: 'quizId required.' }
  }

  const supabase = await createClient()

  // 1. Quiz active hai ya nahi check karo
  const { data: quiz, error: quizError } = await supabase
    .from('quizzes')
    .select('id, is_active')
    .eq('id', quizId)
    .maybeSingle()

  if (quizError || !quiz) {
    return { success: false, error: 'Quiz not found.' }
  }

  if (!quiz.is_active) {
    return { success: false, error: 'This quiz is not active.' }
  }

  // 2. Already attempt kiya hai to block karo (ek quiz = ek attempt)
  const { data: existing } = await supabase
    .from('attempts')
    .select('id')
    .eq('student_id', user.id)
    .eq('quiz_id', quizId)
    .maybeSingle()

  if (existing) {
    return { success: false, error: 'You have already attempted this quiz.' }
  }

  // 3. Saare questions fetch karo
  const { data: questions, error: qError } = await supabase
    .from('questions')
    .select('id, correct_option')
    .eq('quiz_id', quizId)

  if (qError || !questions || questions.length === 0) {
    return { success: false, error: 'No questions found for this quiz.' }
  }

  // 4. Score calculate karo
  let score = 0
  for (const q of questions) {
    if (selectedAnswers[q.id] === q.correct_option) {
      score++
    }
  }

  // 5. Attempt insert karo (trigger automatically total_score update kar dega)
  const { error: insertError } = await supabase.from('attempts').insert({
    student_id: user.id,
    quiz_id: quizId,
    score,
  })

  if (insertError) {
    return { success: false, error: 'Failed to save attempt: ' + insertError.message }
  }

  revalidatePath('/student/dashboard')
  return {
    success: true,
    score,
    totalQuestions: questions.length,
    message: `Quiz submitted! You scored ${score}/${questions.length}.`,
  }
}


// ─────────────────────────────────────────────
// 6. getLeaderboard()
// Top 3 students + current user ka apna rank/score
// ─────────────────────────────────────────────
export async function getLeaderboard() {
  const user = await requireAuth()

  const supabase = await createClient()

  // DB-side leaderboard function use karo (migration mein define kiya tha)
  const { data, error } = await supabase.rpc('get_leaderboard', {
    requesting_user_id: user.id,
  })

  if (error) {
    // Fallback: direct query (agar RPC kaam na kare)
    const { data: top3, error: topError } = await supabase
      .from('profiles')
      .select('id, name, total_score')
      .order('total_score', { ascending: false })
      .limit(3)

    if (topError) {
      return { success: false, error: 'Failed to fetch leaderboard: ' + topError.message }
    }

    // Current user ka rank manually calculate karo
    const { data: allScores } = await supabase
      .from('profiles')
      .select('id, total_score')
      .order('total_score', { ascending: false })

    let myRank = 1
    let myScore = 0
    if (allScores) {
      for (const p of allScores) {
        if (p.id === user.id) {
          myScore = p.total_score
          break
        }
        myRank++
      }
    }

    return {
      success: true,
      top3: top3 ?? [],
      myRank,
      myScore,
    }
  }

  // RPC se aaya response
  return {
    success: true,
    top3: data.top3 ?? [],
    myRank: data.my_rank ?? null,
    myScore: data.my_score ?? 0,
  }
}


// ─────────────────────────────────────────────
// 7. markWelcomeSeen(userId)
// has_seen_welcome ko true karo
// Return: { wasFirstTime: boolean }
// wasFirstTime=true  → frontend welcome dikhaye
// wasFirstTime=false → pehle hi dikh chuka hai
// ─────────────────────────────────────────────
export async function markWelcomeSeen() {
  const user = await requireAuth()

  const supabase = await createClient()

  // Current value fetch karo
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('has_seen_welcome')
    .eq('id', user.id)
    .single()

  if (fetchError || !profile) {
    return { success: false, error: 'Profile not found.' }
  }

  const wasFirstTime = !profile.has_seen_welcome

  // Agar pehli baar hai to update karo
  if (wasFirstTime) {
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ has_seen_welcome: true })
      .eq('id', user.id)

    if (updateError) {
      return { success: false, error: 'Failed to update: ' + updateError.message }
    }
  }

  return {
    success: true,
    wasFirstTime,
    // wasFirstTime=true  → "Welcome!" modal dikhao
    // wasFirstTime=false → skip karo
  }
}


// ─────────────────────────────────────────────
// BONUS: getCommunityMessages()
// Sab authenticated users read kar sakte hain
// ─────────────────────────────────────────────
export async function getCommunityMessages(limit = 50) {
  await requireAuth()

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('community_messages')
    .select(`
      id,
      message,
      created_at,
      sender:profiles(name, email)
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, messages: data ?? [] }
}


// ─────────────────────────────────────────────
// BONUS: getStudentQuizzes()
// Student ke liye active quizzes + attempts status
// ─────────────────────────────────────────────
export async function getStudentQuizzes() {
  const user = await requireAuth()
  const supabase = await createClient()

  // Active quizzes
  const { data: quizzes, error: qError } = await supabase
    .from('quizzes')
    .select('id, title, created_at')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (qError) {
    return { success: false, error: qError.message }
  }

  // Student ke attempts
  const { data: attempts } = await supabase
    .from('attempts')
    .select('quiz_id, score')
    .eq('student_id', user.id)

  const attemptMap = new Map(attempts?.map((a) => [a.quiz_id, a.score]) ?? [])

  const quizzesWithStatus = (quizzes ?? []).map((q) => ({
    ...q,
    attempted: attemptMap.has(q.id),
    score: attemptMap.get(q.id) ?? null,
  }))

  return { success: true, quizzes: quizzesWithStatus }
}
