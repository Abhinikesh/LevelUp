import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, Loader2, GraduationCap, Dumbbell,
  Briefcase, Compass, Wand2, ChevronRight, Calendar,
  Zap, Brain, Target
} from 'lucide-react'
import { aiApi } from '../../api/client'
import toast from 'react-hot-toast'

const GOAL_TYPES = [
  { id: 'study', label: 'Study',   icon: GraduationCap, color: '#6C63FF', glow: 'rgba(108,99,255,0.35)' },
  { id: 'gym',   label: 'Fitness', icon: Dumbbell,      color: '#FF6584', glow: 'rgba(255,101,132,0.35)' },
  { id: 'work',  label: 'Work',    icon: Briefcase,     color: '#FFB800', glow: 'rgba(255,184,0,0.35)' },
  { id: 'custom',label: 'Custom',  icon: Compass,       color: '#43E97B', glow: 'rgba(67,233,123,0.35)' },
]

const EXAMPLE_PROMPTS = [
  'Learn Data Structures and Algorithms in 30 days',
  'Build a full-stack React portfolio project',
  'Get to 10,000 steps daily for 3 weeks',
  'Master SQL and database design fundamentals',
  'Complete a machine learning course end-to-end',
]

export default function AIRoadmapGenerator({ onRoadmapGenerated, onClose, initialGoalText = '', initialGoalType = 'study' }) {
  const [goalText, setGoalText]     = useState(initialGoalText)
  const [goalType, setGoalType]     = useState(initialGoalType)
  const [deadline, setDeadline]     = useState('')
  const [loading, setLoading]       = useState(false)
  const [charCount, setCharCount]   = useState(initialGoalText.length)
  const [promptIdx, setPromptIdx]   = useState(0)
  const textareaRef                 = useRef(null)

  const handleTextChange = (e) => {
    setGoalText(e.target.value)
    setCharCount(e.target.value.length)
  }

  const applyPrompt = (prompt) => {
    setGoalText(prompt)
    setCharCount(prompt.length)
    textareaRef.current?.focus()
  }

  const handleGenerate = async () => {
    if (!goalText.trim() || goalText.trim().length < 10) {
      toast.error('Please describe your goal in at least 10 characters.')
      return
    }
    setLoading(true)
    try {
      const res = await aiApi.generateRoadmap({
        userInput: goalText.trim(),
        deadline:  deadline || null,
        type:      goalType,
      })
      const { roadmap, levels } = res.data
      toast.success(`🎉 Roadmap "${roadmap.title}" created with ${levels.length} levels!`)
      onRoadmapGenerated({ roadmap, levels })
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.message || 'AI generation failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const selectedType = GOAL_TYPES.find(t => t.id === goalType)

  return (
    <div className="ai-generator-overlay">
      <motion.div
        className="ai-generator-modal"
        initial={{ opacity: 0, scale: 0.93, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 30 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      >
        {/* Header */}
        <div className="ai-gen-header">
          <div className="ai-gen-header-icon">
            <Wand2 size={22} />
          </div>
          <div>
            <h2 className="ai-gen-title">AI Roadmap Generator</h2>
            <p className="ai-gen-subtitle">Describe your goal. AI builds your personalized quest map.</p>
          </div>
          <button className="ai-gen-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        {/* Goal Type Selector */}
        <div className="ai-gen-section">
          <label className="ai-gen-label">
            <Target size={14} /> Goal Category
          </label>
          <div className="ai-gen-type-grid">
            {GOAL_TYPES.map(t => (
              <motion.button
                key={t.id}
                className={`ai-gen-type-btn ${goalType === t.id ? 'active' : ''}`}
                style={{
                  '--type-color': t.color,
                  '--type-glow': t.glow,
                  borderColor: goalType === t.id ? t.color : 'transparent',
                  boxShadow: goalType === t.id ? `0 0 18px ${t.glow}` : 'none',
                }}
                onClick={() => setGoalType(t.id)}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
              >
                <t.icon size={18} style={{ color: goalType === t.id ? t.color : '#888' }} />
                <span style={{ color: goalType === t.id ? t.color : '#aaa' }}>{t.label}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Goal Text */}
        <div className="ai-gen-section">
          <label className="ai-gen-label">
            <Brain size={14} /> Describe Your Goal
          </label>
          <div className="ai-gen-textarea-wrap">
            <textarea
              ref={textareaRef}
              className="ai-gen-textarea"
              placeholder="e.g. Learn DSA from scratch and crack FAANG interviews in 6 weeks…"
              value={goalText}
              onChange={handleTextChange}
              maxLength={500}
              rows={4}
            />
            <span className="ai-gen-char-count">{charCount}/500</span>
          </div>

          {/* Example prompts */}
          <div className="ai-gen-prompts">
            <span className="ai-gen-prompts-label">Try:</span>
            {EXAMPLE_PROMPTS.map((p, i) => (
              <button
                key={i}
                className="ai-gen-prompt-chip"
                onClick={() => { applyPrompt(p); setPromptIdx(i) }}
              >
                {p.length > 42 ? p.slice(0, 42) + '…' : p}
              </button>
            ))}
          </div>
        </div>

        {/* Deadline (optional) */}
        <div className="ai-gen-section">
          <label className="ai-gen-label">
            <Calendar size={14} /> Deadline <span className="ai-gen-optional">(optional)</span>
          </label>
          <input
            type="date"
            className="ai-gen-date"
            value={deadline}
            onChange={e => setDeadline(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

        {/* Generate Button */}
        <motion.button
          className="ai-gen-submit"
          style={{
            background: loading
              ? 'rgba(108,99,255,0.4)'
              : `linear-gradient(135deg, ${selectedType.color}, ${selectedType.color}99)`,
            boxShadow: loading ? 'none' : `0 0 30px ${selectedType.glow}`,
          }}
          onClick={handleGenerate}
          disabled={loading || !goalText.trim()}
          whileHover={!loading ? { scale: 1.03, y: -1 } : {}}
          whileTap={!loading ? { scale: 0.97 } : {}}
        >
          {loading ? (
            <>
              <Loader2 size={20} className="spin" />
              <span>AI is building your roadmap…</span>
            </>
          ) : (
            <>
              <Sparkles size={20} />
              <span>Generate My Roadmap</span>
              <ChevronRight size={16} />
            </>
          )}
        </motion.button>

        {/* Loading particles */}
        <AnimatePresence>
          {loading && (
            <motion.div
              className="ai-gen-loading-bar"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="ai-gen-loading-fill"
                style={{ background: selectedType.color }}
                initial={{ width: '0%' }}
                animate={{ width: '85%' }}
                transition={{ duration: 8, ease: 'easeInOut' }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom hint */}
        <p className="ai-gen-hint">
          <Zap size={12} /> Powered by GPT-4o · Mock mode active when no API key is set
        </p>
      </motion.div>

      <style>{`
        .ai-generator-overlay {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(0,0,0,0.75);
          backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          padding: 1rem;
        }
        .ai-generator-modal {
          background: #12121A;
          border: 1px solid rgba(108,99,255,0.25);
          border-radius: 20px;
          padding: 2rem;
          width: 100%; max-width: 560px;
          max-height: 90vh; overflow-y: auto;
          position: relative;
          box-shadow: 0 30px 80px rgba(0,0,0,0.6), 0 0 40px rgba(108,99,255,0.1);
        }
        .ai-gen-header {
          display: flex; align-items: flex-start; gap: 1rem; margin-bottom: 1.8rem;
        }
        .ai-gen-header-icon {
          width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;
          background: linear-gradient(135deg, #6C63FF, #9c8dff);
          display: flex; align-items: center; justify-content: center;
          color: white; box-shadow: 0 0 20px rgba(108,99,255,0.4);
        }
        .ai-gen-title { font-size: 1.2rem; font-weight: 700; color: #fff; margin: 0 0 0.2rem; }
        .ai-gen-subtitle { font-size: 0.82rem; color: #777; margin: 0; }
        .ai-gen-close {
          margin-left: auto; background: rgba(255,255,255,0.07);
          border: none; border-radius: 8px; width: 32px; height: 32px;
          color: #aaa; font-size: 1.2rem; cursor: pointer; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.2s, color 0.2s;
        }
        .ai-gen-close:hover { background: rgba(255,255,255,0.14); color: white; }
        .ai-gen-section { margin-bottom: 1.4rem; }
        .ai-gen-label {
          display: flex; align-items: center; gap: 0.4rem;
          font-size: 0.78rem; font-weight: 600; color: #aaa;
          text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 0.7rem;
        }
        .ai-gen-type-grid {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.6rem;
        }
        .ai-gen-type-btn {
          display: flex; flex-direction: column; align-items: center; gap: 0.35rem;
          padding: 0.75rem 0.5rem; border-radius: 12px; cursor: pointer;
          background: rgba(255,255,255,0.04); border: 1px solid;
          transition: all 0.2s; font-size: 0.78rem; font-weight: 600;
        }
        .ai-gen-textarea-wrap { position: relative; }
        .ai-gen-textarea {
          width: 100%; min-height: 110px; resize: vertical;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px; padding: 0.9rem 1rem 2rem;
          color: #f0f0f0; font-size: 0.92rem; line-height: 1.5;
          font-family: inherit; transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
        }
        .ai-gen-textarea:focus {
          outline: none; border-color: rgba(108,99,255,0.5);
          box-shadow: 0 0 0 3px rgba(108,99,255,0.12);
        }
        .ai-gen-char-count {
          position: absolute; bottom: 0.6rem; right: 0.8rem;
          font-size: 0.72rem; color: #555;
        }
        .ai-gen-prompts { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-top: 0.7rem; align-items: center; }
        .ai-gen-prompts-label { font-size: 0.75rem; color: #555; white-space: nowrap; }
        .ai-gen-prompt-chip {
          font-size: 0.72rem; color: #888; background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08); border-radius: 20px;
          padding: 0.3rem 0.7rem; cursor: pointer; transition: all 0.18s;
          white-space: nowrap; text-align: left;
        }
        .ai-gen-prompt-chip:hover { color: #6C63FF; border-color: rgba(108,99,255,0.4); background: rgba(108,99,255,0.08); }
        .ai-gen-date {
          width: 100%; padding: 0.7rem 1rem;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px; color: #f0f0f0; font-size: 0.9rem;
          font-family: inherit; cursor: pointer; transition: border-color 0.2s;
          box-sizing: border-box;
        }
        .ai-gen-date:focus { outline: none; border-color: rgba(108,99,255,0.5); }
        .ai-gen-optional { font-size: 0.7rem; color: #555; text-transform: none; letter-spacing: 0; font-weight: 400; }
        .ai-gen-submit {
          width: 100%; padding: 0.95rem; border-radius: 14px; border: none;
          color: white; font-size: 1rem; font-weight: 700; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 0.6rem;
          transition: opacity 0.2s; margin-bottom: 1rem;
          font-family: inherit;
        }
        .ai-gen-submit:disabled { opacity: 0.6; cursor: not-allowed; }
        .ai-gen-loading-bar {
          height: 3px; background: rgba(255,255,255,0.07); border-radius: 99px;
          overflow: hidden; margin-bottom: 0.8rem;
        }
        .ai-gen-loading-fill { height: 100%; border-radius: 99px; }
        .ai-gen-hint {
          display: flex; align-items: center; gap: 0.3rem;
          font-size: 0.72rem; color: #444; text-align: center; justify-content: center;
          margin: 0;
        }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media (max-width: 480px) {
          .ai-gen-type-grid { grid-template-columns: repeat(2, 1fr); }
          .ai-generator-modal { padding: 1.4rem; }
        }
      `}</style>
    </div>
  )
}
