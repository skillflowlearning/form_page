'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Home, Zap, MessageSquare, Settings } from 'lucide-react'

export type TabId = 'home' | 'quiz' | 'community' | 'settings'

interface Props {
  active: TabId
  onChange: (tab: TabId) => void
}

const tabs = [
  { id: 'home' as TabId,      icon: Home,          label: 'Home' },
  { id: 'quiz' as TabId,      icon: Zap,           label: 'Quiz' },
  { id: 'community' as TabId, icon: MessageSquare, label: 'Community' },
  { id: 'settings' as TabId,  icon: Settings,      label: 'Settings' },
]

export default function BottomNav({ active, onChange }: Props) {
  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        display: 'flex',
        justifyContent: 'center',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          background: 'rgba(7, 13, 26, 0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          display: 'flex',
          alignItems: 'center',
          padding: '8px 12px 10px',
        }}
      >
        {tabs.map((tab) => {
          const isActive = active === tab.id
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '6px 0',
                position: 'relative',
              }}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-pill"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(99,102,241,0.12)',
                    borderRadius: 12,
                    border: '1px solid rgba(99,102,241,0.2)',
                  }}
                  transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                />
              )}
              <motion.div
                animate={{ scale: isActive ? 1.1 : 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              >
                <Icon
                  size={20}
                  style={{
                    color: isActive ? '#818cf8' : '#475569',
                    transition: 'color 0.2s',
                  }}
                />
              </motion.div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  fontFamily: 'Space Grotesk, sans-serif',
                  color: isActive ? '#818cf8' : '#475569',
                  transition: 'color 0.2s',
                  letterSpacing: '0.03em',
                  position: 'relative',
                }}
              >
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
