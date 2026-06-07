import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import {
  CheckCircle, Lock, Star, Zap, Clock, Trophy,
  ChevronDown, X, Flame, Sparkles, ArrowLeft, BookOpen,
  Dumbbell, Briefcase, Compass, Check, Volume2, Camera, Navigation,
  Brain, Play, RefreshCw, AlertCircle, Send, Upload
} from 'lucide-react'
import toast from 'react-hot-toast'
import useRoadmaps from '../hooks/useRoadmaps'
import useAuthStore from '../store/authStore'
import { levelApi, aiApi } from '../api/client'
import AICoach from '../components/ai/AICoach'
import GymLevelDetail from '../components/gym/GymLevelDetail'
import BadgeModal from '../components/ui/BadgeModal'
import XPAnimation from '../components/ui/XPAnimation'

function getTypeColors(type) {
  switch (type) {
    case 'gym':   return { from: '#FF6584', to: '#ff4567', glow: 'rgba(255,101,132,0.6)', border: '#FF658444', text: '#FF6584' }
    case 'work':  return { from: '#FFB800', to: '#FFD93D', glow: 'rgba(255,184,0,0.6)', border: '#FFB80044', text: '#FFB800' }
    case 'study': return { from: '#6C63FF', to: '#9c8dff', glow: 'rgba(108,99,255,0.6)', border: '#6C63FF44', text: '#6C63FF' }
    default:      return { from: '#43E97B', to: '#38f9d7', glow: 'rgba(67,233,123,0.6)', border: '#43E97B44', text: '#43E97B' }
  }
}

export default function LevelDetailPage() {
  const { levelId } = useParams()
  const navigate = useNavigate()
  const { user, setUser } = useAuthStore()
  const { activeRoadmap, completeLevel } = useRoadmaps()

  const [level, setLevel] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [scanText, setScanText] = useState('')
  const [proofText, setProofText] = useState('')
  const [proofFile, setProofFile] = useState(null)
  const [showCoach, setShowCoach] = useState(false)
  const [showGym, setShowGym] = useState(false)
  const [activeBadge, setActiveBadge] = useState(null)
  const [xpAnimationAmount, setXpAnimationAmount] = useState(null)

  const proofFileInputRef = useRef(null)

  // Fetch Level info on mount
  useEffect(() => {
    async function fetchLevelDetails() {
      try {
        setLoading(true)
        const { data } = await levelApi.getById(levelId)
        if (data.success && data.level) {
          setLevel(data.level)
        } else {
          toast.error('Level not found')
          navigate('/home/map')
        }
      } catch (err) {
        console.error(err)
        toast.error('Failed to load level details')
        navigate('/home/map')
      } finally {
        setLoading(false)
      }
    }
    fetchLevelDetails()
  }, [levelId]) // eslint-disable-line

  const handleManualSubmit = async () => {
    if (!level) return
    setSubmitting(true)
    setScanText('AI Auditor is parsing your submission...')

    try {
      const payload = {}
      if (level.proofType === 'photo' || level.proofType === 'screenshot') {
        if (!proofFile) {
          toast.error('Please upload an image proof')
          setSubmitting(false)
          return
        }
        setScanText('Analyzing screenshot with OCR & vision...')
        const formData = new FormData()
        formData.append('image', proofFile)
        formData.append('levelId', level._id)
        
        const res = await aiApi.verifyPhoto(formData)
        if (!res.data.success || !res.data.verified) {
          toast.error(res.data.feedback || 'AI verification failed. Check feedback and try again.')
          setSubmitting(false)
          return
        }
        payload.proofUrl = res.data.proofUrl || 'https://stepup-uploads.s3.amazonaws.com/mock-photo-proof.png'
        payload.proofType = level.proofType
      } else {
        if (!proofText.trim()) {
          toast.error('Please write some proof notes')
          setSubmitting(false)
          return
        }
        payload.proofData = { text: proofText }
        payload.proofType = level.proofType
      }

      setScanText('Finalizing verification rewards...')
      const result = await completeLevel(level, payload)

      setXpAnimationAmount(level.xpReward)
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 }, colors: ['#6C63FF', '#FF6584', '#43E97B', '#FFB800'] })
      
      setLevel(prev => ({ ...prev, isCompleted: true, completedAt: new Date() }))

      if (result.user) {
        setUser({ ...user, xpTotal: result.user.xpTotal, streakCount: result.user.streakCount })
      }
      if (result.newBadges && result.newBadges.length > 0) {
        setActiveBadge(result.newBadges[0])
      }

      toast.success(result.message || 'Level verified successfully! 🎉')
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.message || 'Proof verification failed. Try again!')
    } finally {
      setSubmitting(false)
      setScanText('')
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-2 border-brand/20" />
          <div className="absolute inset-0 rounded-full border-2 border-t-brand border-r-transparent border-b-transparent border-l-transparent animate-spin" />
        </div>
        <p className="text-xs text-muted font-bold tracking-widest uppercase">Analyzing Level</p>
      </div>
    )
  }

  if (!level) return null

  const colors = getTypeColors(level.type || 'study')

  return (
    <div className="min-h-screen pb-12" style={{ background: '#0A0A0F' }}>
      
      {/* ── TOP NAV BAR ── */}
      <div
        className="sticky top-0 z-20 px-4 py-3 border-b flex items-center justify-between gap-4"
        style={{ background: 'rgba(10,10,15,0.92)', backdropFilter: 'blur(20px)', borderColor: '#1E1E2E' }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(level.roadmapId ? `/home/map/${level.roadmapId}` : '/home/map')}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200"
            style={{ background: 'rgba(30,30,46,0.8)', border: '1px solid #1E1E2E' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(108,99,255,0.4)'; e.currentTarget.style.background = 'rgba(108,99,255,0.1)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#1E1E2E'; e.currentTarget.style.background = 'rgba(30,30,46,0.8)' }}
          >
            <ArrowLeft size={14} style={{ color: '#8B8BAE' }} />
          </button>
          <div>
            <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
                  style={{ background: `${colors.from}15`, color: colors.from, border: `1px solid ${colors.from}30` }}>
              Level {level.levelNumber} · {level.type || 'Campaign'}
            </span>
            <h1 className="text-sm font-black text-white font-display mt-0.5 truncate max-w-[200px] sm:max-w-xs" style={{ fontFamily: 'Syne, sans-serif' }}>
              {level.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold"
               style={{ background: 'rgba(108,99,255,0.08)', border: '1px solid rgba(108,99,255,0.15)' }}>
            <Zap size={10} style={{ color: '#6C63FF' }} />
            <span className="text-white">{user?.xpTotal || 0} XP</span>
          </div>
        </div>
      </div>

      {/* ── MAIN LAYOUT CONTENT ── */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 relative">
        
        {/* Verification Loader / Scanner Overlay */}
        <AnimatePresence>
          {submitting && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 rounded-3xl flex flex-col items-center justify-center gap-6 p-8 text-center"
              style={{ background: 'rgba(10,10,15,0.96)', backdropFilter: 'blur(12px)' }}
            >
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
              
              <motion.div
                className="absolute left-0 right-0 h-0.5"
                style={{ background: 'linear-gradient(90deg, transparent, #6C63FF, transparent)' }}
                animate={{ top: ['20%', '80%', '20%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
              
              <div>
                <h4 className="font-display font-black text-lg text-white mb-2">AI Auditor Evaluating</h4>
                <motion.p key={scanText} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-muted max-w-xs">
                  {scanText}
                </motion.p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Level Card Details */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl p-6 sm:p-8 mb-6 relative overflow-hidden"
          style={{
            background: 'linear-gradient(145deg, rgba(18,18,26,0.95) 0%, rgba(26,26,40,0.92) 100%)',
            border: '1px solid #1E1E2E',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
          }}
        >
          {/* Accent Glow */}
          <div
            className="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none opacity-20"
            style={{ background: `radial-gradient(circle, ${colors.from} 0%, transparent 70%)`, filter: 'blur(30px)' }}
          />

          <div className="flex items-center gap-4 mb-6">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black flex-shrink-0"
              style={{
                background: level.isCompleted ? 'rgba(67,233,123,0.1)' : 'rgba(108,99,255,0.1)',
                border: `1.5px solid ${level.isCompleted ? 'rgba(67,233,123,0.35)' : 'rgba(108,99,255,0.35)'}`,
                color: level.isCompleted ? '#43E97B' : '#6C63FF',
                fontFamily: 'Syne, sans-serif'
              }}
            >
              {level.levelNumber}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full text-bg" style={{ background: '#FFB800' }}>
                  +{level.xpReward} XP
                </span>
                <span className="text-[10px] font-semibold text-muted flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: '#1E1E2E' }}>
                  <Clock size={9} /> {level.estimatedMinutes}m
                </span>
              </div>
              <h2 className="font-display font-black text-xl text-white leading-snug">
                {level.title}
              </h2>
            </div>
          </div>

          <div className="p-4 rounded-2xl mb-6 text-xs text-muted/90 leading-relaxed" style={{ background: '#0D0D18', border: '1px solid #1E1E2E' }}>
            {level.description}
          </div>

          {/* Practice Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
            <button
              onClick={() => setShowCoach(true)}
              className="py-3 px-4 rounded-2xl border border-brand/20 bg-brand/5 hover:bg-brand/10 text-brand text-[11px] font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-200"
            >
              <Brain size={14} /> Discuss with ARIA AI Coach
            </button>
            <button
              onClick={() => setShowGym(true)}
              className="py-3 px-4 rounded-2xl border border-pink-500/20 bg-pink-500/5 hover:bg-pink-500/10 text-pink-500 text-[11px] font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-200"
            >
              <Dumbbell size={14} /> Practice in Exercise Gym
            </button>
          </div>

          {/* Verification States */}
          <div className="border-t pt-6" style={{ borderColor: '#1E1E2E' }}>
            {level.isCompleted ? (
              <div className="flex flex-col items-center justify-center py-8 text-center rounded-2xl"
                   style={{ background: 'rgba(67,233,123,0.04)', border: '1px solid rgba(67,233,123,0.15)' }}>
                <CheckCircle size={40} className="text-green mb-3" />
                <h4 className="font-black text-base text-white mb-1">Quest Cleared!</h4>
                <p className="text-xs text-muted max-w-xs">
                  You successfully cleared this level and claimed +{level.xpReward} XP. Keep upgrading!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black text-muted uppercase tracking-widest">
                    Submit Verification Proof
                  </h4>
                  <span className="text-[9px] font-bold text-brand uppercase tracking-wider px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(108,99,255,0.1)' }}>
                    Type: {level.proofType}
                  </span>
                </div>

                {/* QUIZ */}
                {level.proofType === 'quiz' && (
                  <div className="text-center py-6 border border-dashed border-border rounded-2xl space-y-4">
                    <Brain size={36} className="text-brand mx-auto animate-pulse" />
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-white">Interactive Knowledge Quiz</p>
                      <p className="text-[11px] text-muted max-w-xs mx-auto">
                        Pass the AI-generated concept check (scoring 60% or higher) to verify learning.
                      </p>
                    </div>
                    <button
                      onClick={() => navigate(`/verification/${level._id}/quiz`)}
                      className="btn btn-primary px-6 py-2.5 text-xs inline-flex items-center gap-1.5"
                    >
                      <Play size={12} fill="currentColor" /> Start Quiz
                    </button>
                  </div>
                )}

                {/* VOICE */}
                {level.proofType === 'voice' && (
                  <div className="text-center py-6 border border-dashed border-border rounded-2xl space-y-4">
                    <Volume2 size={36} className="text-brand mx-auto animate-pulse" />
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-white">Voice Concept Explanation</p>
                      <p className="text-[11px] text-muted max-w-xs mx-auto">
                        Explain the concepts verbally. AI evaluates your verbal understanding and vocabulary.
                      </p>
                    </div>
                    <button
                      onClick={() => navigate(`/verification/${level._id}/voice`)}
                      className="btn btn-primary px-6 py-2.5 text-xs inline-flex items-center gap-1.5"
                    >
                      <Play size={12} fill="currentColor" /> Explain Out Loud
                    </button>
                  </div>
                )}

                {/* PHOTO / SCREENSHOT */}
                {(level.proofType === 'photo' || level.proofType === 'screenshot') && (
                  <div className="space-y-4">
                    {proofFile ? (
                      <div className="relative rounded-2xl overflow-hidden border border-border bg-black/40">
                        <img src={URL.createObjectURL(proofFile)} alt="Upload proof" className="w-full max-h-56 object-contain" />
                        <button
                          onClick={() => setProofFile(null)}
                          className="absolute top-2 right-2 w-7 h-7 rounded-xl flex items-center justify-center text-xs transition-colors"
                          style={{ background: 'rgba(10,10,15,0.85)', color: '#FF6584' }}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => proofFileInputRef.current?.click()}
                        className="w-full h-36 rounded-2xl border-2 border-dashed border-border hover:border-brand/40 bg-card/40 flex flex-col items-center justify-center gap-2.5 transition-colors"
                      >
                        <Camera size={26} className="text-muted/65" />
                        <div className="text-center">
                          <span className="text-xs font-bold text-white block">Upload Screenshot Proof</span>
                          <span className="text-[10px] text-muted mt-0.5 block">Supports PNG, JPG (Max 5MB)</span>
                        </div>
                      </button>
                    )}
                    <input
                      ref={proofFileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => e.target.files?.[0] && setProofFile(e.target.files[0])}
                    />

                    <div className="flex gap-3">
                      <button
                        onClick={handleManualSubmit}
                        disabled={submitting || !proofFile}
                        className="btn btn-primary flex-1 py-3 text-xs flex items-center justify-center gap-1.5"
                      >
                        {submitting ? <RefreshCw size={13} className="animate-spin" /> : <><Check size={13} /> Verify Screenshot Proof</>}
                      </button>
                    </div>
                  </div>
                )}

                {/* TEXT / CODE / TIMER */}
                {level.proofType !== 'quiz' && level.proofType !== 'voice' && level.proofType !== 'photo' && level.proofType !== 'screenshot' && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-muted uppercase tracking-wider block">
                        {level.proofType === 'code' ? 'GitHub Link or Code Snippet' : 'Proof Description Notes'}
                      </label>
                      <textarea
                        value={proofText}
                        onChange={e => setProofText(e.target.value)}
                        rows={4}
                        placeholder={level.proofType === 'code' ? 'Paste repository url, gist url, or code snippet…' : 'I completed this level by doing…'}
                        className="input w-full resize-none text-xs"
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={handleManualSubmit}
                        disabled={submitting || !proofText.trim()}
                        className="btn btn-primary flex-1 py-3 text-xs flex items-center justify-center gap-1.5"
                      >
                        {submitting ? <RefreshCw size={13} className="animate-spin" /> : <><Check size={13} /> Complete Level</>}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* ── DIALOG OVERLAYS ── */}
      <AnimatePresence>
        {showCoach && (
          <AICoach
            isOpen={showCoach}
            onClose={() => setShowCoach(false)}
            levelId={level._id}
            levelTitle={level.title}
          />
        )}
        {showGym && (
          <GymLevelDetail
            levelId={level._id}
            levelTitle={level.title}
            onClose={() => setShowGym(false)}
            onXpEarned={(amt) => {
              setXpAnimationAmount(amt);
              if (user) {
                setUser({ ...user, xpTotal: (user.xpTotal || 0) + amt })
              }
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
