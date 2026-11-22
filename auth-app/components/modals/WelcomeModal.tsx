'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles } from 'lucide-react'

interface Props {
  onClose: () => void
}

export default function WelcomeModal({ onClose }: Props) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          background: 'rgba(3,6,15,0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        {/* Stars background */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 2 + Math.random() * 3, delay: Math.random() * 2, repeat: Infinity }}
              style={{
                position: 'absolute',
                width: Math.random() > 0.7 ? 2 : 1,
                height: Math.random() > 0.7 ? 2 : 1,
                background: 'white',
                borderRadius: '50%',
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
              }}
            />
          ))}
        </div>

        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: -20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.1 }}
          style={{
            width: '100%',
            maxWidth: 380,
            background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(168,85,247,0.08))',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: 28,
            padding: '40px 32px',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 0 60px rgba(99,102,241,0.15), 0 0 120px rgba(168,85,247,0.1)',
          }}
        >
          {/* Top glow line */}
          <div style={{
            position: 'absolute',
            top: 0, left: '20%', right: '20%',
            height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.8), transparent)',
          }} />

          {/* Icon */}
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              width: 80, height: 80,
              background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(168,85,247,0.2))',
              border: '1px solid rgba(99,102,241,0.3)',
              borderRadius: 24,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px',
            }}
          >
            <Sparkles size={36} color="#818cf8" />
          </motion.div>

          {/* Title */}
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: 26,
              fontWeight: 700,
              color: '#f1f5f9',
              marginBottom: 12,
              lineHeight: 1.2,
            }}
          >
            Welcome to{' '}
            <span style={{
              background: 'linear-gradient(135deg, #818cf8, #c084fc)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Quiz & Play!
            </span>
          </motion.h2>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 15,
              color: '#94a3b8',
              lineHeight: 1.6,
              marginBottom: 32,
            }}
          >
            Participate in quizzes, climb the leaderboard, and win exciting rewards! 🏆
          </motion.p>

          {/* Stars/badges */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 8,
              marginBottom: 32,
            }}
          >
            {['🎯 Compete', '🏆 Win', '⭐ Shine'].map((item, i) => (
              <span
                key={i}
                style={{
                  background: 'rgba(99,102,241,0.12)',
                  border: '1px solid rgba(99,102,241,0.2)',
                  borderRadius: 100,
                  padding: '4px 12px',
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: 'Space Grotesk, sans-serif',
                  color: '#a5b4fc',
                }}
              >
                {item}
              </span>
            ))}
          </motion.div>

          {/* CTA Button */}
          <motion.button
            whileTap={{ scale: 0.96 }}
            whileHover={{ opacity: 0.9 }}
            onClick={onClose}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              border: 'none',
              borderRadius: 14,
              color: 'white',
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: 16,
              fontWeight: 700,
              padding: '16px 24px',
              cursor: 'pointer',
              boxShadow: '0 4px 24px rgba(99,102,241,0.4)',
              letterSpacing: '0.02em',
            }}
          >
            Let's Go! 🚀
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
