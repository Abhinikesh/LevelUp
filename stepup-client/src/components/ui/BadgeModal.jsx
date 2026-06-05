import { motion, AnimatePresence } from 'framer-motion'
import { Award, X, Sparkles, Share2, Compass, Zap, Check } from 'lucide-react'
import confetti from 'canvas-confetti'
import { useEffect } from 'react'

export default function BadgeModal({ badge, onClose }) {
  useEffect(() => {
    if (badge) {
      // Fire confetti burst
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.4 },
        colors: ['#6C63FF', '#FF6584', '#FFB800', '#43E97B']
      });
    }
  }, [badge]);

  if (!badge) return null;

  // Render different styling/emoji based on badgeType
  const getBadgeMeta = (type) => {
    switch (type) {
      case 'first_roadmap':
        return { emoji: '🗺️', color: '#6C63FF', desc: 'Unlocked by launching your first campaign pathway!' };
      case 'three_streak':
        return { emoji: '🔥', color: '#FFB800', desc: 'Earned by logging study progress 3 days in a row!' };
      case 'five_levels':
        return { emoji: '🎓', color: '#43E97B', desc: 'Unlocked by clearing 5 separate curriculum modules!' };
      case 'exam_warrior':
        return { emoji: '⚔️', color: '#FF6584', desc: 'Unlocked by scheduling an exam study timeline!' };
      default:
        return { emoji: '🏆', color: '#FFB800', desc: 'Congratulations on earning this special achievement!' };
    }
  };

  const meta = getBadgeMeta(badge.badgeType);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `I unlocked the ${badge.badgeName} Badge!`,
        text: `Check out my learning progress on STEPUP app. I just earned the ${badge.badgeName} Badge!`,
        url: window.location.origin
      }).catch(err => console.log(err));
    } else {
      navigator.clipboard.writeText(`I just unlocked the ${badge.badgeName} Badge on STEPUP! 🏆`);
      toast.success('Share text copied to clipboard! 📋', { id: 'badge-share' });
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/75 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          className="relative z-10 w-full max-w-sm p-6 rounded-3xl border text-center flex flex-col items-center gap-5 overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, #12121E 0%, #08080C 100%)',
            borderColor: `${meta.color}40`,
            boxShadow: `0 20px 50px ${meta.color}15`,
          }}
        >
          {/* Ambient Glow */}
          <div
            className="absolute top-[-50px] w-48 h-48 rounded-full blur-[80px] opacity-25"
            style={{ background: meta.color }}
          />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-muted hover:text-white hover:bg-white/5 transition-all"
          >
            <X size={16} />
          </button>

          {/* Small Title */}
          <div className="flex items-center gap-1.5 text-xs font-black text-muted uppercase tracking-widest mt-2">
            <Sparkles size={11} className="text-gold animate-spin" style={{ animationDuration: '6s' }} />
            Achievement Unlocked
            <Sparkles size={11} className="text-gold animate-spin" style={{ animationDuration: '6s' }} />
          </div>

          {/* Badge Visual */}
          <div className="relative my-2">
            {/* Spinning background rings */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-[-18px] rounded-full border border-dashed"
              style={{ borderColor: `${meta.color}33` }}
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-[-8px] rounded-full border border-dotted"
              style={{ borderColor: `${meta.color}44` }}
            />
            
            {/* Badge container */}
            <motion.div
              animate={{ y: [-4, 4, -4] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              className="w-24 h-24 rounded-full flex items-center justify-center text-4xl shadow-xl relative z-10 border-2"
              style={{
                background: `radial-gradient(circle, ${meta.color}25 0%, #151522 80%)`,
                borderColor: `${meta.color}77`,
                boxShadow: `0 10px 24px ${meta.color}25`,
              }}
            >
              {meta.emoji}
            </motion.div>
          </div>

          {/* Title and details */}
          <div className="space-y-1">
            <h3 className="font-display font-black text-lg text-white">
              {badge.badgeName}
            </h3>
            <p className="text-[11px] text-muted-foreground max-w-xs leading-relaxed">
              {meta.desc}
            </p>
          </div>

          {/* Action Button */}
          <div className="flex gap-3 w-full pt-2">
            <button
              onClick={handleShare}
              className="px-3.5 py-3 rounded-xl border border-border bg-card text-muted hover:text-white transition-all flex items-center justify-center gap-1.5"
              title="Share Achievement"
            >
              <Share2 size={13} />
            </button>
            <button
              onClick={onClose}
              className="btn btn-primary py-3 rounded-xl text-xs flex-1 font-bold flex items-center justify-center gap-1"
            >
              <Check size={13} /> Claim & Continue
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  )
}
