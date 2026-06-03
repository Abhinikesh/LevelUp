import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function AuthLayout() {
  return (
    <div className="min-h-screen grid-bg relative overflow-hidden flex items-center justify-center">

      {/* Ambient background orbs */}
      <div
        className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(108,99,255,0.12) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
      <div
        className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(255,101,132,0.1) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
      <div
        className="absolute top-[40%] right-[20%] w-[300px] h-[300px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(67,233,123,0.06) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      {/* Logo + Brand */}
      <div className="absolute top-8 left-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2"
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center font-display font-black text-white text-sm"
            style={{ background: 'linear-gradient(135deg, #6C63FF, #FF6584)' }}
          >
            S
          </div>
          <span className="font-display font-black text-xl tracking-tight" style={{ color: '#F0F0FF' }}>
            STEP<span className="gradient-text">UP</span>
          </span>
        </motion.div>
      </div>

      {/* Floating decorative level nodes */}
      <motion.div
        animate={{ y: [0, -16, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[15%] right-[8%] w-14 h-14 rounded-full flex items-center justify-center text-xl pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, #6C63FF, #9c8dff)',
          boxShadow: '0 0 30px rgba(108,99,255,0.5)',
          opacity: 0.7,
        }}
      >
        ⚡
      </motion.div>
      <motion.div
        animate={{ y: [0, 12, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute bottom-[20%] left-[6%] w-12 h-12 rounded-full flex items-center justify-center text-lg pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, #FFB800, #FFD93D)',
          boxShadow: '0 0 25px rgba(255,184,0,0.5)',
          opacity: 0.7,
        }}
      >
        🏆
      </motion.div>
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        className="absolute top-[55%] left-[12%] w-10 h-10 rounded-full flex items-center justify-center text-base pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, #43E97B, #38f9d7)',
          boxShadow: '0 0 20px rgba(67,233,123,0.5)',
          opacity: 0.65,
        }}
      >
        🔥
      </motion.div>

      {/* Main content area */}
      <main className="relative z-10 w-full max-w-md px-4">
        <Outlet />
      </main>
    </div>
  )
}
