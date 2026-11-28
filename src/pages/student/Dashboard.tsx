import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import {
  isQuizCurrentlyActive,
  startQuizAttempt,
  submitQuizAttemptDelayed,
  getAttemptResult,
  getWeeklyLeaderboard,
  getMyWeeklyRank,
  type QuizScheduleStatus,
  type WeeklyRankedStudent,
} from '@/lib/quiz-backend'
import { 
  Home, Zap, MessageSquare, Trophy, 
  CheckCircle2, XCircle, Loader2, Sparkles, LogOut, 
  Mail, Shield, ChevronRight, Lock, User, Clock, AlertCircle
} from 'lucide-react'
import BottomNavBar, { type NavItem } from '@/components/ui/bottom-nav-bar'
import { AlertCard } from '@/components/ui/card-8'
import { ColorfulBentoGrid } from '@/components/ui/colorful-bento-grid'

type TabId = 'home' | 'quiz' | 'community' | 'rewards' | 'settings'

const getISTDateStr = (d = new Date()) =>
  d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })

interface QuizReviewItem {
  id: string
  question_text: string
  options: string[]
  selected_option: number | null
  correct_option: number
  is_correct: boolean
}

interface QuizResultData {
  delayed?: boolean
  revealMessage?: string
  score: number
  total: number
  wrong: number
  unanswered: number
  autoSubmitted?: boolean
  autoSubmitReason?: string
  review: QuizReviewItem[]
}

interface Quiz {
  id: string
  title: string
  duration_minutes?: number
  created_at: string
  isToday?: boolean
  attempted?: boolean
  attemptId?: string | null
  resultRevealed?: boolean
  score?: number | null
}

interface Question {
  id: string
  question_text: string
  options: string[]
  correct_option: number
}

interface CommunityMsg {
  id: string
  message: string
  created_at: string
  sender?: {
    name?: string
    email?: string
  }
}

export default function StudentDashboard() {
  const navigate = useNavigate()
  const [activeTabIdx, setActiveTabIdx] = useState(0)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showWelcome, setShowWelcome] = useState(false)

  // Weekly Leaderboard
  const [leaderboard, setLeaderboard] = useState<{
    weeklyWinners: WeeklyRankedStudent[]
    myRank: number | null
    myScore: number
  } | null>(null)

  // Quiz State
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [scheduleStatus, setScheduleStatus] = useState<QuizScheduleStatus | null>(null)
  const [quizNotice, setQuizNotice] = useState<string>('')
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQ, setCurrentQ] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({})
  const [quizScreen, setQuizScreen] = useState<'list' | 'quiz' | 'result'>('list')
  const [quizResult, setQuizResult] = useState<QuizResultData | null>(null)
  const [submittingQuiz, setSubmittingQuiz] = useState(false)
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const submittingRef = useRef(false)
  const quizStartedAtRef = useRef<number>(0)

  const showNotice = useCallback((msg: string) => {
    setQuizNotice(msg)
    setTimeout(() => setQuizNotice(''), 4000)
  }, [])

  // Community
  const [communityMessages, setCommunityMessages] = useState<CommunityMsg[]>([])

  // Settings
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  // Custom navigation items requested: Home, Quiz, Community, Rewards, Profile
  const navItems: (NavItem & { tabId: TabId })[] = [
    { label: 'Home', icon: Home, tabId: 'home' },
    { label: 'Quiz', icon: Zap, tabId: 'quiz' },
    { label: 'Community', icon: MessageSquare, tabId: 'community' },
    { label: 'Rewards', icon: Trophy, tabId: 'rewards' },
    { label: 'Profile', icon: User, tabId: 'settings' },
  ]

  const currentTab = navItems[activeTabIdx]?.tabId || 'home'

  const mapQuizList = useCallback((qzList: any[] | null, attempts: any[] | null, studentId: string): Quiz[] => {
    const todayIST = getISTDateStr()
    const attemptMap = new Map(attempts?.map(a => [a.quiz_id, a]) || [])
    return (qzList || []).map(q => {
      const attempt = attemptMap.get(q.id)
      const isToday = getISTDateStr(new Date(q.created_at)) === todayIST
      const localStarted = localStorage.getItem(`quiz_started_${q.id}_${studentId}`) === 'true'
      return {
        ...q,
        isToday,
        attempted: Boolean(attempt) || localStarted,
        attemptId: attempt?.id ?? null,
        resultRevealed: Boolean(attempt?.result_revealed),
        score: attempt?.score ?? null,
      }
    })
  }, [])

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate('/student/login')
        return
      }

      // If user is support@skillflowlearn.com, redirect to admin dashboard immediately
      if (user.email === 'support@skillflowlearn.com') {
        navigate('/admin/dashboard', { replace: true })
        return
      }

      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (prof?.role === 'admin') {
        navigate('/admin/dashboard', { replace: true })
        return
      }

      const currentProf = prof || { id: user.id, email: user.email, name: 'Student', role: 'student', total_score: 0 }
      setProfile(currentProf)

      // Check both database AND local storage so it NEVER repeats for this user
      const localSeen = localStorage.getItem(`has_seen_welcome_${user.id}`) === 'true'
      if (!currentProf.has_seen_welcome && !localSeen) {
        setShowWelcome(true)
      } else {
        setShowWelcome(false)
      }

      // Fetch weekly leaderboard + schedule status + quizzes + messages
      const [weeklyTop3, myWeekly, schedRes, qzRes, attemptsRes, msgsRes] = await Promise.all([
        getWeeklyLeaderboard().catch(() => []),
        getMyWeeklyRank(user.id).catch(() => null),
        isQuizCurrentlyActive().catch(() => null),
        supabase
          .from('quizzes')
          .select('id, title, duration_minutes, created_at')
          .eq('is_active', true)
          .order('created_at', { ascending: false }),
        supabase
          .from('attempts')
          .select('id, quiz_id, score, result_revealed')
          .eq('student_id', user.id),
        supabase
          .from('community_messages')
          .select('id, message, created_at')
          .order('created_at', { ascending: false })
          .limit(20),
      ])

      setLeaderboard({
        weeklyWinners: weeklyTop3,
        myRank: myWeekly?.rank ?? null,
        myScore: myWeekly?.weekly_score ?? currentProf.total_score ?? 0,
      })

      if (schedRes) setScheduleStatus(schedRes)
      setQuizzes(mapQuizList(qzRes.data, attemptsRes.data, user.id))
      setCommunityMessages(msgsRes.data || [])
      setLoading(false)
    }

    init()
  }, [navigate, mapQuizList])

  const refreshLeaderboard = useCallback(async (studentId: string) => {
    const [weeklyTop3, myWeekly] = await Promise.all([
      getWeeklyLeaderboard().catch(() => []),
      getMyWeeklyRank(studentId).catch(() => null),
    ])
    setLeaderboard({
      weeklyWinners: weeklyTop3,
      myRank: myWeekly?.rank ?? null,
      myScore: myWeekly?.weekly_score ?? 0,
    })
  }, [])

  const refreshQuizzes = useCallback(async (studentId: string) => {
    const [schedRes, { data: qzList }, { data: attempts }] = await Promise.all([
      isQuizCurrentlyActive().catch(() => null),
      supabase
        .from('quizzes')
        .select('id, title, duration_minutes, created_at')
        .eq('is_active', true)
        .order('created_at', { ascending: false }),
      supabase
        .from('attempts')
        .select('id, quiz_id, score, result_revealed')
        .eq('student_id', studentId),
    ])

    if (schedRes) setScheduleStatus(schedRes)
    setQuizzes(mapQuizList(qzList, attempts, studentId))
  }, [mapQuizList])

  // Refresh quizzes/schedule or leaderboard when switching tabs, plus 30s poll for quiz window
  useEffect(() => {
    if (!profile?.id) return
    if (currentTab === 'quiz' && quizScreen === 'list') {
      refreshQuizzes(profile.id)
      const intervalId = setInterval(() => {
        refreshQuizzes(profile.id)
      }, 30000)
      return () => clearInterval(intervalId)
    } else if (currentTab === 'home') {
      refreshLeaderboard(profile.id)
    }
  }, [currentTab, quizScreen, profile?.id, refreshQuizzes, refreshLeaderboard])

  // Real-time subscriptions for quizzes and profile score updates
  useEffect(() => {
    if (!profile?.id) return
    const quizChannel = supabase
      .channel('quizzes-realtime-feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'quizzes' },
        () => {
          refreshQuizzes(profile.id)
        }
      )
      .subscribe()

    const leaderboardChannel = supabase
      .channel('leaderboard-realtime-feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => {
          refreshLeaderboard(profile.id)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(quizChannel)
      supabase.removeChannel(leaderboardChannel)
    }
  }, [profile?.id, refreshQuizzes, refreshLeaderboard])

  const handleCloseWelcome = async () => {
    setShowWelcome(false)
    if (profile?.id) {
      localStorage.setItem(`has_seen_welcome_${profile.id}`, 'true')
      await supabase.from('profiles').update({ has_seen_welcome: true }).eq('id', profile.id)
      setProfile((prev: any) => ({ ...prev, has_seen_welcome: true }))
    }
  }

  const handleOpenRevealedResult = async (quiz: Quiz) => {
    if (!quiz.attemptId) return
    try {
      const res = await getAttemptResult(quiz.attemptId)
      if (!res.available) {
        showNotice(res.message || 'Results are not yet available. Check back after the quiz window ends.')
        return
      }
      const reviewItems: QuizReviewItem[] = (res.review || []).map(r => ({
        id: r.id,
        question_text: r.question_text,
        options: r.options,
        selected_option: r.selected_option,
        correct_option: r.correct_option,
        is_correct: r.selected_option === r.correct_option,
      }))
      const wrongCount = reviewItems.filter(r => r.selected_option !== null && !r.is_correct).length
      const skippedCount = reviewItems.filter(r => r.selected_option === null).length

      setActiveQuiz(quiz)
      setQuizResult({
        delayed: false,
        score: res.score ?? 0,
        total: res.total_questions ?? reviewItems.length,
        wrong: wrongCount,
        unanswered: skippedCount,
        review: reviewItems,
      })
      setQuizScreen('result')
    } catch (err: any) {
      showNotice(err?.message || 'Unable to load result yet.')
    }
  }

  const handleStartQuiz = async (quiz: Quiz) => {
    if (!profile?.id) return

    if (quiz.attempted) {
      if (quiz.attemptId) {
        await handleOpenRevealedResult(quiz)
      } else {
        showNotice('You have already attempted this quiz.')
      }
      return
    }

    if (!quiz.isToday) {
      showNotice('This quiz has expired. Only today\'s quizzes can be attempted.')
      return
    }

    // Verify server-side time window & hard end time
    try {
      const startRes = await startQuizAttempt(quiz.id)
      if (!startRes.allowed) {
        showNotice(startRes.reason || 'Quiz window is currently closed.')
        refreshQuizzes(profile.id)
        return
      }

      const { data: qs } = await supabase
        .from('questions')
        .select('id, question_text, options, correct_option')
        .eq('quiz_id', quiz.id)

      if (!qs || qs.length === 0) {
        showNotice('No questions found for this quiz.')
        return
      }

      // Lock attempt immediately on this device so refresh/back cannot restart
      localStorage.setItem(`quiz_started_${quiz.id}_${profile.id}`, 'true')
      submittingRef.current = false
      quizStartedAtRef.current = Date.now()
      setActiveQuiz(quiz)
      setQuestions(qs)
      setSelectedAnswers({})
      setCurrentQ(0)
      setTimeLeft(startRes.remaining_seconds ?? (quiz.duration_minutes || 8) * 60)
      setQuizScreen('quiz')

      // Push history state to catch browser back button & enter fullscreen
      window.history.pushState({ inQuiz: true }, '')
      if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {})
      }
    } catch (err: any) {
      showNotice(err?.message || 'Unable to start quiz right now.')
    }
  }

  const handleSubmitAttempt = useCallback(async (isAutoSubmit = false, autoReason?: string) => {
    if (!activeQuiz || !profile?.id || submittingRef.current) return
    submittingRef.current = true
    setSubmittingQuiz(true)

    // Exit fullscreen cleanly if active
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {})
    }

    try {
      const submitRes = await submitQuizAttemptDelayed(activeQuiz.id, selectedAnswers)
      const resultRes = await getAttemptResult(submitRes.attempt_id)

      setSubmittingQuiz(false)
      setQuizzes(prev =>
        prev.map(q =>
          q.id === activeQuiz.id
            ? {
                ...q,
                attempted: true,
                attemptId: submitRes.attempt_id,
                resultRevealed: resultRes.available,
                score: resultRes.available ? (resultRes.score ?? 0) : null,
              }
            : q
        )
      )

      if (resultRes.available) {
        const reviewItems: QuizReviewItem[] = (resultRes.review || []).map(r => ({
          id: r.id,
          question_text: r.question_text,
          options: r.options,
          selected_option: r.selected_option,
          correct_option: r.correct_option,
          is_correct: r.selected_option === r.correct_option,
        }))
        const scoreVal = resultRes.score ?? 0
        const wrongCount = reviewItems.filter(r => r.selected_option !== null && !r.is_correct).length
        const skippedCount = reviewItems.filter(r => r.selected_option === null).length

        setQuizResult({
          delayed: false,
          score: scoreVal,
          total: resultRes.total_questions ?? questions.length,
          wrong: wrongCount,
          unanswered: skippedCount,
          autoSubmitted: isAutoSubmit,
          autoSubmitReason: autoReason,
          review: reviewItems,
        })
        setProfile((prev: any) => ({ ...prev, total_score: (prev.total_score || 0) + scoreVal }))
        refreshLeaderboard(profile.id)
      } else {
        setQuizResult({
          delayed: true,
          revealMessage: resultRes.message || submitRes.message,
          score: 0,
          total: questions.length,
          wrong: 0,
          unanswered: 0,
          autoSubmitted: isAutoSubmit,
          autoSubmitReason: autoReason,
          review: [],
        })
      }
      setQuizScreen('result')
    } catch (err: any) {
      setSubmittingQuiz(false)
      submittingRef.current = false
      showNotice(err?.message || 'Submission failed.')
    }
  }, [activeQuiz, profile?.id, questions.length, selectedAnswers, refreshLeaderboard, showNotice])

  // Anti-cheat listeners while quiz is active: Tab switch, Fullscreen exit, Browser Back
  useEffect(() => {
    if (quizScreen !== 'quiz') return

    const onVisibilityChange = () => {
      if (document.hidden && !submittingRef.current) {
        handleSubmitAttempt(true, 'Auto-submitted because you switched tabs or minimized the window.')
      }
    }

    const onFullscreenChange = () => {
      if (
        !document.fullscreenElement &&
        Date.now() - quizStartedAtRef.current > 1200 &&
        !submittingRef.current
      ) {
        handleSubmitAttempt(true, 'Auto-submitted because fullscreen mode was exited.')
      }
    }

    const onPopState = () => {
      if (!submittingRef.current) {
        handleSubmitAttempt(true, 'Auto-submitted because you navigated back.')
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    document.addEventListener('fullscreenchange', onFullscreenChange)
    window.addEventListener('popstate', onPopState)

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      document.removeEventListener('fullscreenchange', onFullscreenChange)
      window.removeEventListener('popstate', onPopState)
    }
  }, [quizScreen, handleSubmitAttempt])

  // Countdown timer effect for active quiz
  useEffect(() => {
    if (quizScreen !== 'quiz' || questions.length === 0) return

    if (timeLeft <= 0) {
      if (!submittingRef.current) {
        handleSubmitAttempt(true)
      }
      return
    }

    const timerId = setInterval(() => {
      setTimeLeft(prev => (prev <= 1 ? 0 : prev - 1))
    }, 1000)

    return () => clearInterval(timerId)
  }, [quizScreen, questions.length, timeLeft, handleSubmitAttempt])

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/student/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#03060f] text-white flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-xs text-neutral-400 font-mono">Loading Cosmic Dashboard...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white text-[#0A0A0A] flex flex-col font-sans select-none overflow-x-hidden">

      {/* 1. Welcome AlertCard Modal */}
      <AnimatePresence>
        {showWelcome && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/80 backdrop-blur-md">
            <AlertCard
              isVisible={showWelcome}
              title="Welcome to Quiz & Play"
              description="Participate in live skill quizzes, climb the real-time leaderboard and win exciting rewards."
              buttonText="Let's Go"
              onButtonClick={handleCloseWelcome}
              onDismiss={handleCloseWelcome}
              icon={<Sparkles className="h-6 w-6 text-indigo-400" />}
            />
          </div>
        )}
      </AnimatePresence>

      {/* 2. Top Header Bar (Laptop & Mobile) */}
      <header className="w-full border-b border-[#0A0A0A]/10 bg-white/90 backdrop-blur-xl sticky top-0 z-40 px-4 md:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#0A0A0A] flex items-center justify-center font-bold text-white shadow-sm">
            {(profile?.name || profile?.email || 'S')[0].toUpperCase()}
          </div>
          <div>
            <span className="text-[10px] md:text-[11px] font-bold tracking-widest uppercase text-[#439775] block">
              SkillFlow Student
            </span>
            <h1 className="text-base md:text-lg font-bold font-['Space_Grotesk'] text-[#0A0A0A] leading-tight">
              {profile?.name ? `Hey, ${profile.name}` : 'Student Portal'}
            </h1>
          </div>
        </div>

        {/* Desktop Dynamic Slide Pill Navbar in Header */}
        <div className="hidden md:flex items-center">
          <BottomNavBar
            items={navItems}
            activeIndex={activeTabIdx}
            onChange={setActiveTabIdx}
          />
        </div>

        {/* Quick Logout Button */}
        <button
          onClick={handleLogout}
          className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FF0F67]/15 hover:bg-[#FF0F67]/25 text-[#FF0F67] text-xs font-semibold transition-all cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" /> Logout
        </button>
      </header>

      {/* 3. Main Content: Mobile centered (max-w-md), Desktop wide responsive */}
      <main className="flex-1 w-full max-w-md md:max-w-5xl lg:max-w-6xl mx-auto px-4 md:px-8 py-6 pb-28 md:pb-12">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: HOME */}
          {currentTab === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-6"
            >
              <ColorfulBentoGrid
                totalScore={profile?.total_score ?? 0}
                myRank={leaderboard?.myRank ?? null}
                weeklyWinners={leaderboard?.weeklyWinners || []}
                playedCount={quizzes.filter(q => q.attempted).length}
                totalQuizzes={quizzes.length}
                availableCount={quizzes.filter(q => !q.attempted && q.isToday && scheduleStatus?.is_active).length}
                currentUserId={profile?.id}
                onOpenQuizzes={() => setActiveTabIdx(1)}
              />
            </motion.div>
          )}

          {/* TAB 2: QUIZ */}
          {currentTab === 'quiz' && (
            <motion.div
              key="quiz"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-5 max-w-3xl mx-auto"
            >
              {quizScreen === 'list' && (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-semibold text-[#0A0A0A]">Active Contests &amp; Quizzes</h2>
                      <p className="text-xs md:text-sm text-[#222222]/60 mt-1">
                        Only today&apos;s quizzes can be attempted once during the daily window
                      </p>
                    </div>
                    <span
                      className={`px-4 py-1.5 rounded-full text-xs font-semibold w-fit inline-flex items-center gap-1.5 ${
                        scheduleStatus?.is_active
                          ? 'bg-[#439775]/20 text-[#439775]'
                          : 'bg-[#FF0F67]/15 text-[#FF0F67]'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      {scheduleStatus?.is_active ? 'Window Active Now' : 'Window Closed (6:00 PM - 6:25 PM IST)'}
                    </span>
                  </div>

                  {quizNotice && (
                    <div className="p-4 rounded-xl bg-[#FF0F67]/15 text-[#0A0A0A] text-xs sm:text-sm font-semibold flex items-center gap-2.5">
                      <AlertCircle className="w-4 h-4 text-[#FF0F67] shrink-0" />
                      <span>{quizNotice}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {quizzes.map((q, idx) => {
                      const pastelBgs = ['bg-[#439775]/20', 'bg-[#454ADE]/20', 'bg-[#FFF07C]/25', 'bg-[#FF0F67]/20']
                      const hoverTilts = ['hover:rotate-1', 'hover:-rotate-1', 'hover:rotate-2', 'hover:-rotate-2']
                      const canPlay = !q.attempted && Boolean(q.isToday) && Boolean(scheduleStatus?.is_active)

                      let badgeText = `${q.duration_minutes || 8} min`
                      let subtitleText = 'Tap to start quiz (Fullscreen)'
                      if (q.attempted) {
                        badgeText = q.resultRevealed && q.score !== null ? `Score: ${q.score} pts` : 'Submitted'
                        subtitleText = q.resultRevealed ? 'Already attempted • Tap to view result' : 'Submitted • Results reveal after window ends'
                      } else if (!q.isToday) {
                        badgeText = 'Not Attempted'
                        subtitleText = 'Expired • Only today\'s quiz can be opened'
                      } else if (!scheduleStatus?.is_active) {
                        badgeText = 'Window Closed'
                        subtitleText = 'Locked • Opens during daily window'
                      }

                      return (
                        <div
                          key={q.id}
                          onClick={() => handleStartQuiz(q)}
                          className={`rounded-xl p-5 flex flex-col justify-between gap-4 transition-all duration-200 ease-in-out ${
                            canPlay
                              ? `${pastelBgs[idx % pastelBgs.length]} ${hoverTilts[idx % hoverTilts.length]} hover:scale-[1.03] hover:shadow-[-6px_6px_32px_8px_rgba(192,192,192,0.25)] cursor-pointer`
                              : q.attempted && q.attemptId
                              ? 'bg-[#f0f0f0] hover:bg-[#e8e8e8] cursor-pointer'
                              : 'bg-[#f0f0f0] opacity-75 cursor-not-allowed'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="-rotate-2 px-3.5 py-1 rounded-full bg-[#0A0A0A]/90 text-white text-xs font-semibold inline-flex items-center gap-1.5">
                              {q.attempted ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#36D399]" />
                              ) : canPlay ? (
                                <Zap className="w-3.5 h-3.5 text-[#FFF07C]" />
                              ) : (
                                <Lock className="w-3.5 h-3.5 text-[#FF0F67]" />
                              )}
                              {badgeText}
                            </span>
                            {canPlay || (q.attempted && q.attemptId) ? (
                              <ChevronRight className="w-5 h-5 text-[#0A0A0A]" />
                            ) : (
                              <Lock className="w-4 h-4 text-[#222222]/50" />
                            )}
                          </div>
                          <div>
                            <h4 className="text-lg font-bold text-[#0A0A0A]">{q.title}</h4>
                            <p className="text-xs mt-1 text-[#222222]/70 font-medium">{subtitleText}</p>
                          </div>
                        </div>
                      )
                    })}
                    {quizzes.length === 0 && (
                      <div className="sm:col-span-2 text-center py-12 rounded-xl bg-[#f0f0f0] text-[#222222]/60 text-sm font-medium">
                        No quizzes active currently. Check back soon!
                      </div>
                    )}
                  </div>
                </>
              )}

              {quizScreen === 'quiz' && questions.length > 0 && (
                <div
                  onContextMenu={e => e.preventDefault()}
                  onCopy={e => e.preventDefault()}
                  className="fixed inset-0 z-50 bg-white overflow-y-auto px-4 sm:px-8 py-6 select-none"
                >
                  <div className="max-w-3xl mx-auto flex flex-col gap-5 pb-10">
                    {/* Top Anti-Cheat Notice */}
                    <div className="px-4 py-2 rounded-full bg-[#FF0F67]/15 text-[#FF0F67] text-[11px] font-bold text-center">
                      Fullscreen Exam Mode Active — Do not switch tabs, press Back, or exit fullscreen (auto-submits immediately)
                    </div>

                    {/* Top Bar: Title + Countdown Timer (NO Back Button) */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <span className="text-[11px] uppercase font-bold text-[#454ADE] tracking-wider">
                          Question {currentQ + 1} of {questions.length}
                        </span>
                        <p className="text-base text-[#0A0A0A] font-bold truncate">{activeQuiz?.title}</p>
                      </div>

                      {/* Countdown Timer */}
                      <div
                        className={`px-4 py-2 rounded-full flex items-center gap-2 font-mono text-sm font-bold shrink-0 transition-colors ${
                          timeLeft <= 60
                            ? 'bg-[#FF0F67]/20 text-[#FF0F67] animate-pulse'
                            : 'bg-[#0A0A0A]/90 text-white'
                        }`}
                      >
                        <Clock className="w-4 h-4" />
                        <span>{formatTimer(timeLeft)}</span>
                      </div>
                    </div>

                    {/* Question Progress Pills */}
                    <div className="flex flex-wrap gap-1.5">
                      {questions.map((qItem, idx) => {
                        const isAnswered = selectedAnswers[qItem.id] !== undefined
                        const isCurrent = idx === currentQ
                        return (
                          <button
                            key={qItem.id}
                            type="button"
                            onClick={() => setCurrentQ(idx)}
                            className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              isCurrent
                                ? 'bg-[#0A0A0A] text-white scale-105'
                                : isAnswered
                                ? 'bg-[#439775]/25 text-[#0A0A0A]'
                                : 'bg-[#f0f0f0] text-[#222222]/70 hover:bg-[#e4e4e4]'
                            }`}
                          >
                            {idx + 1}
                          </button>
                        )
                      })}
                    </div>

                    {/* Question Box */}
                    <div className="rounded-xl p-6 bg-[#454ADE]/15">
                      <h3 className="text-base md:text-lg font-semibold text-[#0A0A0A] leading-relaxed">
                        {questions[currentQ].question_text}
                      </h3>
                    </div>

                    {/* Options */}
                    <div className="flex flex-col gap-3">
                      {questions[currentQ].options.map((opt, i) => {
                        const selected = selectedAnswers[questions[currentQ].id] === i
                        return (
                          <button
                            key={i}
                            onClick={() => setSelectedAnswers(prev => ({ ...prev, [questions[currentQ].id]: i }))}
                            className={`w-full p-4 md:p-5 rounded-xl text-left text-sm md:text-base flex items-center gap-3.5 transition-all duration-200 ease-in-out cursor-pointer ${
                              selected
                                ? 'bg-[#439775]/25 text-[#0A0A0A] ring-2 ring-[#439775] scale-[1.01]'
                                : 'bg-[#f0f0f0] text-[#0A0A0A] hover:bg-[#e6e6e6]'
                            }`}
                          >
                            <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                              selected ? 'bg-[#0A0A0A] text-white' : 'bg-white text-[#0A0A0A]'
                            }`}>
                              {String.fromCharCode(65 + i)}
                            </span>
                            <span className="flex-1 font-medium">{opt}</span>
                            {selected && <CheckCircle2 className="w-5 h-5 text-[#439775]" />}
                          </button>
                        )
                      })}
                    </div>

                    {/* Navigation Buttons (Previous / Next / Submit) */}
                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setCurrentQ(c => Math.max(0, c - 1))}
                        disabled={currentQ === 0}
                        className="px-5 py-3.5 rounded-full font-semibold text-sm bg-[#f0f0f0] hover:bg-[#e5e5e5] text-[#0A0A0A] disabled:opacity-40 cursor-pointer transition-colors"
                      >
                        Previous
                      </button>

                      {currentQ < questions.length - 1 ? (
                        <button
                          type="button"
                          onClick={() => setCurrentQ(c => c + 1)}
                          className="flex-1 py-3.5 rounded-full font-semibold text-sm bg-[#0A0A0A]/90 hover:bg-[#0A0A0A] text-white cursor-pointer transition-colors"
                        >
                          Next Question
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSubmitAttempt(false)}
                          disabled={submittingQuiz}
                          className="flex-1 py-3.5 rounded-full font-semibold text-sm bg-[#439775] hover:opacity-90 text-white disabled:opacity-40 cursor-pointer transition-opacity"
                        >
                          {submittingQuiz
                            ? 'Submitting...'
                            : `Submit Quiz (${Object.keys(selectedAnswers).length}/${questions.length} Answered)`}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {quizScreen === 'result' && quizResult && (
                <div className="py-4 flex flex-col gap-6">
                  {quizResult.delayed ? (
                    <div className="rounded-xl p-6 md:p-8 bg-[#454ADE]/15 text-center flex flex-col items-center gap-4">
                      <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-[#454ADE] shadow-sm">
                        <Clock className="w-9 h-9" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-[#0A0A0A]">
                          {quizResult.autoSubmitted ? 'Quiz Auto-Submitted' : 'Quiz Submitted!'}
                        </h3>
                        {quizResult.autoSubmitReason && (
                          <p className="text-xs font-semibold text-[#FF0F67] mt-1">{quizResult.autoSubmitReason}</p>
                        )}
                        <p className="text-sm md:text-base text-[#222222]/80 mt-2 font-medium">
                          {quizResult.revealMessage || 'Results will be revealed after the daily quiz window ends.'}
                        </p>
                      </div>
                      <button
                        onClick={() => setQuizScreen('list')}
                        className="w-full max-w-xs py-3.5 rounded-full font-semibold text-sm bg-[#0A0A0A]/90 hover:bg-[#0A0A0A] text-white cursor-pointer mt-2"
                      >
                        Back to Contests
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Top Summary Card */}
                      <div className="rounded-xl p-6 md:p-8 bg-[#439775]/20 text-center flex flex-col items-center gap-4">
                        <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center text-3xl font-extrabold text-[#0A0A0A] shadow-sm">
                          {quizResult.total > 0 ? Math.round((quizResult.score / quizResult.total) * 100) : 0}%
                        </div>
                        <div>
                          <h3 className="text-2xl md:text-3xl font-bold text-[#0A0A0A]">
                            {quizResult.autoSubmitted ? 'Quiz Auto-Submitted!' : 'Quiz Completed!'}
                          </h3>
                          {quizResult.autoSubmitReason && (
                            <p className="text-xs font-semibold text-[#FF0F67] mt-1">{quizResult.autoSubmitReason}</p>
                          )}
                          <p className="text-base md:text-lg text-[#222222]/80 mt-1 font-semibold">
                            <span className="text-[#439775]">{quizResult.score} / {quizResult.total}</span> correct
                          </p>
                        </div>

                        {/* Correct / Wrong / Skipped Badges */}
                        <div className="grid grid-cols-3 gap-2.5 w-full max-w-sm mt-1">
                          <div className="rounded-xl p-3 bg-white/80">
                            <span className="text-[11px] uppercase font-bold text-[#439775] block">Correct</span>
                            <span className="text-lg font-extrabold text-[#0A0A0A]">{quizResult.score}</span>
                          </div>
                          <div className="rounded-xl p-3 bg-white/80">
                            <span className="text-[11px] uppercase font-bold text-[#FF0F67] block">Wrong</span>
                            <span className="text-lg font-extrabold text-[#0A0A0A]">{quizResult.wrong}</span>
                          </div>
                          <div className="rounded-xl p-3 bg-white/80">
                            <span className="text-[11px] uppercase font-bold text-[#222222]/60 block">Skipped</span>
                            <span className="text-lg font-extrabold text-[#0A0A0A]">{quizResult.unanswered}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => setQuizScreen('list')}
                          className="w-full max-w-xs py-3.5 rounded-full font-semibold text-sm bg-[#0A0A0A]/90 hover:bg-[#0A0A0A] text-white cursor-pointer mt-2"
                        >
                          Back to Contests
                        </button>
                      </div>

                      {/* Question-by-Question Review */}
                      <div className="flex flex-col gap-3">
                        <h4 className="text-sm font-bold uppercase tracking-wider text-[#222222]/60">
                          Detailed Answer Review ({quizResult.review.length} Questions)
                        </h4>

                        {quizResult.review.map((item, idx) => (
                          <div
                            key={item.id}
                            className={`rounded-xl p-5 flex flex-col gap-3 ${
                              item.is_correct ? 'bg-[#439775]/15' : 'bg-[#FF0F67]/15'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <p className="text-sm md:text-base font-semibold text-[#0A0A0A] leading-snug">
                                <span className="text-[#222222]/60 font-bold mr-2">Q{idx + 1}.</span>
                                {item.question_text}
                              </p>
                              {item.is_correct ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white text-[#439775] text-[11px] font-bold shrink-0">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white text-[#FF0F67] text-[11px] font-bold shrink-0">
                                  <XCircle className="w-3.5 h-3.5" /> {item.selected_option === null ? 'Skipped' : 'Wrong'}
                                </span>
                              )}
                            </div>

                            <div className="flex flex-col gap-2">
                              {item.options.map((opt, optIdx) => {
                                const isSelected = item.selected_option === optIdx
                                const isCorrectOpt = item.correct_option === optIdx

                                let styleClass = 'bg-white/70 text-[#222222]/80'
                                let tag: string | null = null

                                if (isCorrectOpt) {
                                  styleClass = 'bg-[#439775]/25 ring-1 ring-[#439775] text-[#0A0A0A] font-semibold'
                                  tag = isSelected ? 'Your Answer (Correct)' : 'Correct Answer'
                                } else if (isSelected && !item.is_correct) {
                                  styleClass = 'bg-[#FF0F67]/20 ring-1 ring-[#FF0F67] text-[#0A0A0A] font-semibold'
                                  tag = 'Your Answer (Wrong)'
                                }

                                return (
                                  <div
                                    key={optIdx}
                                    className={`px-3.5 py-2.5 rounded-xl text-xs md:text-sm flex items-center justify-between gap-2 ${styleClass}`}
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <span className="font-bold shrink-0">{String.fromCharCode(65 + optIdx)}.</span>
                                      <span className="truncate">{opt}</span>
                                    </div>
                                    {tag && (
                                      <span className={`text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                                        isCorrectOpt ? 'text-[#439775]' : 'text-[#FF0F67]'
                                      }`}>
                                        {tag}
                                      </span>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 3: COMMUNITY */}
          {currentTab === 'community' && (
            <motion.div
              key="community"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-5 max-w-3xl mx-auto"
            >
              <div>
                <h2 className="text-2xl sm:text-3xl font-semibold text-[#0A0A0A]">Official Announcements</h2>
                <p className="text-xs md:text-sm text-[#222222]/60 mt-1">Updates from SkillFlow Instructors</p>
              </div>

              <div className="flex flex-col gap-4">
                {communityMessages.map((m, idx) => {
                  const bgs = ['bg-[#454ADE]/15', 'bg-[#439775]/15', 'bg-[#FFF07C]/25', 'bg-[#f0f0f0]']
                  return (
                    <div
                      key={m.id}
                      className={`rounded-xl p-5 flex flex-col gap-3 transition-all duration-200 ease-in-out hover:scale-[1.01] hover:rotate-1 hover:shadow-[-6px_6px_32px_8px_rgba(192,192,192,0.25)] ${bgs[idx % bgs.length]}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="-rotate-2 text-[11px] font-semibold px-3.5 py-1 rounded-full bg-[#0A0A0A]/90 text-white uppercase tracking-wider">
                          SkillFlow Admin
                        </span>
                        <span className="text-xs font-medium text-[#222222]/60">
                          {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm md:text-base text-[#0A0A0A] leading-relaxed whitespace-pre-wrap font-medium">{m.message}</p>
                    </div>
                  )
                })}
                {communityMessages.length === 0 && (
                  <div className="text-center py-12 rounded-xl bg-[#f0f0f0] text-[#222222]/60 text-sm font-medium">
                    No announcements broadcast yet.
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 4: REWARDS */}
          {currentTab === 'rewards' && (
            <motion.div
              key="rewards"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-5 max-w-3xl mx-auto"
            >
              <div>
                <h2 className="text-2xl sm:text-3xl font-semibold text-[#0A0A0A]">Earned Badges &amp; Rewards</h2>
                <p className="text-xs md:text-sm text-[#222222]/60 mt-1">Unlock certificates as your score increases</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl p-6 bg-[#FFF07C]/25 hover:scale-105 hover:rotate-2 hover:shadow-[-6px_6px_32px_8px_rgba(192,192,192,0.25)] transition-all duration-200 ease-in-out flex flex-col justify-between gap-4 min-h-[200px]">
                  <div className="flex items-center justify-between">
                    <span className="-rotate-2 px-4 py-1 rounded-full bg-[#0A0A0A]/90 text-white text-xs font-semibold">
                      {leaderboard?.myRank && leaderboard.myRank <= 3 ? 'Unlocked' : 'In Progress'}
                    </span>
                    <Trophy className="w-6 h-6 text-[#0A0A0A] rotate-12" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-[#0A0A0A]">Quiz Champion</h4>
                    <p className="text-xs text-[#222222]/70 mt-1 font-medium">Reach Top 3 on the global leaderboard</p>
                  </div>
                </div>

                <div className="rounded-xl p-6 bg-[#439775]/20 hover:scale-105 hover:-rotate-2 hover:shadow-[-6px_6px_32px_8px_rgba(192,192,192,0.25)] transition-all duration-200 ease-in-out flex flex-col justify-between gap-4 min-h-[200px]">
                  <div className="flex items-center justify-between">
                    <span className="rotate-2 px-4 py-1 rounded-full bg-[#0A0A0A]/90 text-white text-xs font-semibold">
                      {(profile?.total_score || 0) >= 100 ? 'Unlocked' : `${profile?.total_score || 0}/100 pts`}
                    </span>
                    <Sparkles className="w-6 h-6 text-[#439775] -rotate-12" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-[#0A0A0A]">Course Certified</h4>
                    <p className="text-xs text-[#222222]/70 mt-1 font-medium">Earn 100+ points across quizzes</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 5: PROFILE / SETTINGS */}
          {currentTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-5 max-w-xl mx-auto"
            >
              <div>
                <h2 className="text-2xl sm:text-3xl font-semibold text-[#0A0A0A]">Student Profile</h2>
                <p className="text-xs md:text-sm text-[#222222]/60 mt-1">Your student session details</p>
              </div>

              <div className="rounded-xl p-6 bg-[#454ADE]/15 hover:scale-[1.01] hover:rotate-1 hover:shadow-[-6px_6px_32px_8px_rgba(192,192,192,0.25)] transition-all duration-200 ease-in-out flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#0A0A0A]/90 text-white flex items-center justify-center font-bold text-xl">
                    {(profile?.name || 'S')[0].toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-[#0A0A0A]">{profile?.name || 'SkillFlow Student'}</h4>
                    <span className="-rotate-2 inline-block mt-1 text-[10px] font-bold uppercase tracking-wider text-white bg-[#454ADE] px-3 py-0.5 rounded-full">
                      {profile?.role || 'student'}
                    </span>
                  </div>
                </div>

                <div className="border-t border-[#0A0A0A]/10 pt-4 flex flex-col gap-3 text-xs md:text-sm text-[#0A0A0A] font-medium">
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-[#454ADE]" />
                    <span>{profile?.email}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Shield className="w-4 h-4 text-[#439775]" />
                    <span>Verified Student Account</span>
                  </div>
                </div>
              </div>

              {/* Logout */}
              <div className="pt-1">
                {!showLogoutConfirm ? (
                  <button
                    onClick={() => setShowLogoutConfirm(true)}
                    className="w-full py-3.5 rounded-full font-semibold text-sm bg-[#FF0F67]/15 hover:bg-[#FF0F67]/25 text-[#0A0A0A] flex items-center justify-center gap-2 cursor-pointer transition-all duration-200"
                  >
                    <LogOut className="w-4 h-4 text-[#FF0F67]" /> Logout from Session
                  </button>
                ) : (
                  <div className="p-5 rounded-xl bg-[#FF0F67]/15 text-center flex flex-col gap-3">
                    <p className="text-xs md:text-sm font-medium text-[#0A0A0A]">Are you sure you want to log out?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowLogoutConfirm(false)}
                        className="flex-1 py-2.5 rounded-full bg-white text-[#0A0A0A] text-xs font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleLogout}
                        className="flex-1 py-2.5 rounded-full bg-[#FF0F67] text-white text-xs font-bold cursor-pointer"
                      >
                        Confirm Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* 4. Floating Pill Bottom Navigation (Phone par dikhega, slide width expansion animation ke saath) */}
      <div className="md:hidden">
        <BottomNavBar
          items={navItems}
          activeIndex={activeTabIdx}
          onChange={setActiveTabIdx}
          stickyBottom={true}
        />
      </div>

    </div>
  )
}
