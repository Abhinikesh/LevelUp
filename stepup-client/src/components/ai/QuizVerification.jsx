import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain, CheckCircle, XCircle, Loader2, Zap,
  ChevronRight, Trophy, RefreshCw, Star, Lock
} from 'lucide-react'
import { aiApi } from '../../api/client'
import toast from 'react-hot-toast'
import confetti from 'canvas-confetti'

export default function QuizVerification({ level, levelId, onVerified, onClose }) {
  const [questions, setQuestions]   = useState([])
  const [loading, setLoading]       = useState(true)
  const [selected, setSelected]     = useState({})   // { [qIdx]: optionIdx }
  const [submitted, setSubmitted]   = useState(false)
  const [score, setScore]           = useState(0)
  const [passed, setPassed]         = useState(false)
  const [currentQ, setCurrentQ]     = useState(0)
  const [showExplain, setShowExplain] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [timeLeft, setTimeLeft]     = useState(null)

  const resolvedId = levelId || level?._id

  const loadQuestions = useCallback(async () => {
    setLoading(true)
    setSubmitted(false)
    setSelected({})
    setCurrentQ(0)
    setShowExplain(false)
    setScore(0)
    try {
      // Try to use cached questions first
      if (level?.quizQuestions?.length > 0) {
        setQuestions(level.quizQuestions)
        setTimeLeft(level.quizQuestions.length * 30)
      } else {
        const res = await aiApi.generateQuiz(resolvedId)
        setQuestions(res.data.questions || [])
        setTimeLeft((res.data.questions?.length || 5) * 30)
      }
    } catch (err) {
      toast.error('Could not load quiz. Using sample questions.')
      // Fallback sample
      setQuestions([
        {
          question: `What is the most important aspect of: "${level?.title}"?`,
          options: ['Understanding core concepts thoroughly', 'Skipping difficult parts', 'Memorizing without understanding', 'Avoiding practice problems'],
          correctIndex: 0,
          explanation: 'Deep understanding is the foundation of mastery in any topic.',
        },
        {
          question: 'How do you verify progress on a learning task?',
          options: ['By guessing the answer', 'By actively applying the knowledge', 'By reading without practice', 'By watching videos only'],
          correctIndex: 1,
          explanation: 'Active application and practice is the most reliable verification of learning.',
        },
        {
          question: 'What should you do when you encounter a difficult concept?',
          options: ['Give up immediately', 'Skip it permanently', 'Break it into smaller parts and work through it', 'Ask someone else to do it'],
          correctIndex: 2,
          explanation: 'Breaking problems into smaller parts is the key problem-solving strategy.',
        },
      ])
      setTimeLeft(90)
    } finally {
      setLoading(false)
    }
  }, [resolvedId, level])

  useEffect(() => { loadQuestions() }, [loadQuestions])

  // Countdown timer
  useEffect(() => {
    if (!timeLeft || submitted || loading) return
    if (timeLeft <= 0) { handleSubmit(); return }
    const t = setInterval(() => setTimeLeft(p => p - 1), 1000)
    return () => clearInterval(t)
  }, [timeLeft, submitted, loading])

  const handleSelect = (qIdx, optIdx) => {
    if (submitted) return
    setSelected(prev => ({ ...prev, [qIdx]: optIdx }))
  }

  const handleNext = () => {
    if (currentQ < questions.length - 1) setCurrentQ(p => p + 1)
    else setShowExplain(true)
  }

  const handleSubmit = useCallback(() => {
    let correct = 0
    questions.forEach((q, i) => {
      if (selected[i] === (q.correctIndex ?? 0)) correct++
    })
    const pct = Math.round((correct / questions.length) * 100)
    setScore(pct)
    const didPass = pct >= 60
    setPassed(didPass)
    setSubmitted(true)
    setShowExplain(false)
    if (didPass) {
      confetti({ particleCount: 90, spread: 80, origin: { y: 0.5 }, colors: ['#6C63FF', '#FFB800', '#43E97B'] })
      const answersArray = questions.map((_, i) => selected[i] ?? 0)
      onVerified?.({ score: pct, method: 'quiz', answers: answersArray })
    }
  }, [questions, selected, onVerified])

  const handleRegenerate = async () => {
    setRegenerating(true)
    try {
      const res = await aiApi.generateQuiz(resolvedId)
      setQuestions(res.data.questions || [])
      setTimeLeft((res.data.questions?.length || 5) * 30)
      setSubmitted(false)
      setSelected({})
      setCurrentQ(0)
      setScore(0)
      setShowExplain(false)
      toast.success('Fresh quiz questions generated!')
    } catch {
      toast.error('Could not regenerate. Try again.')
    } finally {
      setRegenerating(false)
    }
  }

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  const answeredCount = Object.keys(selected).length
  const isLastQ = currentQ === questions.length - 1

  if (loading) {
    return (
      <div className="quiz-overlay">
        <motion.div className="quiz-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="quiz-loading">
            <div className="quiz-loading-icon">
              <Loader2 size={28} className="spin" />
            </div>
            <p className="quiz-loading-text">AI is generating your quiz…</p>
            <p className="quiz-loading-sub">Crafting questions based on your level topics</p>
          </div>
        </motion.div>
        {inlineStyles}
      </div>
    )
  }

  const q = questions[currentQ]

  return (
    <div className="quiz-overlay">
      <motion.div
        className="quiz-modal"
        initial={{ opacity: 0, scale: 0.93, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 30 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      >
        {/* Header */}
        <div className="quiz-header">
          <div className="quiz-header-icon">
            <Brain size={20} />
          </div>
          <div className="quiz-header-info">
            <h2 className="quiz-title">Knowledge Quiz</h2>
            <p className="quiz-level-name">{level?.title || 'Level Verification'}</p>
          </div>
          <div className="quiz-header-right">
            {!submitted && timeLeft !== null && (
              <div className={`quiz-timer ${timeLeft < 30 ? 'urgent' : ''}`}>
                ⏱ {formatTime(timeLeft)}
              </div>
            )}
            <button className="quiz-close" onClick={onClose} aria-label="Close">×</button>
          </div>
        </div>

        {/* Progress bar */}
        {!submitted && (
          <div className="quiz-progress-wrap">
            <div className="quiz-progress-bar">
              <motion.div
                className="quiz-progress-fill"
                initial={{ width: 0 }}
                animate={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
                transition={{ ease: 'easeOut' }}
              />
            </div>
            <span className="quiz-progress-text">{currentQ + 1} / {questions.length}</span>
          </div>
        )}

        {/* Results screen */}
        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="results"
              className="quiz-results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className={`quiz-score-ring ${passed ? 'pass' : 'fail'}`}>
                {passed ? <Trophy size={30} color="#FFB800" /> : <XCircle size={30} color="#FF6584" />}
                <div className="quiz-score-number">{score}%</div>
              </div>
              <h3 className="quiz-result-title">{passed ? '🎉 Quest Unlocked!' : '💪 Keep Practicing!'}</h3>
              <p className="quiz-result-sub">
                {passed
                  ? `You scored ${score}% — Level complete! XP reward is on its way.`
                  : `You scored ${score}%. You need 60% to pass. Review the material and try again.`}
              </p>

              {/* Answer review */}
              <div className="quiz-review">
                {questions.map((rq, i) => {
                  const isCorrect = selected[i] === (rq.correctIndex ?? 0)
                  return (
                    <div key={i} className={`quiz-review-item ${isCorrect ? 'correct' : 'wrong'}`}>
                      <div className="quiz-review-q">
                        {isCorrect ? <CheckCircle size={14} color="#43E97B" /> : <XCircle size={14} color="#FF6584" />}
                        <span>{rq.question}</span>
                      </div>
                      {!isCorrect && (
                        <div className="quiz-review-answer">
                          <span className="quiz-review-correct-label">Correct:</span>
                          {rq.options?.[rq.correctIndex ?? 0]}
                          {rq.explanation && (
                            <span className="quiz-review-explain"> — {rq.explanation}</span>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="quiz-result-actions">
                {!passed && (
                  <button className="quiz-retry-btn" onClick={handleRegenerate} disabled={regenerating}>
                    {regenerating ? <Loader2 size={15} className="spin" /> : <RefreshCw size={15} />}
                    New Questions
                  </button>
                )}
                {passed ? (
                  <motion.button
                    className="quiz-confirm-btn"
                    onClick={onClose}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Star size={16} /> Continue Journey
                  </motion.button>
                ) : (
                  <button className="quiz-retry-btn alt" onClick={() => { setSubmitted(false); setSelected({}); setCurrentQ(0); setTimeLeft(questions.length * 30) }}>
                    <RefreshCw size={15} /> Retry Same Quiz
                  </button>
                )}
              </div>
            </motion.div>
          ) : showExplain ? (
            /* Review before submit */
            <motion.div key="review" className="quiz-pre-submit" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="quiz-pre-submit-info">
                <CheckCircle size={20} color="#43E97B" />
                <span>{answeredCount} of {questions.length} answered</span>
                {answeredCount < questions.length && <span className="quiz-warn">({questions.length - answeredCount} unanswered)</span>}
              </div>
              <button className="quiz-confirm-btn" onClick={handleSubmit}>
                <Zap size={16} /> Submit &amp; Check Score
              </button>
              <button className="quiz-back-btn" onClick={() => setShowExplain(false)}>
                ← Review Answers
              </button>
            </motion.div>
          ) : (
            /* Active question */
            <motion.div
              key={`q-${currentQ}`}
              className="quiz-question-wrap"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
            >
              <div className="quiz-q-number">Question {currentQ + 1}</div>
              <p className="quiz-q-text">{q?.question}</p>
              <div className="quiz-options">
                {q?.options?.map((opt, oi) => {
                  const isSelected = selected[currentQ] === oi
                  return (
                    <motion.button
                      key={oi}
                      className={`quiz-option ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleSelect(currentQ, oi)}
                      whileHover={{ scale: 1.015 }}
                      whileTap={{ scale: 0.985 }}
                    >
                      <span className={`quiz-option-letter ${isSelected ? 'active' : ''}`}>
                        {['A', 'B', 'C', 'D'][oi]}
                      </span>
                      <span className="quiz-option-text">{opt}</span>
                      {isSelected && <CheckCircle size={16} color="#6C63FF" className="quiz-option-check" />}
                    </motion.button>
                  )
                })}
              </div>
              <div className="quiz-nav">
                {currentQ > 0 && (
                  <button className="quiz-prev-btn" onClick={() => setCurrentQ(p => p - 1)}>
                    ← Back
                  </button>
                )}
                <button
                  className="quiz-next-btn"
                  onClick={handleNext}
                  disabled={selected[currentQ] === undefined}
                >
                  {isLastQ ? 'Review & Submit' : 'Next'} <ChevronRight size={16} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {inlineStyles}
    </div>
  )
}

const inlineStyles = (
  <style>{`
    .quiz-overlay {
      position: fixed; inset: 0; z-index: 1000;
      background: rgba(0,0,0,0.8); backdrop-filter: blur(10px);
      display: flex; align-items: center; justify-content: center; padding: 1rem;
    }
    .quiz-modal {
      background: #12121A; border: 1px solid rgba(108,99,255,0.25);
      border-radius: 22px; padding: 2rem; width: 100%; max-width: 540px;
      max-height: 90vh; overflow-y: auto;
      box-shadow: 0 30px 80px rgba(0,0,0,0.6), 0 0 40px rgba(108,99,255,0.1);
    }
    .quiz-loading { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 3rem; }
    .quiz-loading-icon {
      width: 60px; height: 60px; border-radius: 50%;
      background: linear-gradient(135deg, #6C63FF, #9c8dff);
      display: flex; align-items: center; justify-content: center; color: white;
    }
    .quiz-loading-text { color: #fff; font-weight: 700; font-size: 1rem; margin: 0; }
    .quiz-loading-sub { color: #666; font-size: 0.82rem; margin: 0; text-align: center; }
    .quiz-header { display: flex; align-items: center; gap: 0.9rem; margin-bottom: 1.4rem; }
    .quiz-header-icon {
      width: 42px; height: 42px; border-radius: 12px; flex-shrink: 0;
      background: linear-gradient(135deg, #6C63FF, #9c8dff);
      display: flex; align-items: center; justify-content: center; color: white;
    }
    .quiz-header-info { flex: 1; min-width: 0; }
    .quiz-title { font-size: 1.1rem; font-weight: 700; color: #fff; margin: 0; }
    .quiz-level-name { font-size: 0.78rem; color: #777; margin: 0.2rem 0 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .quiz-header-right { display: flex; align-items: center; gap: 0.7rem; flex-shrink: 0; }
    .quiz-timer { font-size: 0.82rem; font-weight: 700; color: #43E97B; background: rgba(67,233,123,0.1); padding: 0.3rem 0.7rem; border-radius: 20px; }
    .quiz-timer.urgent { color: #FF6584; background: rgba(255,101,132,0.12); animation: pulse 1s ease-in-out infinite; }
    .quiz-close {
      background: rgba(255,255,255,0.07); border: none; border-radius: 8px;
      width: 30px; height: 30px; color: #aaa; font-size: 1.1rem; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
    }
    .quiz-close:hover { background: rgba(255,255,255,0.14); color: white; }
    .quiz-progress-wrap { display: flex; align-items: center; gap: 0.8rem; margin-bottom: 1.6rem; }
    .quiz-progress-bar { flex: 1; height: 5px; background: rgba(255,255,255,0.07); border-radius: 99px; overflow: hidden; }
    .quiz-progress-fill { height: 100%; background: linear-gradient(90deg, #6C63FF, #9c8dff); border-radius: 99px; }
    .quiz-progress-text { font-size: 0.75rem; color: #666; white-space: nowrap; }
    .quiz-q-number { font-size: 0.72rem; font-weight: 700; color: #6C63FF; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 0.6rem; }
    .quiz-q-text { font-size: 1rem; color: #f0f0f0; line-height: 1.55; margin: 0 0 1.2rem; font-weight: 500; }
    .quiz-options { display: flex; flex-direction: column; gap: 0.55rem; margin-bottom: 1.4rem; }
    .quiz-option {
      display: flex; align-items: center; gap: 0.75rem; padding: 0.85rem 1rem;
      background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
      border-radius: 12px; cursor: pointer; text-align: left; transition: all 0.18s;
      font-family: inherit; position: relative; overflow: hidden;
    }
    .quiz-option:hover { border-color: rgba(108,99,255,0.4); background: rgba(108,99,255,0.06); }
    .quiz-option.selected { border-color: #6C63FF; background: rgba(108,99,255,0.12); }
    .quiz-option-letter {
      width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.78rem; font-weight: 700; background: rgba(255,255,255,0.07); color: #888;
      transition: all 0.18s;
    }
    .quiz-option-letter.active { background: #6C63FF; color: white; }
    .quiz-option-text { flex: 1; font-size: 0.9rem; color: #ccc; }
    .quiz-option-check { position: absolute; right: 0.9rem; }
    .quiz-nav { display: flex; justify-content: space-between; align-items: center; gap: 0.8rem; }
    .quiz-prev-btn {
      padding: 0.7rem 1.2rem; border-radius: 10px; cursor: pointer;
      background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
      color: #aaa; font-size: 0.88rem; font-family: inherit; transition: all 0.18s;
    }
    .quiz-prev-btn:hover { background: rgba(255,255,255,0.09); color: white; }
    .quiz-next-btn {
      flex: 1; padding: 0.85rem 1.2rem; border-radius: 12px; cursor: pointer;
      background: linear-gradient(135deg, #6C63FF, #9c8dff);
      border: none; color: white; font-size: 0.92rem; font-weight: 700;
      display: flex; align-items: center; justify-content: center; gap: 0.4rem;
      font-family: inherit; transition: opacity 0.2s; box-shadow: 0 0 20px rgba(108,99,255,0.3);
    }
    .quiz-next-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .quiz-pre-submit { display: flex; flex-direction: column; gap: 1rem; align-items: center; padding: 1rem 0; }
    .quiz-pre-submit-info { display: flex; align-items: center; gap: 0.5rem; color: #bbb; font-size: 0.9rem; }
    .quiz-warn { color: #FF6584; font-size: 0.82rem; }
    .quiz-confirm-btn {
      width: 100%; padding: 0.9rem; border-radius: 12px; border: none;
      background: linear-gradient(135deg, #6C63FF, #9c8dff); color: white;
      font-size: 0.95rem; font-weight: 700; cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 0.5rem;
      font-family: inherit; box-shadow: 0 0 20px rgba(108,99,255,0.35);
      transition: opacity 0.2s;
    }
    .quiz-back-btn { background: none; border: none; color: #555; font-size: 0.85rem; cursor: pointer; }
    .quiz-results { display: flex; flex-direction: column; align-items: center; gap: 1rem; }
    .quiz-score-ring {
      width: 90px; height: 90px; border-radius: 50%; border: 3px solid;
      display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.2rem;
    }
    .quiz-score-ring.pass { border-color: #43E97B; background: rgba(67,233,123,0.08); }
    .quiz-score-ring.fail { border-color: #FF6584; background: rgba(255,101,132,0.08); }
    .quiz-score-number { font-size: 1.1rem; font-weight: 800; color: white; }
    .quiz-result-title { font-size: 1.15rem; font-weight: 800; color: white; margin: 0; }
    .quiz-result-sub { font-size: 0.85rem; color: #888; text-align: center; margin: 0; max-width: 380px; }
    .quiz-review { width: 100%; display: flex; flex-direction: column; gap: 0.5rem; max-height: 220px; overflow-y: auto; }
    .quiz-review-item { padding: 0.7rem; border-radius: 10px; border: 1px solid; }
    .quiz-review-item.correct { border-color: rgba(67,233,123,0.2); background: rgba(67,233,123,0.04); }
    .quiz-review-item.wrong { border-color: rgba(255,101,132,0.2); background: rgba(255,101,132,0.04); }
    .quiz-review-q { display: flex; align-items: flex-start; gap: 0.5rem; font-size: 0.82rem; color: #ccc; }
    .quiz-review-answer { font-size: 0.78rem; color: #888; margin-top: 0.4rem; padding-left: 1.4rem; }
    .quiz-review-correct-label { color: #43E97B; font-weight: 600; margin-right: 0.3rem; }
    .quiz-review-explain { color: #666; font-style: italic; }
    .quiz-result-actions { display: flex; gap: 0.8rem; width: 100%; }
    .quiz-retry-btn {
      flex: 1; padding: 0.8rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.12);
      background: rgba(255,255,255,0.05); color: #bbb; font-size: 0.88rem; font-weight: 600;
      cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.4rem;
      font-family: inherit; transition: all 0.18s;
    }
    .quiz-retry-btn:hover { border-color: rgba(108,99,255,0.4); color: #9c8dff; }
    .quiz-retry-btn.alt { flex: 1; }
    .quiz-question-wrap {}
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.6; } }
  `}</style>
)
