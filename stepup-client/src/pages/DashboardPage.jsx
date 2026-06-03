import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Play,
  Lock,
  CheckCircle,
  Clock,
  Compass,
  Trophy,
  Activity,
  Flame,
  Award,
  ChevronRight,
  Sparkles,
  Timer,
  Upload,
  BookOpen,
  Dumbbell,
  Briefcase,
  Layers,
  Check,
  ChevronLeft,
  Zap
} from 'lucide-react'
import { roadmapApi, levelApi } from '../api/client'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'

export default function DashboardPage() {
  const { user, setUser } = useAuthStore()
  
  // State
  const [roadmaps, setRoadmaps] = useState([])
  const [selectedRoadmap, setSelectedRoadmap] = useState(null)
  const [levels, setLevels] = useState([])
  const [loading, setLoading] = useState(true)
  const [levelsLoading, setLevelsLoading] = useState(false)

  // Modals
  const [createOpen, setCreateOpen] = useState(false)
  const [activeLevel, setActiveLevel] = useState(null)

  // Creation Form State
  const [newTitle, setNewTitle] = useState('')
  const [newType, setNewType] = useState('study')
  const [creationLoading, setCreationLoading] = useState(false)

  // Quiz state
  const [quizAnswers, setQuizAnswers] = useState({})
  
  // Generic completion proof state
  const [proofText, setProofText] = useState('')
  const [submittingProof, setSubmittingProof] = useState(false)
  const [verifyingText, setVerifyingText] = useState('')

  // ── Fetch User Roadmaps ──────────────────────────────────────────
  const fetchRoadmaps = async (autoSelectId = null) => {
    try {
      setLoading(true)
      const { data } = await roadmapApi.getAll()
      setRoadmaps(data.roadmaps || [])
      
      if (data.roadmaps && data.roadmaps.length > 0) {
        // Auto-select first roadmap or the recently created one
        const target = autoSelectId 
          ? data.roadmaps.find(r => r._id === autoSelectId) || data.roadmaps[0]
          : data.roadmaps[0]
        setSelectedRoadmap(target)
        await fetchLevels(target._id)
      } else {
        setSelectedRoadmap(null)
        setLevels([])
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to load your progress maps.')
    } finally {
      setLoading(false)
    }
  }

  // ── Fetch Levels of Selected Roadmap ─────────────────────────────
  const fetchLevels = async (roadmapId) => {
    try {
      setLevelsLoading(true)
      const { data } = await levelApi.getByRoadmap(roadmapId)
      setLevels(data.levels || [])
    } catch (err) {
      console.error(err)
      toast.error('Failed to load level progression.')
    } finally {
      setLevelsLoading(false)
    }
  }

  useEffect(() => {
    fetchRoadmaps()
  }, [])

  // Handle roadmap selection switch
  const handleSelectRoadmap = async (roadmap) => {
    setSelectedRoadmap(roadmap)
    await fetchLevels(roadmap._id)
  }

  // ── Create New Roadmap ───────────────────────────────────────────
  const handleCreateRoadmap = async (e) => {
    e.preventDefault()
    if (!newTitle.trim()) {
      toast.error('Please enter a title for your roadmap')
      return
    }

    setCreationLoading(true)
    try {
      // Setup standard mock levels depending on selected type
      let initialLevels = []
      if (newType === 'study') {
        initialLevels = [
          {
            title: 'Foundational Concepts',
            description: 'Learn the primary guidelines, terminology, and core syntax of the subject.',
            proofType: 'quiz',
            estimatedMinutes: 20,
            xpReward: 100,
            quizQuestions: [
              {
                question: 'Which of the following describes the core objective of building a solid foundation?',
                options: ['Skipping straight to advanced projects', 'Understanding fundamentals and terminology', 'Using external tools without learning how they work'],
                correctIndex: 1,
                explanation: 'A strong foundation allows you to debug and think logically when building complex features.'
              }
            ]
          },
          {
            title: 'Apply Core Concepts',
            description: 'Write a small script or outline that directly utilizes the syntax you learned in Level 1.',
            proofType: 'code',
            estimatedMinutes: 45,
            xpReward: 150
          },
          {
            title: 'Comprehensive Challenge',
            description: 'Finish a multi-part quiz to prove your master status of basic study skills.',
            proofType: 'quiz',
            estimatedMinutes: 30,
            xpReward: 200,
            quizQuestions: [
              {
                question: 'Which learning method is proven to maximize information retention?',
                options: ['Re-reading notes multiple times', 'Spaced repetition and active recall', 'Cramming the night before'],
                correctIndex: 1,
                explanation: 'Active recall forces your brain to retrieve information, strengthening neural pathways.'
              }
            ]
          }
        ]
      } else if (newType === 'gym') {
        initialLevels = [
          {
            title: 'Dynamic Warmup',
            description: 'Complete 10 minutes of active mobility work to prime joints and raise core temp.',
            proofType: 'timer',
            estimatedMinutes: 10,
            xpReward: 100
          },
          {
            title: 'Strength Core Session',
            description: 'Perform compound movements prioritizing proper form and gradual load.',
            proofType: 'photo',
            estimatedMinutes: 45,
            xpReward: 150
          },
          {
            title: 'Post-Workout Stretch',
            description: 'Hold static stretches for major muscle groups to aid recovery.',
            proofType: 'screenshot',
            estimatedMinutes: 15,
            xpReward: 100
          }
        ]
      } else {
        // Work/Custom default template
        initialLevels = [
          {
            title: 'Set Daily Focus',
            description: 'Define and write down your single most critical outcome for the day.',
            proofType: 'quiz',
            estimatedMinutes: 15,
            xpReward: 100,
            quizQuestions: [
              {
                question: 'What is the recommended limit of high-priority daily tasks?',
                options: ['1 to 3 key focus tasks', '10 to 15 generic tasks', 'None, just follow the flow'],
                correctIndex: 0,
                explanation: 'Limiting priorities prevents cognitive fatigue and guarantees execution on what matters.'
              }
            ]
          },
          {
            title: 'Deep Work Block',
            description: 'Commit to a distraction-free block of deep execution with notifications muted.',
            proofType: 'timer',
            estimatedMinutes: 90,
            xpReward: 200
          }
        ]
      }

      const { data } = await roadmapApi.create({
        title: newTitle,
        type: newType,
        levels: initialLevels
      })

      toast.success(data.message)
      setCreateOpen(false)
      setNewTitle('')
      setNewType('study')
      
      // Reload lists and select the new one
      await fetchRoadmaps(data.roadmap._id)
    } catch (err) {
      console.error(err)
      toast.error('Failed to create roadmap')
    } finally {
      setCreationLoading(false)
    }
  }

  // ── Submit Level Completion Proof ───────────────────────────────
  const handleCompleteLevel = async (level) => {
    let proofData = null

    if (level.proofType === 'quiz') {
      // Gather quiz answers
      const answers = level.quizQuestions.map((_, idx) => quizAnswers[idx])
      if (answers.some(ans => ans === undefined)) {
        toast.error('Please answer all quiz questions!')
        return
      }
      proofData = { answers }
    } else {
      // Text proof / URL / verification content
      if (!proofText.trim()) {
        toast.error('Please provide a written confirmation or description of completion.')
        return
      }
      proofData = { proofText }
    }

    setSubmittingProof(true)
    
    // AAA Game simulation scanning effect
    const scanPhases = [
      'Initializing secure connection...',
      'Analyzing proof file signature...',
      'AI OCR and visual validation checks running...',
      'Verifying metadata and location timestamps...',
      'Approval criteria satisfied. Generating rewards...'
    ]

    for (let i = 0; i < scanPhases.length; i++) {
      setVerifyingText(scanPhases[i])
      await new Promise(resolve => setTimeout(resolve, 800))
    }

    try {
      const { data } = await levelApi.complete(level._id, {
        proofUrl: 'https://stepup-uploads.s3.amazonaws.com/mock-proof.png',
        proofData
      })

      toast.success(data.message)
      
      // Update local level states
      setLevels(prev => prev.map(lvl => {
        if (lvl._id === level._id) {
          return { ...lvl, isCompleted: true, completedAt: new Date() }
        }
        // Unlock the next level
        if (lvl.levelNumber === level.levelNumber + 1) {
          return { ...lvl, isLocked: false }
        }
        return lvl
      }))

      // Update roadmap state
      setSelectedRoadmap(prev => ({
        ...prev,
        currentLevel: data.nextLevelUnlocked ? level.levelNumber + 1 : prev.currentLevel,
        isCompleted: data.roadmapCompleted
      }))

      // Update user XP & Streak in Zustand store
      if (data.user) {
        setUser({
          ...user,
          xpTotal: data.user.xpTotal,
          streakCount: data.user.streakCount
        })
      }

      // Close modal
      setActiveLevel(null)
      setProofText('')
      setQuizAnswers({})
      
      // Refresh roadmap listings to reflect current Level/XP updates
      const roadmapId = selectedRoadmap._id
      const roadmapListRes = await roadmapApi.getAll()
      setRoadmaps(roadmapListRes.data.roadmaps || [])
      const updatedSelect = (roadmapListRes.data.roadmaps || []).find(r => r._id === roadmapId)
      if (updatedSelect) setSelectedRoadmap(updatedSelect)

    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.message || 'Proof verification failed. Try again!')
    } finally {
      setSubmittingProof(false)
      setVerifyingText('')
    }
  }

  // Type-specific background styles
  const getRoadmapColorGlow = (type) => {
    switch (type) {
      case 'gym':    return 'shadow-[0_0_30px_rgba(255,101,132,0.15)] border-coral/30'
      case 'work':   return 'shadow-[0_0_30px_rgba(255,184,0,0.15)] border-gold/30'
      case 'study':  return 'shadow-[0_0_30px_rgba(108,99,255,0.15)] border-brand/30'
      default:       return 'shadow-[0_0_30px_rgba(67,233,123,0.15)] border-green/30'
    }
  }

  const getRoadmapTypeIcon = (type) => {
    switch (type) {
      case 'gym':    return <Dumbbell className="text-coral" size={18} />
      case 'work':   return <Briefcase className="text-gold" size={18} />
      case 'study':  return <BookOpen className="text-brand" size={18} />
      default:       return <Compass className="text-green" size={18} />
    }
  }

  return (
    <div className="min-h-screen grid-bg relative py-8 px-4 sm:px-8 text-textprimary overflow-hidden">
      
      {/* ── Background decoration ── */}
      <div className="absolute top-[10%] left-[-15%] w-[800px] h-[800px] rounded-full pointer-events-none opacity-20"
        style={{
          background: 'radial-gradient(circle, rgba(108,99,255,0.15) 0%, transparent 80%)',
          filter: 'blur(80px)'
        }}
      />
      <div className="absolute bottom-[10%] right-[-15%] w-[600px] h-[600px] rounded-full pointer-events-none opacity-20"
        style={{
          background: 'radial-gradient(circle, rgba(255,101,132,0.1) 0%, transparent 80%)',
          filter: 'blur(60px)'
        }}
      />

      <div className="container mx-auto max-w-6xl relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 mt-4">
        
        {/* ── LEFT COLUMN: ROADMAP LISTING & PROFILE CARD (4 Cols) ── */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* USER MINI DASH CARD */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="glass-card p-6 flex flex-col gap-4 border border-border"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold font-display text-white relative shadow-brand"
                style={{ background: 'linear-gradient(135deg, #6C63FF, #FF6584)' }}
              >
                {user?.name ? user.name.charAt(0).toUpperCase() : '?'}
                <div className="absolute -bottom-1.5 -right-1.5 bg-green border-2 border-bg text-bg text-[9px] font-black px-1.5 py-0.5 rounded-full">
                  ONLINE
                </div>
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-black truncate">{user?.name}</h2>
                <div className="flex items-center gap-1 text-xs font-semibold text-muted">
                  <Zap size={12} className="text-brand" />
                  <span>Level {user ? Math.floor((user.xpTotal || 0) / 500) + 1 : 1} Explorer</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="flex flex-col p-3 rounded-xl bg-card border border-border">
                <span className="text-xs text-muted font-semibold uppercase tracking-wider">XP Total</span>
                <span className="text-lg font-black text-white mt-1">{user?.xpTotal || 0}</span>
              </div>
              <div className="flex flex-col p-3 rounded-xl bg-card border border-border">
                <span className="text-xs text-muted font-semibold uppercase tracking-wider">Streak</span>
                <span className="text-lg font-black text-gold mt-1 flex items-center gap-1">
                  <Flame size={16} className="text-gold animate-pulse" />
                  {user?.streakCount || 0}d
                </span>
              </div>
            </div>
          </motion.div>

          {/* ROADMAPS COLLECTION */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="glass-card p-6 flex-1 flex flex-col border border-border"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Layers size={18} className="text-brand" />
                <h3 className="font-display font-black text-base text-white">Your Quests</h3>
              </div>
              <button
                id="btn-new-roadmap"
                onClick={() => setCreateOpen(true)}
                className="w-8 h-8 rounded-xl bg-brand/10 hover:bg-brand/20 border border-brand/20 hover:border-brand/40 flex items-center justify-center transition-all duration-200"
              >
                <Plus size={16} className="text-brand" />
              </button>
            </div>

            {loading ? (
              <div className="flex-1 flex flex-col gap-3 justify-center items-center py-12">
                <div className="animate-spin w-6 h-6 border-2 border-brand border-t-transparent rounded-full" />
                <span className="text-xs text-muted">Retrieving active campaigns...</span>
              </div>
            ) : roadmaps.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-12 px-4 border border-dashed border-border rounded-2xl bg-card/20">
                <Compass className="text-muted/40 mb-3" size={32} />
                <h4 className="font-semibold text-sm text-textprimary mb-1">No active quests</h4>
                <p className="text-xs text-muted mb-4 max-w-[200px]">Create a new track and level up your skills.</p>
                <button
                  id="btn-create-empty-roadmap"
                  onClick={() => setCreateOpen(true)}
                  className="btn btn-primary text-xs py-2 px-4 rounded-xl flex items-center gap-1.5"
                >
                  <Plus size={14} /> Add First Track
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3 max-h-[350px] overflow-y-auto no-scrollbar">
                {roadmaps.map((rm) => {
                  const isActive = selectedRoadmap?._id === rm._id
                  const completionPercent = rm.totalLevels > 0 
                    ? Math.round(((rm.currentLevel - 1) / rm.totalLevels) * 100)
                    : 0

                  return (
                    <button
                      key={rm._id}
                      onClick={() => handleSelectRoadmap(rm)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between gap-4 ${
                        isActive
                          ? 'bg-card border-brand/40 shadow-[0_0_15px_rgba(108,99,255,0.08)]'
                          : 'bg-card/40 border-border hover:border-brand/20'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          {getRoadmapTypeIcon(rm.type)}
                          <span className="text-xs font-bold text-muted uppercase tracking-wider">{rm.type}</span>
                        </div>
                        <h4 className="font-bold text-sm text-white truncate">{rm.title}</h4>
                        
                        {/* Progress Bar */}
                        <div className="mt-3 flex items-center gap-2">
                          <div className="flex-1 h-1 bg-border rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-brand" 
                              style={{ 
                                width: `${completionPercent}%`,
                                background: rm.type === 'gym' ? '#FF6584' : rm.type === 'work' ? '#FFB800' : '#6C63FF' 
                              }} 
                            />
                          </div>
                          <span className="text-[10px] font-bold text-muted">{completionPercent}%</span>
                        </div>
                      </div>
                      <ChevronRight size={16} className={`text-muted transition-transform ${isActive ? 'translate-x-1 text-brand' : ''}`} />
                    </button>
                  )
                })}
              </div>
            )}
          </motion.div>

        </div>

        {/* ── RIGHT COLUMN: MAP PATHWAY & QUEST DETAILS (8 Cols) ── */}
        <div className="lg:col-span-8">
          
          {selectedRoadmap ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className={`glass-card p-6 sm:p-8 flex flex-col min-h-[500px] border relative overflow-hidden ${getRoadmapColorGlow(selectedRoadmap.type)}`}
            >
              
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-brand uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-brand/10 border border-brand/20">
                      {selectedRoadmap.type} Campaign
                    </span>
                    {selectedRoadmap.isCompleted && (
                      <span className="text-xs font-bold text-green uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-green/10 border border-green/20 flex items-center gap-1">
                        <Check size={10} /> Completed
                      </span>
                    )}
                  </div>
                  <h2 className="font-display font-black text-xl sm:text-2xl text-white">{selectedRoadmap.title}</h2>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-muted bg-card/60 border border-border px-3 py-2 rounded-xl self-start sm:self-auto">
                  <Layers size={14} className="text-brand" />
                  <span>Progression: <strong className="text-white">{selectedRoadmap.currentLevel} of {selectedRoadmap.totalLevels}</strong> Nodes</span>
                </div>
              </div>

              {/* Candy Crush Level Node Pathway */}
              <div className="flex-1 flex flex-col items-center justify-center relative py-10 min-h-[350px]">
                
                {/* SVG Connecting Path Line */}
                <div className="absolute inset-0 pointer-events-none flex justify-center z-0">
                  <svg className="w-48 h-full" viewBox="0 0 200 400" preserveAspectRatio="none">
                    <path
                      d="M100,10 C40,100 160,200 100,300 C70,350 100,390 100,400"
                      fill="none"
                      stroke="rgba(30, 30, 46, 0.8)"
                      strokeWidth="6"
                      strokeLinecap="round"
                    />
                    <path
                      d="M100,10 C40,100 160,200 100,300 C70,350 100,390 100,400"
                      fill="none"
                      stroke="rgba(108, 99, 255, 0.2)"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray="10 5"
                      className="animate-spin-slow"
                    />
                  </svg>
                </div>

                {levelsLoading ? (
                  <div className="flex flex-col items-center gap-2 py-20 z-10">
                    <div className="animate-spin w-8 h-8 border-2 border-brand border-t-transparent rounded-full" />
                    <span className="text-xs text-muted">Drawing path map...</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-12 relative z-10 w-full max-w-sm">
                    {levels.map((lvl, index) => {
                      const isCompleted = lvl.isCompleted
                      const isLocked = lvl.isLocked
                      const isCurrent = !isCompleted && !isLocked

                      // Alternate alignment for the path snake/wave look
                      const alignments = ['justify-center', 'justify-start pl-8', 'justify-end pr-8']
                      const alignClass = alignments[index % alignments.length]

                      return (
                        <div key={lvl._id} className={`flex ${alignClass}`}>
                          <motion.button
                            whileHover={!isLocked ? { scale: 1.1 } : {}}
                            whileTap={!isLocked ? { scale: 0.95 } : {}}
                            onClick={() => !isLocked && setActiveLevel(lvl)}
                            className={`flex flex-col items-center gap-2 cursor-pointer group ${isLocked ? 'cursor-not-allowed opacity-70' : ''}`}
                          >
                            {/* Circle Node */}
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center font-display font-black text-lg relative transition-all duration-300 ${
                              isCompleted 
                                ? 'bg-gradient-to-br from-green to-[#38f9d7] text-[#0A0A0F] shadow-[0_0_20px_rgba(67,233,123,0.4)]'
                                : isCurrent
                                ? 'bg-gradient-to-br from-brand to-[#9c8dff] text-white shadow-[0_0_25px_rgba(108,99,255,0.6)] ring-4 ring-brand/20 animate-pulse'
                                : 'bg-[#12121A] border-2 border-border text-muted'
                            }`}>
                              {isCompleted ? (
                                <CheckCircle size={22} className="stroke-[2.5]" />
                              ) : isLocked ? (
                                <Lock size={18} className="text-muted/60" />
                              ) : (
                                <span>{lvl.levelNumber}</span>
                              )}

                              {/* Tiny XP Tag */}
                              {!isCompleted && !isLocked && (
                                <div className="absolute -top-3 bg-gold text-[#0A0A0F] font-black text-[9px] px-1.5 py-0.5 rounded-full tracking-wider shadow-[0_4px_10px_rgba(255,184,0,0.3)]">
                                  +{lvl.xpReward} XP
                                </div>
                              )}
                            </div>

                            {/* Node Title */}
                            <div className="text-center max-w-[120px]">
                              <p className={`text-xs font-bold truncate ${isCurrent ? 'text-brand' : 'text-textprimary'}`}>
                                {lvl.title}
                              </p>
                              <span className="text-[9px] text-muted uppercase font-semibold">
                                {lvl.proofType}
                              </span>
                            </div>
                          </motion.button>
                        </div>
                      )
                    })}
                  </div>
                )}

              </div>

            </motion.div>
          ) : (
            <div className="glass-card p-12 flex flex-col items-center justify-center text-center min-h-[500px] border border-border">
              <Compass className="text-muted/30 mb-4 animate-float" size={48} />
              <h2 className="font-display font-black text-xl text-white mb-2">No Campaign Selected</h2>
              <p className="text-sm text-muted max-w-sm mb-6">Create or select a campaign path from the left panel to begin leveling up.</p>
              <button
                id="btn-dashboard-new-roadmap"
                onClick={() => setCreateOpen(true)}
                className="btn btn-primary flex items-center gap-2"
              >
                <Plus size={16} /> Start a Campaign
              </button>
            </div>
          )}

        </div>

      </div>

      {/* ── CREATE CAMPAIGN MODAL ── */}
      <AnimatePresence>
        {createOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCreateOpen(false)}
              className="absolute inset-0 bg-bg/85 backdrop-blur-md"
            />

            {/* Content Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative z-10 w-full max-w-md bg-[#12121A] border border-border rounded-3xl p-6 shadow-card-lg"
            >
              <h3 className="font-display font-black text-xl text-white mb-2">Start a New Campaign</h3>
              <p className="text-xs text-muted mb-6">Embark on a gamified campaign pathway to track and audit your achievements.</p>

              <form onSubmit={handleCreateRoadmap} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider text-muted">
                    Campaign Title
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Master React & Node, 10k Run prep"
                    className="input"
                    disabled={creationLoading}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider text-muted">
                    Theme / Objective
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { type: 'study', label: 'Study', icon: <BookOpen size={16} /> },
                      { type: 'gym', label: 'Gym', icon: <Dumbbell size={16} /> },
                      { type: 'work', label: 'Work', icon: <Briefcase size={16} /> }
                    ].map(opt => (
                      <button
                        key={opt.type}
                        type="button"
                        onClick={() => setNewType(opt.type)}
                        className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl border text-xs font-bold transition-all duration-200 ${
                          newType === opt.type
                            ? 'bg-brand/10 border-brand text-white shadow-[0_0_15px_rgba(108,99,255,0.15)]'
                            : 'bg-card border-border text-muted hover:border-brand/20'
                        }`}
                      >
                        {opt.icon}
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setCreateOpen(false)}
                    className="btn btn-ghost flex-1 py-3 text-xs"
                    disabled={creationLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary flex-1 py-3 text-xs flex items-center justify-center gap-1.5"
                    disabled={creationLoading}
                  >
                    {creationLoading ? (
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <>
                        <Sparkles size={14} /> Start Campaign
                      </>
                    )}
                  </button>
                </div>
              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── LEVEL CHALLENGE MODAL (Quest verification UI) ── */}
      <AnimatePresence>
        {activeLevel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !submittingProof && setActiveLevel(null)}
              className="absolute inset-0 bg-bg/90 backdrop-blur-md"
            />

            {/* Content Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative z-10 w-full max-w-lg bg-[#12121A] border border-border rounded-3xl p-6 sm:p-8 shadow-card-lg overflow-hidden"
            >
              
              {/* AI Verification Scanner Overlay */}
              <AnimatePresence>
                {submittingProof && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 bg-[#0A0A0F]/95 flex flex-col items-center justify-center p-6 text-center"
                  >
                    {/* Glowing circular scanner */}
                    <div className="w-24 h-24 rounded-full border-4 border-brand/20 border-t-brand animate-spin flex items-center justify-center mb-6 relative">
                      <div className="absolute inset-2 rounded-full border border-dashed border-coral/40 animate-pulse" />
                      <Compass size={32} className="text-brand animate-bounce-slow" />
                    </div>

                    <h4 className="font-display font-black text-lg text-white mb-2">AI Verification Scan</h4>
                    <p className="text-sm text-muted max-w-xs">{verifyingText}</p>
                    
                    {/* Retro sci-fi scanning beam */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-brand to-transparent animate-bounce-slow" 
                      style={{ animationDuration: '2s' }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Close Button */}
              <button
                onClick={() => setActiveLevel(null)}
                className="absolute top-4 right-4 text-muted hover:text-white"
                disabled={submittingProof}
              >
                ✕
              </button>

              {/* Modal Header */}
              <div className="flex items-start gap-4 mb-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black ${
                  activeLevel.isCompleted 
                    ? 'bg-green/10 border border-green/20 text-green'
                    : 'bg-brand/10 border border-brand/20 text-brand'
                }`}>
                  {activeLevel.levelNumber}
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[10px] font-bold text-gold uppercase tracking-wider bg-gold/10 px-2 py-0.5 rounded border border-gold/20">
                      +{activeLevel.xpReward} XP Reward
                    </span>
                    <span className="text-[10px] font-bold text-muted uppercase tracking-wider bg-card px-2 py-0.5 rounded border border-border flex items-center gap-1">
                      <Clock size={10} /> {activeLevel.estimatedMinutes} Mins
                    </span>
                  </div>
                  <h3 className="font-display font-black text-xl text-white">{activeLevel.title}</h3>
                </div>
              </div>

              {/* Description */}
              <div className="p-4 rounded-2xl bg-card border border-border mb-6">
                <p className="text-xs text-muted leading-relaxed">{activeLevel.description}</p>
              </div>

              {/* PROOF INPUT AREA DEPENDING ON TYPE */}
              {activeLevel.isCompleted ? (
                <div className="flex flex-col items-center justify-center py-6 text-center bg-green/5 border border-green/20 rounded-2xl">
                  <CheckCircle size={32} className="text-green mb-2" />
                  <h4 className="font-bold text-sm text-white">Level Completed!</h4>
                  <p className="text-xs text-muted mt-1">You already collected {activeLevel.xpReward} XP from this challenge.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-muted uppercase tracking-wider">Proof of Work Needed ({activeLevel.proofType})</h4>

                  {/* 1. QUIZ PROOF */}
                  {activeLevel.proofType === 'quiz' && activeLevel.quizQuestions && (
                    <div className="space-y-4 max-h-[220px] overflow-y-auto pr-2 no-scrollbar">
                      {activeLevel.quizQuestions.map((q, qIdx) => (
                        <div key={qIdx} className="space-y-2 border-b border-border/40 pb-3 last:border-0 last:pb-0">
                          <p className="text-xs font-semibold text-white">{q.question}</p>
                          <div className="flex flex-col gap-2">
                            {q.options.map((opt, oIdx) => {
                              const isSelected = quizAnswers[qIdx] === oIdx
                              return (
                                <button
                                  key={oIdx}
                                  type="button"
                                  onClick={() => setQuizAnswers(prev => ({ ...prev, [qIdx]: oIdx }))}
                                  className={`w-full text-left p-3 rounded-xl border text-xs transition-all duration-200 ${
                                    isSelected
                                      ? 'bg-brand/10 border-brand text-white font-semibold'
                                      : 'bg-card border-border text-muted hover:border-brand/20'
                                  }`}
                                >
                                  {opt}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 2. WRITTEN/CONFIRMATION PROOF (Timer, Code, Photo, etc.) */}
                  {activeLevel.proofType !== 'quiz' && (
                    <div className="space-y-3">
                      <p className="text-[11px] text-muted">
                        Explain how you completed this level, paste your code link, or state your outcome:
                      </p>
                      <textarea
                        value={proofText}
                        onChange={(e) => setProofText(e.target.value)}
                        placeholder={
                          activeLevel.proofType === 'code'
                            ? 'Paste your Github link or output snippet here...'
                            : activeLevel.proofType === 'timer'
                            ? 'Confirm you completed the workout duration block...'
                            : 'Provide brief completion details...'
                        }
                        rows={3}
                        className="input w-full resize-none text-xs"
                      />
                    </div>
                  )}

                  {/* Submit Action */}
                  <div className="flex gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setActiveLevel(null)}
                      className="btn btn-ghost flex-1 py-3 text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCompleteLevel(activeLevel)}
                      className="btn btn-primary flex-1 py-3 text-xs flex items-center justify-center gap-1.5"
                    >
                      <Check size={14} /> Submit & Audit
                    </button>
                  </div>
                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
