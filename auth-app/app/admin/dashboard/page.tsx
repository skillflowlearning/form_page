'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import BottomNav, { TabId } from '@/components/layout/BottomNav'
import AdminHome from '@/components/home/AdminHome'
import AdminQuiz from '@/components/quiz/AdminQuiz'
import CommunityFeed from '@/components/community/CommunityFeed'
import SettingsTab from '@/components/settings/SettingsTab'
import { Loader2 } from 'lucide-react'

export default function AdminDashboardPage() {
  const [tab, setTab] = useState<TabId>('home')
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      setProfile(data || { id: user.id, email: user.email, name: 'Admin', role: 'admin' })
      setLoading(false)
    }

    init()
  }, [])

  if (loading) {
    return (
      <div className="cosmic-bg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={32} color="#a855f7" style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    )
  }

  return (
    <div className="cosmic-bg pb-nav" style={{ minHeight: '100dvh', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 480, padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        
        {/* Tab View Transition */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {tab === 'home' && <AdminHome />}
            {tab === 'quiz' && <AdminQuiz />}
            {tab === 'community' && <CommunityFeed role="admin" />}
            {tab === 'settings' && <SettingsTab profile={profile} />}
          </motion.div>
        </AnimatePresence>

        {/* Sticky Mobile Bottom Navigation */}
        <BottomNav active={tab} onChange={setTab} />
      </div>
    </div>
  )
}
