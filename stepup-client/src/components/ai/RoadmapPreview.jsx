import { motion, AnimatePresence } from 'framer-motion'
import {
  Map, Zap, Clock, BookOpen, Dumbbell, Briefcase,
  Compass, Trophy, ChevronRight, CheckCircle, ArrowRight,
  Star, Sparkles
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import confetti from 'canvas-confetti'
import { useEffect } from 'react'

const TYPE_CONFIG = {
  study:  { icon: BookOpen,  color: '#6C63FF', from: '#6C63FF', to: '#9c8dff', bg: 'rgba(108,99,255,0.08)' },
  gym:    { icon: Dumbbell,  color: '#FF6584', from: '#FF6584', to: '#ff8fa3', bg: 'rgba(255,101,132,0.08)' },
  work:   { icon: Briefcase, color: '#FFB800', from: '#FFB800', to: '#FFD93D', bg: 'rgba(255,184,0,0.08)' },
  custom: { icon: Compass,   color: '#43E97B', from: '#43E97B', to: '#38f9d7', bg: 'rgba(67,233,123,0.08)' },
}

const PROOF_ICONS = {
  quiz:       '🧠',
  photo:      '📸',
  code:       '💻',
  timer:      '⏱️',
  screenshot: '🖥️',
  text:       '📝',
  voice:      '🎤',
}

export default function RoadmapPreview({ roadmap, levels, onConfirm, onClose, onEdit }) {
  const navigate  = useNavigate()
  const cfg       = TYPE_CONFIG[roadmap?.type] || TYPE_CONFIG.custom
  const TypeIcon  = cfg.icon

  useEffect(() => {
    confetti({ particleCount: 60, spread: 70, origin: { y: 0.5 }, colors: [cfg.color, '#fff', cfg.to] })
  }, [])

  const totalXP  = levels.reduce((s, l) => s + (l.xpReward || 100), 0)
  const totalMins = levels.reduce((s, l) => s + (l.estimatedMinutes || 30), 0)
  const totalHrs = (totalMins / 60).toFixed(1)

  const handleStartNow = async () => {
    if (onConfirm) {
      await onConfirm()
    } else {
      navigate(`/map/${roadmap._id}`)
    }
  }

  return (
    <div className="rp-overlay">
      <motion.div
        className="rp-modal"
        initial={{ opacity: 0, scale: 0.9, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 40 }}
        transition={{ type: 'spring', stiffness: 280, damping: 26 }}
      >
        {/* Hero banner */}
        <div
          className="rp-hero"
          style={{ background: `linear-gradient(135deg, ${cfg.from}22, ${cfg.to}11)`, borderColor: `${cfg.color}33` }}
        >
          <div className="rp-hero-icon" style={{ background: `linear-gradient(135deg, ${cfg.from}, ${cfg.to})`, boxShadow: `0 0 25px ${cfg.color}55` }}>
            <TypeIcon size={28} color={roadmap?.type === 'gym' ? '#fff' : '#0A0A0F'} />
          </div>
          <div className="rp-hero-text">
            <h2 className="rp-title">{roadmap?.title || 'Your Roadmap'}</h2>
            <p className="rp-subtitle">{roadmap?.description?.slice(0, 90)}{roadmap?.description?.length > 90 ? '…' : ''}</p>
          </div>
          <div className="rp-celebration">
            <Sparkles size={18} color={cfg.color} />
            <span style={{ color: cfg.color, fontSize: '0.78rem', fontWeight: 700 }}>AI Generated!</span>
          </div>
        </div>

        {/* Stats row */}
        <div className="rp-stats">
          <div className="rp-stat">
            <Map size={16} color={cfg.color} />
            <span className="rp-stat-val">{levels.length}</span>
            <span className="rp-stat-lbl">Levels</span>
          </div>
          <div className="rp-stat-divider" />
          <div className="rp-stat">
            <Zap size={16} color="#FFB800" />
            <span className="rp-stat-val">{totalXP.toLocaleString()}</span>
            <span className="rp-stat-lbl">Total XP</span>
          </div>
          <div className="rp-stat-divider" />
          <div className="rp-stat">
            <Clock size={16} color="#43E97B" />
            <span className="rp-stat-val">{totalHrs}h</span>
            <span className="rp-stat-lbl">Est. Time</span>
          </div>
          {roadmap?.deadline && (
            <>
              <div className="rp-stat-divider" />
              <div className="rp-stat">
                <Trophy size={16} color="#FF6584" />
                <span className="rp-stat-val">{new Date(roadmap.deadline).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</span>
                <span className="rp-stat-lbl">Deadline</span>
              </div>
            </>
          )}
        </div>

        {/* Level cards */}
        <div className="rp-levels-label">
          <Star size={13} color={cfg.color} /> Quest Map Preview
        </div>
        <div className="rp-levels">
          {levels.map((level, i) => (
            <motion.div
              key={level._id || i}
              className="rp-level"
              style={{ borderColor: i === 0 ? `${cfg.color}55` : 'rgba(255,255,255,0.06)' }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06, duration: 0.35 }}
            >
              <div
                className="rp-level-num"
                style={{
                  background: i === 0
                    ? `linear-gradient(135deg, ${cfg.from}, ${cfg.to})`
                    : 'rgba(255,255,255,0.08)',
                  color: i === 0 ? (roadmap?.type === 'gym' ? '#fff' : '#0A0A0F') : '#666',
                }}
              >
                {i === 0 ? <CheckCircle size={14} /> : i + 1}
              </div>
              <div className="rp-level-info">
                <div className="rp-level-title">{level.title}</div>
                {level.topics?.length > 0 && (
                  <div className="rp-level-topics">
                    {level.topics.slice(0, 3).map((t, ti) => (
                      <span key={ti} className="rp-topic-chip">{t}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="rp-level-right">
                <span className="rp-proof-badge">{PROOF_ICONS[level.proofType] || '📝'} {level.proofType}</span>
                <span className="rp-xp-badge" style={{ color: '#FFB800' }}>+{level.xpReward} XP</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Actions */}
        <div className="rp-actions">
          {onEdit && (
            <button className="rp-btn-secondary" onClick={onEdit}>
              Edit Levels
            </button>
          )}
          <motion.button
            className="rp-btn-primary"
            style={{ background: `linear-gradient(135deg, ${cfg.from}, ${cfg.to})`, boxShadow: `0 0 25px ${cfg.color}44` }}
            onClick={handleStartNow}
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
          >
            Start Quest <ArrowRight size={16} />
          </motion.button>
        </div>

        <button className="rp-dismiss" onClick={onClose}>
          I&apos;ll start later
        </button>
      </motion.div>

      <style>{`
        .rp-overlay {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(0,0,0,0.8); backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center; padding: 1rem;
        }
        .rp-modal {
          background: #12121A; border: 1px solid rgba(255,255,255,0.08);
          border-radius: 22px; padding: 2rem; width: 100%; max-width: 560px;
          max-height: 90vh; overflow-y: auto;
          box-shadow: 0 30px 80px rgba(0,0,0,0.6);
        }
        .rp-hero {
          border: 1px solid; border-radius: 16px; padding: 1.4rem; margin-bottom: 1.4rem;
          display: flex; flex-direction: column; gap: 0.7rem;
        }
        .rp-hero-icon {
          width: 56px; height: 56px; border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
        }
        .rp-title { font-size: 1.18rem; font-weight: 800; color: #fff; margin: 0 0 0.25rem; }
        .rp-subtitle { font-size: 0.82rem; color: #888; margin: 0; }
        .rp-celebration { display: flex; align-items: center; gap: 0.4rem; }
        .rp-stats {
          display: flex; gap: 0; background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07); border-radius: 14px;
          padding: 1rem; margin-bottom: 1.4rem; justify-content: space-around;
        }
        .rp-stat { display: flex; flex-direction: column; align-items: center; gap: 0.3rem; }
        .rp-stat-val { font-size: 1.1rem; font-weight: 800; color: #fff; }
        .rp-stat-lbl { font-size: 0.7rem; color: #666; text-transform: uppercase; letter-spacing: 0.04em; }
        .rp-stat-divider { width: 1px; background: rgba(255,255,255,0.07); margin: 0 0.5rem; }
        .rp-levels-label {
          display: flex; align-items: center; gap: 0.4rem;
          font-size: 0.75rem; font-weight: 700; color: #666;
          text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 0.8rem;
        }
        .rp-levels { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.6rem; max-height: 260px; overflow-y: auto; }
        .rp-level {
          display: flex; align-items: center; gap: 0.8rem;
          padding: 0.75rem 0.9rem; border: 1px solid; border-radius: 12px;
          background: rgba(255,255,255,0.025);
        }
        .rp-level-num {
          width: 28px; height: 28px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.75rem; font-weight: 700; flex-shrink: 0;
        }
        .rp-level-info { flex: 1; min-width: 0; }
        .rp-level-title { font-size: 0.88rem; font-weight: 600; color: #ddd; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .rp-level-topics { display: flex; gap: 0.3rem; flex-wrap: wrap; margin-top: 0.3rem; }
        .rp-topic-chip {
          font-size: 0.65rem; color: #666; background: rgba(255,255,255,0.05);
          border-radius: 4px; padding: 0.1rem 0.4rem;
        }
        .rp-level-right { display: flex; flex-direction: column; align-items: flex-end; gap: 0.2rem; flex-shrink: 0; }
        .rp-proof-badge { font-size: 0.68rem; color: #666; white-space: nowrap; }
        .rp-xp-badge { font-size: 0.72rem; font-weight: 700; }
        .rp-actions { display: flex; gap: 0.8rem; }
        .rp-btn-secondary {
          flex: 1; padding: 0.85rem; border-radius: 12px; cursor: pointer;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12);
          color: #bbb; font-size: 0.9rem; font-weight: 600; font-family: inherit;
          transition: all 0.18s;
        }
        .rp-btn-secondary:hover { background: rgba(255,255,255,0.09); color: white; }
        .rp-btn-primary {
          flex: 2; padding: 0.9rem; border-radius: 12px; cursor: pointer;
          border: none; color: #0A0A0F; font-size: 0.95rem; font-weight: 800;
          display: flex; align-items: center; justify-content: center; gap: 0.5rem;
          font-family: inherit;
        }
        .rp-dismiss {
          width: 100%; padding: 0.6rem; margin-top: 0.6rem; background: none;
          border: none; color: #444; font-size: 0.8rem; cursor: pointer;
          transition: color 0.2s;
        }
        .rp-dismiss:hover { color: #777; }
      `}</style>
    </div>
  )
}
