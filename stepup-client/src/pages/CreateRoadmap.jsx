import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import confetti from 'canvas-confetti'
import {
  GraduationCap, Dumbbell, Briefcase, Sparkles, Check,
  ChevronRight, ChevronLeft, Plus, Trash2, GripVertical,
  Camera, Upload, FileText, PenLine, RefreshCw, Rocket,
  Clock, Zap, Calendar
} from 'lucide-react'
import { roadmapApi } from '../api/client'
import toast from 'react-hot-toast'
import AIRoadmapGenerator from '../components/ai/AIRoadmapGenerator'
import OCRScanner from '../components/ai/OCRScanner'
import RoadmapPreview from '../components/ai/RoadmapPreview'

/* ── Step config ── */
const STEPS = ['Goal Type', 'Details', 'Levels', 'Review']

const GOAL_TYPES = [
  { id: 'study', label: 'Study / Exam',    desc: 'DSA, DBMS, any subject',     icon: GraduationCap, color: '#6C63FF', from: '#6C63FF', to: '#9c8dff' },
  { id: 'gym',   label: 'Gym & Fitness',   desc: 'Workouts, training plans',   icon: Dumbbell,      color: '#FF6584', from: '#FF6584', to: '#ff8fa3' },
  { id: 'work',  label: 'Work & Projects', desc: 'Startup, coding, career',    icon: Briefcase,     color: '#FFB800', from: '#FFB800', to: '#FFD93D' },
  { id: 'custom',label: 'Custom Goal',     desc: 'Anything you want',          icon: Sparkles,      color: '#43E97B', from: '#43E97B', to: '#38f9d7' },
]

const PROOF_TYPES = ['quiz', 'code', 'timer', 'photo', 'screenshot', 'text']

/* ── AI level generator (mock — replace with real AI endpoint) ── */
const generateLevels = (goalText, goalType) => {
  const templates = {
    study: [
      { title: 'Foundations & Core Concepts',  proofType: 'quiz',       estimatedMinutes: 30, xpReward: 100 },
      { title: 'Deep Dive — Theory & Examples',proofType: 'text',       estimatedMinutes: 45, xpReward: 150 },
      { title: 'Hands-On Practice',            proofType: 'code',       estimatedMinutes: 60, xpReward: 200 },
      { title: 'Mock Test & Review',           proofType: 'quiz',       estimatedMinutes: 40, xpReward: 175 },
      { title: 'Final Project / Exam',         proofType: 'code',       estimatedMinutes: 90, xpReward: 300 },
    ],
    gym: [
      { title: 'Dynamic Warm-Up',             proofType: 'timer',      estimatedMinutes: 10, xpReward: 75  },
      { title: 'Compound Strength Session',   proofType: 'photo',      estimatedMinutes: 50, xpReward: 150 },
      { title: 'Cardio Conditioning',         proofType: 'timer',      estimatedMinutes: 30, xpReward: 125 },
      { title: 'Flexibility & Mobility',      proofType: 'timer',      estimatedMinutes: 20, xpReward: 100 },
      { title: 'Recovery & Stretching',       proofType: 'screenshot', estimatedMinutes: 15, xpReward: 75  },
    ],
    work: [
      { title: 'Define Goals & Plan',         proofType: 'text',       estimatedMinutes: 20, xpReward: 100 },
      { title: 'Research & Prototyping',      proofType: 'code',       estimatedMinutes: 90, xpReward: 200 },
      { title: 'Core Implementation',         proofType: 'code',       estimatedMinutes: 120,xpReward: 300 },
      { title: 'Testing & QA',                proofType: 'screenshot', estimatedMinutes: 60, xpReward: 175 },
      { title: 'Deploy & Document',           proofType: 'text',       estimatedMinutes: 45, xpReward: 225 },
    ],
    custom: [
      { title: 'Kickoff & Commitment',        proofType: 'text',       estimatedMinutes: 15, xpReward: 100 },
      { title: 'First Milestone',             proofType: 'photo',      estimatedMinutes: 60, xpReward: 150 },
      { title: 'Mid-Way Check-In',            proofType: 'quiz',       estimatedMinutes: 30, xpReward: 175 },
      { title: 'Deep Work Session',           proofType: 'timer',      estimatedMinutes: 90, xpReward: 200 },
      { title: 'Final Showcase',              proofType: 'photo',      estimatedMinutes: 45, xpReward: 250 },
    ],
  }
  return (templates[goalType] || templates.custom).map((l, i) => ({
    ...l, id: `gen-${Date.now()}-${i}`, levelNumber: i + 1,
    description: `Complete this level as part of: "${goalText.slice(0, 60)}${goalText.length > 60 ? '…' : ''}"`,
    quizQuestions: l.proofType === 'quiz' ? [{
      question: 'Did you fully understand and complete this stage?',
      options: ['Yes, completely', 'Mostly, with some gaps', 'Need more practice'],
      correctIndex: 0,
      explanation: 'Full understanding is required to progress.',
    }] : [],
  }))
}

export default function CreateRoadmap() {
  const navigate = useNavigate()
  const [step, setStep]         = useState(0)
  const [goalType, setGoalType] = useState('')
  const [inputTab, setInputTab] = useState(0)
  const [goalText, setGoalText] = useState('')
  const [deadline, setDeadline] = useState('')
  const [levels, setLevels]     = useState([])
  const [generating, setGenerating] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uploadedImg, setUploadedImg] = useState(null)
  const fileRef = useRef(null)

  const [showAiGen, setShowAiGen] = useState(false)
  const [showOcrScanner, setShowOcrScanner] = useState(false)
  const [tempRoadmap, setTempRoadmap] = useState(null)

  const selectedType = GOAL_TYPES.find(t => t.id === goalType)

  /* ── Navigation ── */
  const canAdvance = [
    goalType !== '',
    goalText.trim().length > 10 || uploadedImg || levels.length > 0,
    levels.length > 0,
    true,
  ][step]

  const goNext = () => {
    if (step === 1 && levels.length === 0) {
      handleGenerate()
      return
    }
    setStep(s => Math.min(s + 1, 3))
  }
  const goPrev = () => setStep(s => Math.max(s - 1, 0))

  /* ── AI Generate ── */
  const handleGenerate = useCallback(() => {
    if (inputTab === 0) {
      if (!goalText.trim() || goalText.trim().length < 10) {
        toast.error('Please describe your goal in at least 10 characters.')
        return
      }
      setShowAiGen(true)
    } else if (inputTab === 1 || inputTab === 2) {
      setShowOcrScanner(true)
    } else {
      // Manual tab
      setStep(2)
    }
  }, [goalText, inputTab])

  const handleRoadmapGenerated = useCallback(({ roadmap, levels }) => {
    setTempRoadmap(roadmap)
    setLevels(levels.map((l, i) => ({
      ...l,
      id: l._id || `gen-${Date.now()}-${i}`,
    })))
    setGoalText(roadmap.title)
    setGoalType(roadmap.type)
    if (roadmap.deadline) {
      setDeadline(new Date(roadmap.deadline).toISOString().split('T')[0])
    }
    setShowAiGen(false)
    setShowOcrScanner(false)
    setStep(2)
    toast.success('AI Quest Map generated successfully! Review the levels.')
  }, [])

  /* ── Level CRUD ── */
  const addLevel = () => setLevels(prev => [...prev, {
    id: `manual-${Date.now()}`,
    levelNumber: prev.length + 1,
    title: `Level ${prev.length + 1}`,
    description: '',
    proofType: 'text',
    estimatedMinutes: 30,
    xpReward: 100,
    quizQuestions: [],
  }])

  const updateLevel = (id, field, value) =>
    setLevels(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l))

  const removeLevel = (id) =>
    setLevels(prev => prev.filter(l => l.id !== id).map((l, i) => ({ ...l, levelNumber: i + 1 })))

  const moveLevel = (id, dir) => {
    setLevels(prev => {
      const idx = prev.findIndex(l => l.id === id)
      const newList = [...prev]
      const swapIdx = idx + dir
      if (swapIdx < 0 || swapIdx >= newList.length) return prev
      ;[newList[idx], newList[swapIdx]] = [newList[swapIdx], newList[idx]]
      return newList.map((l, i) => ({ ...l, levelNumber: i + 1 }))
    })
  }

  /* ── Upload ── */
  const handleUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setUploadedImg(ev.target.result)
    reader.readAsDataURL(file)
  }

  /* ── Submit ── */
  const handleLaunch = async () => {
    setSubmitting(true)
    try {
      const payload = {
        title: goalText.slice(0, 80) || selectedType?.label || 'My Roadmap',
        type: goalType || 'custom',
        deadline: deadline || null,
        levels: levels.map(l => ({
          title:             l.title,
          description:       l.description,
          proofType:         l.proofType,
          estimatedMinutes:  l.estimatedMinutes,
          xpReward:          l.xpReward,
          quizQuestions:     l.quizQuestions,
        })),
      }

      if (tempRoadmap?._id) {
        try {
          await roadmapApi.remove(tempRoadmap._id)
        } catch (e) {
          console.warn('Failed to cleanup temp roadmap:', e)
        }
      }

      const { data } = await roadmapApi.create(payload)
      confetti({ particleCount: 200, spread: 100, origin: { y: 0.5 }, colors: ['#6C63FF','#FF6584','#43E97B','#FFB800'] })
      toast.success('🚀 Roadmap launched! Let\'s go!')
      setTimeout(() => navigate(`/map/${data.roadmap._id}`), 1000)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create roadmap')
    } finally {
      setSubmitting(false)
    }
  }

  const totalTime = levels.reduce((s, l) => s + (l.estimatedMinutes || 0), 0)
  const totalXP   = levels.reduce((s, l) => s + (l.xpReward || 0), 0)

  return (
    <div className="min-h-screen py-8 px-4 sm:px-8" style={{ background: '#0A0A0F' }}>
      {/* Ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] pointer-events-none opacity-10"
        style={{ background: 'radial-gradient(ellipse, #6C63FF 0%, transparent 70%)', filter: 'blur(80px)' }} />

      <div className="max-w-2xl mx-auto relative z-10">
        {/* ── Header ── */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <span className="badge badge-brand mb-4 inline-flex">New Campaign</span>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-white">Create Your Roadmap</h1>
          <p className="text-muted mt-2 text-sm">Follow the wizard to build a personalized level-up journey</p>
        </motion.div>

        {/* ── Step Progress Bar ── */}
        <div className="flex items-center justify-center mb-10 px-4">
          {STEPS.map((label, i) => {
            const done    = i < step
            const active  = i === step
            const future  = i > step
            const typeColor = selectedType?.color || '#6C63FF'
            return (
              <div key={i} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1.5">
                  <motion.div
                    animate={{
                      background: done    ? '#43E97B'  : active ? typeColor : '#1E1E2E',
                      boxShadow:  active  ? `0 0 20px ${typeColor}88` : 'none',
                      scale:      active  ? 1.15 : 1,
                    }}
                    transition={{ duration: 0.3 }}
                    className="w-9 h-9 rounded-full flex items-center justify-center font-black text-sm transition-all"
                    style={{ color: done || active ? '#0A0A0F' : '#8B8BAE', border: future ? '2px solid #1E1E2E' : 'none' }}
                  >
                    {done ? <Check size={16} strokeWidth={3} /> : i + 1}
                  </motion.div>
                  <span className="text-[9px] font-bold uppercase tracking-wider"
                    style={{ color: active ? typeColor : done ? '#43E97B' : '#8B8BAE' }}>
                    {label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-0.5 mx-2 mb-4 rounded-full overflow-hidden" style={{ background: '#1E1E2E' }}>
                    <motion.div className="h-full rounded-full"
                      animate={{ width: i < step ? '100%' : '0%' }}
                      transition={{ duration: 0.4 }}
                      style={{ background: '#43E97B' }}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* ── Step Content ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
          >
            {/* ══ STEP 0: Goal Type ══ */}
            {step === 0 && (
              <div className="grid grid-cols-2 gap-4">
                {GOAL_TYPES.map(type => {
                  const Icon = type.icon
                  const selected = goalType === type.id
                  return (
                    <motion.button
                      key={type.id}
                      id={`goal-type-${type.id}`}
                      onClick={() => setGoalType(type.id)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      className="relative flex flex-col items-center justify-center gap-4 p-6 rounded-3xl border-2 transition-all duration-300 text-center"
                      style={{
                        background:   selected ? `${type.from}15` : '#12121A',
                        borderColor:  selected ? type.from : '#1E1E2E',
                        boxShadow:    selected ? `0 0 30px ${type.from}30` : 'none',
                        minHeight: 160,
                      }}
                    >
                      {selected && (
                        <motion.div
                          initial={{ scale: 0 }} animate={{ scale: 1 }}
                          className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center"
                          style={{ background: type.from }}
                        >
                          <Check size={12} className="text-[#0A0A0F]" strokeWidth={3} />
                        </motion.div>
                      )}
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                        style={{ background: selected ? `linear-gradient(135deg, ${type.from}, ${type.to})` : '#1E1E2E',
                                 boxShadow: selected ? `0 0 20px ${type.from}60` : 'none' }}>
                        <Icon size={28} style={{ color: selected ? '#0A0A0F' : type.color }} />
                      </div>
                      <div>
                        <p className="font-display font-black text-base text-white">{type.label}</p>
                        <p className="text-xs text-muted mt-0.5">{type.desc}</p>
                      </div>
                    </motion.button>
                  )
                })}
              </div>
            )}

            {/* ══ STEP 1: Details ══ */}
            {step === 1 && (
              <div className="glass-card p-6 border border-border">
                {/* Input method tabs */}
                <div className="flex gap-1 p-1 rounded-2xl mb-6" style={{ background: '#0D0D18' }}>
                  {['Type Goal', 'Handwritten', 'Syllabus', 'Manual'].map((tab, i) => (
                    <button key={i} onClick={() => setInputTab(i)}
                      className="flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-200"
                      style={{
                        background: inputTab === i ? (selectedType?.color || '#6C63FF') : 'transparent',
                        color:      inputTab === i ? '#0A0A0F' : '#8B8BAE',
                      }}>
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Tab 0: Type */}
                {inputTab === 0 && (
                  <div className="space-y-4">
                    <div className="relative">
                      <textarea
                        id="goal-text-input"
                        value={goalText}
                        onChange={e => setGoalText(e.target.value)}
                        placeholder="e.g. Learn DSA completely. I know basics of C++. I have 30 days."
                        rows={5}
                        maxLength={500}
                        className="input w-full resize-none text-sm"
                      />
                      <span className="absolute bottom-3 right-3 text-[10px] text-muted">
                        {goalText.length}/500
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar size={14} className="text-muted flex-shrink-0" />
                      <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
                        className="input flex-1 text-sm" style={{ height: 40 }} />
                    </div>
                    <motion.button
                      id="btn-generate-ai"
                      onClick={handleGenerate}
                      disabled={generating || goalText.trim().length < 10}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      className="w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all"
                      style={{
                        background:  'linear-gradient(135deg, #6C63FF, #FF6584)',
                        boxShadow:   '0 0 30px rgba(108,99,255,0.4)',
                        color: '#fff',
                        opacity: (generating || goalText.trim().length < 10) ? 0.6 : 1,
                      }}
                    >
                      {generating ? (
                        <><RefreshCw size={16} className="animate-spin" /> AI is thinking…</>
                      ) : (
                        <><Sparkles size={16} /> Generate Roadmap with AI</>
                      )}
                    </motion.button>
                  </div>
                )}

                {/* Tab 1 & 2: Upload */}
                {(inputTab === 1 || inputTab === 2) && (
                  <div className="space-y-4">
                    <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleUpload} />
                    {uploadedImg ? (
                      <div className="relative">
                        <img src={uploadedImg} alt="Uploaded" className="w-full rounded-2xl object-cover max-h-48" />
                        <button onClick={() => setUploadedImg(null)}
                          className="absolute top-2 right-2 w-7 h-7 bg-bg/80 rounded-full flex items-center justify-center text-coral">
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => fileRef.current?.click()}
                        className="w-full h-44 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all hover:border-brand/50"
                        style={{ borderColor: '#1E1E2E', background: '#0D0D18' }}>
                        <Camera size={36} className="text-muted/40" />
                        <p className="text-sm text-muted text-center px-4">
                          {inputTab === 1 ? 'Take a photo or upload image of your notes' : 'Upload your syllabus or textbook photo'}
                        </p>
                        <span className="text-xs text-muted/50">jpg, png, pdf accepted</span>
                      </button>
                    )}
                    <div className="flex gap-3">
                      <button onClick={() => fileRef.current?.click()}
                        className="btn btn-ghost flex-1 py-2.5 text-xs flex items-center gap-1.5">
                        <Upload size={13} /> Upload File
                      </button>
                      <button onClick={handleGenerate} disabled={generating}
                        className="btn btn-primary flex-1 py-2.5 text-xs flex items-center gap-1.5">
                        {generating ? <RefreshCw size={13} className="animate-spin" /> : <Sparkles size={13} />}
                        Extract & Generate
                      </button>
                    </div>
                  </div>
                )}

                {/* Tab 3: Manual */}
                {inputTab === 3 && (
                  <div className="space-y-3">
                    <p className="text-xs text-muted">Add levels manually. You can reorder them by using the arrows.</p>
                    {levels.map((lvl, i) => (
                      <div key={lvl.id} className="flex items-center gap-2 p-3 rounded-2xl border"
                        style={{ background: '#0D0D18', borderColor: '#1E1E2E' }}>
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs flex-shrink-0"
                          style={{ background: '#6C63FF', color: '#fff' }}>{i + 1}</div>
                        <input value={lvl.title} onChange={e => updateLevel(lvl.id, 'title', e.target.value)}
                          className="flex-1 bg-transparent text-sm text-white font-semibold outline-none min-w-0" />
                        <select value={lvl.proofType} onChange={e => updateLevel(lvl.id, 'proofType', e.target.value)}
                          className="text-xs text-muted bg-transparent border border-border rounded-lg px-1.5 py-1 outline-none">
                          {PROOF_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                        <div className="flex flex-col gap-0.5">
                          <button onClick={() => moveLevel(lvl.id, -1)} disabled={i === 0}
                            className="text-muted hover:text-white disabled:opacity-30 text-xs leading-none">▲</button>
                          <button onClick={() => moveLevel(lvl.id, 1)} disabled={i === levels.length - 1}
                            className="text-muted hover:text-white disabled:opacity-30 text-xs leading-none">▼</button>
                        </div>
                        <button onClick={() => removeLevel(lvl.id)} className="text-muted hover:text-coral">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                    <button onClick={addLevel}
                      className="w-full py-2.5 rounded-2xl border-2 border-dashed text-xs font-bold text-brand flex items-center justify-center gap-1.5 hover:border-brand/50 transition-colors"
                      style={{ borderColor: '#1E1E2E', background: '#0D0D18' }}>
                      <Plus size={14} /> Add Level
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ══ STEP 2: Review Levels ══ */}
            {step === 2 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-display font-black text-base text-white">{levels.length} Levels Generated</h3>
                  <button onClick={handleGenerate} disabled={generating}
                    className="text-xs text-muted hover:text-brand flex items-center gap-1 transition-colors">
                    <RefreshCw size={11} className={generating ? 'animate-spin' : ''} /> Regenerate
                  </button>
                </div>

                {levels.map((lvl, i) => (
                  <motion.div key={lvl.id}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="flex items-start gap-3 p-4 rounded-2xl border group hover:border-brand/30 transition-all"
                    style={{ background: '#12121A', borderColor: '#1E1E2E' }}
                  >
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #6C63FF, #9c8dff)', color: '#fff' }}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <input
                        value={lvl.title}
                        onChange={e => updateLevel(lvl.id, 'title', e.target.value)}
                        className="w-full bg-transparent text-sm font-bold text-white outline-none border-b border-transparent focus:border-brand/40 pb-0.5 transition-colors"
                      />
                      <div className="flex items-center gap-3 flex-wrap">
                        <select value={lvl.proofType} onChange={e => updateLevel(lvl.id, 'proofType', e.target.value)}
                          className="text-[10px] text-muted bg-card border border-border rounded-lg px-2 py-1 outline-none">
                          {PROOF_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                        <div className="flex items-center gap-1">
                          <Clock size={10} className="text-muted" />
                          <input type="number" value={lvl.estimatedMinutes}
                            onChange={e => updateLevel(lvl.id, 'estimatedMinutes', +e.target.value)}
                            className="w-12 text-[10px] bg-card border border-border rounded-lg px-1.5 py-1 text-muted outline-none text-center" />
                          <span className="text-[10px] text-muted">min</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Zap size={10} className="text-gold" />
                          <input type="number" value={lvl.xpReward}
                            onChange={e => updateLevel(lvl.id, 'xpReward', +e.target.value)}
                            className="w-14 text-[10px] bg-card border border-border rounded-lg px-1.5 py-1 text-gold outline-none text-center" />
                          <span className="text-[10px] text-muted">XP</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => moveLevel(lvl.id, -1)} disabled={i === 0}
                        className="text-muted hover:text-white disabled:opacity-20 text-xs">▲</button>
                      <button onClick={() => moveLevel(lvl.id, 1)} disabled={i === levels.length - 1}
                        className="text-muted hover:text-white disabled:opacity-20 text-xs">▼</button>
                      <button onClick={() => removeLevel(lvl.id)} className="text-muted hover:text-coral mt-1">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </motion.div>
                ))}
                <button onClick={addLevel}
                  className="w-full py-3 rounded-2xl border-2 border-dashed text-xs font-bold text-brand flex items-center justify-center gap-1.5 hover:border-brand/40 transition-colors"
                  style={{ borderColor: '#1E1E2E', background: '#0D0D18' }}>
                  <Plus size={13} /> Add Level
                </button>
              </div>
            )}

            {/* ══ STEP 3: Review & Launch ══ */}
            {step === 3 && (
              <RoadmapPreview
                roadmap={{
                  title: goalText || 'My Roadmap',
                  type: goalType || 'custom',
                  description: 'Confirm and start your new journey',
                  deadline: deadline || null,
                  _id: tempRoadmap?._id
                }}
                levels={levels}
                onConfirm={handleLaunch}
                onClose={() => navigate('/dashboard')}
                onEdit={() => setStep(2)}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* ── Bottom Nav ── */}
        {step < 3 && (
          <div className="flex items-center gap-4 mt-8">
            {step > 0 && (
              <button onClick={goPrev} className="btn btn-ghost flex-1 flex items-center gap-2 py-3">
                <ChevronLeft size={16} /> Back
              </button>
            )}
            <button
              id="btn-wizard-next"
              onClick={goNext}
              disabled={!canAdvance || generating}
              className="btn btn-primary flex-1 flex items-center justify-center gap-2 py-3"
              style={{ opacity: (!canAdvance || generating) ? 0.5 : 1 }}
            >
              {step === 1 && levels.length === 0 ? (
                <><Sparkles size={16} /> Generate with AI</>
              ) : (
                <>Next <ChevronRight size={16} /></>
              )}
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showAiGen && (
          <AIRoadmapGenerator
            initialGoalText={goalText}
            initialGoalType={goalType || 'study'}
            onRoadmapGenerated={handleRoadmapGenerated}
            onClose={() => setShowAiGen(false)}
          />
        )}
        {showOcrScanner && (
          <OCRScanner
            onRoadmapGenerated={handleRoadmapGenerated}
            onClose={() => setShowOcrScanner(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
