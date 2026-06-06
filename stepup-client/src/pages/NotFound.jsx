import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Home, Map } from 'lucide-react'

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ background: '#0A0A0F' }}>
      {/* Animated broken node */}
      <motion.div
        animate={{ y: [0, -14, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="relative w-32 h-32 mb-8"
      >
        {/* Outer ring - broken */}
        <svg viewBox="0 0 128 128" className="w-full h-full" fill="none">
          <circle cx="64" cy="64" r="54" stroke="#1E1E2E" strokeWidth="6" />
          <path d="M 64 10 A 54 54 0 0 1 118 64" stroke="#6C63FF" strokeWidth="6"
            strokeLinecap="round" strokeDasharray="6 6" />
          <path d="M 10 64 A 54 54 0 0 0 64 118" stroke="#FF6584" strokeWidth="6"
            strokeLinecap="round" strokeDasharray="4 8" />
          {/* Inner circle */}
          <circle cx="64" cy="64" r="30" fill="#12121A" stroke="#1E1E2E" strokeWidth="3" />
          {/* 4 and 0 and 4 */}
          <text x="64" y="72" textAnchor="middle" fill="#6C63FF"
            style={{ fontFamily: 'Syne, sans-serif', fontWeight: 900, fontSize: 24 }}>
            404
          </text>
        </svg>
        {/* Crack lines */}
        <div className="absolute top-4 right-4 w-6 h-0.5 rotate-45" style={{ background: '#FF6584', opacity: 0.6 }} />
        <div className="absolute bottom-6 left-3 w-4 h-0.5 -rotate-12" style={{ background: '#6C63FF', opacity: 0.5 }} />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <h1 className="font-display font-black text-3xl text-white mb-2">
          This Level Doesn't Exist Yet
        </h1>
        <p className="text-muted text-sm max-w-xs mx-auto mb-8">
          Looks like you wandered off the map. This page hasn't been unlocked — head back to safety.
        </p>
        <div className="flex items-center justify-center gap-3">
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm"
            style={{ background: 'linear-gradient(135deg,#6C63FF,#FF6584)', color: '#fff',
                     boxShadow: '0 0 30px rgba(108,99,255,0.4)' }}>
            <Home size={15} /> Go Back Home
          </motion.button>
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={() => navigate('/home/map')}
            className="btn btn-ghost flex items-center gap-2 px-6 py-3 text-sm">
            <Map size={15} /> View Map
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}
