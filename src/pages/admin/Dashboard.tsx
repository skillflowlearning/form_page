import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { getLeaderboard, type RankedStudent } from '@/lib/leaderboard'
import { 
  Home, Zap, MessageSquare, Settings, Users, 
  UserPlus, LogOut, Loader2, CheckCircle2, AlertCircle,
  Plus, Trash2, Clock, Trophy, ChevronDown, ChevronUp
} from 'lucide-react'
import BottomNavBar, { type NavItem } from '@/components/ui/bottom-nav-bar'

type AdminTab = 'overview' | 'quizzes' | 'broadcast' | 'users' | 'settings'

interface QuestionDraft {
  question_text: string
  options: [string, string, string, string]
  correct_option: number
}

const createEmptyQuestion = (): QuestionDraft => ({
  question_text: '',
  options: ['', '', '', ''],
  correct_option: 0,
})

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [activeTabIdx, setActiveTabIdx] = useState(0)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Stats
  const [stats, setStats] = useState({ students: 0, quizzes: 0 })
  const [leaderboard, setLeaderboard] = useState<RankedStudent[]>([])
  const [allRanked, setAllRanked] = useState<RankedStudent[]>([])
  const [showAllLeaderboard, setShowAllLeaderboard] = useState(false)

  // Quiz Creator Form
  const [qTitle, setQTitle] = useState('')
  const [durationMinutes, setDurationMinutes] = useState<number>(8)
  const [questionList, setQuestionList] = useState<QuestionDraft[]>([createEmptyQuestion()])
  const [creatingQuiz, setCreatingQuiz] = useState(false)

  // Community Broadcast
  const [broadcastMsg, setBroadcastMsg] = useState('')
  const [broadcasting, setBroadcasting] = useState(false)
  const [recentMsgs, setRecentMsgs] = useState<any[]>([])

  // User Management Quick Actions
  const [targetEmail, setTargetEmail] = useState('')
  const [userActionLoading, setUserActionLoading] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const navItems: (NavItem & { tabId: AdminTab })[] = [
    { label: 'Overview', icon: Home, tabId: 'overview' },
    { label: 'Quizzes', icon: Zap, tabId: 'quizzes' },
    { label: 'Broadcast', icon: MessageSquare, tabId: 'broadcast' },
    { label: 'Users', icon: Users, tabId: 'users' },
    { label: 'Settings', icon: Settings, tabId: 'settings' },
  ]

  const currentTab = navItems[activeTabIdx]?.tabId || 'overview'

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text })
    setTimeout(() => setToast(null), 3500)
  }

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate('/admin/login')
        return
      }

      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      setProfile(prof || { email: user.email, name: 'Admin', role: 'admin' })

      // Fetch Stats & Leaderboard
      const [{ count: studentCount }, { count: quizCount }, lbData, { data: msgs }] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('quizzes').select('*', { count: 'exact', head: true }),
        getLeaderboard(),
        supabase.from('community_messages').select('*').order('created_at', { ascending: false }).limit(10),
      ])

      setStats({ students: studentCount || 0, quizzes: quizCount || 0 })
      setLeaderboard(lbData.top3)
      setAllRanked(lbData.allRanked)
      setRecentMsgs(msgs || [])

      setLoading(false)
    }

    init()
  }, [navigate])

  const refreshAdminLeaderboard = useCallback(async () => {
    const [{ count: studentCount }, lbData] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
      getLeaderboard(),
    ])
    setStats(prev => ({ ...prev, students: studentCount ?? prev.students }))
    setLeaderboard(lbData.top3)
    setAllRanked(lbData.allRanked)
  }, [])

  useEffect(() => {
    if (currentTab === 'overview' && !loading) {
      refreshAdminLeaderboard()
    }
  }, [currentTab, loading, refreshAdminLeaderboard])

  useEffect(() => {
    const channel = supabase
      .channel('admin-leaderboard-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => {
          refreshAdminLeaderboard()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [refreshAdminLeaderboard])

  // Question Draft Helpers (1 to 15 questions)
  const handleAddQuestion = () => {
    if (questionList.length >= 15) {
      return showToast('error', 'Maximum 15 questions allowed per quiz.')
    }
    setQuestionList(prev => [...prev, createEmptyQuestion()])
  }

  const handleRemoveQuestion = (index: number) => {
    if (index === 0 || questionList.length <= 1) return
    setQuestionList(prev => prev.filter((_, i) => i !== index))
  }

  const handleQuestionTextChange = (index: number, value: string) => {
    setQuestionList(prev => prev.map((q, i) => (i === index ? { ...q, question_text: value } : q)))
  }

  const handleOptionChange = (qIndex: number, optIndex: number, value: string) => {
    setQuestionList(prev =>
      prev.map((q, i) => {
        if (i !== qIndex) return q
        const updatedOpts = [...q.options] as [string, string, string, string]
        updatedOpts[optIndex] = value
        return { ...q, options: updatedOpts }
      })
    )
  }

  const handleCorrectOptChange = (qIndex: number, optIndex: number) => {
    setQuestionList(prev => prev.map((q, i) => (i === qIndex ? { ...q, correct_option: optIndex } : q)))
  }

  // Create Quiz (Batch insert quiz + all questions)
  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!qTitle.trim()) return showToast('error', 'Quiz Title is required.')
    const parsedDuration = Number(durationMinutes)
    if (!Number.isFinite(parsedDuration) || parsedDuration < 1 || parsedDuration > 180) {
      return showToast('error', 'Timer duration must be between 1 and 180 minutes.')
    }

    for (let i = 0; i < questionList.length; i++) {
      const q = questionList[i]
      if (!q.question_text.trim()) {
        return showToast('error', `Question ${i + 1}: Question text is required.`)
      }
      if (q.options.some(o => !o.trim())) {
        return showToast('error', `Question ${i + 1}: All 4 options must be filled.`)
      }
    }

    setCreatingQuiz(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: quiz, error: qzErr } = await supabase
        .from('quizzes')
        .insert({
          title: qTitle.trim(),
          duration_minutes: Math.round(parsedDuration),
          is_active: true,
          created_by: user?.id,
        })
        .select('id')
        .single()

      if (qzErr) throw qzErr

      const questionsPayload = questionList.map(q => ({
        quiz_id: quiz.id,
        question_text: q.question_text.trim(),
        options: q.options.map(o => o.trim()),
        correct_option: q.correct_option,
      }))

      const { error: questErr } = await supabase.from('questions').insert(questionsPayload)
      if (questErr) {
        await supabase.from('quizzes').delete().eq('id', quiz.id)
        throw questErr
      }

      showToast('success', `Quiz published with ${questionList.length} question${questionList.length > 1 ? 's' : ''}!`)
      setQTitle('')
      setDurationMinutes(8)
      setQuestionList([createEmptyQuestion()])
      setStats(prev => ({ ...prev, quizzes: prev.quizzes + 1 }))
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to publish quiz.')
    } finally {
      setCreatingQuiz(false)
    }
  }

  // Broadcast Message
  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!broadcastMsg.trim()) return

    setBroadcasting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: inserted, error } = await supabase.from('community_messages').insert({
        sender_id: user?.id,
        message: broadcastMsg.trim(),
      }).select('*').single()

      if (error) throw error

      showToast('success', 'Announcement broadcast to all students.')
      setBroadcastMsg('')
      if (inserted) setRecentMsgs(prev => [inserted, ...prev])
    } catch (err: any) {
      showToast('error', err?.message || 'Broadcast failed.')
    } finally {
      setBroadcasting(false)
    }
  }

  // Make Admin
  const handleMakeAdmin = async () => {
    if (!targetEmail.trim()) return
    setUserActionLoading(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('email', targetEmail.trim().toLowerCase())

      if (error) throw error
      showToast('success', `${targetEmail} promoted to Admin.`)
      setTargetEmail('')
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to update role.')
    } finally {
      setUserActionLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/admin/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#03060f] text-white flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        <p className="text-xs text-neutral-400 font-mono">Loading Administrator Panel...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white text-[#0A0A0A] flex flex-col font-sans select-none overflow-x-hidden">
      {/* Toast Notification */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-full flex items-center gap-2.5 text-xs font-semibold shadow-xl ${
            toast.type === 'success'
              ? 'bg-[#0A0A0A] text-white'
              : 'bg-[#FF0F67] text-white'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-[#36D399]" /> : <AlertCircle className="w-4 h-4 text-white" />}
          <span>{toast.text}</span>
        </motion.div>
      )}

      {/* Top Header */}
      <header className="w-full border-b border-[#0A0A0A]/10 bg-white/90 backdrop-blur-xl sticky top-0 z-40 px-4 md:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#0A0A0A] flex items-center justify-center font-bold text-white shadow-sm">
            A
          </div>
          <div>
            <span className="text-[10px] md:text-[11px] font-bold tracking-widest uppercase text-[#454ADE] block">
              SkillFlow Authority
            </span>
            <h1 className="text-base md:text-lg font-bold font-['Space_Grotesk'] text-[#0A0A0A] leading-tight">
              Admin Portal
            </h1>
          </div>
        </div>

        {/* Laptop Dynamic Slide Pill Navbar */}
        <div className="hidden md:flex items-center">
          <BottomNavBar
            items={navItems}
            activeIndex={activeTabIdx}
            onChange={setActiveTabIdx}
          />
        </div>

        <button
          onClick={handleLogout}
          className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FF0F67]/15 hover:bg-[#FF0F67]/25 text-[#FF0F67] text-xs font-semibold transition-all cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" /> Logout
        </button>
      </header>

      {/* Main Responsive Body */}
      <main className="flex-1 w-full max-w-md md:max-w-5xl lg:max-w-6xl mx-auto px-4 md:px-8 py-6 pb-28 md:pb-12">
        <AnimatePresence mode="wait">

          {/* TAB 1: OVERVIEW */}
          {currentTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-6"
            >
              {/* Intro Banner */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-2">
                <div>
                  <span className="-rotate-2 inline-block px-3.5 py-1 rounded-full bg-[#0A0A0A]/90 text-white text-[11px] font-semibold uppercase tracking-wider mb-3">
                    Admin Console
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-semibold text-[#0A0A0A] leading-tight">
                    System Overview
                  </h2>
                </div>
                <p className="text-xs md:text-sm font-medium text-[#222222]/60 max-w-sm">
                  Managing live skill contests, student scores, rankings, and community broadcasts.
                </p>
              </div>

              {/* Pastel Bento Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-xl p-5 bg-[#439775]/20 hover:scale-105 hover:rotate-2 hover:shadow-[-6px_6px_32px_8px_rgba(192,192,192,0.25)] transition-all duration-200 ease-in-out flex flex-col justify-between gap-3 min-h-[140px]">
                  <span className="-rotate-2 w-fit px-3 py-1 rounded-full bg-[#0A0A0A]/90 text-white text-[11px] font-semibold">
                    Total Students
                  </span>
                  <div className="text-3xl sm:text-4xl font-bold text-[#0A0A0A]">{stats.students}</div>
                </div>

                <div className="rounded-xl p-5 bg-[#454ADE]/20 hover:scale-105 hover:-rotate-2 hover:shadow-[-6px_6px_32px_8px_rgba(192,192,192,0.25)] transition-all duration-200 ease-in-out flex flex-col justify-between gap-3 min-h-[140px]">
                  <span className="rotate-2 w-fit px-3 py-1 rounded-full bg-[#0A0A0A]/90 text-white text-[11px] font-semibold">
                    Live Quizzes
                  </span>
                  <div className="text-3xl sm:text-4xl font-bold text-[#0A0A0A]">{stats.quizzes}</div>
                </div>

                <div className="rounded-xl p-5 bg-[#FFF07C]/25 hover:scale-105 hover:rotate-3 hover:shadow-[-6px_6px_32px_8px_rgba(192,192,192,0.25)] transition-all duration-200 ease-in-out flex flex-col justify-between gap-3 min-h-[140px]">
                  <span className="-rotate-3 w-fit px-3 py-1 rounded-full bg-[#0A0A0A]/90 text-white text-[11px] font-semibold">
                    System Status
                  </span>
                  <div className="text-xl font-bold text-[#439775]">Active</div>
                </div>

                <div className="rounded-xl p-5 bg-[#FF0F67]/20 hover:scale-105 hover:-rotate-3 hover:shadow-[-6px_6px_32px_8px_rgba(192,192,192,0.25)] transition-all duration-200 ease-in-out flex flex-col justify-between gap-3 min-h-[140px]">
                  <span className="rotate-3 w-fit px-3 py-1 rounded-full bg-white/85 text-[#0A0A0A] text-[11px] font-semibold">
                    Admin Account
                  </span>
                  <div className="text-xs font-mono font-semibold text-[#0A0A0A] truncate">{profile?.email}</div>
                </div>
              </div>

              {/* Leaderboard */}
              <div className="rounded-xl bg-[#454ADE]/15 hover:shadow-[-6px_6px_32px_8px_rgba(192,192,192,0.25)] transition-all duration-200 ease-in-out p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="-rotate-2 px-4 py-1.5 rounded-full bg-[#0A0A0A]/90 text-white text-xs font-semibold inline-flex items-center gap-2">
                      <Trophy className="w-3.5 h-3.5 text-[#FFF07C]" />
                      Top 3 Performing Students
                    </span>
                  </div>

                  {allRanked.length > 3 && (
                    <button
                      type="button"
                      onClick={() => setShowAllLeaderboard(prev => !prev)}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/85 hover:bg-white text-xs font-semibold text-[#0A0A0A] cursor-pointer transition-colors shadow-sm"
                    >
                      {showAllLeaderboard ? (
                        <>Hide All <ChevronUp className="w-3.5 h-3.5" /></>
                      ) : (
                        <>View All ({allRanked.length}) <ChevronDown className="w-3.5 h-3.5" /></>
                      )}
                    </button>
                  )}
                </div>

                <div className="flex flex-col gap-2.5">
                  {leaderboard.map((item) => (
                    <div key={item.id} className="p-3.5 rounded-xl bg-white/80 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#0A0A0A]/90 text-white flex items-center justify-center text-xs font-bold">
                          #{item.rank}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#0A0A0A]">{item.name || 'Student'}</p>
                          <p className="text-xs text-[#222222]/60 font-medium">Rank #{item.rank}</p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-[#454ADE]">{item.total_score} pts</span>
                    </div>
                  ))}
                  {leaderboard.length === 0 && <p className="text-xs text-[#222222]/60 py-3 text-center">No scores yet.</p>}
                </div>

                {/* Expandable Full Ranked Student List */}
                <AnimatePresence>
                  {showAllLeaderboard && allRanked.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden border-t border-[#0A0A0A]/10 pt-4"
                    >
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#222222]/60 mb-3">
                        All Ranked Students ({allRanked.length})
                      </h4>
                      <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
                        {allRanked.map(student => (
                          <div key={student.id} className="px-3.5 py-2.5 rounded-xl bg-white/75 flex items-center justify-between text-sm">
                            <div className="flex items-center gap-3">
                              <span className="w-8 text-xs font-mono font-bold text-[#454ADE]">#{student.rank}</span>
                              <span className="text-[#0A0A0A] font-semibold">{student.name}</span>
                            </div>
                            <span className="font-bold text-[#439775]">{student.total_score} pts</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* TAB 2: QUIZZES */}
          {currentTab === 'quizzes' && (
            <motion.div
              key="quizzes"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-5 max-w-2xl mx-auto pb-8"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-semibold text-[#0A0A0A]">Create New Quiz</h2>
                  <p className="text-xs text-[#222222]/60 mt-1">Add 1 to 15 questions &amp; publish instantly for students</p>
                </div>
                <span className="-rotate-2 px-3.5 py-1 rounded-full bg-[#0A0A0A]/90 text-white text-xs font-bold shrink-0">
                  {questionList.length} / 15 Qs
                </span>
              </div>

              <form onSubmit={handleCreateQuiz} className="flex flex-col gap-4">
                {/* Quiz Metadata Card: Title + Timer Duration */}
                <div className="rounded-xl p-5 bg-[#439775]/20 flex flex-col gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase text-[#0A0A0A] block mb-2">Quiz Title</label>
                    <input
                      className="w-full bg-white/85 rounded-xl px-4 py-3 text-sm text-[#0A0A0A] placeholder-[#222222]/40 outline-none focus:ring-2 focus:ring-[#439775]"
                      placeholder="e.g. Next.js & React Core Concepts"
                      value={qTitle}
                      onChange={e => setQTitle(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase text-[#0A0A0A] flex items-center gap-1.5 mb-2">
                      <Clock className="w-3.5 h-3.5 text-[#439775]" />
                      Timer Duration (Minutes)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={180}
                      className="w-full sm:w-44 bg-white/85 rounded-xl px-4 py-2.5 text-sm text-[#0A0A0A] outline-none focus:ring-2 focus:ring-[#439775]"
                      value={durationMinutes}
                      onChange={e => setDurationMinutes(Math.max(1, parseInt(e.target.value || '8', 10)))}
                    />
                    <p className="text-[11px] text-[#222222]/65 mt-1 font-medium">Default: 8 minutes. Auto-submits when time ends.</p>
                  </div>
                </div>

                {/* Dynamic Question Blocks */}
                {questionList.map((q, qIdx) => (
                  <div
                    key={qIdx}
                    className="rounded-xl p-5 bg-[#f0f0f0] flex flex-col gap-3 transition-all duration-200 ease-in-out"
                  >
                    <div className="flex items-center justify-between">
                      <span className="-rotate-1 px-3.5 py-1 rounded-full bg-[#0A0A0A]/90 text-white text-xs font-semibold">
                        Question {qIdx + 1}
                      </span>
                      {qIdx > 0 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(qIdx)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF0F67]/15 hover:bg-[#FF0F67]/25 text-[#FF0F67] text-xs font-semibold cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Remove
                        </button>
                      )}
                    </div>

                    <textarea
                      rows={2}
                      className="w-full bg-white rounded-xl px-4 py-3 text-sm text-[#0A0A0A] placeholder-[#222222]/40 outline-none focus:ring-2 focus:ring-[#454ADE] resize-none"
                      placeholder={`Enter question ${qIdx + 1} text...`}
                      value={q.question_text}
                      onChange={e => handleQuestionTextChange(qIdx, e.target.value)}
                    />

                    <label className="text-[11px] font-bold uppercase text-[#222222]/70 mt-1">
                      Options (Select correct answer)
                    </label>
                    <div className="flex flex-col gap-2.5">
                      {q.options.map((opt, optIdx) => (
                        <div key={optIdx} className="flex items-center gap-3">
                          <input
                            type="radio"
                            name={`correctOpt-${qIdx}`}
                            checked={q.correct_option === optIdx}
                            onChange={() => handleCorrectOptChange(qIdx, optIdx)}
                            className="w-4 h-4 accent-[#439775] cursor-pointer shrink-0"
                          />
                          <input
                            className="flex-1 bg-white rounded-xl px-4 py-2.5 text-sm text-[#0A0A0A] placeholder-[#222222]/40 outline-none focus:ring-2 focus:ring-[#454ADE]"
                            placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                            value={opt}
                            onChange={e => handleOptionChange(qIdx, optIdx, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Add Question Button */}
                <button
                  type="button"
                  onClick={handleAddQuestion}
                  disabled={questionList.length >= 15}
                  className="w-full py-3 rounded-full font-semibold text-sm bg-[#454ADE]/15 hover:bg-[#454ADE]/25 text-[#0A0A0A] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="w-4 h-4 text-[#454ADE]" />
                  Add Question ({questionList.length}/15)
                </button>

                {/* Publish Quiz Button */}
                <button
                  type="submit"
                  disabled={creatingQuiz}
                  className="w-full py-3.5 rounded-full font-bold text-sm bg-[#0A0A0A]/90 hover:bg-[#0A0A0A] text-white cursor-pointer disabled:opacity-40 transition-colors"
                >
                  {creatingQuiz
                    ? 'Publishing Quiz...'
                    : `Publish Quiz (${questionList.length} ${questionList.length === 1 ? 'Question' : 'Questions'})`}
                </button>
              </form>
            </motion.div>
          )}

          {/* TAB 3: BROADCAST */}
          {currentTab === 'broadcast' && (
            <motion.div
              key="broadcast"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-5 max-w-2xl mx-auto"
            >
              <div>
                <h2 className="text-2xl sm:text-3xl font-semibold text-[#0A0A0A]">Broadcast Announcement</h2>
                <p className="text-xs text-[#222222]/60 mt-1">Post updates to student community feed</p>
              </div>

              <form onSubmit={handleBroadcast} className="flex flex-col gap-3 rounded-xl p-5 bg-[#454ADE]/15">
                <textarea
                  rows={3}
                  className="w-full bg-white rounded-xl p-4 text-sm text-[#0A0A0A] placeholder-[#222222]/40 outline-none focus:ring-2 focus:ring-[#454ADE] resize-none"
                  placeholder="Type an announcement to broadcast..."
                  value={broadcastMsg}
                  onChange={e => setBroadcastMsg(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={broadcasting || !broadcastMsg.trim()}
                  className="py-3 rounded-full font-semibold text-sm bg-[#0A0A0A]/90 hover:bg-[#0A0A0A] text-white cursor-pointer disabled:opacity-40 transition-colors"
                >
                  {broadcasting ? 'Posting...' : 'Send Broadcast'}
                </button>
              </form>

              <div className="flex flex-col gap-3 mt-2">
                <h4 className="text-xs uppercase font-bold text-[#222222]/60">Recent Broadcasts</h4>
                {recentMsgs.map((m, idx) => (
                  <div
                    key={m.id}
                    className={`p-4 rounded-xl text-sm text-[#0A0A0A] font-medium hover:scale-[1.01] transition-all duration-200 ${
                      idx % 2 === 0 ? 'bg-[#FFF07C]/25' : 'bg-[#f0f0f0]'
                    }`}
                  >
                    <div className="text-[11px] text-[#222222]/60 mb-1">{new Date(m.created_at).toLocaleString()}</div>
                    {m.message}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* TAB 4: USERS */}
          {currentTab === 'users' && (
            <motion.div
              key="users"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-5 max-w-2xl mx-auto"
            >
              <div>
                <h2 className="text-2xl sm:text-3xl font-semibold text-[#0A0A0A]">User Role Management</h2>
                <p className="text-xs text-[#222222]/60 mt-1">Promote or manage students</p>
              </div>

              <div className="rounded-xl p-6 bg-[#FFF07C]/25 hover:scale-[1.01] hover:rotate-1 hover:shadow-[-6px_6px_32px_8px_rgba(192,192,192,0.25)] transition-all duration-200 ease-in-out flex flex-col gap-3">
                <span className="-rotate-2 w-fit px-3.5 py-1 rounded-full bg-[#0A0A0A]/90 text-white text-xs font-semibold inline-flex items-center gap-2">
                  <UserPlus className="w-3.5 h-3.5 text-[#FFF07C]" /> Promote User to Admin
                </span>
                <div className="flex flex-col sm:flex-row gap-2 mt-2">
                  <input
                    className="flex-1 bg-white rounded-xl px-4 py-2.5 text-sm text-[#0A0A0A] placeholder-[#222222]/40 outline-none focus:ring-2 focus:ring-[#0A0A0A]"
                    placeholder="user@skillflowlearn.com"
                    value={targetEmail}
                    onChange={e => setTargetEmail(e.target.value)}
                  />
                  <button
                    onClick={handleMakeAdmin}
                    disabled={userActionLoading || !targetEmail.trim()}
                    className="px-6 py-2.5 rounded-full font-bold text-xs bg-[#0A0A0A]/90 hover:bg-[#0A0A0A] text-white cursor-pointer disabled:opacity-40 transition-colors"
                  >
                    Promote
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 5: SETTINGS */}
          {currentTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-5 max-w-xl mx-auto"
            >
              <div>
                <h2 className="text-2xl sm:text-3xl font-semibold text-[#0A0A0A]">Admin Session</h2>
                <p className="text-xs text-[#222222]/60 mt-1">Administrator details</p>
              </div>

              <div className="rounded-xl p-6 bg-[#f0f0f0] hover:scale-[1.01] hover:rotate-1 hover:shadow-[-6px_6px_32px_8px_rgba(192,192,192,0.25)] transition-all duration-200 ease-in-out flex flex-col gap-3">
                <div className="text-base text-[#0A0A0A] font-bold">{profile?.name || 'Administrator'}</div>
                <div className="text-xs text-[#222222]/70 font-medium">{profile?.email}</div>
                <span className="-rotate-2 w-fit text-[10px] font-bold uppercase tracking-wider text-white bg-[#0A0A0A]/90 px-3 py-1 rounded-full mt-1">
                  System Admin
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="w-full py-3.5 rounded-full font-semibold text-sm bg-[#FF0F67]/15 hover:bg-[#FF0F67]/25 text-[#0A0A0A] cursor-pointer transition-colors"
              >
                Logout from Admin Console
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Floating Pill Bottom Navigation (Phone) */}
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
