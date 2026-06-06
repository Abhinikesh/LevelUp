import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Map, Plus, BookOpen, Dumbbell, Briefcase, Compass,
  ChevronRight, Trophy, Zap, Lock, CheckCircle, Flame,
  Sparkles, BarChart2, Clock, Star
} from 'lucide-react'
import { fetchRoadmaps as apiFetchRoadmaps } from '../api/roadmaps.api'
import useStore from '../store/useStore'
import toast from 'react-hot-toast'

function getTypeTheme(type) {
  switch (type) {
    case 'gym':   return { from: '#FF6584', to: '#ff4567', glow: 'rgba(255,101,132,0.35)', icon: Dumbbell,  label: 'Gym & Fitness' }
    case 'work':  return { from: '#FFB800', to: '#FFD93D', glow: 'rgba(255,184,0,0.35)',   icon: Briefcase, label: 'Career & Work' }
    case 'study': return { from: '#6C63FF', to: '#9c8dff', glow: 'rgba(108,99,255,0.35)', icon: BookOpen,  label: 'Study & Learn' }
    default:      return { from: '#43E97B', to: '#38f9d7', glow: 'rgba(67,233,123,0.35)', icon: Compass,   label: 'General' }
  }
}

const FILTER_TYPES = ['all', 'study', 'gym', 'work', 'general']

function RoadmapCard({ roadmap, index, onSelect }) {
  const theme = getTypeTheme(roadmap.type)
  const Icon = theme.icon
  const total     = roadmap.totalLevels || 0
  const completed = roadmap.completedLevels || 0
  const progress  = total > 0 ? (completed / total) * 100 : 0
  const isDone    = completed === total && total > 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07, ease: [0.25, 0.46, 0.45, 0.94] }}
      onClick={() => onSelect(roadmap)}
      className="group relative rounded-3xl overflow-hidden cursor-pointer"
      style={{
        background: 'linear-gradient(145deg, rgba(18,18,26,0.98) 0%, rgba(26,26,40,0.95) 100%)',
        border: `1px solid rgba(30,30,46,0.9)`,
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
        transition: 'all 0.3s cubic-bezier(0.25,0.46,0.45,0.94)',
      }}
      whileHover={{ y: -6, boxShadow: `0 16px 48px rgba(0,0,0,0.6), 0 0 30px ${theme.glow}` }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Gradient header band */}
      <div
        className="h-2 w-full"
        style={{ background: `linear-gradient(90deg, ${theme.from}, ${theme.to})` }}
      />

      {/* Ambient glow */}
      <div
        className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: `radial-gradient(circle, ${theme.from}20 0%, transparent 70%)`, filter: 'blur(20px)' }}
      />

      <div className="p-5">
        {/* Top row: icon + badges */}
        <div className="flex items-start justify-between mb-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${theme.from}22, ${theme.to}22)`,
                     border: `1px solid ${theme.from}40` }}
          >
            <Icon size={22} style={{ color: theme.from }} />
          </div>
          <div className="flex items-center gap-2">
            {isDone && (
              <span
                className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full"
                style={{ background: 'rgba(67,233,123,0.12)', color: '#43E97B', border: '1px solid rgba(67,233,123,0.25)' }}
              >
                <CheckCircle size={9} /> Complete
              </span>
            )}
            <span
              className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full"
              style={{ background: `${theme.from}18`, color: theme.from, border: `1px solid ${theme.from}30` }}
            >
              {theme.label}
            </span>
          </div>
        </div>

        {/* Title + desc */}
        <h3
          className="font-black text-white text-base leading-tight mb-1 group-hover:text-white transition-colors"
          style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.02em' }}
        >
          {roadmap.title}
        </h3>
        {roadmap.description && (
          <p className="text-[11px] text-muted/80 leading-relaxed mb-4 line-clamp-2">
            {roadmap.description}
          </p>
        )}

        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-muted font-semibold">{completed}/{total} levels</span>
            <span className="text-[10px] font-black" style={{ color: theme.from }}>{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(30,30,46,0.8)' }}>
            <motion.div
              className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: 'easeOut', delay: index * 0.07 + 0.3 }}
              style={{ background: `linear-gradient(90deg, ${theme.from}, ${theme.to})`,
                       boxShadow: `0 0 8px ${theme.glow}` }}
            />
          </div>
        </div>

        {/* Footer stats */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {roadmap.xpTotal > 0 && (
              <div className="flex items-center gap-1 text-[10px] font-bold" style={{ color: '#FFB800' }}>
                <Zap size={9} /> {roadmap.xpTotal?.toLocaleString() || 0} XP
              </div>
            )}
            {roadmap.examMode && (
              <div className="flex items-center gap-1 text-[10px] font-bold" style={{ color: '#FF6584' }}>
                <Flame size={9} /> Exam Mode
              </div>
            )}
            {total > 0 && (
              <div className="flex items-center gap-1 text-[10px] text-muted">
                <Clock size={9} /> {total} levels
              </div>
            )}
          </div>

          <motion.div
            className="flex items-center gap-1 text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            style={{ color: theme.from }}
          >
            Open Map <ChevronRight size={11} />
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}

function EmptyState({ onCreateClick }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="col-span-full flex flex-col items-center justify-center py-24 text-center"
    >
      <motion.div
        animate={{ y: [-6, 6, -6] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
        style={{ background: 'linear-gradient(135deg,#6C63FF22,#FF658422)', border: '1px solid rgba(108,99,255,0.2)' }}
      >
        <Map size={36} style={{ color: '#6C63FF' }} />
      </motion.div>
      <h2 className="font-black text-2xl text-white mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>
        No Roadmaps Yet
      </h2>
      <p className="text-sm text-muted max-w-xs mb-8">
        Create your first roadmap to get started on your levelling journey.
      </p>
      <button
        onClick={onCreateClick}
        className="btn btn-primary flex items-center gap-2"
        style={{ fontFamily: 'Syne, sans-serif' }}
      >
        <Plus size={16} /> Create First Roadmap
      </button>
    </motion.div>
  )
}

export default function MapListPage() {
  const navigate   = useNavigate()
  const storeSetRoadmaps      = useStore(s => s.setRoadmaps)
  const storeSetActiveRoadmap = useStore(s => s.setActiveRoadmap)
  const storeRoadmaps         = useStore(s => s.roadmaps)

  const [roadmaps, setRoadmaps] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState('all')

  useEffect(() => {
    apiFetchRoadmaps()
      .then(res => {
        const data = res.data?.roadmaps || res.data || []
        setRoadmaps(data)
        storeSetRoadmaps(data)
      })
      .catch(() => toast.error('Failed to load roadmaps'))
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line

  const filtered = filter === 'all'
    ? roadmaps
    : roadmaps.filter(r => r.type === filter)

  const handleSelect = (roadmap) => {
    storeSetActiveRoadmap(roadmap)
    navigate(`/home/map/${roadmap._id}`)
  }

  return (
    <div className="min-h-screen" style={{ background: '#0A0A0F' }}>
      {/* ── Header ── */}
      <div
        className="sticky top-0 z-20 px-6 py-5 border-b"
        style={{ background: 'rgba(10,10,15,0.92)', backdropFilter: 'blur(20px)', borderColor: '#1E1E2E' }}
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1
              className="text-2xl font-black text-white leading-tight"
              style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.03em' }}
            >
              🗺️ My Roadmaps
            </h1>
            <p className="text-xs text-muted mt-0.5">
              {roadmaps.length} campaign{roadmaps.length !== 1 ? 's' : ''} · Select one to open its game map
            </p>
          </div>
          <button
            onClick={() => navigate('/home/create')}
            className="btn btn-primary flex items-center gap-2 text-sm px-4 py-2.5"
          >
            <Plus size={15} /> New Roadmap
          </button>
        </div>

        {/* Filters */}
        <div className="max-w-5xl mx-auto mt-3 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {FILTER_TYPES.map(type => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 border"
              style={{
                background: filter === type ? 'rgba(108,99,255,0.15)' : 'transparent',
                borderColor: filter === type ? 'rgba(108,99,255,0.4)' : '#1E1E2E',
                color: filter === type ? '#6C63FF' : '#8B8BAE',
              }}
            >
              {type === 'all' ? 'All Roadmaps' : type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="h-52 rounded-3xl skeleton" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {filtered.length === 0
                ? <EmptyState onCreateClick={() => navigate('/home/create')} />
                : filtered.map((rm, i) => (
                    <RoadmapCard key={rm._id} roadmap={rm} index={i} onSelect={handleSelect} />
                  ))
              }
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
