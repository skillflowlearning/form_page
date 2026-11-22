'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Users, BookOpen, Trophy, UserPlus, UserMinus, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { getLeaderboard } from '@/lib/actions/student-actions'
import { makeAdmin, removeAdmin } from '@/lib/actions/admin-actions'
import { createClient } from '@/lib/supabase/client'

interface LeaderboardEntry { id: string; name?: string; total_score: number }

const medals = [
  { label: '1st', color: '#f59e0b', emoji: '🥇' },
  { label: '2nd', color: '#94a3b8', emoji: '🥈' },
  { label: '3rd', color: '#b45309', emoji: '🥉' },
]

export default function AdminHome() {
  const [stats, setStats] = useState({ students: 0, quizzes: 0 })
  const [leaderboard, setLeaderboard] = useState<{ top3: LeaderboardEntry[] } | null>(null)
  const [adminEmail, setAdminEmail] = useState('')
  const [removeId, setRemoveId] = useState('')
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const fetchStats = async () => {
      const [{ count: students }, { count: quizzes }, lb] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('quizzes').select('*', { count: 'exact', head: true }),
        getLeaderboard(),
      ])
      setStats({ students: students ?? 0, quizzes: quizzes ?? 0 })
      if (lb.success) setLeaderboard({ top3: lb.top3 })
    }
    fetchStats()
  }, [])

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMsg({ type, text })
    setTimeout(() => setMsg(null), 3500)
  }

  const handleMakeAdmin = async () => {
    if (!adminEmail.trim()) return
    setLoading(true)
    const res = await makeAdmin(adminEmail.trim())
    setLoading(false)
    setAdminEmail('')
    showMsg(res.success ? 'success' : 'error', res.success ? res.message! : res.error!)
  }

  const handleRemoveAdmin = async () => {
    if (!removeId.trim()) return
    setLoading(true)
    const res = await removeAdmin(removeId.trim())
    setLoading(false)
    setRemoveId('')
    showMsg(res.success ? 'success' : 'error', res.success ? res.message! : res.error!)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Toast */}
      {msg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
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

      {/* Admin Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(99,102,241,0.08))',
          border: '1px solid rgba(168,85,247,0.25)',
          borderRadius: 24,
          padding: '24px',
          position: 'relative', overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: '30%', right: '30%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(168,85,247,0.6), transparent)' }} />
        <span style={{ fontSize: 11, color: '#a855f7', fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Admin Panel
        </span>
        <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 24, fontWeight: 700, color: '#f1f5f9', marginTop: 6 }}>
          Dashboard Overview
        </h2>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}
      >
        {[
          { label: 'Total Students', value: stats.students, icon: Users, color: '#6366f1' },
          { label: 'Total Quizzes', value: stats.quizzes, icon: BookOpen, color: '#a855f7' },
        ].map((s, i) => (
          <div key={i} style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 20, padding: '18px',
            display: 'flex', flexDirection: 'column', gap: 10,
          }}>
            <div style={{ width: 36, height: 36, background: `${s.color}18`, border: `1px solid ${s.color}30`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <s.icon size={16} color={s.color} />
            </div>
            <p style={{ fontSize: 28, fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', color: '#f1f5f9', lineHeight: 1 }}>{s.value}</p>
            <p style={{ fontSize: 11, color: '#475569', fontFamily: 'Inter, sans-serif' }}>{s.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Top 3 Leaderboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 24, overflow: 'hidden' }}
      >
        <div style={{ padding: '18px 20px 0', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <Trophy size={16} color="#f59e0b" />
          <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 15, fontWeight: 700, color: '#f1f5f9' }}>Top 3 Students</h3>
        </div>
        {(leaderboard?.top3 ?? []).map((e, i) => (
          <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: 20 }}>{medals[i].emoji}</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>{e.name || 'Student'}</p>
            </div>
            <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 14, fontWeight: 700, color: medals[i].color }}>{e.total_score} pts</span>
          </div>
        ))}
        {(leaderboard?.top3 ?? []).length === 0 && (
          <div style={{ padding: '20px', textAlign: 'center', color: '#475569', fontSize: 13, fontFamily: 'Inter' }}>No scores yet.</div>
        )}
      </motion.div>

      {/* Make Admin */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 24, padding: '20px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ width: 32, height: 32, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UserPlus size={15} color="#818cf8" />
          </div>
          <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 15, fontWeight: 700, color: '#f1f5f9' }}>Make Admin</h3>
        </div>
        <input
          className="glass-input"
          type="email"
          placeholder="user@example.com"
          value={adminEmail}
          onChange={e => setAdminEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleMakeAdmin()}
        />
        <button
          className="btn-primary"
          onClick={handleMakeAdmin}
          disabled={loading || !adminEmail.trim()}
          style={{ marginTop: 12 }}
        >
          {loading ? <Loader2 size={16} style={{ display: 'inline', animation: 'spin 1s linear infinite' }} /> : 'Grant Admin Access'}
        </button>
      </motion.div>

      {/* Remove Admin */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 24, padding: '20px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ width: 32, height: 32, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UserMinus size={15} color="#f87171" />
          </div>
          <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 15, fontWeight: 700, color: '#f1f5f9' }}>Remove Admin</h3>
        </div>
        <input
          className="glass-input"
          type="text"
          placeholder="User ID (UUID)"
          value={removeId}
          onChange={e => setRemoveId(e.target.value)}
        />
        <button
          onClick={handleRemoveAdmin}
          disabled={loading || !removeId.trim()}
          style={{
            width: '100%', marginTop: 12,
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 12, color: '#f87171',
            fontFamily: 'Space Grotesk, sans-serif', fontSize: 14, fontWeight: 600,
            padding: '12px', cursor: 'pointer',
          }}
        >
          Revoke Admin Access
        </button>
      </motion.div>
    </div>
  )
}
