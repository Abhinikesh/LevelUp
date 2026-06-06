import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Map, Plus, Users, User,
  Trophy, BarChart2, Settings, LogOut, Zap, Flame
} from 'lucide-react'
import useStore from '../../store/useStore'

const NAV_ITEMS = [
  { to: '/home/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/home/map',       icon: Map,             label: 'Map'       },
  { to: '/home/create',    icon: Plus,            label: 'Create',   highlight: true },
  { to: '/home/social',    icon: Users,           label: 'Social'    },
  { to: '/home/profile',   icon: User,            label: 'Profile'   },
]

const SIDEBAR_ITEMS = [
  { to: '/home/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/home/map',       icon: Map,             label: 'Game Map'  },
  { to: '/home/create',    icon: Plus,            label: 'New Roadmap', highlight: true },
  { to: '/home/social',    icon: Users,           label: 'Social'    },
  { to: '/home/profile',   icon: User,            label: 'Profile'   },
  { to: '/home/analytics', icon: BarChart2,       label: 'Analytics' },
  { to: '/home/settings',  icon: Settings,        label: 'Settings'  },
]

export default function AppLayout() {
  const { user, logout } = useStore()
  const navigate = useNavigate()

  const xp     = user?.xpTotal || 0
  const level  = Math.floor(xp / 500) + 1
  const xpPct  = (xp % 500) / 500 * 100
  const streak = user?.streakCount || 0

  const initials = (user?.name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0A0A0F' }}>

      {/* ════════ SIDEBAR (desktop) ════════ */}
      <aside className="hidden md:flex flex-col w-64 flex-shrink-0 border-r overflow-y-auto"
        style={{ background: '#0C0C14', borderColor: '#1E1E2E' }}>

        {/* Logo */}
        <div className="px-6 py-5 border-b flex items-center gap-3" style={{ borderColor: '#1E1E2E' }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center font-display font-black text-sm"
            style={{ background: 'linear-gradient(135deg,#6C63FF,#FF6584)', color: '#fff' }}>S</div>
          <span className="font-display font-black text-lg text-white">STEPUP</span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {SIDEBAR_ITEMS.map(({ to, icon: Icon, label, highlight }) => (
            <NavLink key={to} to={to} end={to === '/home/dashboard'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 group ${
                  highlight
                    ? 'text-white'
                    : isActive
                      ? 'text-white'
                      : 'text-muted hover:text-white hover:bg-white/5'
                }`
              }
              style={({ isActive }) => ({
                background: highlight
                  ? 'linear-gradient(135deg,#6C63FF,#FF6584)'
                  : isActive ? 'rgba(108,99,255,0.12)' : 'transparent',
                border: highlight
                  ? 'none'
                  : isActive ? '1px solid rgba(108,99,255,0.25)' : '1px solid transparent',
                boxShadow: highlight ? '0 0 20px rgba(108,99,255,0.3)' : 'none',
              })}
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom: User card */}
        <div className="px-4 py-4 border-t" style={{ borderColor: '#1E1E2E' }}>
          {/* XP bar */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-muted font-bold">Level {level}</span>
              <span className="text-[10px] text-brand font-black">{Math.round(xpPct)}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#1E1E2E' }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${xpPct}%`, background: 'linear-gradient(90deg,#6C63FF,#9c8dff)' }} />
            </div>
            <div className="flex items-center gap-3 mt-1.5">
              <div className="flex items-center gap-1 text-[10px] text-gold">
                <Zap size={9} /> {xp.toLocaleString()} XP
              </div>
              {streak > 0 && (
                <div className="flex items-center gap-1 text-[10px] text-coral">
                  <Flame size={9} /> {streak}d streak
                </div>
              )}
            </div>
          </div>

          {/* User info */}
          <div className="flex items-center gap-2 p-2 rounded-xl hover:bg-white/5 transition-colors">
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-xs flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#6C63FF,#FF6584)', color: '#fff' }}>
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-muted truncate">{user?.email}</p>
            </div>
            <button onClick={handleLogout} title="Logout"
              className="p-1.5 rounded-lg text-muted hover:text-coral hover:bg-coral/10 transition-all flex-shrink-0">
              <LogOut size={13} />
            </button>
          </div>
        </div>
      </aside>

      {/* ════════ MAIN CONTENT ════════ */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col">
        <div className="flex-1 pb-20 md:pb-0">
          <Outlet />
        </div>
      </main>

      {/* ════════ BOTTOM NAV (mobile) ════════ */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-2 pb-safe"
        style={{ background: 'rgba(12,12,20,0.95)', backdropFilter: 'blur(20px)',
                 borderTop: '1px solid #1E1E2E' }}>
        <div className="flex items-center justify-around py-2">
          {NAV_ITEMS.map(({ to, icon: Icon, label, highlight }) => (
            <NavLink key={to} to={to} end={to === '/home/dashboard'}
              className="flex flex-col items-center gap-0.5 min-w-[44px] min-h-[44px] justify-center relative"
            >
              {({ isActive }) => (
                <>
                  {highlight ? (
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center -mt-4"
                      style={{ background: 'linear-gradient(135deg,#6C63FF,#FF6584)',
                               boxShadow: '0 0 20px rgba(108,99,255,0.5)' }}>
                      <Icon size={20} className="text-white" />
                    </div>
                  ) : (
                    <>
                      <Icon size={20} style={{ color: isActive ? '#6C63FF' : '#8B8BAE' }} />
                      <span className="text-[9px] font-bold"
                        style={{ color: isActive ? '#6C63FF' : '#8B8BAE' }}>
                        {label}
                      </span>
                      {isActive && (
                        <motion.div layoutId="mobile-tab-indicator"
                          className="absolute -bottom-2 w-4 h-0.5 rounded-full"
                          style={{ background: '#6C63FF' }} />
                      )}
                    </>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

    </div>
  )
}
