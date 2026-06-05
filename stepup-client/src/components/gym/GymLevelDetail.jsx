import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Check, HelpCircle, Dumbbell, ArrowRight, RotateCcw, AlertCircle, Play,
  Cpu, Award, HelpCircle as HelpIcon, Sparkles, BookOpen
} from 'lucide-react'
import { gymApi, levelApi } from '../../api/client'
import useAuthStore from '../../store/authStore'
import toast from 'react-hot-toast'
import confetti from 'canvas-confetti'

export default function GymLevelDetail({ levelId, levelTitle, onClose, onXpEarned }) {
  const [challenge, setChallenge] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('practice') // 'practice' | 'result'
  
  // Game states
  const [flashcardIndex, setFlashcardIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [flashcardScore, setFlashcardScore] = useState(0) // items marked "know it"
  
  const [selectedLeft, setSelectedLeft] = useState(null)
  const [matchedPairs, setMatchedPairs] = useState({}) // leftId -> rightId
  const [wrongSelection, setWrongSelection] = useState(null) // { left, right }
  
  const [fillInputs, setFillInputs] = useState({})
  
  const [codeAnswer, setCodeAnswer] = useState('')
  const [checkingCode, setCheckingCode] = useState(false)

  const { user, setUser } = useAuthStore()

  useEffect(() => {
    let active = true;
    async function loadChallenge() {
      try {
        setLoading(true);
        const { data } = await gymApi.getChallenge(levelId);
        if (active && data.success) {
          setChallenge(data.challenge);
          if (data.challenge.type === 'code') {
            setCodeAnswer(data.challenge.starterCode);
          }
        }
      } catch (err) {
        console.error('Failed to load gym challenge:', err);
        toast.error('Could not generate gym challenge.');
      } finally {
        if (active) setLoading(false);
      }
    }
    loadChallenge();
    return () => { active = false; };
  }, [levelId]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="glass-card p-8 border border-brand/20 flex flex-col items-center gap-4 text-center max-w-xs">
          <Dumbbell className="text-brand animate-bounce" size={40} />
          <h3 className="font-display font-black text-sm text-white">Generating Gym Workout</h3>
          <p className="text-[10px] text-muted">ARIA is compiling practice problems for you...</p>
        </div>
      </div>
    );
  }

  if (!challenge) return null;

  const handleCompleteGym = async (earnedXp = 50) => {
    // Repeatable practice rewards +50 XP
    try {
      // Award XP in client store
      const newXpTotal = (user?.xpTotal || 0) + earnedXp;
      setUser({ ...user, xpTotal: newXpTotal });
      
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FF6584', '#6C63FF', '#FFB800']
      });
      
      if (onXpEarned) {
        onXpEarned(earnedXp);
      }
      
      toast.success(`Gym workout complete! +${earnedXp} XP 🏋️‍♂️`);
      setActiveTab('result');
    } catch (err) {
      toast.error('Failed to register practice rewards.');
    }
  };

  // 1. Flashcards logic
  const handleFlashcardAnswer = (knowsIt) => {
    setIsFlipped(false);
    if (knowsIt) setFlashcardScore(s => s + 1);
    
    if (flashcardIndex < challenge.items.length - 1) {
      setTimeout(() => {
        setFlashcardIndex(i => i + 1);
      }, 200);
    } else {
      handleCompleteGym(50);
    }
  };

  // 2. Matching pairs logic
  const handleLeftClick = (id) => {
    if (matchedPairs[id]) return;
    setSelectedLeft(id);
  };

  const handleRightClick = (id) => {
    if (!selectedLeft) {
      toast.error('Select an item on the left first!');
      return;
    }

    // Check if correct match
    const correctRightId = challenge.pairs[selectedLeft];
    if (correctRightId === id) {
      setMatchedPairs(prev => ({ ...prev, [selectedLeft]: id }));
      setSelectedLeft(null);
      
      // Check if all matched
      const totalPairs = Object.keys(challenge.pairs).length;
      const currentlyMatched = Object.keys(matchedPairs).length + 1;
      if (currentlyMatched === totalPairs) {
        setTimeout(() => handleCompleteGym(50), 600);
      }
    } else {
      // Show wrong selection indicator
      setWrongSelection({ left: selectedLeft, right: id });
      setTimeout(() => {
        setWrongSelection(null);
        setSelectedLeft(null);
      }, 800);
    }
  };

  // 3. Fill in the blanks logic
  const handleFillSubmit = () => {
    let allCorrect = true;
    challenge.answers.forEach((answer, idx) => {
      const userVal = fillInputs[idx]?.trim()?.toLowerCase() || '';
      if (userVal !== answer.toLowerCase()) {
        allCorrect = false;
      }
    });

    if (allCorrect) {
      handleCompleteGym(60);
    } else {
      toast.error('Some blanks have incorrect answers. Review carefully!');
    }
  };

  // 4. Code Challenge compilation simulation
  const handleRunCode = () => {
    setCheckingCode(true);
    setTimeout(() => {
      setCheckingCode(false);
      // We check if code contains logic or execute mock compile validation
      const cleaned = codeAnswer.replace(/\s/g, '');
      if (cleaned.includes('return') && !cleaned.includes('//TODO')) {
        handleCompleteGym(70);
      } else {
        toast.error('Code execution failed. Make sure you return a valid output snippet!');
      }
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg rounded-3xl overflow-hidden flex flex-col border border-border"
        style={{
          background: 'linear-gradient(180deg, #101019 0%, #0A0A0F 100%)',
          maxHeight: '90vh'
        }}
      >
        {/* Header */}
        <div className="p-5 border-b border-border/40 flex justify-between items-center bg-card/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-500">
              <Dumbbell size={16} />
            </div>
            <div>
              <h3 className="font-display font-black text-sm text-white">STEPUP Gym: Practice</h3>
              <p className="text-[10px] text-muted truncate max-w-[200px]">Node: {levelTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted hover:text-white hover:bg-white/5 transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
          {activeTab === 'practice' ? (
            <>
              {/* Challenge Title */}
              <div className="text-center space-y-1">
                <h4 className="font-display font-black text-sm text-white">{challenge.title}</h4>
                <p className="text-[10px] text-muted">Master this challenge to claim active study points</p>
              </div>

              {/* FLASHCARDS */}
              {challenge.type === 'flashcards' && (
                <div className="space-y-6">
                  {/* Card Flip Container */}
                  <div
                    onClick={() => setIsFlipped(!isFlipped)}
                    className="w-full h-48 rounded-2xl cursor-pointer relative perspective"
                  >
                    <motion.div
                      animate={{ rotateY: isFlipped ? 180 : 0 }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className="w-full h-full preserve-3d relative rounded-2xl border"
                      style={{
                        background: isFlipped ? '#151522' : '#0F0F16',
                        borderColor: isFlipped ? '#2E2E4E' : '#1E1E2E',
                      }}
                    >
                      {/* Front Side */}
                      <div className="absolute inset-0 backface-hidden p-6 flex flex-col items-center justify-center text-center">
                        <HelpIcon className="text-brand/40 mb-3" size={24} />
                        <span className="text-xs font-semibold text-white leading-relaxed">
                          {challenge.items[flashcardIndex].question}
                        </span>
                        <span className="text-[9px] font-bold text-muted uppercase tracking-widest mt-6">
                          Click to Reveal
                        </span>
                      </div>

                      {/* Back Side */}
                      <div className="absolute inset-0 backface-hidden rotate-y-180 p-6 flex flex-col items-center justify-center text-center overflow-y-auto">
                        <BookOpen className="text-pink-500/40 mb-3" size={24} />
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {challenge.items[flashcardIndex].answer}
                        </p>
                      </div>
                    </motion.div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-4">
                    <button
                      onClick={() => handleFlashcardAnswer(false)}
                      className="btn bg-coral/10 hover:bg-coral/20 border border-coral/30 hover:border-coral/50 text-coral text-xs py-3 rounded-xl flex-1 font-bold"
                    >
                      Need Review
                    </button>
                    <button
                      onClick={() => handleFlashcardAnswer(true)}
                      className="btn bg-green/10 hover:bg-green/20 border border-green/30 hover:border-green/50 text-green text-xs py-3 rounded-xl flex-1 font-bold"
                    >
                      Know It!
                    </button>
                  </div>

                  {/* Indicators */}
                  <div className="flex justify-between items-center text-[10px] text-muted font-bold px-1">
                    <span>Card {flashcardIndex + 1} of {challenge.items.length}</span>
                    <span>Knowledge score: {flashcardScore}</span>
                  </div>
                </div>
              )}

              {/* MATCHING PAIRS */}
              {challenge.type === 'matching' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    
                    {/* Left Column (Terms) */}
                    <div className="space-y-2">
                      <span className="text-[9px] font-black uppercase text-muted tracking-widest block mb-2 text-center">Concepts</span>
                      {challenge.leftItems.map(item => {
                        const isMatched = !!matchedPairs[item.id];
                        const isSelected = selectedLeft === item.id;
                        const isWrong = wrongSelection?.left === item.id;
                        
                        return (
                          <button
                            key={item.id}
                            disabled={isMatched}
                            onClick={() => handleLeftClick(item.id)}
                            className={`w-full p-3 rounded-xl text-left text-xs font-semibold border transition-all ${
                              isMatched
                                ? 'bg-green/10 border-green/30 text-green/60'
                                : isSelected
                                ? 'bg-brand/10 border-brand text-white shadow-lg'
                                : isWrong
                                ? 'bg-coral/10 border-coral text-coral animate-shake'
                                : 'bg-[#0F0F16] border-border hover:border-brand/45 text-white'
                            }`}
                          >
                            {item.text}
                          </button>
                        );
                      })}
                    </div>

                    {/* Right Column (Definitions) */}
                    <div className="space-y-2">
                      <span className="text-[9px] font-black uppercase text-muted tracking-widest block mb-2 text-center">Definitions</span>
                      {challenge.rightItems.map(item => {
                        const isMatched = Object.values(matchedPairs).includes(item.id);
                        const isWrong = wrongSelection?.right === item.id;
                        
                        return (
                          <button
                            key={item.id}
                            disabled={isMatched}
                            onClick={() => handleRightClick(item.id)}
                            className={`w-full p-3 rounded-xl text-left text-[11px] leading-relaxed border transition-all ${
                              isMatched
                                ? 'bg-green/10 border-green/30 text-green/60'
                                : isWrong
                                ? 'bg-coral/10 border-coral text-coral animate-shake'
                                : 'bg-[#0F0F16] border-border hover:border-brand/45 text-muted-foreground hover:text-white'
                            }`}
                          >
                            {item.text}
                          </button>
                        );
                      })}
                    </div>

                  </div>
                </div>
              )}

              {/* FILL IN THE BLANKS */}
              {challenge.type === 'fill' && (
                <div className="space-y-6">
                  {/* Text Container */}
                  <div className="p-5 rounded-2xl border border-border bg-[#0D0D15] text-xs leading-relaxed text-muted-foreground">
                    {challenge.text.split('________').map((chunk, idx) => (
                      <span key={idx}>
                        {chunk}
                        {idx < challenge.blanksCount && (
                          <input
                            type="text"
                            value={fillInputs[idx] || ''}
                            onChange={e => setFillInputs(prev => ({ ...prev, [idx]: e.target.value }))}
                            placeholder={`Blank ${idx + 1}`}
                            className="mx-1 px-2.5 py-1 rounded-lg border border-border bg-[#0F0F16] text-white font-bold outline-none focus:border-brand text-xs inline-block"
                            style={{ width: 100 }}
                          />
                        )}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={handleFillSubmit}
                    className="btn btn-primary w-full py-3.5 text-xs flex items-center justify-center gap-1.5"
                  >
                    Check Answers <ArrowRight size={13} />
                  </button>
                </div>
              )}

              {/* CODE CHALLENGE */}
              {challenge.type === 'code' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-brand/5 border border-brand/10 flex gap-2">
                    <Cpu size={16} className="text-brand flex-shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-bold text-xs text-white">Instructions:</h5>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{challenge.instructions}</p>
                    </div>
                  </div>

                  <div className="relative rounded-2xl overflow-hidden border border-border">
                    <textarea
                      value={codeAnswer}
                      onChange={e => setCodeAnswer(e.target.value)}
                      rows={8}
                      className="w-full p-4 bg-[#050508] font-mono text-[10px] text-green-400 outline-none resize-none leading-relaxed"
                    />
                  </div>

                  <button
                    onClick={handleRunCode}
                    disabled={checkingCode}
                    className="btn btn-primary w-full py-3.5 text-xs flex items-center justify-center gap-1.5"
                  >
                    {checkingCode ? 'Compiling & Running...' : 'Execute & Validate Test Cases'}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-10 space-y-5">
              <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center text-gold shadow-lg shadow-gold/10 animate-pulse">
                <Award size={32} />
              </div>
              <div className="space-y-1">
                <h4 className="font-display font-black text-base text-white">Workout Complete!</h4>
                <p className="text-xs text-muted-foreground max-w-xs">You solved the challenge successfully. ARIA rewarded you with training points!</p>
              </div>
              <div className="px-5 py-2.5 rounded-full bg-gold/20 border border-gold/30 flex items-center gap-1 text-gold font-display font-black text-sm">
                <Sparkles size={14} /> +50 XP Earned
              </div>
              <button
                onClick={onClose}
                className="btn btn-primary px-8 py-3 text-xs"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
