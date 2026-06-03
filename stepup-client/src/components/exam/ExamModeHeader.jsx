import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, AlertTriangle, CheckCircle, Zap, Shield, Flame, Activity } from 'lucide-react'
import { roadmapApi } from '../../api/client'
import axios from 'axios'
import useAuthStore from '../../store/authStore'

export default function ExamModeHeader({ roadmapId, refreshTrigger }) {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const token = useAuthStore(s => s.token)

  useEffect(() => {
    if (!roadmapId) return;

    let active = true;
    async function loadStatus() {
      try {
        setLoading(true);
        // Direct axios config or roadmapApi helper
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const { data } = await axios.get(`${API_BASE_URL}/roadmaps/${roadmapId}/exam-status`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (active && data.success) {
          setStatus(data.examStatus);
        }
      } catch (err) {
        console.error('Failed to load exam status:', err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadStatus();
    return () => { active = false; };
  }, [roadmapId, refreshTrigger, token]);

  if (!status) return null;

  // Colors based on urgency
  const getUrgencyColors = (level) => {
    switch (level) {
      case 'critical': return { bg: 'rgba(255,101,132,0.1)', border: 'rgba(255,101,132,0.3)', text: '#FF6584', badge: 'bg-[#FF6584] text-[#0A0A0F]' };
      case 'urgent':   return { bg: 'rgba(255,184,0,0.1)', border: 'rgba(255,184,0,0.3)', text: '#FFB800', badge: 'bg-[#FFB800] text-[#0A0A0F]' };
      case 'normal':   return { bg: 'rgba(108,99,255,0.1)', border: 'rgba(108,99,255,0.3)', text: '#6C63FF', badge: 'bg-[#6C63FF] text-[#0A0A0F]' };
      default:         return { bg: 'rgba(67,233,123,0.1)', border: 'rgba(67,233,123,0.3)', text: '#43E97B', badge: 'bg-[#43E97B] text-[#0A0A0F]' };
    }
  };

  const colors = getUrgencyColors(status.urgencyLevel);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-6 mt-4 p-4 rounded-2xl border"
      style={{
        background: 'rgba(18,18,26,0.5)',
        backdropFilter: 'blur(8px)',
        borderColor: colors.border,
      }}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Left Side: Deadline & Urgency */}
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${colors.badge} flex items-center justify-center flex-shrink-0`}>
            {status.urgencyLevel === 'critical' || status.urgencyLevel === 'urgent' ? (
              <AlertTriangle size={20} className="stroke-[2.5]" />
            ) : (
              <Calendar size={20} className="stroke-[2.5]" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${colors.badge}`}>
                {status.urgencyLevel}
              </span>
              <span className="text-[10px] font-bold text-muted">
                Exam on {new Date(status.examDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <h3 className="font-display font-black text-sm text-white">
              {status.totalDays > 0 ? (
                <>
                  <span style={{ color: colors.text }}>{status.totalDays} days</span> until target deadline
                </>
              ) : status.isExamToday ? (
                <span className="text-[#FF6584]">Exam day is today! 🎯</span>
              ) : (
                <span className="text-muted">Deadline has passed</span>
              )}
            </h3>
          </div>
        </div>

        {/* Right Side: Study Tracker */}
        <div className="flex items-center gap-4 flex-wrap">
          
          {/* Target */}
          <div className="flex flex-col border-l border-border/40 pl-4 py-0.5">
            <span className="text-[8px] font-extrabold uppercase tracking-wider text-muted">Daily Target</span>
            <span className="text-sm font-black text-white font-display mt-0.5 flex items-center gap-1">
              {status.dailyTarget} {status.dailyTarget === 1 ? 'level' : 'levels'}
            </span>
          </div>

          {/* Progress Today */}
          <div className="flex flex-col border-l border-border/40 pl-4 py-0.5">
            <span className="text-[8px] font-extrabold uppercase tracking-wider text-muted">Cleared Today</span>
            <span className={`text-sm font-black font-display mt-0.5 flex items-center gap-1 ${status.onTrack ? 'text-[#43E97B]' : 'text-[#FFB800]'}`}>
              {status.levelsCompletedToday} / {status.dailyTarget}
              {status.onTrack && <CheckCircle size={11} className="inline ml-0.5" />}
            </span>
          </div>

          {/* Intensity */}
          <div className="flex flex-col border-l border-border/40 pl-4 py-0.5">
            <span className="text-[8px] font-extrabold uppercase tracking-wider text-muted">Study Pace</span>
            <span className="text-sm font-black text-white font-display mt-0.5 flex items-center gap-1.5">
              <Activity size={12} className="text-brand" /> {status.intensity} ({status.dailyHours}h/d)
            </span>
          </div>

        </div>

      </div>
    </motion.div>
  )
}
