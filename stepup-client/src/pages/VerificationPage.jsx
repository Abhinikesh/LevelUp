import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import toast from 'react-hot-toast'
import useRoadmaps from '../hooks/useRoadmaps'
import useAuthStore from '../store/authStore'
import { levelApi } from '../api/client'
import QuizVerification from '../components/ai/QuizVerification'
import VoiceVerification from '../components/ai/VoiceVerification'
import BadgeModal from '../components/ui/BadgeModal'
import XPAnimation from '../components/ui/XPAnimation'

export default function VerificationPage() {
  const { levelId, type } = useParams()
  const navigate = useNavigate()
  const { user, setUser } = useAuthStore()
  const { completeLevel } = useRoadmaps()

  const [level, setLevel] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [activeBadge, setActiveBadge] = useState(null)
  const [xpAnimationAmount, setXpAnimationAmount] = useState(null)

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

  const handleQuizVerified = async ({ score, answers }) => {
    if (!level) return
    setSubmitting(true)
    try {
      const result = await completeLevel(level, {
        proofUrl: 'https://stepup-uploads.s3.amazonaws.com/quiz-proof.png',
        proofData: { answers },
      })
      setXpAnimationAmount(level.xpReward)
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 }, colors: ['#6C63FF', '#FF6584', '#43E97B', '#FFB800'] })
      
      if (result.user) {
        setUser({ ...user, xpTotal: result.user.xpTotal, streakCount: result.user.streakCount })
      }
      if (result.newBadges && result.newBadges.length > 0) {
        setActiveBadge(result.newBadges[0])
      }
      toast.success(result.message || 'Quiz cleared! Level complete! 🎉')
      
      // Wait a moment for animations then navigate back to map
      setTimeout(() => {
        navigate(level.roadmapId ? `/home/map/${level.roadmapId}` : '/home/map')
      }, 1500)
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.message || 'Verification failed. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleVoiceVerified = (data) => {
    if (!level) return
    setXpAnimationAmount(level.xpReward)
    confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 }, colors: ['#6C63FF', '#43E97B', '#FFB800'] })
    
    if (data.user) {
      setUser({ ...user, xpTotal: data.user.xpTotal, streakCount: data.user.streakCount })
    }
    if (data.newBadges && data.newBadges.length > 0) {
      setActiveBadge(data.newBadges[0])
    }
    toast.success('Voice challenge verified! Level complete! 🎉')

    setTimeout(() => {
      navigate(level.roadmapId ? `/home/map/${level.roadmapId}` : '/home/map')
    }, 1500)
  }

  const handleClose = () => {
    navigate(`/level/${levelId}`)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-2 border-brand/20" />
          <div className="absolute inset-0 rounded-full border-2 border-t-brand border-r-transparent border-b-transparent border-l-transparent animate-spin" />
        </div>
        <p className="text-xs text-muted font-bold tracking-widest uppercase">Initializing Verification Session</p>
      </div>
    )
  }

  if (!level) return null

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4" style={{ background: '#0A0A0F' }}>
      
      <div className="w-full max-w-lg z-10">
        {type === 'quiz' ? (
          <QuizVerification
            level={level}
            onVerified={handleQuizVerified}
            onClose={handleClose}
          />
        ) : type === 'voice' ? (
          <VoiceVerification
            level={level}
            onVerified={handleVoiceVerified}
            onClose={handleClose}
          />
        ) : (
          <div className="text-center p-8 bg-card border border-border rounded-3xl">
            <h2 className="text-lg font-black text-white mb-2">Unsupported Verification Type</h2>
            <p className="text-xs text-muted mb-4">The verification type "{type}" is not supported.</p>
            <button onClick={handleClose} className="btn btn-primary text-xs">Back to Level</button>
          </div>
        )}
      </div>

      {/* Badges / Animations */}
      <AnimatePresence>
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
