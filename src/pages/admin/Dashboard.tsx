import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { 
  Home, Zap, MessageSquare, Settings, Users, 
  UserPlus, LogOut, Loader2, CheckCircle2, AlertCircle,
  Plus, Trash2, Clock
} from 'lucide-react'
import BottomNavBar, { type NavItem } from '@/components/ui/bottom-nav-bar'

type AdminTab = 'overview' | 'quizzes' | 'broadcast' | 'users' | 'settings'

interface LeaderboardEntry {
  id: string
  name?: string
  total_score: number
}

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

const medals = [
  { label: '1st', color: '#f59e0b', emoji: '🥇' },
  { label: '2nd', color: '#94a3b8', emoji: '🥈' },
  { label: '3rd', color: '#b45309', emoji: '🥉' },
]

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [activeTabIdx, setActiveTabIdx] = useState(0)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Stats
  const [stats, setStats] = useState({ students: 0, quizzes: 0 })
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])

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

      // Fetch Stats
      const [{ count: studentCount }, { count: quizCount }, { data: top3 }, { data: msgs }] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('quizzes').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('id, name, total_score').order('total_score', { ascending: false }).limit(3),
        supabase.from('community_messages').select('*').order('created_at', { ascending: false }).limit(10),
      ])

      setStats({ students: studentCount || 0, quizzes: quizCount || 0 })
      setLeaderboard(top3 || [])
      setRecentMsgs(msgs || [])

      setLoading(false)
    }

    init()
  }, [navigate])

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
    <div className="min-h-screen bg-[#03060f] text-slate-100 flex flex-col font-sans select-none overflow-x-hidden">
      {/* Toast Notification */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl flex items-center gap-3 text-xs font-semibold backdrop-blur-xl border shadow-xl"
          style={{
            background: toast.type === 'success' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
            borderColor: toast.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)',
            color: toast.type === 'success' ? '#4ade80' : '#f87171',
          }}
        >
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{toast.text}</span>
        </motion.div>
      )}

      {/* Top Header */}
      <header className="w-full border-b border-white/[0.08] bg-[#070d1a]/80 backdrop-blur-xl sticky top-0 z-40 px-4 md:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center font-bold text-white shadow-md shadow-amber-500/20">
            A
          </div>
          <div>
            <span className="text-[10px] md:text-[11px] font-bold tracking-widest uppercase text-amber-400 block">
              SkillFlow Authority
            </span>
            <h1 className="text-base md:text-lg font-bold font-['Space_Grotesk'] text-white leading-tight">
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
          className="hidden md:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-semibold transition-all cursor-pointer"
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
              {/* Banner */}
              <div className="rounded-3xl p-6 md:p-8 relative overflow-hidden bg-gradient-to-br from-amber-950/40 via-red-950/20 to-black/80 border border-amber-500/30">
                <span className="text-xs uppercase tracking-wider text-amber-400 font-bold">Admin Console</span>
                <h2 className="text-2xl md:text-4xl font-extrabold font-['Space_Grotesk'] text-white mt-1">
                  System Overview
                </h2>
                <p className="text-xs md:text-sm text-slate-300 mt-2">
                  Managing live skill contests, student scores and broadcasts.
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-2xl p-5 bg-white/[0.03] border border-white/[0.07]">
                  <span className="text-xs text-slate-400 font-semibold">Total Students</span>
                  <div className="text-3xl font-extrabold font-['Space_Grotesk'] text-white mt-2">{stats.students}</div>
                </div>
                <div className="rounded-2xl p-5 bg-white/[0.03] border border-white/[0.07]">
                  <span className="text-xs text-slate-400 font-semibold">Live Quizzes</span>
                  <div className="text-3xl font-extrabold font-['Space_Grotesk'] text-indigo-400 mt-2">{stats.quizzes}</div>
                </div>
                <div className="rounded-2xl p-5 bg-white/[0.03] border border-white/[0.07]">
                  <span className="text-xs text-slate-400 font-semibold">System Status</span>
                  <div className="text-lg font-bold font-['Space_Grotesk'] text-emerald-400 mt-3">Active 🟢</div>
                </div>
                <div className="rounded-2xl p-5 bg-white/[0.03] border border-white/[0.07]">
                  <span className="text-xs text-slate-400 font-semibold">Admin Account</span>
                  <div className="text-xs font-mono text-slate-300 truncate mt-3">{profile?.email}</div>
                </div>
              </div>

              {/* Leaderboard */}
              <div className="rounded-3xl bg-white/[0.03] border border-white/[0.07] p-6">
                <h3 className="text-base font-bold font-['Space_Grotesk'] text-white mb-4">Top 3 Performing Students</h3>
                <div className="divide-y divide-white/[0.05]">
                  {leaderboard.map((item, idx) => (
                    <div key={item.id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{medals[idx]?.emoji}</span>
                        <div>
                          <p className="text-sm font-semibold text-white">{item.name || 'Student'}</p>
                          <p className="text-xs text-slate-400">{medals[idx]?.label} Place</p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-amber-400 font-['Space_Grotesk']">{item.total_score} pts</span>
                    </div>
                  ))}
                  {leaderboard.length === 0 && <p className="text-xs text-slate-500 py-3 text-center">No scores yet.</p>}
                </div>
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
                  <h2 className="text-xl font-bold font-['Space_Grotesk'] text-white">Create New Quiz</h2>
                  <p className="text-xs text-slate-400 mt-1">Add 1 to 15 questions &amp; publish instantly for students</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold shrink-0">
                  {questionList.length} / 15 Qs
                </span>
              </div>

              <form onSubmit={handleCreateQuiz} className="flex flex-col gap-4">
                {/* Quiz Metadata Card: Title + Timer Duration */}
                <div className="rounded-2xl p-5 bg-white/[0.03] border border-white/[0.07] flex flex-col gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase text-slate-400 block mb-2">Quiz Title</label>
                    <input
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-amber-400"
                      placeholder="e.g. Next.js & React Core Concepts"
                      value={qTitle}
                      onChange={e => setQTitle(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5 mb-2">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      Timer Duration (Minutes)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={180}
                      className="w-full sm:w-44 bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-amber-400"
                      value={durationMinutes}
                      onChange={e => setDurationMinutes(Math.max(1, parseInt(e.target.value || '8', 10)))}
                    />
                    <p className="text-[11px] text-slate-500 mt-1">Default: 8 minutes. Auto-submits when time ends.</p>
                  </div>
                </div>

                {/* Dynamic Question Blocks */}
                {questionList.map((q, qIdx) => (
                  <div
                    key={qIdx}
                    className="rounded-2xl p-5 bg-white/[0.03] border border-white/[0.07] flex flex-col gap-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                        Question {qIdx + 1}
                      </span>
                      {qIdx > 0 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(qIdx)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-semibold cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Remove
                        </button>
                      )}
                    </div>

                    <textarea
                      rows={2}
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-amber-400 resize-none"
                      placeholder={`Enter question ${qIdx + 1} text...`}
                      value={q.question_text}
                      onChange={e => handleQuestionTextChange(qIdx, e.target.value)}
                    />

                    <label className="text-[11px] font-bold uppercase text-slate-400 mt-1">
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
                            className="w-4 h-4 accent-amber-500 cursor-pointer shrink-0"
                          />
                          <input
                            className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-amber-400"
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
                  className="w-full py-3 rounded-xl font-semibold text-sm bg-white/[0.04] hover:bg-white/[0.08] border border-dashed border-white/20 text-slate-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="w-4 h-4 text-amber-400" />
                  Add Question ({questionList.length}/15)
                </button>

                {/* Publish Quiz Button */}
                <button
                  type="submit"
                  disabled={creatingQuiz}
                  className="w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-orange-600 text-white cursor-pointer hover:opacity-90 disabled:opacity-40 shadow-lg shadow-amber-500/20"
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
                <h2 className="text-xl font-bold font-['Space_Grotesk'] text-white">Broadcast Announcement</h2>
                <p className="text-xs text-slate-400 mt-1">Post updates to student community feed</p>
              </div>

              <form onSubmit={handleBroadcast} className="flex flex-col gap-3">
                <textarea
                  rows={3}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-sm text-white outline-none focus:border-indigo-400 resize-none"
                  placeholder="Type an announcement to broadcast..."
                  value={broadcastMsg}
                  onChange={e => setBroadcastMsg(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={broadcasting || !broadcastMsg.trim()}
                  className="py-3 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer disabled:opacity-40"
                >
                  {broadcasting ? 'Posting...' : 'Send Broadcast'}
                </button>
              </form>

              <div className="flex flex-col gap-3 mt-4">
                <h4 className="text-xs uppercase font-bold text-slate-400">Recent Broadcasts</h4>
                {recentMsgs.map(m => (
                  <div key={m.id} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.07] text-sm text-slate-300">
                    <div className="text-[10px] text-slate-400 mb-1">{new Date(m.created_at).toLocaleString()}</div>
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
                <h2 className="text-xl font-bold font-['Space_Grotesk'] text-white">User Role Management</h2>
                <p className="text-xs text-slate-400 mt-1">Promote or manage students</p>
              </div>

              <div className="rounded-2xl p-5 bg-white/[0.03] border border-white/[0.07] flex flex-col gap-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-amber-400" /> Promote User to Admin
                </h4>
                <div className="flex gap-2 mt-2">
                  <input
                    className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-amber-400"
                    placeholder="user@skillflowlearn.com"
                    value={targetEmail}
                    onChange={e => setTargetEmail(e.target.value)}
                  />
                  <button
                    onClick={handleMakeAdmin}
                    disabled={userActionLoading || !targetEmail.trim()}
                    className="px-5 py-2.5 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-400 text-black cursor-pointer disabled:opacity-40"
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
                <h2 className="text-xl font-bold font-['Space_Grotesk'] text-white">Admin Session</h2>
                <p className="text-xs text-slate-400 mt-1">Administrator details</p>
              </div>

              <div className="rounded-2xl p-6 bg-white/[0.03] border border-white/[0.07] flex flex-col gap-3">
                <div className="text-sm text-white font-bold">{profile?.name || 'Administrator'}</div>
                <div className="text-xs text-slate-400">{profile?.email}</div>
                <span className="w-fit text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20 mt-1">
                  System Admin
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="w-full py-3.5 rounded-xl font-bold text-sm bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 cursor-pointer"
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
