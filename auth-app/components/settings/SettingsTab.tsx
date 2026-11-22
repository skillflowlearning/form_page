'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Mail, Shield, LogOut, Trash2, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { deleteStudent } from '@/lib/actions/admin-actions'

interface Props {
  profile: {
    id?: string
    name?: string
    email?: string
    role?: string
  }
}

export default function SettingsTab({ profile }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  // Admin delete student quick action
  const [studentIdToDelete, setStudentIdToDelete] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [delMsg, setDelMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleLogout = async () => {
    setLoggingOut(true)
    await supabase.auth.signOut()
    router.push(profile.role === 'admin' ? '/admin/login' : '/student/login')
  }

  const handleDeleteStudent = async () => {
    if (!studentIdToDelete.trim()) return
    setDeleting(true)
    const res = await deleteStudent(studentIdToDelete.trim())
    setDeleting(false)
    setStudentIdToDelete('')
    setDelMsg({
      type: res.success ? 'success' : 'error',
      text: res.success ? (res.message || 'Student deleted.') : (res.error || 'Failed to delete.'),
    })
    setTimeout(() => setDelMsg(null), 4000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 22, fontWeight: 700, color: '#f1f5f9' }}>
          Account Settings
        </h2>
        <p style={{ fontSize: 13, color: '#64748b', fontFamily: 'Inter', marginTop: 4 }}>
          Manage your personal details and session preferences
        </p>
      </div>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 24,
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 54, height: 54, borderRadius: 18,
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 700, color: '#fff',
            fontFamily: 'Space Grotesk, sans-serif'
          }}>
            {(profile.name || profile.email || 'U')[0].toUpperCase()}
          </div>
          <div>
            <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 17, fontWeight: 700, color: '#f1f5f9' }}>
              {profile.name || 'SkillFlow User'}
            </h3>
            <span style={{
              display: 'inline-block',
              marginTop: 4,
              fontSize: 11,
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: 6,
              background: profile.role === 'admin' ? 'rgba(168,85,247,0.2)' : 'rgba(99,102,241,0.2)',
              color: profile.role === 'admin' ? '#c084fc' : '#818cf8',
              fontFamily: 'Space Grotesk, sans-serif',
              textTransform: 'uppercase'
            }}>
              {profile.role || 'student'}
            </span>
          </div>
        </div>

        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Mail size={16} color="#64748b" />
            <span style={{ fontSize: 13, color: '#cbd5e1', fontFamily: 'Inter' }}>{profile.email}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Shield size={16} color="#64748b" />
            <span style={{ fontSize: 13, color: '#94a3b8', fontFamily: 'Inter' }}>Verified Session</span>
          </div>
        </div>
      </motion.div>

      {/* Admin Danger Zone: Delete Student */}
      {profile.role === 'admin' && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            background: 'rgba(239,68,68,0.03)',
            border: '1px solid rgba(239,68,68,0.18)',
            borderRadius: 24,
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Trash2 size={16} color="#f87171" />
            <h4 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 15, fontWeight: 700, color: '#f87171' }}>
              Delete Student (Admin)
            </h4>
          </div>
          <p style={{ fontSize: 12, color: '#94a3b8', fontFamily: 'Inter' }}>
            Permanently removes user from Supabase Auth & cascades profiles record.
          </p>

          {delMsg && (
            <div style={{ fontSize: 12, color: delMsg.type === 'success' ? '#4ade80' : '#f87171', fontFamily: 'Inter' }}>
              {delMsg.text}
            </div>
          )}

          <input
            className="glass-input"
            placeholder="Student User UUID"
            value={studentIdToDelete}
            onChange={e => setStudentIdToDelete(e.target.value)}
          />

          <button
            onClick={handleDeleteStudent}
            disabled={deleting || !studentIdToDelete.trim()}
            style={{
              background: 'rgba(239,68,68,0.15)',
              border: '1px solid rgba(239,68,68,0.3)',
              color: '#f87171',
              borderRadius: 12,
              padding: '10px',
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {deleting ? 'Deleting...' : 'Delete Student Record'}
          </button>
        </motion.div>
      )}

      {/* Logout Action */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 24,
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {!showLogoutConfirm ? (
          <button
            onClick={() => setShowLogoutConfirm(true)}
            style={{
              width: '100%',
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 14,
              color: '#f87171',
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: 15,
              fontWeight: 600,
              padding: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.2s'
            }}
          >
            <LogOut size={16} /> Logout from SkillFlow
          </button>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: '#f1f5f9', fontFamily: 'Inter' }}>
              Are you sure you want to log out?
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="btn-ghost"
                onClick={() => setShowLogoutConfirm(false)}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                style={{
                  flex: 1,
                  background: '#ef4444',
                  border: 'none',
                  borderRadius: 12,
                  color: 'white',
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '10px'
                }}
              >
                {loggingOut ? 'Logging out...' : 'Confirm'}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
