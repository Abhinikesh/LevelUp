import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, HelpCircle, ChevronRight, X, ArrowLeft } from 'lucide-react'

export default function OnboardingTour() {
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    const isCompleted = localStorage.getItem('stepup-tour-completed');
    if (!isCompleted) {
      const timer = setTimeout(() => setIsOpen(true), 4000);
      return () => clearTimeout(timer);
    }
  }, []);

  const steps = [
    {
      title: 'Welcome to STEPUP! 🚀',
      desc: 'Let us take a quick 1-minute tour of your gamified learning dashboard.',
      target: null // Centered overlay
    },
    {
      title: 'Campaign Quest Map 🗺️',
      desc: 'Click on Game Map in the sidebar to view your learning timeline. Solve nodes sequentially to clear levels.',
      target: '#sidebar-nav-game-map'
    },
    {
      title: 'Daily Streak Tracker 🔥',
      desc: 'Log in and clear levels daily to build your streak. Keep it alive or receive ARIA warning notifications!',
      target: '#sidebar-toggle' // near the streak area on bottom
    },
    {
      title: 'Global Search (Cmd+K) 🔍',
      desc: 'Press Command/Ctrl + K anywhere to trigger the search palette. Search campaigns or navigate instantly.',
      target: null
    }
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(s => s + 1);
    } else {
      localStorage.setItem('stepup-tour-completed', 'true');
      setIsOpen(false);
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setStep(s => s - 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('stepup-tour-completed', 'true');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  const currentStep = steps[step];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1500] flex items-center justify-center pointer-events-none">
        {/* Backdrop for center step */}
        {!currentStep.target && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto" />
        )}

        {/* Tour Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 15 }}
          className="relative z-10 w-full max-w-sm p-5 rounded-2xl border pointer-events-auto mx-4"
          style={{
            background: 'linear-gradient(180deg, #12121E 0%, #0A0A0F 100%)',
            borderColor: 'rgba(108,99,255,0.3)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.7)',
            ...(currentStep.target && {
              position: 'fixed',
              bottom: '24px',
              left: '24px',
            })
          }}
        >
          <div className="space-y-3">
            {/* Header info */}
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-black text-brand uppercase tracking-wider flex items-center gap-1">
                <Sparkles size={10} className="text-brand" /> Guide {step + 1} of {steps.length}
              </span>
              <button
                onClick={handleSkip}
                className="p-1 rounded-lg text-muted hover:text-white hover:bg-white/5 transition-all"
              >
                <X size={13} />
              </button>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <h4 className="font-display font-black text-sm text-white">
                {currentStep.title}
              </h4>
              <p className="text-[10px] leading-relaxed text-muted-foreground">
                {currentStep.desc}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-border/40">
              <button
                onClick={handleSkip}
                className="text-[9px] font-bold text-muted hover:text-white transition-all"
              >
                Skip Tour
              </button>
              
              <div className="flex gap-2">
                {step > 0 && (
                  <button
                    onClick={handlePrev}
                    className="px-2.5 py-1.5 rounded-lg border border-border text-[9px] font-bold text-muted hover:text-white transition-all flex items-center gap-1"
                  >
                    <ArrowLeft size={9} /> Back
                  </button>
                )}
                <button
                  onClick={handleNext}
                  className="btn btn-primary px-3.5 py-1.5 rounded-lg text-[9px] font-bold flex items-center gap-0.5"
                >
                  {step === steps.length - 1 ? 'Finish' : 'Next'} <ChevronRight size={9} />
                </button>
              </div>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
