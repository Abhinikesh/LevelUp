import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, Zap, Flame, Trophy, ChevronDown } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import toast from 'react-hot-toast'

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const navigate         = useNavigate()
  const location         = useLocation()
  const [scrolled,      setScrolled]      = useState(false)
  const [profileOpen,   setProfileOpen]   = useState(false)

  const xpProgress = user ? ((user.xpTotal || 0) % 500) / 500 : 0
  const level      = user ? Math.floor((user.xpTotal || 0) / 500) + 1 : 1
  const xpInLevel  = user ? (user.xpTotal || 0) % 500 : 0

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setProfileOpen(false)
  }, [location])

  const handleLogout = () => {
    logout()
    toast.success('Logged out. See you soon! 👋')
    navigate('/login')
  }

  const avatarLetter = user?.name ? user.name.charAt(0).toUpperCase() : '?'

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="sticky top-0 z-50 w-full transition-all duration-300"
      style={{
        background: scrolled
          ? 'rgba(10,10,15,0.85)'
          : 'rgba(10,10,15,0.6)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: scrolled
          ? '1px solid rgba(30,30,46,0.9)'
          : '1px solid rgba(30,30,46,0.4)',
        boxShadow: scrolled ? '0 4px 32px rgba(0,0,0,0.4)' : 'none',
      }}
    >
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">

        {/* ── Logo ─────────────────────────────────────────── */}
        <Link to="/dashboard" className="flex items-center gap-2.5 group">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-sm transition-transform duration-200 group-hover:scale-110"
            style={{ background: 'linear-gradient(135deg, #6C63FF, #FF6584)' }}
          >
            S
          </div>
          <span className="font-display font-black text-lg tracking-tight" style={{ color: '#F0F0FF' }}>
            STEP<span className="gradient-text">UP</span>
          </span>
        </Link>

        {/* ── Right Side ────────────────────────────────────── */}
        <div className="flex items-center gap-4">

          {/* Streak Badge */}
          {user?.streakCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold"
              style={{
                background: 'rgba(255,184,0,0.12)',
                border: '1px solid rgba(255,184,0,0.25)',
                color: '#FFB800',
              }}
            >
              <Flame size={14} className="text-gold animate-bounce-slow" />
              <span>{user.streakCount}</span>
            </motion.div>
          )}

          {/* Level + XP Bar */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Zap size={14} style={{ color: '#6C63FF' }} />
              <span className="text-xs font-semibold" style={{ color: '#8B8BAE' }}>
                Lv.{level}
              </span>
            </div>
            <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: '#1E1E2E' }}>
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${xpProgress * 100}%` }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                style={{
                  background: 'linear-gradient(90deg, #6C63FF, #9c8dff)',
                  boxShadow: '0 0 8px rgba(108,99,255,0.6)',
                }}
              />
            </div>
            <span className="text-xs" style={{ color: '#8B8BAE' }}>
              {xpInLevel}<span style={{ color: '#3a3a5c' }}>/500</span>
            </span>
          </div>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              id="navbar-profile-btn"
              onClick={() => setProfileOpen((p) => !p)}
              className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition-all duration-200"
              style={{
                background: profileOpen ? 'rgba(108,99,255,0.12)' : 'transparent',
                border: '1px solid',
                borderColor: profileOpen ? 'rgba(108,99,255,0.3)' : 'rgba(30,30,46,0.6)',
              }}
            >
              {/* Avatar */}
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #6C63FF, #9c8dff)' }}
              >
                {avatarLetter}
              </div>
              <span className="hidden sm:block text-sm font-medium max-w-[96px] truncate" style={{ color: '#F0F0FF' }}>
                {user?.name?.split(' ')[0]}
              </span>
              <ChevronDown
                size={14}
                style={{
                  color: '#8B8BAE',
                  transform: profileOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease',
                }}
              />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="absolute right-0 mt-2 w-64 rounded-2xl overflow-hidden"
                  style={{
                    background: '#12121A',
                    border: '1px solid #1E1E2E',
                    boxShadow: '0 16px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(108,99,255,0.08)',
                  }}
                >
                  {/* User Info */}
                  <div className="p-4 border-b" style={{ borderColor: '#1E1E2E' }}>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, #6C63FF, #9c8dff)' }}
                      >
                        {avatarLetter}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: '#F0F0FF' }}>
                          {user?.name}
                        </p>
                        <p className="text-xs truncate" style={{ color: '#8B8BAE' }}>
                          {user?.email}
                        </p>
                      </div>
                    </div>

                    {/* Mini Stats */}
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {[
                        { icon: '⚡', value: user?.xpTotal || 0, label: 'XP' },
                        { icon: '🔥', value: user?.streakCount || 0, label: 'Streak' },
                        { icon: '🏆', value: user?.badges?.length || 0, label: 'Badges' },
                      ].map((stat) => (
                        <div
                          key={stat.label}
                          className="flex flex-col items-center py-2 rounded-xl"
                          style={{ background: 'rgba(30,30,46,0.6)' }}
                        >
                          <span className="text-base leading-none">{stat.icon}</span>
                          <span className="text-sm font-bold mt-1" style={{ color: '#F0F0FF' }}>{stat.value}</span>
                          <span className="text-xs" style={{ color: '#8B8BAE' }}>{stat.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-2">
                    <button
                      id="navbar-logout-btn"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
                      style={{ color: '#FF6584' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,101,132,0.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <LogOut size={15} />
                      Sign out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.header>
  )
}
