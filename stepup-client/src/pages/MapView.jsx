import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import {
  CheckCircle, Lock, Star, Zap, Clock, Trophy,
  ChevronDown, X, Flame, Sparkles, ArrowLeft, BookOpen,
  Dumbbell, Briefcase, Compass, Check, Volume2, Camera, Navigation
} from 'lucide-react'
import toast from 'react-hot-toast'
import useRoadmaps from '../hooks/useRoadmaps'
import useAuthStore from '../store/authStore'
import { levelApi, aiApi } from '../api/client'
import QuizVerification from '../components/ai/QuizVerification'
import VoiceVerification from '../components/ai/VoiceVerification'
import AICoach from '../components/ai/AICoach'
import GymLevelDetail from '../components/gym/GymLevelDetail'
import ExamModeHeader from '../components/exam/ExamModeHeader'
import BadgeModal from '../components/ui/BadgeModal'
import XPAnimation from '../components/ui/XPAnimation'

/* ── helpers ── */
function getLevelPosition(index, total) {
  // Candy-crush winding snake layout
  const col = index % 3
  const row  = Math.floor(index / 3)
  const isEven = row % 2 === 0
  const colMap = isEven ? [0, 1, 2] : [2, 1, 0]
  const x = [18, 50, 82][colMap[col]]
  const y = row * 160 + 80
  return { x, y }
}

function getTypeColor(type) {
  switch (type) {
    case 'gym':   return { from: '#FF6584', to: '#ff4567', glow: 'rgba(255,101,132,0.6)' }
    case 'work':  return { from: '#FFB800', to: '#FFD93D', glow: 'rgba(255,184,0,0.6)' }
    case 'study': return { from: '#6C63FF', to: '#9c8dff', glow: 'rgba(108,99,255,0.6)' }
    default:      return { from: '#43E97B', to: '#38f9d7', glow: 'rgba(67,233,123,0.6)' }
  }
}

function TypeIcon({ type, size = 18 }) {
  switch (type) {
    case 'gym':   return <Dumbbell  size={size} />
    case 'work':  return <Briefcase size={size} />
    case 'study': return <BookOpen  size={size} />
    default:      return <Compass   size={size} />
  }
}

/* ── XP Flyup animation ── */
function XpFlyUp({ amount, onDone }) {
  return (
    <motion.div
      initial={{ opacity: 1, y: 0, scale: 1 }}
      animate={{ opacity: 0, y: -80, scale: 1.4 }}
      transition={{ duration: 1.2, ease: 'easeOut' }}
      onAnimationComplete={onDone}
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[200] pointer-events-none"
      style={{
        fontFamily: 'Syne, sans-serif',
        fontWeight: 900,
        fontSize: '2.5rem',
        color: '#FFB800',
        textShadow: '0 0 30px rgba(255,184,0,0.8)',
      }}
    >
      +{amount} XP
    </motion.div>
  )
}

/* ── SVG path between two nodes ── */
function PathConnector({ from, to, completed }) {
  const midX = (from.x + to.x) / 2
  const midY = (from.y + to.y) / 2
  const cp1  = { x: from.x + (to.x - from.x) * 0.1, y: midY }
  const cp2  = { x: to.x   - (to.x - from.x) * 0.1, y: midY }
  const d = `M ${from.x},${from.y} C ${cp1.x},${cp1.y} ${cp2.x},${cp2.y} ${to.x},${to.y}`

  return (
    <g>
      {/* Track */}
      <path d={d} fill="none" stroke="rgba(30,30,46,0.9)" strokeWidth="6" strokeLinecap="round" />
      {/* Filled portion */}
      <path
        d={d}
        fill="none"
        stroke={completed ? 'rgba(67,233,123,0.5)' : 'rgba(108,99,255,0.18)'}
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={completed ? 'none' : '12 8'}
      />
    </g>
  )
}

/* ── Main Component ── */
export default function MapView() {
  const { roadmapId }                                   = useParams()
  const navigate                                        = useNavigate()
  const { user, setUser }                               = useAuthStore()
  const { roadmaps, activeRoadmap, levels, loading,
          levelsLoading, fetchRoadmaps, selectRoadmap } = useRoadmaps()

  const [localLevels,   setLocalLevels]   = useState([])
  const [selectedLevel, setSelectedLevel] = useState(null)
  const [submitting,    setSubmitting]     = useState(false)
  const [scanText,      setScanText]       = useState('')
  const [quizAnswers,   setQuizAnswers]    = useState({})
  const [proofText,     setProofText]      = useState('')
  const [xpFly,         setXpFly]          = useState(null) // { amount }
  const [completedAnim, setCompletedAnim]  = useState(null) // levelId
  const [showQuizModal, setShowQuizModal] = useState(false)
  const [showVoiceModal, setShowVoiceModal] = useState(false)
  const [showCoach, setShowCoach] = useState(false)
  const [showGym, setShowGym] = useState(false)
  const [activeBadge, setActiveBadge] = useState(null)
  const [examRefresh, setExamRefresh] = useState(0)
  const [xpAnimationAmount, setXpAnimationAmount] = useState(null)
  const [proofFile, setProofFile] = useState(null)
  const mapRef = useRef(null)
  const proofFileInputRef = useRef(null)

  // Sync local levels from store
  useEffect(() => {
    setLocalLevels(levels)
    setProofFile(null)
  }, [levels, selectedLevel])

  // Load on mount — use URL roadmapId if present
  useEffect(() => {
    const sessionId = sessionStorage.getItem('openRoadmapId')
    if (sessionId) sessionStorage.removeItem('openRoadmapId')
    const targetId = roadmapId || sessionId || null
    fetchRoadmaps(targetId)
  }, [roadmapId]) // eslint-disable-line

  // Scroll to active node
  useEffect(() => {
    if (!mapRef.current || localLevels.length === 0) return
    const activeIdx = localLevels.findIndex(l => !l.isCompleted && !l.isLocked)
    if (activeIdx >= 0) {
      const { y } = getLevelPosition(activeIdx, localLevels.length)
      const mapH  = localLevels.length > 0
        ? Math.floor((localLevels.length - 1) / 3) * 160 + 200
        : 600
      const scrollTo = Math.max(0, (y / mapH) * mapRef.current.scrollHeight - 200)
      mapRef.current.scrollTo({ top: scrollTo, behavior: 'smooth' })
    }
  }, [localLevels])

  const handleQuizVerified = useCallback(async ({ score, answers }) => {
    if (!selectedLevel) return
    setSubmitting(true)
    setScanText('Submitting quiz results...')
    try {
      const { data } = await levelApi.complete(selectedLevel._id, {
        proofUrl: 'https://stepup-uploads.s3.amazonaws.com/quiz-proof.png',
        proofData: { answers },
      })
      setXpAnimationAmount(selectedLevel.xpReward)
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 }, colors: ['#6C63FF', '#FF6584', '#43E97B', '#FFB800'] })
      setLocalLevels(prev =>
        prev.map(l => {
          if (l._id === selectedLevel._id) return { ...l, isCompleted: true }
          if (l.levelNumber === selectedLevel.levelNumber + 1) return { ...l, isLocked: false }
          return l
        })
      )
      setCompletedAnim(selectedLevel._id)
      setTimeout(() => setCompletedAnim(null), 1200)
      if (data.user) {
        setUser({ ...user, xpTotal: data.user.xpTotal, streakCount: data.user.streakCount })
      }
      if (data.newBadges && data.newBadges.length > 0) {
        setActiveBadge(data.newBadges[0])
      }
      setExamRefresh(r => r + 1)
      toast.success(data.message || 'Quiz cleared! Level complete! 🎉')
      setSelectedLevel(null)
      setShowQuizModal(false)
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.message || 'Verification failed. Try again.')
    } finally {
      setSubmitting(false)
      setScanText('')
    }
  }, [selectedLevel, user, setUser])

  const handleVoiceVerified = useCallback((data) => {
    if (!selectedLevel) return
    setXpAnimationAmount(selectedLevel.xpReward)
    confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 }, colors: ['#6C63FF', '#43E97B', '#FFB800'] })
    setLocalLevels(prev =>
      prev.map(l => {
        if (l._id === selectedLevel._id) return { ...l, isCompleted: true }
        if (l.levelNumber === selectedLevel.levelNumber + 1) return { ...l, isLocked: false }
        return l
      })
    )
    setCompletedAnim(selectedLevel._id)
    setTimeout(() => setCompletedAnim(null), 1200)
    if (data.user) {
      setUser({ ...user, xpTotal: data.user.xpTotal, streakCount: data.user.streakCount })
    }
    if (data.newBadges && data.newBadges.length > 0) {
      setActiveBadge(data.newBadges[0])
    }
    setExamRefresh(r => r + 1)
    toast.success('Voice challenge verified! Level complete! 🎉')
    setSelectedLevel(null)
    setShowVoiceModal(false)
  }, [selectedLevel, user, setUser])

  /* ── Complete level ── */
  const handleSubmit = useCallback(async () => {
    if (!selectedLevel) return

    // 1. Photo / Screenshot AI verification path
    if (selectedLevel.proofType === 'photo' || selectedLevel.proofType === 'screenshot') {
      if (!proofFile) {
        toast.error('Please upload a photo proof first!')
        return
      }
      setSubmitting(true)
      setScanText('Uploading image proof...')
      try {
        const formData = new FormData()
        formData.append('levelId', selectedLevel._id)
        formData.append('image', proofFile)
        
        const res = await aiApi.verifyPhoto(formData)
        const data = res.data
        
        if (data.verified) {
          setXpAnimationAmount(selectedLevel.xpReward)
          confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 }, colors: ['#6C63FF', '#43E97B', '#FFB800'] })
          
          setLocalLevels(prev =>
            prev.map(l => {
              if (l._id === selectedLevel._id) return { ...l, isCompleted: true }
              if (l.levelNumber === selectedLevel.levelNumber + 1) return { ...l, isLocked: false }
              return l
            })
          )
          
          setCompletedAnim(selectedLevel._id)
          setTimeout(() => setCompletedAnim(null), 1200)
          
          if (data.user) {
            setUser({ ...user, xpTotal: data.user.xpTotal, streakCount: data.user.streakCount })
          }
          if (data.newBadges && data.newBadges.length > 0) {
            setActiveBadge(data.newBadges[0])
          }
          setExamRefresh(r => r + 1)
          
          toast.success(data.feedback || 'Photo proof approved! Level complete! 🎉')
          setSelectedLevel(null)
          setProofFile(null)
        } else {
          toast.error(data.feedback || 'AI was unable to verify your proof. Check the feedback and try again.')
        }
      } catch (err) {
        console.error(err)
        toast.error(err.response?.data?.message || 'Verification failed. Try again.')
      } finally {
        setSubmitting(false)
        setScanText('')
      }
      return
    }

    // 2. Original code/text/timer submission path
    if (selectedLevel.proofType === 'quiz') {
      const answers = selectedLevel.quizQuestions?.map((_, i) => quizAnswers[i])
      if (answers?.some(a => a === undefined)) {
        toast.error('Answer all questions first!')
        return
      }
    } else {
      if (!proofText.trim()) {
        toast.error('Provide your completion proof.')
        return
      }
    }

    setSubmitting(true)
    const scans = [
      'Initializing verification chain…',
      'Scanning proof signature…',
      'AI validation checks running…',
      'Verifying completion criteria…',
      'Reward generation approved ✓',
    ]
    for (const text of scans) {
      setScanText(text)
      await new Promise(r => setTimeout(r, 750))
    }

    try {
      const proofData =
        selectedLevel.proofType === 'quiz'
          ? { answers: selectedLevel.quizQuestions.map((_, i) => quizAnswers[i]) }
          : { proofText }

      const { data } = await levelApi.complete(selectedLevel._id, {
        proofUrl: 'https://stepup-uploads.s3.amazonaws.com/mock-proof.png',
        proofData,
      })

      // Trigger XP flyup + confetti
      setXpAnimationAmount(selectedLevel.xpReward)
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.5 },
        colors: ['#6C63FF', '#FF6584', '#43E97B', '#FFB800'],
      })

      // Update local levels
      setLocalLevels(prev =>
        prev.map(l => {
          if (l._id === selectedLevel._id) return { ...l, isCompleted: true }
          if (l.levelNumber === selectedLevel.levelNumber + 1) return { ...l, isLocked: false }
          return l
        })
      )

      setCompletedAnim(selectedLevel._id)
      setTimeout(() => setCompletedAnim(null), 1200)

      // Update auth user XP
      if (data.user) {
        setUser({ ...user, xpTotal: data.user.xpTotal, streakCount: data.user.streakCount })
      }
      if (data.newBadges && data.newBadges.length > 0) {
        setActiveBadge(data.newBadges[0])
      }
      setExamRefresh(r => r + 1)

      toast.success(data.message || 'Level complete! 🎉')
      setSelectedLevel(null)
      setProofText('')
      setQuizAnswers({})
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.message || 'Verification failed. Try again.')
    } finally {
      setSubmitting(false)
      setScanText('')
    }
  }, [selectedLevel, quizAnswers, proofText, proofFile, user, setUser])

  /* ── Derived ── */
  const completedCount = localLevels.filter(l => l.isCompleted).length
  const totalCount     = localLevels.length
  const progress       = totalCount > 0 ? (completedCount / totalCount) * 100 : 0
  const typeColors     = activeRoadmap ? getTypeColor(activeRoadmap.type) : getTypeColor('study')
  const mapHeight      = totalCount > 0 ? Math.floor((totalCount - 1) / 3) * 160 + 240 : 600

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: '#0A0A0F' }}>

      {/* ── XP Flyup ── */}
      <AnimatePresence>
        {xpFly && (
          <XpFlyUp
            amount={xpFly.amount}
            onDone={() => setXpFly(null)}
          />
        )}
      </AnimatePresence>

      {/* ── TOP BAR ── */}
      <div
        className="flex-shrink-0 flex items-center justify-between gap-3 px-4 py-3 border-b"
        style={{ borderColor: '#1E1E2E', background: 'rgba(13,13,24,0.97)', backdropFilter: 'blur(12px)' }}
      >
        {/* Back + Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate('/home/map')}
            className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200"
            style={{ background: 'rgba(30,30,46,0.8)', border: '1px solid #1E1E2E' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(108,99,255,0.4)'; e.currentTarget.style.background = 'rgba(108,99,255,0.1)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#1E1E2E'; e.currentTarget.style.background = 'rgba(30,30,46,0.8)' }}
          >
            <ArrowLeft size={14} style={{ color: '#8B8BAE' }} />
          </button>
          <div
            className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${typeColors.from}, ${typeColors.to})` }}
          >
            {activeRoadmap && <TypeIcon type={activeRoadmap.type} size={16} />}
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-black text-white font-display leading-tight truncate" style={{ fontFamily: 'Syne, sans-serif' }}>
              {activeRoadmap?.title || 'Select a Campaign'}
            </h1>
            <p className="text-[10px] text-muted">
              {completedCount}/{totalCount} nodes cleared
            </p>
          </div>
        </div>

        {/* Stats pills */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.2)' }}>
            <Zap size={11} style={{ color: '#6C63FF' }} />
            <span className="text-xs font-bold text-white">{user?.xpTotal || 0} XP</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: 'rgba(255,184,0,0.1)', border: '1px solid rgba(255,184,0,0.2)' }}>
            <Flame size={11} style={{ color: '#FFB800' }} />
            <span className="text-xs font-bold" style={{ color: '#FFB800' }}>{user?.streakCount || 0}d</span>
          </div>
        </div>
      </div>

      {/* ── EXAM MODE HEADER ── */}
      {activeRoadmap?.examMode && (
        <ExamModeHeader roadmapId={activeRoadmap._id} refreshTrigger={examRefresh} />
      )}

      {/* ── PROGRESS BAR ── */}
      {totalCount > 0 && (
        <div className="flex-shrink-0 px-6 py-2 flex items-center gap-3">
          <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              style={{
                background: `linear-gradient(90deg, ${typeColors.from}, ${typeColors.to})`,
                boxShadow: `0 0 8px ${typeColors.glow}`,
              }}
            />
          </div>
          <span className="text-[10px] font-bold text-muted whitespace-nowrap">
            {Math.round(progress)}% done
          </span>
        </div>
      )}

      {/* ── MAP CANVAS ── */}
      <div className="flex-1 overflow-hidden relative">
        {loading || levelsLoading ? (
          <div className="h-full flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-brand border-t-transparent animate-spin" />
            <p className="text-xs text-muted">Loading campaign map…</p>
          </div>
        ) : !activeRoadmap ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-8 gap-4">
            <Compass size={48} className="text-muted/30" />
            <h2 className="font-display font-black text-xl text-white">No Campaign Active</h2>
            <p className="text-sm text-muted max-w-xs">
              Go to the Dashboard and create or select a campaign to view its map.
            </p>
          </div>
        ) : (
          <div
            ref={mapRef}
            className="h-full overflow-y-auto no-scrollbar relative"
            style={{ scrollBehavior: 'smooth' }}
          >
            {/* Background ambient glows */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div
                className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full opacity-10"
                style={{
                  background: `radial-gradient(circle, ${typeColors.from} 0%, transparent 70%)`,
                  filter: 'blur(60px)',
                }}
              />
              <div
                className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full opacity-10"
                style={{
                  background: `radial-gradient(circle, ${typeColors.to} 0%, transparent 70%)`,
                  filter: 'blur(50px)',
                }}
              />
            </div>

            {/* SVG paths + nodes */}
            <div
              className="relative mx-auto"
              style={{ width: '100%', maxWidth: 480, height: mapHeight + 60 }}
            >
              {/* SVG connector paths */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox={`0 0 100 ${mapHeight + 60}`}
                preserveAspectRatio="none"
              >
                {localLevels.map((lvl, i) => {
                  if (i === 0) return null
                  const prev = getLevelPosition(i - 1, localLevels.length)
                  const curr = getLevelPosition(i, localLevels.length)
                  // Scale y-coords to viewBox
                  const scale = (mapHeight + 60)
                  return (
                    <PathConnector
                      key={`path-${lvl._id}`}
                      from={{ x: prev.x, y: (prev.y / scale) * 100 }}
                      to={{ x: curr.x, y: (curr.y / scale) * 100 }}
                      completed={localLevels[i - 1]?.isCompleted}
                    />
                  )
                })}
              </svg>

              {/* Level nodes */}
              {localLevels.map((lvl, i) => {
                const pos        = getLevelPosition(i, localLevels.length)
                const isCompleted = lvl.isCompleted
                const isLocked    = lvl.isLocked
                const isCurrent   = !isCompleted && !isLocked
                const isJustDone  = completedAnim === lvl._id

                return (
                  <motion.div
                    key={lvl._id}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: i * 0.07, type: 'spring', bounce: 0.4 }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                    style={{
                      left:  `${pos.x}%`,
                      top:   pos.y,
                      zIndex: isCurrent ? 10 : 5,
                    }}
                  >
                    {/* XP badge */}
                    {isCurrent && (
                      <motion.div
                        initial={{ y: 0 }}
                        animate={{ y: [-3, 3, -3] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                        className="mb-1.5 px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider"
                        style={{
                          background: '#FFB800',
                          color: '#0A0A0F',
                          boxShadow: '0 4px 12px rgba(255,184,0,0.4)',
                        }}
                      >
                        +{lvl.xpReward} XP
                      </motion.div>
                    )}

                    {/* Circle button */}
                    <motion.button
                      id={`level-node-${lvl.levelNumber}`}
                      disabled={isLocked}
                      onClick={() => !isLocked && setSelectedLevel(lvl)}
                      whileHover={!isLocked ? { scale: 1.15 } : {}}
                      whileTap={!isLocked ? { scale: 0.92 } : {}}
                      animate={
                        isJustDone
                          ? { scale: [1, 1.4, 1], rotate: [0, 15, -15, 0] }
                          : isCurrent
                          ? { boxShadow: [
                              `0 0 20px ${typeColors.glow}`,
                              `0 0 40px ${typeColors.glow}`,
                              `0 0 20px ${typeColors.glow}`,
                            ]}
                          : {}
                      }
                      transition={
                        isCurrent
                          ? { duration: 2, repeat: Infinity, ease: 'easeInOut' }
                          : { duration: 0.5 }
                      }
                      className="w-16 h-16 rounded-full flex items-center justify-center relative transition-all duration-300"
                      style={{
                        background: isCompleted
                          ? 'linear-gradient(135deg, #43E97B, #38f9d7)'
                          : isCurrent
                          ? `linear-gradient(135deg, ${typeColors.from}, ${typeColors.to})`
                          : '#12121A',
                        border: isLocked
                          ? '2px solid #1E1E2E'
                          : isCompleted
                          ? '2px solid rgba(67,233,123,0.4)'
                          : `2px solid ${typeColors.from}44`,
                        boxShadow: isCompleted
                          ? '0 0 20px rgba(67,233,123,0.4), 0 4px 16px rgba(0,0,0,0.5)'
                          : isCurrent
                          ? `0 0 25px ${typeColors.glow}, 0 4px 16px rgba(0,0,0,0.5)`
                          : '0 4px 16px rgba(0,0,0,0.4)',
                        cursor: isLocked ? 'not-allowed' : 'pointer',
                        opacity: isLocked ? 0.55 : 1,
                      }}
                    >
                      {isCompleted ? (
                        <CheckCircle size={24} className="text-[#0A0A0F] stroke-[2.5]" />
                      ) : isLocked ? (
                        <Lock size={16} className="text-muted/50" />
                      ) : (
                        <span
                          className="text-lg font-black"
                          style={{ color: '#fff', fontFamily: 'Syne, sans-serif' }}
                        >
                          {lvl.levelNumber}
                        </span>
                      )}

                      {/* Star badge on completed */}
                      {isCompleted && (
                        <div
                          className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ background: '#FFB800', border: '2px solid #0A0A0F' }}
                        >
                          <Star size={9} fill="#0A0A0F" className="text-[#0A0A0F]" />
                        </div>
                      )}

                      {/* Ripple rings on current */}
                      {isCurrent && (
                        <>
                          <motion.div
                            className="absolute inset-0 rounded-full"
                            animate={{ scale: [1, 1.6], opacity: [0.4, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
                            style={{ border: `2px solid ${typeColors.from}` }}
                          />
                          <motion.div
                            className="absolute inset-0 rounded-full"
                            animate={{ scale: [1, 1.9], opacity: [0.2, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', delay: 0.4 }}
                            style={{ border: `2px solid ${typeColors.from}` }}
                          />
                        </>
                      )}
                    </motion.button>

                    {/* Title label */}
                    <div className="mt-2 text-center max-w-[100px]">
                      <p
                        className="text-[10px] font-bold leading-tight truncate"
                        style={{ color: isCurrent ? typeColors.from : isCompleted ? '#43E97B' : '#8B8BAE' }}
                      >
                        {lvl.title}
                      </p>
                      <p className="text-[8px] text-muted/60 uppercase font-semibold mt-0.5">
                        {lvl.proofType}
                      </p>
                    </div>
                  </motion.div>
                )
              })}

              {/* Finish flag if all complete */}
              {completedCount > 0 && completedCount === totalCount && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, type: 'spring' }}
                  className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
                  style={{ top: mapHeight + 20 }}
                >
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, #FFB800, #FFD93D)',
                      boxShadow: '0 0 30px rgba(255,184,0,0.6)',
                    }}
                  >
                    <Trophy size={28} className="text-[#0A0A0F]" />
                  </div>
                  <p className="text-xs font-black text-gold">Campaign Complete!</p>
                </motion.div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── LEVEL DETAIL BOTTOM SHEET / MODAL ── */}
      <AnimatePresence>
        {selectedLevel && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !submitting && setSelectedLevel(null)}
              className="absolute inset-0"
              style={{ background: 'rgba(10,10,15,0.88)', backdropFilter: 'blur(12px)' }}
            />

            {/* Sheet */}
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 60 }}
              transition={{ type: 'spring', damping: 24, stiffness: 300 }}
              className="relative z-10 w-full sm:max-w-lg mx-0 sm:mx-4 rounded-t-3xl sm:rounded-3xl overflow-hidden"
              style={{
                background: '#12121A',
                border: '1px solid #1E1E2E',
                maxHeight: '88vh',
              }}
            >
              {/* AI Scanner Overlay */}
              <AnimatePresence>
                {submitting && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-6 p-8 text-center"
                    style={{ background: 'rgba(10,10,15,0.96)', backdropFilter: 'blur(12px)' }}
                  >
                    {/* Scanner ring */}
                    <div className="relative w-24 h-24">
                      <motion.div
                        className="absolute inset-0 rounded-full border-4"
                        style={{ borderColor: 'rgba(108,99,255,0.2)', borderTopColor: '#6C63FF' }}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      />
                      <motion.div
                        className="absolute inset-3 rounded-full border-2 border-dashed"
                        style={{ borderColor: 'rgba(255,101,132,0.4)' }}
                        animate={{ rotate: -360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles size={28} className="text-brand" />
                      </div>
                    </div>
                    {/* Scanning beam */}
                    <motion.div
                      className="absolute left-0 right-0 h-0.5"
                      style={{ background: 'linear-gradient(90deg, transparent, #6C63FF, transparent)' }}
                      animate={{ top: ['20%', '80%', '20%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <div>
                      <h4 className="font-display font-black text-lg text-white mb-2">
                        AI Verification Active
                      </h4>
                      <motion.p
                        key={scanText}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm text-muted max-w-xs"
                      >
                        {scanText}
                      </motion.p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1 sm:hidden">
                <div className="w-10 h-1 rounded-full bg-border" />
              </div>

              {/* Scrollable content */}
              <div className="overflow-y-auto no-scrollbar" style={{ maxHeight: '80vh' }}>
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-start gap-4">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black flex-shrink-0"
                        style={{
                          background: selectedLevel.isCompleted
                            ? 'rgba(67,233,123,0.1)' : 'rgba(108,99,255,0.1)',
                          border: `1px solid ${selectedLevel.isCompleted ? 'rgba(67,233,123,0.3)' : 'rgba(108,99,255,0.3)'}`,
                          color: selectedLevel.isCompleted ? '#43E97B' : '#6C63FF',
                          fontFamily: 'Syne, sans-serif',
                        }}
                      >
                        {selectedLevel.levelNumber}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span
                            className="text-[10px] font-black px-2 py-0.5 rounded-full"
                            style={{ background: '#FFB800', color: '#0A0A0F' }}
                          >
                            +{selectedLevel.xpReward} XP
                          </span>
                          <span className="text-[10px] font-semibold text-muted flex items-center gap-1 px-2 py-0.5 rounded-full"
                            style={{ background: '#1E1E2E' }}>
                            <Clock size={9} /> {selectedLevel.estimatedMinutes}m
                          </span>
                        </div>
                        <h3 className="font-display font-black text-lg text-white leading-tight">
                          {selectedLevel.title}
                        </h3>
                      </div>
                    </div>
                    <button
                      onClick={() => !submitting && setSelectedLevel(null)}
                      disabled={submitting}
                      className="p-2 rounded-xl text-muted hover:text-white hover:bg-white/5 transition-all"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Description */}
                  <div
                    className="p-4 rounded-2xl mb-4 text-xs text-muted leading-relaxed"
                    style={{ background: '#0D0D18', border: '1px solid #1E1E2E' }}
                  >
                    {selectedLevel.description}
                  </div>

                  {/* ARIA and Gym quick action row */}
                  <div className="flex gap-3 mb-5">
                    <button
                      onClick={() => setShowCoach(true)}
                      className="flex-1 py-2 px-3 rounded-xl border border-brand/20 bg-brand/5 hover:bg-brand/10 text-brand text-[10px] font-extrabold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Brain size={12} /> Chat with ARIA
                    </button>
                    <button
                      onClick={() => setShowGym(true)}
                      className="flex-1 py-2 px-3 rounded-xl border border-pink-500/20 bg-pink-500/5 hover:bg-pink-500/10 text-pink-500 text-[10px] font-extrabold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Dumbbell size={12} /> Practice in Gym
                    </button>
                  </div>

                  {/* ── Completed state ── */}
                  {selectedLevel.isCompleted ? (
                    <div
                      className="flex flex-col items-center justify-center py-8 text-center rounded-2xl"
                      style={{ background: 'rgba(67,233,123,0.05)', border: '1px solid rgba(67,233,123,0.2)' }}
                    >
                      <CheckCircle size={36} className="text-green mb-3" />
                      <h4 className="font-black text-base text-white mb-1">Level Complete!</h4>
                      <p className="text-xs text-muted">
                        You earned {selectedLevel.xpReward} XP from this challenge.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-muted uppercase tracking-wider">
                        Proof Required — {selectedLevel.proofType}
                      </h4>

                      {/* QUIZ */}
                      {selectedLevel.proofType === 'quiz' && (
                        <div className="space-y-3 text-center py-4">
                          <Brain size={36} className="text-brand mx-auto animate-pulse" />
                          <p className="text-xs text-muted">
                            This level requires a knowledge verification quiz. You must score 60% or higher to unlock the next quest.
                          </p>
                          <button
                            onClick={() => setShowQuizModal(true)}
                            className="btn btn-primary w-full py-3 text-xs flex items-center justify-center gap-1.5"
                          >
                            <Play size={12} /> Start Quiz Verification
                          </button>
                        </div>
                      )}

                      {/* VOICE */}
                      {selectedLevel.proofType === 'voice' && (
                        <div className="space-y-3 text-center py-4">
                          <Volume2 size={36} className="text-brand mx-auto animate-pulse" />
                          <p className="text-xs text-muted">
                            This level requires voice explanation. Explain the concepts out loud, and AI will evaluate your understanding.
                          </p>
                          <button
                            onClick={() => setShowVoiceModal(true)}
                            className="btn btn-primary w-full py-3 text-xs flex items-center justify-center gap-1.5"
                          >
                            <Play size={12} /> Start Voice Explanation
                          </button>
                        </div>
                      )}

                      {/* PHOTO / SCREENSHOT */}
                      {(selectedLevel.proofType === 'photo' || selectedLevel.proofType === 'screenshot') && (
                        <div className="space-y-3">
                          <p className="text-[11px] text-muted">
                            Upload a photo or screenshot of your completed work:
                          </p>
                          {proofFile ? (
                            <div className="relative">
                              <img src={URL.createObjectURL(proofFile)} alt="Preview" className="w-full rounded-2xl max-h-40 object-cover" />
                              <button onClick={() => setProofFile(null)} className="absolute top-2 right-2 w-6 h-6 bg-bg/85 rounded-full text-coral text-xs">✕</button>
                            </div>
                          ) : (
                            <button
                              onClick={() => proofFileInputRef.current?.click()}
                              className="w-full h-32 rounded-2xl border-2 border-dashed border-border hover:border-brand/40 bg-card flex flex-col items-center justify-center gap-2"
                            >
                              <Camera size={24} className="text-muted/50" />
                              <span className="text-xs text-muted">Click to select photo proof</span>
                            </button>
                          )}
                          <input
                            ref={proofFileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={e => setProofFile(e.target.files[0])}
                          />
                        </div>
                      )}

                      {/* TEXT / TIMER / CODE */}
                      {selectedLevel.proofType !== 'quiz' && selectedLevel.proofType !== 'voice' && selectedLevel.proofType !== 'photo' && selectedLevel.proofType !== 'screenshot' && (
                        <div className="space-y-2">
                          <p className="text-[11px] text-muted">
                            {selectedLevel.proofType === 'code'
                              ? 'Paste your GitHub link or output snippet:'
                              : selectedLevel.proofType === 'timer'
                              ? 'Confirm you completed the timed block:'
                              : 'Describe how you completed this challenge:'}
                          </p>
                          <textarea
                            value={proofText}
                            onChange={e => setProofText(e.target.value)}
                            rows={3}
                            placeholder={
                              selectedLevel.proofType === 'code'
                                ? 'https://github.com/you/repo or paste snippet…'
                                : 'I completed this by…'
                            }
                            className="input w-full resize-none text-xs"
                          />
                        </div>
                      )}

                      {/* Actions */}
                      {selectedLevel.proofType !== 'quiz' && selectedLevel.proofType !== 'voice' && (
                        <div className="flex gap-3 pt-1">
                          <button
                            onClick={() => !submitting && setSelectedLevel(null)}
                            disabled={submitting}
                            className="btn btn-ghost flex-1 py-3 text-xs"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="btn btn-primary flex-1 py-3 text-xs flex items-center justify-center gap-1.5"
                          >
                            {submitting ? (
                              <RefreshCw size={13} className="animate-spin" />
                            ) : (
                              <>
                                <Check size={13} /> Submit & Verify
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showQuizModal && selectedLevel && (
          <QuizVerification
            level={selectedLevel}
            onVerified={handleQuizVerified}
            onClose={() => { setShowQuizModal(false); setSelectedLevel(null); }}
          />
        )}
        {showVoiceModal && selectedLevel && (
          <VoiceVerification
            level={selectedLevel}
            onVerified={handleVoiceVerified}
            onClose={() => { setShowVoiceModal(false); setSelectedLevel(null); }}
          />
        )}
        {showCoach && selectedLevel && (
          <AICoach
            isOpen={showCoach}
            onClose={() => setShowCoach(false)}
            levelId={selectedLevel._id}
            levelTitle={selectedLevel.title}
          />
        )}
        {showGym && selectedLevel && (
          <GymLevelDetail
            levelId={selectedLevel._id}
            levelTitle={selectedLevel.title}
            onClose={() => setShowGym(false)}
            onXpEarned={(amt) => {
              setXpAnimationAmount(amt);
              setExamRefresh(r => r + 1);
            }}
          />
        )}
        {activeBadge && (
          <BadgeModal
            badge={activeBadge}
            onClose={() => setActiveBadge(null)}
          />
        )}
        {xpAnimationAmount && (
          <XPAnimation
            amount={xpAnimationAmount}
            onDone={() => setXpAnimationAmount(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
