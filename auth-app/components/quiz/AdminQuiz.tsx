'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { PlusCircle, CheckCircle, AlertCircle, Loader2, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function AdminQuiz() {
  const [title, setTitle] = useState('')
  const [questionText, setQuestionText] = useState('')
  const [options, setOptions] = useState(['', '', '', ''])
  const [correctOption, setCorrectOption] = useState<number>(0)
  const [isActive, setIsActive] = useState(true)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const supabase = createClient()

  const handleOptionChange = (idx: number, val: string) => {
    const updated = [...options]
    updated[idx] = val
    setOptions(updated)
  }

  const showToast = (type: 'success' | 'error', text: string) => {
    setMsg({ type, text })
    setTimeout(() => setMsg(null), 4000)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return showToast('error', 'Quiz title is required.')
    if (!questionText.trim()) return showToast('error', 'Question text is required.')
    if (options.some(opt => !opt.trim())) return showToast('error', 'All 4 options must be filled.')

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // 1. Create Quiz
      const { data: quiz, error: quizErr } = await supabase
        .from('quizzes')
        .insert({
          title: title.trim(),
          is_active: isActive,
          created_by: user.id,
        })
        .select('id')
        .single()

      if (quizErr || !quiz) throw new Error(quizErr?.message || 'Failed to create quiz.')

      // 2. Create Question for this Quiz
      const { error: qErr } = await supabase
        .from('questions')
        .insert({
          quiz_id: quiz.id,
          question_text: questionText.trim(),
          options: options.map(o => o.trim()),
          correct_option: correctOption,
        })

      if (qErr) throw new Error(qErr.message)

      showToast('success', 'Quiz & Question created successfully! 🚀')
      setTitle('')
      setQuestionText('')
      setOptions(['', '', '', ''])
      setCorrectOption(0)
    } catch (err: any) {
      showToast('error', err?.message || 'Error creating quiz.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 22, fontWeight: 700, color: '#f1f5f9' }}>
          Create New Quiz
        </h2>
        <p style={{ fontSize: 13, color: '#64748b', fontFamily: 'Inter', marginTop: 4 }}>
          Add interactive questions with options and publish immediately
        </p>
      </div>

      {msg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: msg.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${msg.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
            borderRadius: 14,
            padding: '12px 16px',
            display: 'flex', alignItems: 'center', gap: 8,
          }}
        >
          {msg.type === 'success' ? <CheckCircle size={16} color="#4ade80" /> : <AlertCircle size={16} color="#f87171" />}
          <span style={{ fontSize: 13, color: msg.type === 'success' ? '#4ade80' : '#f87171', fontFamily: 'Inter, sans-serif' }}>
            {msg.text}
          </span>
        </motion.div>
      )}

      <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Quiz Info */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', fontFamily: 'Space Grotesk, sans-serif', textTransform: 'uppercase' }}>
            Quiz Title
          </label>
          <input
            className="glass-input"
            placeholder="e.g., JavaScript Fundamentals Mastery"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8 }}>
            <span style={{ fontSize: 13, color: '#f1f5f9', fontFamily: 'Inter' }}>Publish Immediately</span>
            <input
              type="checkbox"
              checked={isActive}
              onChange={e => setIsActive(e.target.checked)}
              style={{ width: 18, height: 18, accentColor: '#6366f1', cursor: 'pointer' }}
            />
          </div>
        </div>

        {/* Question Details */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', fontFamily: 'Space Grotesk, sans-serif', textTransform: 'uppercase' }}>
            Question Text
          </label>
          <textarea
            className="glass-input"
            rows={3}
            placeholder="e.g., What is the output of typeof null in JavaScript?"
            value={questionText}
            onChange={e => setQuestionText(e.target.value)}
            style={{ resize: 'none' }}
          />

          <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', fontFamily: 'Space Grotesk, sans-serif', textTransform: 'uppercase', marginTop: 4 }}>
            Options (Select the correct radio button)
          </label>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {options.map((opt, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="radio"
                  name="correctOption"
                  checked={correctOption === i}
                  onChange={() => setCorrectOption(i)}
                  style={{ width: 18, height: 18, accentColor: '#22c55e', cursor: 'pointer' }}
                />
                <input
                  className="glass-input"
                  placeholder={`Option ${String.fromCharCode(65 + i)}`}
                  value={opt}
                  onChange={e => handleOptionChange(i, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        <button type="submit" className="btn-primary" disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {loading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <><Sparkles size={16} /> Publish Quiz & Question</>}
        </button>
      </form>
    </div>
  )
}
