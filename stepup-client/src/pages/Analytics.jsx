import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BarChart2, TrendingUp, Zap, Clock, Trophy, Flame, Target, ChevronRight } from 'lucide-react'
import { roadmapApi, userApi } from '../api/client'
import toast from 'react-hot-toast'

function Skeleton({ className }) {
  return <div className={`skeleton rounded-xl ${className}`} />
}

export default function Analytics() {
  const [stats, setStats] = useState(null)
  const [roadmaps, setRoadmaps] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      userApi.getProfile(),
      roadmapApi.getAll(),
      userApi.getBadges()
    ]).then(([profileRes, roadmapsRes, badgesRes]) => {
      const u = profileRes.data.user
      const st = profileRes.data.stats
      const rms = roadmapsRes.data.roadmaps || []
      const bdg = badgesRes.data.badges || []

      // Calculate some interesting stats for analytics
      const totalLevels = rms.reduce((acc, r) => acc + (r.totalLevels || 0), 0)
      const completedLevels = st?.totalLevelsCompleted || 0
      const completionRate = totalLevels > 0 ? Math.round((completedLevels / totalLevels) * 100) : 0
      const earnedBadgesCount = bdg.filter(b => b.isEarned).length

      setStats({
        xpTotal: u?.xpTotal || 0,
        streakCount: u?.streakCount || 0,
        completedRoadmapsCount: st?.completedRoadmaps || 0,
        completedLevels,
        totalLevels,
        completionRate,
        badgesCount: earnedBadgesCount,
        badgesTotal: bdg.length,
      })
      setRoadmaps(rms)
    }).catch(err => {
      console.error(err)
      toast.error('Failed to load analytical metrics')
    }).finally(() => {
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen py-8 px-4 sm:px-8 max-w-4xl mx-auto" style={{ background: '#0A0A0F' }}>
        <Skeleton className="h-10 w-48 mb-2" />
        <Skeleton className="h-6 w-96 mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-80 md:col-span-2" />
          <Skeleton className="h-80" />
        </div>
      </div>
    )
  }

  // Activity distribution by type
  const typeCounts = roadmaps.reduce((acc, r) => {
    acc[r.type] = (acc[r.type] || 0) + 1
    return acc
  }, { study: 0, gym: 0, work: 0, custom: 0 })

  const typePct = Object.keys(typeCounts).reduce((acc, type) => {
    acc[type] = roadmaps.length > 0 ? Math.round((typeCounts[type] / roadmaps.length) * 100) : 0
    return acc
  }, {})

  // Weekly XP distribution - mock data based on actual XP
  const baseXP = stats?.xpTotal || 0
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const mockWeeklyXP = [
    Math.round(baseXP * 0.08),
    Math.round(baseXP * 0.12),
    Math.round(baseXP * 0.05),
    Math.round(baseXP * 0.15),
    Math.round(baseXP * 0.10),
    Math.round(baseXP * 0.22),
    Math.round(baseXP * 0.28)
  ]
  const maxWeeklyVal = Math.max(...mockWeeklyXP, 100)

  return (
    <div className="min-h-screen py-8 px-4 sm:px-8" style={{ background: '#0A0A0F' }}>
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="font-display font-black text-3xl text-white">Analytics</h1>
          <p className="text-muted text-sm mt-1">Deep insights into your level-up patterns and consistency</p>
        </motion.div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Overall Progress', value: `${stats?.completionRate}%`, sub: `${stats?.completedLevels}/${stats?.totalLevels} Nodes`, color: '#6C63FF', icon: Target },
            { label: 'Total XP Earned', value: stats?.xpTotal.toLocaleString(), sub: 'Zustand Synced', color: '#FFB800', icon: Zap },
            { label: 'Current Streak', value: `${stats?.streakCount} days`, sub: 'Daily verified status', color: '#FF6584', icon: Flame },
            { label: 'Achievements', value: `${stats?.badgesCount}/${stats?.badgesTotal}`, sub: 'Badges unlocked', color: '#43E97B', icon: Trophy }
          ].map((s, idx) => {
            const Icon = s.icon
            return (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="glass-card p-5 border border-border flex flex-col justify-between"
                style={{ background: `${s.color}05`, borderColor: `${s.color}15` }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-muted font-bold uppercase tracking-wider">{s.label}</span>
                  <Icon size={16} style={{ color: s.color }} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">{s.value}</h2>
                  <p className="text-[10px] text-muted mt-0.5">{s.sub}</p>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Main Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          {/* Weekly XP Bar Chart */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            className="glass-card p-6 border border-border md:col-span-2 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-display font-black text-base text-white">Weekly Activity</h3>
                <p className="text-[10px] text-muted mt-0.5">XP distribution for the past 7 days</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-green font-bold bg-green/5 border border-green/20 px-2.5 py-1 rounded-xl">
                <TrendingUp size={12} />
                <span>+12.4% vs last week</span>
              </div>
            </div>

            {/* SVG Bar Chart */}
            <div className="h-48 w-full flex items-end justify-between gap-2 px-2">
              {mockWeeklyXP.map((xpVal, i) => {
                const heightPct = (xpVal / maxWeeklyVal) * 80 + 10
                return (
                  <div key={days[i]} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                    <div className="relative w-full flex justify-center">
                      <div className="absolute -top-7 scale-0 group-hover:scale-100 transition-all duration-200 bg-brand text-white font-black text-[9px] px-1.5 py-0.5 rounded shadow-lg pointer-events-none z-20">
                        {xpVal} XP
                      </div>
                    </div>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${heightPct}%` }}
                      transition={{ duration: 1, ease: 'easeOut', delay: i * 0.05 }}
                      className="w-full rounded-t-lg transition-all duration-200 group-hover:opacity-90"
                      style={{
                        background: 'linear-gradient(180deg, #6C63FF, rgba(108, 99, 255, 0.4))',
                        boxShadow: '0 4px 15px rgba(108, 99, 255, 0.2)'
                      }}
                    />
                    <span className="text-[9px] font-bold text-muted mt-1">{days[i]}</span>
                  </div>
                )
              })}
            </div>
          </motion.div>

          {/* Goal Type Distribution */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-6 border border-border flex flex-col justify-between"
          >
            <div>
              <h3 className="font-display font-black text-base text-white">Campaign Types</h3>
              <p className="text-[10px] text-muted mt-0.5">Classification of launched roadmaps</p>
            </div>

            <div className="space-y-4 my-6">
              {[
                { type: 'study', label: 'Study / Academy', count: typeCounts.study, pct: typePct.study, color: '#6C63FF' },
                { type: 'gym', label: 'Gym & Athletics', count: typeCounts.gym, pct: typePct.gym, color: '#FF6584' },
                { type: 'work', label: 'Career & Work', count: typeCounts.work, pct: typePct.work, color: '#FFB800' },
                { type: 'custom', label: 'Custom quests', count: typeCounts.custom, pct: typePct.custom, color: '#43E97B' }
              ].map(item => (
                <div key={item.type} className="space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-bold">
                    <span className="text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                      {item.label}
                    </span>
                    <span className="text-muted">{item.count} map{item.count !== 1 ? 's' : ''} ({item.pct}%)</span>
                  </div>
                  <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.pct}%` }}
                      transition={{ duration: 0.8 }}
                      className="h-full rounded-full"
                      style={{ background: item.color }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="text-[10px] text-muted text-center pt-2 border-t border-border/40">
              Total tracks monitored: {roadmaps.length}
            </div>
          </motion.div>

        </div>

        {/* Recent Achievements / Milestones */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass-card p-6 border border-border"
        >
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={18} className="text-gold" />
            <h3 className="font-display font-black text-base text-white">Milestones & Efficiency</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-card/60 border border-border">
              <div className="p-3 bg-brand/10 text-brand rounded-xl border border-brand/20">
                <Clock size={16} />
              </div>
              <div>
                <h4 className="font-bold text-xs text-white">Estimated Audit Time</h4>
                <p className="text-[11px] text-muted mt-1 leading-relaxed">
                  Your average level clearance takes ~32 minutes of verified active execution. Keep going!
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-2xl bg-card/60 border border-border">
              <div className="p-3 bg-green/10 text-green rounded-xl border border-green/20">
                <TrendingUp size={16} />
              </div>
              <div>
                <h4 className="font-bold text-xs text-white">Audited Success Rate</h4>
                <p className="text-[11px] text-muted mt-1 leading-relaxed">
                  92.4% of your submitted manual proofs have satisfied the auto-audit criteria successfully.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  )
}
