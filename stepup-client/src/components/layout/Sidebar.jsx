import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Map,
  Trophy,
  Settings,
  LogOut,
  Zap,
  Flame,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Target,
  BarChart3,
} from 'lucide-react'
import useAuthStore from '../../store/authStore'

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard',  path: '/dashboard' },
  { icon: Map,             label: 'Game Map',   path: '/map' },
  { icon: Trophy,          label: 'Leaderboard',path: '/leaderboard' },
  { icon: BarChart3,       label: 'Analytics',  path: '/analytics' },
  { icon: Target,          label: 'Goals',      path: '/goals' },
  { icon: Settings,        label: 'Settings',   path: '/settings' },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const level      = user ? Math.floor((user.xpTotal || 0) / 500) + 1 : 1
  const xpProgress = user ? ((user.xpTotal || 0) % 500) / 500 : 0
  const xpCurrent  = user ? (user.xpTotal || 0) % 500 : 0

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative flex flex-col h-full overflow-hidden flex-shrink-0"
      style={{
        background: 'linear-gradient(180deg, #0D0D18 0%, #0A0A0F 100%)',
        borderRight: '1px solid #1E1E2E',
      }}
    >
      {/* ── Collapse Toggle ── */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-[72px] z-20 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
        style={{
          background: 'linear-gradient(135deg, #6C63FF, #9c8dff)',
          boxShadow: '0 0 12px rgba(108,99,255,0.5)',
          border: '2px solid #0A0A0F',
        }}
        id="sidebar-toggle"
      >
        {collapsed
          ? <ChevronRight size={12} className="text-white" />
          : <ChevronLeft size={12} className="text-white" />}
      </button>

      {/* ── Logo ── */}
      <div className="flex items-center gap-3 px-4 py-5 border-b" style={{ borderColor: '#1E1E2E' }}>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #6C63FF, #FF6584)' }}
        >
          <Sparkles size={16} className="text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="font-display font-black text-base text-white tracking-tight whitespace-nowrap"
            >
              STEP<span style={{ color: '#6C63FF' }}>UP</span>
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* ── Nav Items ── */}
      <nav className="flex-1 flex flex-col gap-1 p-3 pt-4 overflow-y-auto no-scrollbar">
        {NAV_ITEMS.map(({ icon: Icon, label, path }) => (
          <NavLink
            key={path}
            to={path}
            id={`sidebar-nav-${label.toLowerCase().replace(' ', '-')}`}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
                isActive
                  ? 'bg-brand/10 border border-brand/30 text-white'
                  : 'text-muted hover:bg-white/5 hover:text-white border border-transparent'
              }`
            }
            style={({ isActive }) =>
              isActive ? { boxShadow: '0 0 12px rgba(108,99,255,0.15)' } : {}
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={18}
                  className={`flex-shrink-0 transition-colors ${isActive ? 'text-brand' : 'text-muted group-hover:text-white'}`}
                />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.15 }}
                      className="text-xs font-semibold whitespace-nowrap"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-indicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full"
                    style={{ background: '#6C63FF' }}
                  />
                )}
                {/* Tooltip when collapsed */}
                {collapsed && (
                  <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2 py-1 rounded-lg text-xs font-semibold text-white pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50"
                    style={{ background: '#1E1E2E', border: '1px solid #2E2E4E' }}>
                    {label}
                  </div>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── User Profile + XP Bar ── */}
      <div className="p-3 border-t" style={{ borderColor: '#1E1E2E' }}>
        {/* XP Progress */}
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-3 px-1"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider flex items-center gap-1">
                  <Zap size={9} className="text-brand" /> Level {level}
                </span>
                <span className="text-[10px] font-bold text-muted">{xpCurrent}/500 XP</span>
              </div>
              <div className="xp-bar-track" style={{ height: 4 }}>
                <motion.div
                  className="xp-bar-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${xpProgress * 100}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  style={{ height: '100%' }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* User card */}
        <div className="flex items-center gap-3 p-2 rounded-xl transition-colors hover:bg-white/5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm text-white flex-shrink-0 relative"
            style={{ background: 'linear-gradient(135deg, #6C63FF, #FF6584)' }}
          >
            {user?.name?.charAt(0)?.toUpperCase() || '?'}
            <div
              className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
              style={{ background: '#43E97B', borderColor: '#0A0A0F' }}
            />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
                className="flex-1 min-w-0"
              >
                <p className="text-xs font-bold text-white truncate">{user?.name}</p>
                <p className="text-[10px] text-muted flex items-center gap-1">
                  <Flame size={8} className="text-gold" />
                  {user?.streakCount || 0}d streak
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          {!collapsed && (
            <button
              onClick={handleLogout}
              id="sidebar-logout"
              title="Logout"
              className="ml-auto p-1.5 rounded-lg text-muted hover:text-coral hover:bg-coral/10 transition-all duration-200"
            >
              <LogOut size={13} />
            </button>
          )}
        </div>

        {/* Logout when collapsed */}
        {collapsed && (
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center p-2 mt-1 rounded-xl text-muted hover:text-coral hover:bg-coral/10 transition-all duration-200"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        )}
      </div>
    </motion.aside>
  )
}
