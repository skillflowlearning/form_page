'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, ChevronRight, CheckCircle2, XCircle, ArrowLeft, Loader2, Lock } from 'lucide-react'
import { getStudentQuizzes, submitQuizAttempt } from '@/lib/actions/student-actions'
import { createClient } from '@/lib/supabase/client'

interface Quiz { id: string; title: string; created_at: string; attempted: boolean; score: number | null }
interface Question { id: string; question_text: string; options: string[]; correct_option: number }

type Screen = 'list' | 'quiz' | 'result'

export default function StudentQuiz() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [screen, setScreen] = useState<Screen>('list')
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [result, setResult] = useState<{ score: number; total: number } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [loadingQ, setLoadingQ] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    getStudentQuizzes().then(res => {
      if (res.success && res.quizzes) setQuizzes(res.quizzes as Quiz[])
      setLoading(false)
    })
  }, [])

  const openQuiz = async (quiz: Quiz) => {
    if (quiz.attempted) return
    setLoadingQ(true)
    setActiveQuiz(quiz)
    const { data } = await supabase.from('questions').select('id, question_text, options, correct_option').eq('quiz_id', quiz.id)
    setQuestions(data ?? [])
    setAnswers({})
    setCurrent(0)
    setScreen('quiz')
    setLoadingQ(false)
  }

  const handleAnswer = (qId: string, optIdx: number) => {
    setAnswers(prev => ({ ...prev, [qId]: optIdx }))
  }

  const handleNext = () => {
    if (current < questions.length - 1) setCurrent(c => c + 1)
  }

  const handleSubmit = async () => {
    if (!activeQuiz) return
    setSubmitting(true)
    const res = await submitQuizAttempt(activeQuiz.id, answers)
    setSubmitting(false)
    if (res.success) {
      setResult({ score: res.score!, total: res.totalQuestions! })
      setScreen('result')
      setQuizzes(prev => prev.map(q => q.id === activeQuiz.id ? { ...q, attempted: true, score: res.score! } : q))
    }
  }

  const progress = questions.length > 0 ? ((current + 1) / questions.length) * 100 : 0
  const q = questions[current]

  if (screen === 'result' && result) {
    const pct = Math.round((result.score / result.total) * 100)
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, paddingTop: 32, textAlign: 'center' }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          style={{
            width: 120, height: 120,
            background: pct >= 60 ? 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(34,197,94,0.05))' : 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(239,68,68,0.05))',
            border: `2px solid ${pct >= 60 ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`,
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <span style={{ fontSize: 42, fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', color: pct >= 60 ? '#4ade80' : '#f87171' }}>
            {pct}%
          </span>
        </motion.div>

        <div>
          <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 24, fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>
            {pct >= 80 ? '🏆 Excellent!' : pct >= 60 ? '👏 Good Job!' : '💪 Keep Going!'}
          </h2>
          <p style={{ fontFamily: 'Inter, sans-serif', color: '#94a3b8', fontSize: 15 }}>
            You scored <strong style={{ color: '#818cf8' }}>{result.score}</strong> out of {result.total} questions
          </p>
        </div>

        <div style={{
          width: '100%',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 20, padding: '20px',
          display: 'flex', justifyContent: 'space-around',
        }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 28, fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', color: '#4ade80' }}>{result.score}</p>
            <p style={{ fontSize: 11, color: '#475569' }}>Correct</p>
          </div>
          <div style={{ width: 1, background: 'rgba(255,255,255,0.08)' }} />
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 28, fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', color: '#f87171' }}>{result.total - result.score}</p>
            <p style={{ fontSize: 11, color: '#475569' }}>Wrong</p>
          </div>
          <div style={{ width: 1, background: 'rgba(255,255,255,0.08)' }} />
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 28, fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', color: '#818cf8' }}>{result.total}</p>
            <p style={{ fontSize: 11, color: '#475569' }}>Total</p>
          </div>
        </div>

        <button className="btn-primary" onClick={() => setScreen('list')}>Back to Quizzes</button>
      </motion.div>
    )
  }

  if (screen === 'quiz' && q) {
    const answered = answers[q.id] !== undefined
    const isLast = current === questions.length - 1
    const allAnswered = questions.every(ques => answers[ques.id] !== undefined)
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => setScreen('list')} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px', cursor: 'pointer', display: 'flex' }}>
            <ArrowLeft size={18} color="#94a3b8" />
          </button>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 11, color: '#475569', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Question {current + 1} of {questions.length}
            </p>
            <p style={{ fontSize: 13, color: '#94a3b8', fontFamily: 'Inter' }}>{activeQuiz?.title}</p>
          </div>
        </div>

        {/* Progress */}
        <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 100, overflow: 'hidden' }}>
          <motion.div animate={{ width: `${progress}%` }} transition={{ ease: 'easeOut' }}
            style={{ height: '100%', background: 'linear-gradient(90deg, #6366f1, #a855f7)', borderRadius: 100 }} />
        </div>

        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 24, padding: '24px',
            }}
          >
            <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 17, fontWeight: 600, color: '#f1f5f9', lineHeight: 1.5 }}>
              {q.question_text}
            </h3>
          </motion.div>
        </AnimatePresence>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {q.options.map((opt, idx) => {
            const selected = answers[q.id] === idx
            return (
              <motion.button
                key={idx}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleAnswer(q.id, idx)}
                style={{
                  background: selected ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
                  border: selected ? '1px solid rgba(99,102,241,0.5)' : '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 16,
                  padding: '16px 20px',
                  display: 'flex', alignItems: 'center', gap: 14,
                  cursor: 'pointer', textAlign: 'left',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: selected ? 'linear-gradient(135deg, #6366f1, #a855f7)' : 'rgba(255,255,255,0.06)',
                  border: selected ? 'none' : '1px solid rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif',
                  color: selected ? 'white' : '#475569',
                }}>
                  {String.fromCharCode(65 + idx)}
                </div>
                <span style={{ fontSize: 14, color: selected ? '#a5b4fc' : '#94a3b8', fontFamily: 'Inter, sans-serif', flex: 1 }}>
                  {opt}
                </span>
                {selected && <CheckCircle2 size={18} color="#818cf8" />}
              </motion.button>
            )
          })}
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', gap: 12 }}>
          {!isLast && (
            <button
              className="btn-ghost"
              onClick={handleNext}
              disabled={!answered}
              style={{ flex: 1, opacity: answered ? 1 : 0.4 }}
            >
              Next →
            </button>
          )}
          {isLast && (
            <button
              className="btn-primary"
              onClick={handleSubmit}
              disabled={!allAnswered || submitting}
              style={{ flex: 1 }}
            >
              {submitting ? 'Submitting...' : 'Submit Quiz 🚀'}
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 22, fontWeight: 700, color: '#f1f5f9' }}>Active Quizzes</h2>
        <p style={{ fontSize: 13, color: '#475569', fontFamily: 'Inter', marginTop: 4 }}>
          {quizzes.filter(q => !q.attempted).length} quiz{quizzes.filter(q => !q.attempted).length !== 1 ? 'zes' : ''} available
        </p>
      </motion.div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <Loader2 size={28} color="#6366f1" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : quizzes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#475569' }}>
          <Zap size={40} color="#374151" style={{ margin: '0 auto 12px' }} />
          <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 15 }}>No active quizzes yet.</p>
          <p style={{ fontSize: 13, marginTop: 4 }}>Check back later!</p>
        </div>
      ) : (
        quizzes.map((quiz, i) => (
          <motion.div
            key={quiz.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            onClick={() => openQuiz(quiz)}
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: `1px solid ${quiz.attempted ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.07)'}`,
              borderRadius: 20, padding: '20px',
              display: 'flex', alignItems: 'center', gap: 16,
              cursor: quiz.attempted ? 'default' : 'pointer',
              opacity: quiz.attempted ? 0.7 : 1,
              transition: 'all 0.2s',
            }}
          >
            <div style={{
              width: 48, height: 48, flexShrink: 0,
              background: quiz.attempted ? 'rgba(34,197,94,0.1)' : 'rgba(99,102,241,0.1)',
              border: `1px solid ${quiz.attempted ? 'rgba(34,197,94,0.25)' : 'rgba(99,102,241,0.2)'}`,
              borderRadius: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {quiz.attempted ? <CheckCircle2 size={22} color="#4ade80" /> : <Zap size={22} color="#818cf8" />}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 15, fontWeight: 600, color: '#f1f5f9', marginBottom: 4 }}>
                {quiz.title}
              </p>
              {quiz.attempted ? (
                <span style={{ fontSize: 12, color: '#4ade80', fontFamily: 'Inter' }}>
                  ✓ Completed — Score: {quiz.score} pts
                </span>
              ) : (
                <span style={{ fontSize: 12, color: '#475569', fontFamily: 'Inter' }}>Tap to start</span>
              )}
            </div>
            {!quiz.attempted ? (
              loadingQ ? <Loader2 size={18} color="#6366f1" /> : <ChevronRight size={18} color="#475569" />
            ) : <Lock size={16} color="#4ade80" />}
          </motion.div>
        ))
      )}
    </div>
  )
}
