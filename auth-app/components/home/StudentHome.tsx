'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Star, TrendingUp, Zap } from 'lucide-react'
import { getLeaderboard } from '@/lib/actions/student-actions'

interface Profile {
  name?: string
  email?: string
  total_score?: number
  role?: string
}

interface LeaderboardEntry {
  id: string
  name?: string
  total_score: number
}

interface Props {
  profile: Profile
}

const medals = [
  { label: '1st', color: '#f59e0b', shadow: 'rgba(245,158,11,0.3)', emoji: '🥇' },
  { label: '2nd', color: '#94a3b8', shadow: 'rgba(148,163,184,0.3)', emoji: '🥈' },
  { label: '3rd', color: '#b45309', shadow: 'rgba(180,83,9,0.3)', emoji: '🥉' },
]

export default function StudentHome({ profile }: Props) {
  const [leaderboard, setLeaderboard] = useState<{ top3: LeaderboardEntry[]; myRank: number | null; myScore: number } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getLeaderboard().then((res) => {
      if (res.success) {
        setLeaderboard({ top3: res.top3, myRank: res.myRank ?? null, myScore: res.myScore ?? 0 })
      }
      setLoading(false)
    })
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Score Hero Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.18), rgba(168,85,247,0.1))',
          border: '1px solid rgba(99,102,241,0.25)',
          borderRadius: 24,
          padding: '28px 24px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 0 30px rgba(99,102,241,0.08)',
        }}
      >
        {/* Glow top */}
        <div style={{
          position: 'absolute', top: 0, left: '30%', right: '30%',
          height: 1, background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.6), transparent)',
        }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 12, color: '#64748b', fontWeight: 600, fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
              Your Score
            </p>
            <motion.h2
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
              style={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: 48,
                fontWeight: 700,
                lineHeight: 1,
                background: 'linear-gradient(135deg, #818cf8, #c084fc)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {profile.total_score ?? 0}
            </motion.h2>
            <p style={{ fontSize: 13, color: '#475569', fontFamily: 'Inter, sans-serif', marginTop: 6 }}>
              {leaderboard?.myRank ? `Rank #${leaderboard.myRank} overall` : 'Start a quiz to rank!'}
            </p>
          </div>

          <div style={{
            width: 72, height: 72,
            background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(168,85,247,0.2))',
            border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Trophy size={32} color="#818cf8" />
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: '#475569', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600 }}>Progress</span>
            <span style={{ fontSize: 11, color: '#818cf8', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600 }}>
              {Math.min((profile.total_score ?? 0), 100)}/100 pts
            </span>
          </div>
          <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 100, overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(((profile.total_score ?? 0) / 100) * 100, 100)}%` }}
              transition={{ delay: 0.5, duration: 1, ease: 'easeOut' }}
              style={{
                height: '100%',
                background: 'linear-gradient(90deg, #6366f1, #a855f7)',
                borderRadius: 100,
              }}
            />
          </div>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}
      >
        {[
          { label: 'Total Score', value: profile.total_score ?? 0, icon: Star, color: '#f59e0b' },
          { label: 'Your Rank', value: leaderboard?.myRank ? `#${leaderboard.myRank}` : '—', icon: TrendingUp, color: '#22c55e' },
        ].map((stat, i) => (
          <div
            key={i}
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 18,
              padding: '16px',
              display: 'flex', flexDirection: 'column', gap: 8,
            }}
          >
            <div style={{
              width: 36, height: 36,
              background: `${stat.color}18`,
              border: `1px solid ${stat.color}30`,
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <stat.icon size={16} color={stat.color} />
            </div>
            <p style={{ fontSize: 20, fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', color: '#f1f5f9' }}>
              {stat.value}
            </p>
            <p style={{ fontSize: 11, color: '#475569', fontFamily: 'Inter, sans-serif' }}>{stat.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Leaderboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 24,
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '20px 20px 0', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{
            width: 32, height: 32,
            background: 'rgba(245,158,11,0.15)',
            border: '1px solid rgba(245,158,11,0.25)',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Trophy size={16} color="#f59e0b" />
          </div>
          <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>
            Top 3 Leaderboard
          </h3>
        </div>

        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#475569', fontSize: 13 }}>Loading...</div>
        ) : leaderboard?.top3.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#475569', fontSize: 13 }}>
            No scores yet. Be the first! 🚀
          </div>
        ) : (
          <div>
            {leaderboard?.top3.map((entry, i) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '14px 20px',
                  borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <span style={{ fontSize: 24, minWidth: 32, textAlign: 'center' }}>
                  {medals[i].emoji}
                </span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 14, fontWeight: 600, color: '#f1f5f9' }}>
                    {entry.name || 'Student'}
                  </p>
                  <p style={{ fontSize: 11, color: '#475569', fontFamily: 'Inter, sans-serif' }}>
                    {medals[i].label} Place
                  </p>
                </div>
                <div style={{
                  background: `${medals[i].color}18`,
                  border: `1px solid ${medals[i].color}35`,
                  borderRadius: 10,
                  padding: '6px 14px',
                }}>
                  <span style={{
                    fontFamily: 'Space Grotesk, sans-serif',
                    fontSize: 15,
                    fontWeight: 700,
                    color: medals[i].color,
                  }}>
                    {entry.total_score}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
          <span style={{ fontSize: 12, color: '#475569', fontFamily: 'Space Grotesk, sans-serif' }}>
            Complete quizzes to climb the board! <Zap size={12} style={{ display: 'inline', color: '#818cf8' }} />
          </span>
        </div>
      </motion.div>
    </div>
  )
}
