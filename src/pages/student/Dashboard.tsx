import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { getLeaderboard, getMyRank, type RankedStudent } from '@/lib/leaderboard'
import { 
  Home, Zap, MessageSquare, Trophy, Star, TrendingUp, 
  CheckCircle2, XCircle, ArrowLeft, Loader2, Sparkles, LogOut, 
  Mail, Shield, ChevronRight, Lock, User, Clock
} from 'lucide-react'
import BottomNavBar, { type NavItem } from '@/components/ui/bottom-nav-bar'
import { AlertCard } from '@/components/ui/card-8'

type TabId = 'home' | 'quiz' | 'community' | 'rewards' | 'settings'

interface QuizReviewItem {
  id: string
  question_text: string
  options: string[]
  selected_option: number | null
  correct_option: number
  is_correct: boolean
}

interface QuizResultData {
  score: number
  total: number
  wrong: number
  unanswered: number
  autoSubmitted?: boolean
  review: QuizReviewItem[]
}

interface Quiz {
  id: string
  title: string
  duration_minutes?: number
  created_at: string
  attempted?: boolean
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

const medals = [
  { label: '1st', color: '#f59e0b', emoji: '🥇' },
  { label: '2nd', color: '#94a3b8', emoji: '🥈' },
  { label: '3rd', color: '#b45309', emoji: '🥉' },
]

export default function StudentDashboard() {
  const navigate = useNavigate()
  const [activeTabIdx, setActiveTabIdx] = useState(0)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showWelcome, setShowWelcome] = useState(false)

  // Leaderboard
  const [leaderboard, setLeaderboard] = useState<{ top3: RankedStudent[]; myRank: number | null; myScore: number } | null>(null)

  // Quiz State
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQ, setCurrentQ] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({})
  const [quizScreen, setQuizScreen] = useState<'list' | 'quiz' | 'result'>('list')
  const [quizResult, setQuizResult] = useState<QuizResultData | null>(null)
  const [submittingQuiz, setSubmittingQuiz] = useState(false)
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const submittingRef = useRef(false)

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

      // Fetch leaderboard using SQL RANK() helper
      const [{ top3 }, myStanding] = await Promise.all([
        getLeaderboard(),
        getMyRank(user.id),
      ])

      setLeaderboard({
        top3,
        myRank: myStanding.rank,
        myScore: myStanding.total_score ?? currentProf.total_score ?? 0,
      })

      // Fetch quizzes
      const { data: qzList } = await supabase
        .from('quizzes')
        .select('id, title, duration_minutes, created_at')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      const { data: attempts } = await supabase
        .from('attempts')
        .select('quiz_id, score')
        .eq('student_id', user.id)

      const attemptMap = new Map(attempts?.map(a => [a.quiz_id, a.score]) || [])
      setQuizzes((qzList || []).map(q => ({
        ...q,
        attempted: attemptMap.has(q.id),
        score: attemptMap.get(q.id) ?? null
      })))

      // Fetch community messages
      const { data: msgs } = await supabase
        .from('community_messages')
        .select('id, message, created_at')
        .order('created_at', { ascending: false })
        .limit(20)

      setCommunityMessages(msgs || [])

      setLoading(false)
    }

    init()
  }, [navigate])

  const refreshLeaderboard = useCallback(async (studentId: string) => {
    const [{ top3 }, myStanding] = await Promise.all([
      getLeaderboard(),
      getMyRank(studentId),
    ])
    setLeaderboard({
      top3,
      myRank: myStanding.rank,
      myScore: myStanding.total_score,
    })
  }, [])

  const refreshQuizzes = useCallback(async (studentId: string) => {
    const [{ data: qzList }, { data: attempts }] = await Promise.all([
      supabase
        .from('quizzes')
        .select('id, title, duration_minutes, created_at')
        .eq('is_active', true)
        .order('created_at', { ascending: false }),
      supabase
        .from('attempts')
        .select('quiz_id, score')
        .eq('student_id', studentId),
    ])

    const attemptMap = new Map(attempts?.map(a => [a.quiz_id, a.score]) || [])
    setQuizzes((qzList || []).map(q => ({
      ...q,
      attempted: attemptMap.has(q.id),
      score: attemptMap.get(q.id) ?? null
    })))
  }, [])

  // Refresh quizzes or leaderboard when switching tabs
  useEffect(() => {
    if (!profile?.id) return
    if (currentTab === 'quiz' && quizScreen === 'list') {
      refreshQuizzes(profile.id)
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
      // 1. Save in localStorage immediately (instant lock on device)
      localStorage.setItem(`has_seen_welcome_${profile.id}`, 'true')
      
      // 2. Persist in Supabase Database permanently
      await supabase.from('profiles').update({ has_seen_welcome: true }).eq('id', profile.id)
      setProfile((prev: any) => ({ ...prev, has_seen_welcome: true }))
    }
  }

  const handleStartQuiz = async (quiz: Quiz) => {
    if (quiz.attempted) return
    submittingRef.current = false
    setActiveQuiz(quiz)
    const { data: qs } = await supabase
      .from('questions')
      .select('id, question_text, options, correct_option')
      .eq('quiz_id', quiz.id)

    setQuestions(qs || [])
    setSelectedAnswers({})
    setCurrentQ(0)
    setTimeLeft((quiz.duration_minutes || 8) * 60)
    setQuizScreen('quiz')
  }

  const handleSubmitAttempt = useCallback(async (isAutoSubmit = false) => {
    if (!activeQuiz || !profile?.id || submittingRef.current) return
    submittingRef.current = true
    setSubmittingQuiz(true)

    let score = 0
    let wrong = 0
    let unanswered = 0

    const review: QuizReviewItem[] = questions.map(q => {
      const selectedOpt = selectedAnswers[q.id] !== undefined ? selectedAnswers[q.id] : null
      const isCorrect = selectedOpt === q.correct_option
      if (selectedOpt === null) {
        unanswered++
      } else if (isCorrect) {
        score++
      } else {
        wrong++
      }
      return {
        id: q.id,
        question_text: q.question_text,
        options: q.options,
        selected_option: selectedOpt,
        correct_option: q.correct_option,
        is_correct: isCorrect,
      }
    })

    // Save attempt with answers jsonb; fallback without answers if column not migrated yet
    let { error } = await supabase.from('attempts').insert({
      student_id: profile.id,
      quiz_id: activeQuiz.id,
      score,
      answers: selectedAnswers,
    })

    if (error && error.message?.toLowerCase().includes('answers')) {
      const fallbackRes = await supabase.from('attempts').insert({
        student_id: profile.id,
        quiz_id: activeQuiz.id,
        score,
      })
      error = fallbackRes.error
    }

    setSubmittingQuiz(false)
    if (!error) {
      setQuizResult({
        score,
        total: questions.length,
        wrong,
        unanswered,
        autoSubmitted: isAutoSubmit,
        review,
      })
      setQuizScreen('result')
      setProfile((prev: any) => ({ ...prev, total_score: (prev.total_score || 0) + score }))
      setQuizzes(prev => prev.map(q => q.id === activeQuiz.id ? { ...q, attempted: true, score } : q))
      // Refresh leaderboard immediately after score update
      refreshLeaderboard(profile.id)
    } else {
      submittingRef.current = false
    }
  }, [activeQuiz, profile?.id, questions, selectedAnswers, refreshLeaderboard])

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
    <div className="min-h-screen bg-[#03060f] text-slate-100 flex flex-col font-sans select-none overflow-x-hidden">

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
      <header className="w-full border-b border-white/[0.08] bg-[#070d1a]/80 backdrop-blur-xl sticky top-0 z-40 px-4 md:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-500/20">
            {(profile?.name || profile?.email || 'S')[0].toUpperCase()}
          </div>
          <div>
            <span className="text-[10px] md:text-[11px] font-bold tracking-widest uppercase text-indigo-400 block">
              SkillFlow Student
            </span>
            <h1 className="text-base md:text-lg font-bold font-['Space_Grotesk'] text-white leading-tight">
              {profile?.name ? `Hey, ${profile.name} 👋` : 'Student Portal'}
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
          className="hidden md:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-semibold transition-all cursor-pointer"
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
              {/* Score Hero Banner */}
              <div className="rounded-3xl p-6 md:p-8 relative overflow-hidden bg-gradient-to-br from-indigo-950/60 via-purple-950/30 to-black/80 border border-indigo-500/25 shadow-[0_0_35px_rgba(99,102,241,0.12)]">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Your Total Score</span>
                    <div className="text-5xl md:text-6xl font-extrabold font-['Space_Grotesk'] bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-300 bg-clip-text text-transparent mt-1">
                      {profile?.total_score ?? 0}
                    </div>
                    <p className="text-xs md:text-sm text-indigo-300 mt-2 font-medium">
                      {leaderboard?.myRank ? `Overall Rank #${leaderboard.myRank}` : 'Participate to rank!'}
                    </p>
                  </div>

                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Trophy className="w-8 h-8 md:w-10 md:h-10" />
                  </div>
                </div>

                {/* Progress */}
                <div className="mt-6">
                  <div className="flex justify-between text-xs font-semibold mb-2 text-slate-300">
                    <span>Rank Progress</span>
                    <span className="text-indigo-400">{Math.min(profile?.total_score || 0, 100)} / 100 pts</span>
                  </div>
                  <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(((profile?.total_score || 0) / 100) * 100, 100)}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                    />
                  </div>
                </div>
              </div>

              {/* Responsive Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="md:col-span-2 flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-2xl p-5 bg-white/[0.03] border border-white/[0.07] flex flex-col gap-2">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                        <Star className="w-5 h-5" />
                      </div>
                      <span className="text-2xl md:text-3xl font-bold font-['Space_Grotesk'] text-white">{profile?.total_score ?? 0}</span>
                      <span className="text-xs text-slate-400">Quiz Points</span>
                    </div>

                    <div className="rounded-2xl p-5 bg-white/[0.03] border border-white/[0.07] flex flex-col gap-2">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <span className="text-2xl md:text-3xl font-bold font-['Space_Grotesk'] text-white">#{leaderboard?.myRank ?? 1}</span>
                      <span className="text-xs text-slate-400">Current Standing</span>
                    </div>
                  </div>

                  {/* Active Quizzes */}
                  <div className="rounded-2xl p-6 bg-white/[0.03] border border-white/[0.07]">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-indigo-400" />
                        <h3 className="text-base font-bold font-['Space_Grotesk'] text-white">Active Contests</h3>
                      </div>
                      <button onClick={() => setActiveTabIdx(1)} className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer">
                        View All →
                      </button>
                    </div>

                    <div className="flex flex-col gap-3">
                      {quizzes.slice(0, 3).map((q) => (
                        <div
                          key={q.id}
                          onClick={() => !q.attempted && handleStartQuiz(q)}
                          className={`rounded-xl p-3.5 border flex items-center gap-3 transition-all ${
                            q.attempted
                              ? 'bg-emerald-950/20 border-emerald-500/30 opacity-75'
                              : 'bg-white/[0.02] border-white/[0.06] hover:border-indigo-500/40 cursor-pointer'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            q.attempted ? 'bg-emerald-500/10 text-emerald-400' : 'bg-indigo-500/10 text-indigo-400'
                          }`}>
                            {q.attempted ? <CheckCircle2 className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-white">{q.title}</h4>
                            <p className="text-xs text-slate-400">
                              {q.attempted ? `Completed • Score: ${q.score} pts` : 'Ready to start'}
                            </p>
                          </div>
                          {!q.attempted ? <ChevronRight className="w-4 h-4 text-slate-400" /> : <Lock className="w-4 h-4 text-emerald-400" />}
                        </div>
                      ))}
                      {quizzes.length === 0 && (
                        <p className="text-xs text-slate-500 py-3 text-center">No quizzes active right now.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Col: Leaderboard */}
                <div className="rounded-3xl bg-white/[0.03] border border-white/[0.07] p-6 h-fit flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-amber-400" />
                      <h3 className="text-base font-bold font-['Space_Grotesk'] text-white">Top 3 Leaderboard</h3>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      Live
                    </span>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    {(leaderboard?.top3 || []).map((entry, idx) => {
                      const badgeStyles = [
                        'bg-amber-500/15 border-amber-400/40 text-amber-300',
                        'bg-slate-400/15 border-slate-300/30 text-slate-200',
                        'bg-orange-600/15 border-orange-500/30 text-orange-300',
                      ]
                      return (
                        <div
                          key={entry.id}
                          className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                            entry.id === profile?.id
                              ? 'bg-indigo-500/15 border-indigo-400/40'
                              : 'bg-white/[0.02] border-white/[0.06]'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-9 h-9 rounded-xl border flex items-center justify-center text-sm font-extrabold shrink-0 ${badgeStyles[idx] || badgeStyles[2]}`}>
                              {medals[idx]?.emoji || `#${entry.rank}`}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-white truncate">
                                {entry.name || 'Student'}
                                {entry.id === profile?.id && (
                                  <span className="ml-1.5 text-[10px] text-indigo-300 font-bold">(You)</span>
                                )}
                              </p>
                              <p className="text-[11px] text-slate-400">
                                Rank #{entry.rank} • {medals[idx]?.label || `${entry.rank}th`}
                              </p>
                            </div>
                          </div>
                          <span className="text-sm font-bold font-['Space_Grotesk'] text-amber-400 shrink-0">
                            {entry.total_score} pts
                          </span>
                        </div>
                      )
                    })}
                    {(leaderboard?.top3 || []).length === 0 && (
                      <p className="text-xs text-slate-500 text-center py-4">No scores yet. Take a quiz to top the board!</p>
                    )}
                  </div>

                  {/* Current Student's Own Rank Card */}
                  <div className="rounded-2xl p-4 bg-gradient-to-r from-indigo-500/15 to-purple-500/15 border border-indigo-400/30 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider font-bold text-indigo-300 block">
                        Your Standing
                      </span>
                      <p className="text-sm font-bold text-white mt-0.5">
                        Your Rank: #{leaderboard?.myRank ?? '—'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">
                        Score
                      </span>
                      <span className="text-base font-extrabold font-['Space_Grotesk'] text-indigo-300">
                        {leaderboard?.myScore ?? profile?.total_score ?? 0} pts
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: QUIZ */}
          {currentTab === 'quiz' && (
            <motion.div
              key="quiz"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-5 max-w-2xl mx-auto"
            >
              {quizScreen === 'list' && (
                <>
                  <div>
                    <h2 className="text-xl font-bold font-['Space_Grotesk'] text-white">Active Contests & Quizzes</h2>
                    <p className="text-xs md:text-sm text-slate-400 mt-1">Attempt once to record your score on the leaderboard</p>
                  </div>

                  <div className="flex flex-col gap-3">
                    {quizzes.map((q) => (
                      <div
                        key={q.id}
                        onClick={() => !q.attempted && handleStartQuiz(q)}
                        className={`rounded-2xl p-4 md:p-5 border flex items-center gap-4 transition-all ${
                          q.attempted
                            ? 'bg-emerald-950/20 border-emerald-500/30 opacity-75 cursor-default'
                            : 'bg-white/[0.03] border-white/[0.07] hover:border-indigo-500/40 cursor-pointer active:scale-[0.99]'
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                          q.attempted ? 'bg-emerald-500/10 text-emerald-400' : 'bg-indigo-500/10 text-indigo-400'
                        }`}>
                          {q.attempted ? <CheckCircle2 className="w-6 h-6" /> : <Zap className="w-6 h-6" />}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-base font-bold text-white">{q.title}</h4>
                          <p className="text-xs mt-1 text-slate-400">
                            {q.attempted
                              ? `Already attempted • Score: ${q.score} pts`
                              : `Ready to attempt • ${q.duration_minutes || 8} min`}
                          </p>
                        </div>
                        {!q.attempted ? <ChevronRight className="w-5 h-5 text-slate-400" /> : <Lock className="w-4 h-4 text-emerald-400" />}
                      </div>
                    ))}
                    {quizzes.length === 0 && (
                      <div className="text-center py-10 text-slate-500 text-sm">No quizzes active currently. Check back soon!</div>
                    )}
                  </div>
                </>
              )}

              {quizScreen === 'quiz' && questions.length > 0 && (
                <div className="flex flex-col gap-5">
                  {/* Top Bar: Back + Title + Countdown Timer */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={() => setQuizScreen('list')}
                        className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 cursor-pointer shrink-0"
                        title="Back to quiz list"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                      <div className="min-w-0">
                        <span className="text-[11px] uppercase font-bold text-indigo-400 tracking-wider">
                          Question {currentQ + 1} of {questions.length}
                        </span>
                        <p className="text-sm text-slate-200 font-semibold truncate">{activeQuiz?.title}</p>
                      </div>
                    </div>

                    {/* Countdown Timer */}
                    <div
                      className={`px-3.5 py-2 rounded-xl border flex items-center gap-2 font-mono text-sm font-bold shrink-0 transition-colors ${
                        timeLeft <= 60
                          ? 'bg-red-500/15 border-red-500/40 text-red-400 animate-pulse'
                          : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
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
                          className={`w-8 h-8 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                            isCurrent
                              ? 'bg-indigo-500 border-indigo-400 text-white shadow-[0_0_10px_rgba(99,102,241,0.4)]'
                              : isAnswered
                              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                              : 'bg-white/[0.03] border-white/10 text-slate-400 hover:bg-white/[0.08]'
                          }`}
                        >
                          {idx + 1}
                        </button>
                      )
                    })}
                  </div>

                  {/* Question Box */}
                  <div className="rounded-2xl p-6 bg-white/[0.03] border border-white/[0.08]">
                    <h3 className="text-base md:text-lg font-medium text-white leading-relaxed">
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
                          className={`w-full p-4 md:p-5 rounded-2xl text-left text-sm md:text-base flex items-center gap-3.5 border transition-all cursor-pointer ${
                            selected
                              ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                              : 'bg-white/[0.02] border-white/[0.07] text-slate-300 hover:bg-white/[0.05]'
                          }`}
                        >
                          <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            selected ? 'bg-indigo-500 text-white' : 'bg-white/5 text-slate-400'
                          }`}>
                            {String.fromCharCode(65 + i)}
                          </span>
                          <span className="flex-1">{opt}</span>
                          {selected && <CheckCircle2 className="w-5 h-5 text-indigo-400" />}
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
                      className="px-5 py-3.5 rounded-xl font-bold text-sm bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 disabled:opacity-30 cursor-pointer transition-colors"
                    >
                      ← Previous
                    </button>

                    {currentQ < questions.length - 1 ? (
                      <button
                        type="button"
                        onClick={() => setCurrentQ(c => c + 1)}
                        className="flex-1 py-3.5 rounded-xl font-bold text-sm bg-white/10 hover:bg-white/15 text-white cursor-pointer transition-colors"
                      >
                        Next Question →
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSubmitAttempt(false)}
                        disabled={submittingQuiz}
                        className="flex-1 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-600 to-purple-600 text-white disabled:opacity-40 cursor-pointer shadow-lg shadow-indigo-600/25"
                      >
                        {submittingQuiz
                          ? 'Submitting...'
                          : `Submit Quiz (${Object.keys(selectedAnswers).length}/${questions.length} Answered)`}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {quizScreen === 'result' && quizResult && (
                <div className="py-6 flex flex-col gap-6">
                  {/* Top Summary Card */}
                  <div className="rounded-3xl p-6 md:p-8 bg-white/[0.03] border border-white/[0.08] text-center flex flex-col items-center gap-4">
                    <div className="w-24 h-24 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center text-3xl font-extrabold text-emerald-400 font-['Space_Grotesk'] shadow-[0_0_40px_rgba(34,197,94,0.15)]">
                      {quizResult.total > 0 ? Math.round((quizResult.score / quizResult.total) * 100) : 0}%
                    </div>
                    <div>
                      <h3 className="text-2xl md:text-3xl font-bold font-['Space_Grotesk'] text-white">
                        {quizResult.autoSubmitted ? "Time's Up! Quiz Auto-Submitted" : 'Quiz Completed!'}
                      </h3>
                      <p className="text-base md:text-lg text-slate-200 mt-1 font-semibold">
                        <span className="text-emerald-400">{quizResult.score} / {quizResult.total}</span> correct
                      </p>
                    </div>

                    {/* Correct / Wrong / Skipped Badges */}
                    <div className="grid grid-cols-3 gap-2.5 w-full max-w-sm mt-1">
                      <div className="rounded-xl p-3 bg-emerald-500/10 border border-emerald-500/20">
                        <span className="text-[11px] uppercase font-bold text-emerald-400 block">Correct</span>
                        <span className="text-lg font-extrabold text-white">{quizResult.score}</span>
                      </div>
                      <div className="rounded-xl p-3 bg-red-500/10 border border-red-500/20">
                        <span className="text-[11px] uppercase font-bold text-red-400 block">Wrong</span>
                        <span className="text-lg font-extrabold text-white">{quizResult.wrong}</span>
                      </div>
                      <div className="rounded-xl p-3 bg-slate-500/10 border border-slate-500/20">
                        <span className="text-[11px] uppercase font-bold text-slate-400 block">Skipped</span>
                        <span className="text-lg font-extrabold text-white">{quizResult.unanswered}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setQuizScreen('list')}
                      className="w-full max-w-xs py-3.5 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer mt-2"
                    >
                      Back to Contests
                    </button>
                  </div>

                  {/* Question-by-Question Review */}
                  <div className="flex flex-col gap-3">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                      Detailed Answer Review ({quizResult.review.length} Questions)
                    </h4>

                    {quizResult.review.map((item, idx) => (
                      <div
                        key={item.id}
                        className={`rounded-2xl p-5 border flex flex-col gap-3 ${
                          item.is_correct
                            ? 'bg-emerald-950/15 border-emerald-500/25'
                            : 'bg-red-950/15 border-red-500/25'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm md:text-base font-medium text-white leading-snug">
                            <span className="text-slate-400 font-bold mr-2">Q{idx + 1}.</span>
                            {item.question_text}
                          </p>
                          {item.is_correct ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-[11px] font-bold shrink-0">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/15 text-red-400 text-[11px] font-bold shrink-0">
                              <XCircle className="w-3.5 h-3.5" /> {item.selected_option === null ? 'Skipped' : 'Wrong'}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-col gap-2">
                          {item.options.map((opt, optIdx) => {
                            const isSelected = item.selected_option === optIdx
                            const isCorrectOpt = item.correct_option === optIdx

                            let styleClass = 'bg-white/[0.02] border-white/[0.06] text-slate-400'
                            let tag: string | null = null

                            if (isCorrectOpt) {
                              styleClass = 'bg-emerald-500/15 border-emerald-500/50 text-emerald-200 font-medium'
                              tag = isSelected ? 'Your Answer ✓' : 'Correct Answer ✓'
                            } else if (isSelected && !item.is_correct) {
                              styleClass = 'bg-red-500/15 border-red-500/50 text-red-200 font-medium'
                              tag = 'Your Answer ✗'
                            }

                            return (
                              <div
                                key={optIdx}
                                className={`px-3.5 py-2.5 rounded-xl border text-xs md:text-sm flex items-center justify-between gap-2 ${styleClass}`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span className="font-bold shrink-0">{String.fromCharCode(65 + optIdx)}.</span>
                                  <span className="truncate">{opt}</span>
                                </div>
                                {tag && (
                                  <span className={`text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                                    isCorrectOpt ? 'text-emerald-400' : 'text-red-400'
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
              className="flex flex-col gap-4 max-w-2xl mx-auto"
            >
              <div>
                <h2 className="text-xl font-bold font-['Space_Grotesk'] text-white">Official Announcements</h2>
                <p className="text-xs md:text-sm text-slate-400">Updates from SkillFlow Instructors</p>
              </div>

              <div className="flex flex-col gap-3">
                {communityMessages.map((m) => (
                  <div key={m.id} className="rounded-2xl p-5 bg-white/[0.03] border border-white/[0.07] flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 uppercase">
                        SkillFlow Admin
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm md:text-base text-slate-200 leading-relaxed whitespace-pre-wrap">{m.message}</p>
                  </div>
                ))}
                {communityMessages.length === 0 && (
                  <div className="text-center py-10 text-slate-500 text-sm">No announcements broadcast yet.</div>
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
              className="flex flex-col gap-5 max-w-2xl mx-auto"
            >
              <div>
                <h2 className="text-xl font-bold font-['Space_Grotesk'] text-white">Earned Badges & Rewards</h2>
                <p className="text-xs md:text-sm text-slate-400">Unlock certificates as your score increases</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl p-5 bg-white/[0.03] border border-amber-500/30 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-2xl">
                    🏆
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">Quiz Champion</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Top 3 on Leaderboard</p>
                    <span className="text-[10px] font-bold text-amber-400 uppercase mt-1 inline-block">
                      {leaderboard?.myRank && leaderboard.myRank <= 3 ? 'Unlocked ✓' : 'In Progress'}
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl p-5 bg-white/[0.03] border border-indigo-500/30 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center text-2xl">
                    🎓
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">Course Certified</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Reach 100+ points</p>
                    <span className="text-[10px] font-bold text-indigo-400 uppercase mt-1 inline-block">
                      {(profile?.total_score || 0) >= 100 ? 'Unlocked ✓' : `${profile?.total_score || 0}/100 pts`}
                    </span>
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
              className="flex flex-col gap-4 max-w-xl mx-auto"
            >
              <div>
                <h2 className="text-xl font-bold font-['Space_Grotesk'] text-white">Student Profile</h2>
                <p className="text-xs md:text-sm text-slate-400">Your student session details</p>
              </div>

              <div className="rounded-2xl p-6 bg-white/[0.03] border border-white/[0.07] flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-xl">
                    {(profile?.name || 'S')[0].toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">{profile?.name || 'SkillFlow Student'}</h4>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                      {profile?.role || 'student'}
                    </span>
                  </div>
                </div>

                <div className="border-t border-white/[0.06] pt-4 flex flex-col gap-3 text-xs md:text-sm text-slate-300">
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span>{profile?.email}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Shield className="w-4 h-4 text-slate-400" />
                    <span>Verified Student Account</span>
                  </div>
                </div>
              </div>

              {/* Logout */}
              <div className="pt-2">
                {!showLogoutConfirm ? (
                  <button
                    onClick={() => setShowLogoutConfirm(true)}
                    className="w-full py-3.5 rounded-xl font-bold text-sm bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <LogOut className="w-4 h-4" /> Logout from Session
                  </button>
                ) : (
                  <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/20 text-center flex flex-col gap-3">
                    <p className="text-xs md:text-sm text-red-300">Are you sure you want to log out?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowLogoutConfirm(false)}
                        className="flex-1 py-2.5 rounded-xl bg-white/5 text-white text-xs font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleLogout}
                        className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold cursor-pointer"
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
