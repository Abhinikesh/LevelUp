import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Edit2, Check, X, Trophy, Star, Lock, Flame, Zap,
  Clock, BookOpen, Calendar, ChevronDown, Award
} from 'lucide-react'
import { userApi } from '../api/client'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'

function Skeleton({ className }) {
  return <div className={`skeleton rounded-xl ${className}`} />
}

function Avatar({ name = '?', size = 80, color = '#6C63FF' }) {
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  return (
    <div className="flex items-center justify-center font-display font-black rounded-full flex-shrink-0"
      style={{ width: size, height: size, background: `linear-gradient(135deg, #6C63FF, #FF6584)`,
               fontSize: size * 0.32, color: '#fff',
               boxShadow: '0 0 30px rgba(108,99,255,0.4)' }}>
      {initials}
    </div>
  )
}

const TIER_COLORS = { bronze: '#CD7F32', silver: '#C0C0C0', gold: '#FFB800', platinum: '#43E97B' }

export default function Profile() {
  const { user, setUser } = useAuthStore()
  const [profile,   setProfile]   = useState(null)
  const [stats,     setStats]     = useState(null)
  const [badges,    setBadges]    = useState([])
  const [trophies,  setTrophies]  = useState([])
  const [history,   setHistory]   = useState([])
  const [histPage,  setHistPage]  = useState(1)
  const [histTotal, setHistTotal] = useState(0)
  const [loading,   setLoading]   = useState(true)
  const [editName,  setEditName]  = useState(false)
  const [nameVal,   setNameVal]   = useState('')
  const [saving,    setSaving]    = useState(false)
  const [activeTab, setActiveTab] = useState(0)
  const [tooltip,   setTooltip]   = useState(null)
  const nameRef = useRef(null)

  useEffect(() => {
    Promise.all([
      userApi.getProfile(),
      userApi.getBadges(),
      userApi.getTrophies(),
      userApi.getHistory(1),
    ]).then(([p, b, t, h]) => {
      setProfile(p.data.user)
      setStats(p.data.stats)
      setTrophies(p.data.completedRoadmaps || [])
      setBadges(b.data.badges || [])
      setHistory(h.data.history || [])
      setHistTotal(h.data.pagination?.total || 0)
      setNameVal(p.data.user?.name || '')
    }).catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { if (editName) nameRef.current?.focus() }, [editName])

  const loadMoreHistory = async () => {
    const next = histPage + 1
    try {
      const { data } = await userApi.getHistory(next)
      setHistory(prev => [...prev, ...(data.history || [])])
      setHistPage(next)
    } catch { toast.error('Failed to load more history') }
  }

  const saveName = async () => {
    if (!nameVal.trim() || nameVal === profile?.name) { setEditName(false); return }
    setSaving(true)
    try {
      const { data } = await userApi.updateProfile({ name: nameVal.trim() })
      setProfile(data.user)
      setUser({ ...user, name: data.user.name })
      toast.success('Name updated!')
      setEditName(false)
    } catch { toast.error('Failed to update name') }
    finally { setSaving(false) }
  }

  const xp       = profile?.xpTotal || 0
  const level    = Math.floor(xp / 500) + 1
  const xpInLvl  = xp % 500
  const xpPct    = (xpInLvl / 500) * 100
  const TABS     = ['Badges', 'Trophies', 'History']

  if (loading) {
    return (
      <div className="min-h-screen py-8 px-4 sm:px-8 max-w-2xl mx-auto" style={{ background: '#0A0A0F' }}>
        <Skeleton className="h-48 mb-6" />
        <Skeleton className="h-10 mb-3" />
        <div className="grid grid-cols-2 gap-3">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-8" style={{ background: '#0A0A0F' }}>
      <div className="max-w-2xl mx-auto">

        {/* ── Profile Header ── */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 border border-border mb-6 relative overflow-hidden">
          {/* Bg glow */}
          <div className="absolute top-0 right-0 w-48 h-48 pointer-events-none opacity-10"
            style={{ background: 'radial-gradient(circle, #6C63FF 0%, transparent 70%)', filter: 'blur(40px)' }} />

          <div className="flex items-center gap-5 mb-5">
            <Avatar name={profile?.name || '?'} size={80} />
            <div className="flex-1 min-w-0">
              {/* Editable name */}
              {editName ? (
                <div className="flex items-center gap-2 mb-1">
                  <input ref={nameRef} value={nameVal} onChange={e => setNameVal(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditName(false) }}
                    className="input py-1.5 text-lg font-black flex-1"
                    style={{ height: 40 }} maxLength={50} />
                  <button onClick={saveName} disabled={saving}
                    className="w-8 h-8 rounded-xl bg-green/15 border border-green/30 flex items-center justify-center text-green">
                    {saving ? <div className="w-3 h-3 border-2 border-green border-t-transparent rounded-full animate-spin" /> : <Check size={14} />}
                  </button>
                  <button onClick={() => { setEditName(false); setNameVal(profile?.name || '') }}
                    className="w-8 h-8 rounded-xl bg-coral/10 border border-coral/20 flex items-center justify-center text-coral">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="font-display font-black text-2xl text-white truncate">{profile?.name}</h1>
                  <button onClick={() => setEditName(true)} id="btn-edit-name"
                    className="p-1.5 rounded-lg text-muted hover:text-white hover:bg-white/5 transition-all">
                    <Edit2 size={13} />
                  </button>
                </div>
              )}
              <p className="text-xs text-muted">Level {level} Explorer · {profile?.email}</p>

              {/* XP Bar */}
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-muted font-bold flex items-center gap-1">
                    <Zap size={9} className="text-brand" /> {xpInLvl}/500 XP to Level {level + 1}
                  </span>
                  <span className="text-[10px] text-brand font-black">{Math.round(xpPct)}%</span>
                </div>
                <div className="xp-bar-track">
                  <motion.div className="xp-bar-fill" initial={{ width: 0 }}
                    animate={{ width: `${xpPct}%` }} transition={{ duration: 1.2, ease: 'easeOut' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Total XP',   value: xp.toLocaleString(),              color: '#6C63FF', icon: Zap    },
              { label: 'Levels Done',value: stats?.totalLevelsCompleted || 0,  color: '#43E97B', icon: Check  },
              { label: 'Friends',    value: stats?.friends || 0,               color: '#FF6584', icon: Flame  },
              { label: 'Streak',     value: `${profile?.streakCount || 0}d`,   color: '#FFB800', icon: Flame  },
            ].map(s => (
              <div key={s.label} className="flex flex-col items-center p-3 rounded-2xl"
                style={{ background: `${s.color}10`, border: `1px solid ${s.color}20` }}>
                <span className="font-display font-black text-lg" style={{ color: s.color }}>{s.value}</span>
                <span className="text-[9px] text-muted text-center mt-0.5">{s.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 p-1 rounded-2xl mb-6" style={{ background: '#12121A', border: '1px solid #1E1E2E' }}>
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setActiveTab(i)}
              className="flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-200"
              style={{
                background: activeTab === i ? 'rgba(108,99,255,0.15)' : 'transparent',
                color:      activeTab === i ? '#6C63FF' : '#8B8BAE',
                border:     activeTab === i ? '1px solid rgba(108,99,255,0.3)' : '1px solid transparent',
              }}>
              {t}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ══ BADGES ══ */}
          {activeTab === 0 && (
            <motion.div key="badges" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {badges.map((b, i) => (
                  <motion.div key={b.slug} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    onMouseEnter={() => setTooltip(b.slug)} onMouseLeave={() => setTooltip(null)}
                    className="relative flex flex-col items-center gap-2 p-3 rounded-2xl border cursor-pointer transition-all duration-200"
                    style={{
                      background:  b.isEarned ? `${TIER_COLORS[b.tier]}15` : '#12121A',
                      borderColor: b.isEarned ? `${TIER_COLORS[b.tier]}40` : '#1E1E2E',
                      opacity:     b.isEarned ? 1 : 0.55,
                    }}>
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl relative"
                      style={{ background: b.isEarned ? `${TIER_COLORS[b.tier]}20` : '#1E1E2E' }}>
                      {b.icon}
                      {!b.isEarned && (
                        <div className="absolute inset-0 rounded-2xl flex items-center justify-center"
                          style={{ background: 'rgba(10,10,15,0.6)' }}>
                          <Lock size={14} className="text-muted" />
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] font-bold text-center leading-tight"
                      style={{ color: b.isEarned ? TIER_COLORS[b.tier] : '#8B8BAE' }}>
                      {b.name}
                    </p>
                    {b.isEarned && (
                      <div className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center"
                        style={{ background: TIER_COLORS[b.tier] }}>
                        <Check size={8} className="text-[#0A0A0F]" strokeWidth={3} />
                      </div>
                    )}
                    {!b.isEarned && b.progress > 0 && (
                      <div className="w-full h-0.5 rounded-full overflow-hidden mt-1" style={{ background: '#1E1E2E' }}>
                        <div className="h-full rounded-full" style={{ width: `${b.progress * 100}%`, background: TIER_COLORS[b.tier] }} />
                      </div>
                    )}
                    {/* Tooltip */}
                    {tooltip === b.slug && (
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-2 rounded-xl text-[10px] text-white font-semibold whitespace-nowrap z-20 pointer-events-none"
                        style={{ background: '#1E1E2E', boxShadow: '0 8px 24px rgba(0,0,0,0.6)', border: '1px solid #2E2E4E' }}>
                        {b.isEarned ? `Earned ${new Date(b.earnedAt).toLocaleDateString()}` : b.description}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ══ TROPHIES ══ */}
          {activeTab === 1 && (
            <motion.div key="trophies" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {trophies.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Trophy size={48} className="text-muted/20 mb-4" />
                  <h4 className="font-bold text-white mb-1">No trophies yet</h4>
                  <p className="text-sm text-muted">Complete a roadmap to earn your first trophy!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {trophies.map((t, i) => (
                    <motion.div key={t._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="glass-card p-5 border"
                      style={{ borderColor: 'rgba(255,184,0,0.25)', boxShadow: '0 0 20px rgba(255,184,0,0.06)' }}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                          style={{ background: 'rgba(255,184,0,0.1)', border: '1px solid rgba(255,184,0,0.3)' }}>
                          <Trophy size={22} className="text-gold" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(67,233,123,0.1)', color: '#43E97B', border: '1px solid rgba(67,233,123,0.2)' }}>
                          Completed
                        </span>
                      </div>
                      <h3 className="font-display font-black text-base text-white mb-1 truncate">{t.title}</h3>
                      <p className="text-xs text-muted capitalize">{t.type} · {t.totalLevels} levels</p>
                      <div className="flex items-center gap-3 mt-3">
                        <div className="flex items-center gap-1 text-[10px] text-muted">
                          <Calendar size={10} />
                          {t.completedAt ? new Date(t.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                        </div>
                        {t.totalMinutes > 0 && (
                          <div className="flex items-center gap-1 text-[10px] text-muted">
                            <Clock size={10} /> {t.totalMinutes}m total
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ══ HISTORY ══ */}
          {activeTab === 2 && (
            <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Clock size={48} className="text-muted/20 mb-4" />
                  <h4 className="font-bold text-white mb-1">No activity yet</h4>
                  <p className="text-sm text-muted">Complete levels to see your history here.</p>
                </div>
              ) : (
                <>
                  <div className="relative">
                    {/* Vertical line */}
                    <div className="absolute left-5 top-0 bottom-0 w-0.5" style={{ background: '#1E1E2E' }} />
                    <div className="space-y-4">
                      {history.map((h, i) => (
                        <motion.div key={h._id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-start gap-4 pl-12 relative">
                          {/* Dot */}
                          <div className="absolute left-3.5 top-2 w-3.5 h-3.5 rounded-full flex items-center justify-center z-10"
                            style={{ background: 'linear-gradient(135deg, #6C63FF, #9c8dff)', boxShadow: '0 0 8px rgba(108,99,255,0.5)' }}>
                            <Check size={8} strokeWidth={3} className="text-white" />
                          </div>
                          <div className="glass-card p-3 flex-1 border border-border">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-xs font-bold text-white leading-tight">
                                  Completed{' '}
                                  <span className="text-brand">{h.levelId?.title || 'a level'}</span>
                                </p>
                                {h.roadmapId?.title && (
                                  <p className="text-[10px] text-muted mt-0.5">{h.roadmapId.title}</p>
                                )}
                              </div>
                              <span className="text-[9px] font-bold text-gold whitespace-nowrap mt-0.5">
                                +{h.xpEarned} XP
                              </span>
                            </div>
                            <p className="text-[9px] text-muted/60 mt-1.5">
                              {new Date(h.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                  {history.length < histTotal && (
                    <button onClick={loadMoreHistory}
                      className="btn btn-ghost w-full mt-4 flex items-center justify-center gap-2 text-xs py-3">
                      <ChevronDown size={14} /> Load More
                    </button>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
