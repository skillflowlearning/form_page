'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Send, Shield, MessageSquare, Loader2 } from 'lucide-react'
import { getCommunityMessages } from '@/lib/actions/student-actions'
import { postCommunityMessage } from '@/lib/actions/admin-actions'

interface Message {
  id: string
  message: string
  created_at: string
  sender?: {
    name?: string
    email?: string
  }
}

interface Props {
  role: 'student' | 'admin'
}

export default function CommunityFeed({ role }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [newMsg, setNewMsg] = useState('')
  const [posting, setPosting] = useState(false)

  const fetchMessages = async () => {
    const res = await getCommunityMessages(40)
    if (res.success && res.messages) {
      setMessages(res.messages as Message[])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchMessages()
  }, [])

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMsg.trim()) return

    setPosting(true)
    const res = await postCommunityMessage(newMsg.trim())
    setPosting(false)

    if (res.success) {
      setNewMsg('')
      fetchMessages()
    }
  }

  const formatTime = (ts: string) => {
    try {
      const d = new Date(ts)
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' })
    } catch {
      return ''
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 22, fontWeight: 700, color: '#f1f5f9' }}>
          Community Announcements
        </h2>
        <p style={{ fontSize: 13, color: '#64748b', fontFamily: 'Inter', marginTop: 4 }}>
          Official updates, live contests & rewards from instructors
        </p>
      </div>

      {/* Admin Post Input (Only rendered for Admin) */}
      {role === 'admin' && (
        <form onSubmit={handlePost} style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(99,102,241,0.3)',
          borderRadius: 20,
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          boxShadow: '0 0 25px rgba(99,102,241,0.08)'
        }}>
          <textarea
            className="glass-input"
            rows={2}
            placeholder="Broadcast an announcement to all students..."
            value={newMsg}
            onChange={e => setNewMsg(e.target.value)}
            style={{ resize: 'none' }}
          />
          <button
            type="submit"
            className="btn-primary"
            disabled={posting || !newMsg.trim()}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 16px' }}
          >
            {posting ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <><Send size={15} /> Post Announcement</>}
          </button>
        </form>
      )}

      {/* Feed list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <Loader2 size={24} color="#6366f1" style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
            <MessageSquare size={36} color="#374151" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontFamily: 'Space Grotesk, sans-serif' }}>No announcements yet.</p>
          </div>
        ) : (
          messages.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 20,
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Shield size={14} color="#818cf8" />
                  </div>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9', fontFamily: 'Space Grotesk, sans-serif' }}>
                      {m.sender?.name || 'SkillFlow Instructor'}
                    </span>
                    <span style={{ marginLeft: 6, fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(99,102,241,0.2)', color: '#818cf8', fontWeight: 600 }}>
                      ADMIN
                    </span>
                  </div>
                </div>
                <span style={{ fontSize: 11, color: '#64748b', fontFamily: 'Inter' }}>
                  {formatTime(m.created_at)}
                </span>
              </div>

              <p style={{ fontSize: 14, color: '#cbd5e1', lineHeight: 1.6, fontFamily: 'Inter', whiteSpace: 'pre-wrap' }}>
                {m.message}
              </p>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}
