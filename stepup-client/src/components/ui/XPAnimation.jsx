import { motion } from 'framer-motion'
import { Sparkles, Zap } from 'lucide-react'

export default function XPAnimation({ amount, onDone }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.3, y: 30 }}
      animate={{
        opacity: [0, 1, 1, 0],
        scale: [0.5, 1.2, 1, 0.8],
        y: [20, -120, -160, -200]
      }}
      transition={{
        duration: 1.6,
        times: [0, 0.15, 0.8, 1],
        ease: 'easeOut'
      }}
      onAnimationComplete={onDone}
      className="fixed inset-0 pointer-events-none z-[1000] flex items-center justify-center"
    >
      <div
        className="px-6 py-3 rounded-2xl flex items-center gap-2 border shadow-2xl"
        style={{
          background: 'rgba(10,10,15,0.92)',
          borderColor: 'rgba(255,184,0,0.5)',
          boxShadow: '0 12px 40px rgba(255,184,0,0.25)',
        }}
      >
        <Zap className="text-gold animate-bounce" size={18} fill="#FFB800" />
        <span
          className="text-lg font-black font-display tracking-wider"
          style={{
            color: '#FFB800',
            textShadow: '0 0 10px rgba(255,184,0,0.6)',
          }}
        >
          +{amount} XP
        </span>
        <Sparkles className="text-white animate-pulse" size={14} />
      </div>
    </motion.div>
  )
}
