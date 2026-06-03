import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, UserPlus, Check, X, Flame, Zap, Trophy,
  Crown, Medal, Users, Globe, Target, ChevronRight,
  UserCheck, Clock
} from 'lucide-react'
import { socialApi } from '../api/client'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'

/* ── Skeleton loader ── */
function Skeleton({ className }) {
  return (
    <div className={`skeleton rounded-xl ${className}`} />
  )
}

/* ── Avatar circle ── */
function Avatar({ name = '?', size = 40, streakActive }) {
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  const colors = ['#6C63FF', '#FF6584', '#43E97B', '#FFB800', '#38f9d7']
  const color = colors[name.charCodeAt(0) % colors.length]
  return (
    <div
      className="flex items-center justify-center font-black rounded-full flex-shrink-0 relative"
      style={{
        width: size, height: size,
        background: `linear-gradient(135deg, ${color}, ${color}88)`,
        fontSize: size * 0.35,
        color: '#0A0A0F',
        boxShadow: streakActive ? `0 0 0 3px #FFB800, 0 0 12px rgba(255,184,0,0.4)` : 'none',
      }}
    >
      {initials}
    </div>
  )
}

/* ── Podium card for top 3 ── */
function PodiumCard({ user, rank }) {
  const heights = { 1: 120, 2: 90, 3: 75 }
  const labels  = { 1: '1st', 2: '2nd', 3: '3rd' }
  const colors  = { 1: '#FFB800', 2: '#C0C0C0', 3: '#CD7F32' }
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.1, type: 'spring', damping: 18 }}
      className="flex flex-col items-center gap-2"
    >
      {rank === 1 && <Crown size={22} style={{ color: '#FFB800' }} />}
      <Avatar name={user.name} size={rank === 1 ? 56 : 44} />
      <div className="text-center">
        <p className="text-xs font-black text-white truncate max-w-[70px]">{user.name}</p>
        <p className="text-[10px] font-bold" style={{ color: colors[rank] }}>
          {(user.xpTotal || 0).toLocaleString()} XP
        </p>
      </div>
      <div
        className="w-16 rounded-t-xl flex items-center justify-center font-black text-sm"
        style={{
          height: heights[rank],
          background: `linear-gradient(180deg, ${colors[rank]}30, ${colors[rank]}10)`,
          border: `1px solid ${colors[rank]}40`,
          color: colors[rank],
        }}
      >
        {labels[rank]}
      </div>
    </motion.div>
  )
}

export default function Social({ defaultTab = 0 }) {
  const { user } = useAuthStore()
  const [mainTab,      setMainTab]      = useState(defaultTab) // 0=Friends, 1=Leaderboard
  const [lbTab,        setLbTab]        = useState('global')
  const [friends,      setFriends]      = useState([])
  const [pending,      setPending]      = useState([])
  const [leaderboard,  setLeaderboard]  = useState([])
  const [searchQ,      setSearchQ]      = useState('')
  const [searchRes,    setSearchRes]    = useState([])
  const [searching,    setSearching]    = useState(false)
  const [loadingFriends, setLoadingFriends] = useState(true)
  const [loadingLb,    setLoadingLb]    = useState(false)
  const searchTimer = useRef(null)

  /* ── Load friends ── */
  const loadFriends = useCallback(async () => {
    setLoadingFriends(true)
    try {
      const { data } = await socialApi.getFriends()
      setFriends(data.friends || [])
      setPending(data.pendingRequests || [])
    } catch { toast.error('Failed to load friends') }
    finally { setLoadingFriends(false) }
  }, [])

  /* ── Load leaderboard ── */
  const loadLeaderboard = useCallback(async (type) => {
    setLoadingLb(true)
    try {
      const { data } = await socialApi.leaderboard({ type })
      setLeaderboard(data.leaderboard || [])
    } catch { toast.error('Failed to load leaderboard') }
    finally { setLoadingLb(false) }
  }, [])

  useEffect(() => { loadFriends() }, [loadFriends])
  useEffect(() => { if (mainTab === 1) loadLeaderboard(lbTab) }, [mainTab, lbTab, loadLeaderboard])

  /* ── Search ── */
  const handleSearch = (q) => {
    setSearchQ(q)
    clearTimeout(searchTimer.current)
    if (q.length < 2) { setSearchRes([]); return }
    searchTimer.current = setTimeout(async () => {
      setSearching(true)
      try {
        const { data } = await socialApi.search(q)
        setSearchRes(data.users || [])
      } catch {} finally { setSearching(false) }
    }, 300)
  }

  const handleAddFriend = async (userId) => {
    try {
      await socialApi.addFriend({ userId })
      toast.success('Friend request sent!')
      setSearchRes(prev => prev.map(u => u._id === userId ? { ...u, isFriend: true } : u))
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to send request') }
  }

  const handleAccept = async (userId) => {
    try {
      await socialApi.acceptFriend(userId)
      toast.success('Friend accepted!')
      loadFriends()
    } catch { toast.error('Failed to accept request') }
  }

  const handleRemove = async (userId, name) => {
    if (!confirm(`Remove ${name} from friends?`)) return
    try {
      await socialApi.removeFriend(userId)
      setFriends(prev => prev.filter(f => f._id !== userId))
      toast.success('Friend removed.')
    } catch { toast.error('Failed to remove friend') }
  }

  const top3 = leaderboard.slice(0, 3)
  const rest  = leaderboard.slice(3)

  return (
    <div className="min-h-screen py-8 px-4 sm:px-8" style={{ background: '#0A0A0F' }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="font-display font-black text-3xl text-white">Social</h1>
          <p className="text-muted text-sm mt-1">Connect, compete, and celebrate together</p>
        </motion.div>

        {/* Main tabs */}
        <div className="flex gap-1 p-1 rounded-2xl mb-6" style={{ background: '#12121A', border: '1px solid #1E1E2E' }}>
          {['Friends', 'Leaderboard'].map((t, i) => (
            <button key={t} onClick={() => setMainTab(i)}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2"
              style={{
                background: mainTab === i ? '#6C63FF' : 'transparent',
                color:      mainTab === i ? '#fff' : '#8B8BAE',
                boxShadow:  mainTab === i ? '0 0 20px rgba(108,99,255,0.3)' : 'none',
              }}>
              {i === 0 ? <Users size={14} /> : <Trophy size={14} />} {t}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ══════ FRIENDS TAB ══════ */}
          {mainTab === 0 && (
            <motion.div key="friends" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {/* Search */}
              <div className="relative mb-6">
                <div className="relative">
                  <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                  <input
                    id="friend-search-input"
                    type="text" value={searchQ}
                    onChange={e => handleSearch(e.target.value)}
                    placeholder="Search by name or email…"
                    className="input pl-10 pr-4"
                  />
                  {searching && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                  )}
                </div>
                {/* Dropdown results */}
                <AnimatePresence>
                  {searchRes.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="absolute top-full left-0 right-0 mt-2 rounded-2xl border overflow-hidden z-30"
                      style={{ background: '#12121A', borderColor: '#1E1E2E', boxShadow: '0 16px 40px rgba(0,0,0,0.6)' }}>
                      {searchRes.map(u => (
                        <div key={u._id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors border-b last:border-0"
                          style={{ borderColor: '#1E1E2E' }}>
                          <Avatar name={u.name} size={36} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white truncate">{u.name}</p>
                            <p className="text-xs text-muted">Level {u.level || 1}</p>
                          </div>
                          {u.isFriend ? (
                            <span className="text-xs text-green font-bold flex items-center gap-1"><UserCheck size={12} /> Friends</span>
                          ) : (
                            <button onClick={() => handleAddFriend(u._id)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all"
                              style={{ background: 'linear-gradient(135deg,#6C63FF,#9c8dff)' }}>
                              <UserPlus size={11} /> Add
                            </button>
                          )}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Pending requests */}
              {pending.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xs font-black uppercase tracking-wider text-muted mb-3">
                    Pending Requests ({pending.length})
                  </h3>
                  <div className="space-y-2">
                    {pending.map(p => (
                      <motion.div key={p._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="flex items-center gap-3 p-3 rounded-2xl border"
                        style={{ background: '#12121A', borderColor: 'rgba(108,99,255,0.25)' }}>
                        <Avatar name={p.name} size={38} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white">{p.name}</p>
                          <p className="text-xs text-muted">{p.email}</p>
                        </div>
                        <button onClick={() => handleAccept(p._id)}
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-green hover:bg-green/10 transition-colors">
                          <Check size={15} />
                        </button>
                        <button onClick={() => handleRemove(p._id, p.name)}
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-coral hover:bg-coral/10 transition-colors">
                          <X size={15} />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Friends list */}
              <h3 className="text-xs font-black uppercase tracking-wider text-muted mb-3">
                Your Friends ({friends.length})
              </h3>
              {loadingFriends ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
                </div>
              ) : friends.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                    style={{ background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.2)' }}>
                    <Users size={28} className="text-brand/50" />
                  </div>
                  <h4 className="font-bold text-white mb-1">No friends yet</h4>
                  <p className="text-sm text-muted">Search for friends above to connect!</p>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  {friends.map((f, i) => {
                    const progress = f.activeRoadmap?.progress || 0
                    const rel      = f.relativeProgress
                    return (
                      <motion.div key={f._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="glass-card p-4 border border-border hover:border-brand/30 transition-all duration-300">
                        <div className="flex items-center gap-3 mb-3">
                          <Avatar name={f.name} size={44} streakActive={f.streakCount > 0} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-white">{f.name}</p>
                            <p className="text-xs text-muted truncate">
                              {f.activeRoadmap
                                ? `Level ${f.activeRoadmap.currentLevel} of ${f.activeRoadmap.title}`
                                : 'No active campaign'}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 text-xs font-bold text-gold">
                            <Flame size={12} /> {f.streakCount || 0}d
                          </div>
                          <button onClick={() => handleRemove(f._id, f.name)}
                            className="p-1.5 rounded-lg text-muted hover:text-coral hover:bg-coral/10 transition-all">
                            <X size={13} />
                          </button>
                        </div>
                        {f.activeRoadmap && (
                          <>
                            <div className="flex items-center gap-2 mb-1">
                              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: '#1E1E2E' }}>
                                <div className="h-full rounded-full" style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #6C63FF, #9c8dff)' }} />
                              </div>
                              <span className="text-[10px] text-muted">{progress}%</span>
                            </div>
                            {rel !== null && (
                              <p className="text-[10px] font-bold mt-1"
                                style={{ color: rel >= 0 ? '#43E97B' : '#FF6584' }}>
                                {rel === 0 ? '⚡ Same level as you'
                                  : rel > 0 ? `🔥 You're ${rel} level${rel !== 1 ? 's' : ''} ahead`
                                  : `⬇ You're ${Math.abs(rel)} level${Math.abs(rel) !== 1 ? 's' : ''} behind`}
                              </p>
                            )}
                          </>
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ══════ LEADERBOARD TAB ══════ */}
          {mainTab === 1 && (
            <motion.div key="leaderboard" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {/* Sub-tabs */}
              <div className="flex gap-1 p-1 rounded-2xl mb-6" style={{ background: '#12121A', border: '1px solid #1E1E2E' }}>
                {[['global','Global',Globe],['friends','Friends',Users],['roadmap','Same Task',Target]].map(([id, label, Icon]) => (
                  <button key={id} onClick={() => setLbTab(id)}
                    className="flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                    style={{
                      background: lbTab === id ? 'rgba(108,99,255,0.15)' : 'transparent',
                      color:      lbTab === id ? '#6C63FF' : '#8B8BAE',
                      border:     lbTab === id ? '1px solid rgba(108,99,255,0.3)' : '1px solid transparent',
                    }}>
                    <Icon size={11} /> {label}
                  </button>
                ))}
              </div>

              {loadingLb ? (
                <div className="space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-16" />)}</div>
              ) : leaderboard.length === 0 ? (
                <div className="text-center py-16">
                  <Trophy size={48} className="text-muted/20 mx-auto mb-4" />
                  <p className="text-muted text-sm">No leaderboard data yet.</p>
                </div>
              ) : (
                <>
                  {/* Podium */}
                  {top3.length >= 3 && (
                    <div className="flex items-end justify-center gap-3 mb-8 px-4">
                      {[top3[1], top3[0], top3[2]].map((u, i) => (
                        <PodiumCard key={u._id} user={u} rank={[2, 1, 3][i]} />
                      ))}
                    </div>
                  )}

                  {/* Rest of list */}
                  <div className="space-y-2">
                    {(top3.length >= 3 ? rest : leaderboard).map((entry, i) => {
                      const rank = top3.length >= 3 ? i + 4 : i + 1
                      const isMe = entry.isCurrentUser
                      return (
                        <motion.div key={entry._id}
                          initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className="flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all"
                          style={{
                            background:   isMe ? 'rgba(108,99,255,0.08)' : '#12121A',
                            borderColor:  isMe ? 'rgba(108,99,255,0.35)' : '#1E1E2E',
                            boxShadow:    isMe ? '0 0 20px rgba(108,99,255,0.1)' : 'none',
                          }}>
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                            style={{ background: isMe ? '#6C63FF' : '#1E1E2E', color: isMe ? '#fff' : '#8B8BAE' }}>
                            {rank}
                          </div>
                          <Avatar name={entry.name} size={36} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white truncate">
                              {entry.name} {isMe && <span className="text-[10px] text-brand">(You)</span>}
                            </p>
                            <p className="text-[10px] text-muted">Level {entry.level}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 text-xs font-bold text-gold">
                              <Flame size={11} /> {entry.streakCount || 0}
                            </div>
                            <div className="flex items-center gap-1 text-xs font-bold text-brand">
                              <Zap size={11} /> {(entry.xpTotal || 0).toLocaleString()}
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
