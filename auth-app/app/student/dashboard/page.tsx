'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import BottomNav, { TabId } from '@/components/layout/BottomNav'
import WelcomeModal from '@/components/modals/WelcomeModal'
import StudentHome from '@/components/home/StudentHome'
import StudentQuiz from '@/components/quiz/StudentQuiz'
import CommunityFeed from '@/components/community/CommunityFeed'
import SettingsTab from '@/components/settings/SettingsTab'
import { markWelcomeSeen } from '@/lib/actions/student-actions'
import { Loader2 } from 'lucide-react'

export default function StudentDashboardPage() {
  const [tab, setTab] = useState<TabId>('home')
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showWelcome, setShowWelcome] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      // Fetch profile
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      const userProfile = data || { id: user.id, email: user.email, name: 'Student', role: 'student', total_score: 0 }
      setProfile(userProfile)

      // First time welcome check
      if (!userProfile.has_seen_welcome) {
        setShowWelcome(true)
      }

      setLoading(false)
    }

    init()
  }, [])

  const handleCloseWelcome = async () => {
    setShowWelcome(false)
    await markWelcomeSeen()
    setProfile((prev: any) => ({ ...prev, has_seen_welcome: true }))
  }

  if (loading) {
    return (
      <div className="cosmic-bg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={32} color="#6366f1" style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    )
  }

  return (
    <div className="cosmic-bg pb-nav" style={{ minHeight: '100dvh', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 480, padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        
        {/* Welcome Modal */}
        {showWelcome && <WelcomeModal onClose={handleCloseWelcome} />}

        {/* Tab View Transition */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {tab === 'home' && <StudentHome profile={profile} />}
            {tab === 'quiz' && <StudentQuiz />}
            {tab === 'community' && <CommunityFeed role="student" />}
            {tab === 'settings' && <SettingsTab profile={profile} />}
          </motion.div>
        </AnimatePresence>

        {/* Sticky Mobile Bottom Navigation */}
        <BottomNav active={tab} onChange={setTab} />
      </div>
    </div>
  )
}
