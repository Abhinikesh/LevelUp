import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic, MicOff, Square, Loader2, CheckCircle,
  XCircle, Play, Pause, RotateCcw, Send, Zap,
  Volume2, Brain, Star, AlertCircle
} from 'lucide-react'
import { aiApi } from '../../api/client'
import toast from 'react-hot-toast'
import confetti from 'canvas-confetti'

const PHASES = { IDLE: 'idle', RECORDING: 'recording', PROCESSING: 'processing', RESULT: 'result' }

export default function VoiceVerification({ level, levelId, onVerified, onClose }) {
  const [phase, setPhase]           = useState(PHASES.IDLE)
  const [transcript, setTranscript] = useState('')
  const [manualMode, setManualMode] = useState(false)
  const [manualText, setManualText] = useState('')
  const [result, setResult]         = useState(null)
  const [recSeconds, setRecSeconds] = useState(0)
  const [audioURL, setAudioURL]     = useState(null)
  const [isPlaying, setIsPlaying]   = useState(false)
  const [audioVolume, setAudioVolume] = useState([])
  const [hasPermission, setHasPermission] = useState(null) // null=unknown, true, false

  const mediaRecorder  = useRef(null)
  const audioChunks    = useRef([])
  const audioRef       = useRef(null)
  const timerRef       = useRef(null)
  const analyserRef    = useRef(null)
  const animFrameRef   = useRef(null)
  const streamRef      = useRef(null)
  const resolvedId     = levelId || level?._id

  // Cleanup on unmount
  useEffect(() => () => {
    clearInterval(timerRef.current)
    cancelAnimationFrame(animFrameRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
  }, [])

  const startWaveAnimation = (stream) => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const src = ctx.createMediaStreamSource(stream)
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 64
    src.connect(analyser)
    analyserRef.current = analyser
    const data = new Uint8Array(analyser.frequencyBinCount)
    const tick = () => {
      analyser.getByteFrequencyData(data)
      const bars = Array.from(data.slice(0, 12)).map(v => Math.max(4, (v / 255) * 60))
      setAudioVolume(bars)
      animFrameRef.current = requestAnimationFrame(tick)
    }
    tick()
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      setHasPermission(true)
      audioChunks.current = []
      setAudioURL(null)
      setRecSeconds(0)
      setTranscript('')

      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecorder.current = recorder

      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunks.current.push(e.data) }
      recorder.onstop = () => {
        clearInterval(timerRef.current)
        cancelAnimationFrame(animFrameRef.current)
        setAudioVolume([])
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(audioChunks.current, { type: mimeType })
        const url  = URL.createObjectURL(blob)
        setAudioURL(url)
        setPhase(PHASES.PROCESSING)
        processAudio(blob)
      }

      recorder.start(100)
      setPhase(PHASES.RECORDING)
      startWaveAnimation(stream)
      timerRef.current = setInterval(() => setRecSeconds(s => {
        if (s >= 180) { stopRecording(); return s }
        return s + 1
      }), 1000)
    } catch (err) {
      setHasPermission(false)
      toast.error('Microphone access denied. Use manual text entry below.')
      setManualMode(true)
    }
  }

  const stopRecording = () => {
    if (mediaRecorder.current?.state === 'recording') {
      mediaRecorder.current.stop()
    }
  }

  const processAudio = async (blob) => {
    setPhase(PHASES.PROCESSING)
    let finalTranscript = ''

    try {
      const formData = new FormData()
      const ext = blob.type.includes('mp4') ? 'mp4' : 'webm'
      formData.append('audio', blob, `voice_${Date.now()}.${ext}`)
      const sttRes = await aiApi.transcribeVoice(formData)
      finalTranscript = sttRes.data.transcript || ''
    } catch {
      // Fallback: mock transcript
      finalTranscript = `I understand ${level?.title || 'this topic'} which covers ${level?.topics?.join(', ') || 'the core concepts'}. The main idea involves applying theoretical knowledge and solving practical problems through systematic analysis.`
      toast('Using mock transcription — set OPENAI_API_KEY for real Whisper STT', { icon: '🎤' })
    }

    setTranscript(finalTranscript)
    await evaluateTranscript(finalTranscript)
  }

  const evaluateTranscript = async (text) => {
    try {
      const evalRes = await aiApi.verifyVoice({
        transcript: text,
        levelId:    resolvedId,
      })
      const data = evalRes.data
      setResult(data)
      setPhase(PHASES.RESULT)
      if (data.verified) {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.5 }, colors: ['#6C63FF', '#43E97B', '#FFB800'] })
        onVerified?.(data)
      }
    } catch (err) {
      toast.error('Evaluation failed. Please try again.')
      setPhase(PHASES.IDLE)
    }
  }

  const handleManualSubmit = async () => {
    if (!manualText.trim() || manualText.trim().length < 20) {
      toast.error('Please write at least 20 characters explaining the topic.')
      return
    }
    setTranscript(manualText.trim())
    setPhase(PHASES.PROCESSING)
    await evaluateTranscript(manualText.trim())
  }

  const handleRetry = () => {
    setPhase(PHASES.IDLE)
    setResult(null)
    setTranscript('')
    setManualText('')
    setAudioURL(null)
    setRecSeconds(0)
  }

  const togglePlayback = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  return (
    <div className="voice-overlay">
      <motion.div
        className="voice-modal"
        initial={{ opacity: 0, scale: 0.93, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 30 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      >
        {/* Header */}
        <div className="voice-header">
          <div className="voice-header-icon">
            <Volume2 size={20} />
          </div>
          <div className="voice-header-info">
            <h2 className="voice-title">Voice Verification</h2>
            <p className="voice-level-name">{level?.title || 'Explain what you learned'}</p>
          </div>
          <button className="voice-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        {/* Topics hint */}
        {level?.topics?.length > 0 && (
          <div className="voice-topics">
            <span className="voice-topics-label"><Brain size={12} /> Cover these topics:</span>
            {level.topics.map((t, i) => (
              <span key={i} className="voice-topic-chip">{t}</span>
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">

          {/* ── IDLE ── */}
          {phase === PHASES.IDLE && (
            <motion.div key="idle" className="voice-idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="voice-mic-container">
                <motion.button
                  className="voice-mic-btn"
                  onClick={startRecording}
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.94 }}
                >
                  <Mic size={40} />
                </motion.button>
                <div className="voice-pulse-ring" />
                <div className="voice-pulse-ring delay" />
              </div>
              <p className="voice-idle-title">Tap to start recording</p>
              <p className="voice-idle-sub">
                Explain <strong>{level?.title || 'this level'}</strong> in your own words. AI will grade your verbal understanding.
              </p>
              <p className="voice-idle-limit">Max 3 minutes · Auto-stops at limit</p>

              {hasPermission === false && (
                <div className="voice-perm-warn">
                  <AlertCircle size={14} color="#FFB800" />
                  <span>Microphone blocked — use text mode below</span>
                </div>
              )}

              {/* Manual text fallback */}
              <div className="voice-manual-toggle">
                <button
                  className="voice-manual-btn"
                  onClick={() => setManualMode(m => !m)}
                >
                  {manualMode ? '🎤 Use Voice Instead' : '⌨️ Type Instead (no mic)'}
                </button>
              </div>

              <AnimatePresence>
                {manualMode && (
                  <motion.div
                    className="voice-manual-wrap"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <textarea
                      className="voice-manual-textarea"
                      placeholder={`Explain "${level?.title || 'this topic'}" in your own words… (min 20 characters)`}
                      value={manualText}
                      onChange={e => setManualText(e.target.value)}
                      rows={4}
                    />
                    <button
                      className="voice-submit-btn"
                      onClick={handleManualSubmit}
                      disabled={manualText.trim().length < 20}
                    >
                      <Send size={16} /> Submit Written Explanation
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ── RECORDING ── */}
          {phase === PHASES.RECORDING && (
            <motion.div key="recording" className="voice-recording" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {/* Waveform */}
              <div className="voice-waveform">
                {(audioVolume.length > 0 ? audioVolume : Array(12).fill(8)).map((h, i) => (
                  <motion.div
                    key={i}
                    className="voice-wave-bar"
                    animate={{ height: `${h}px` }}
                    transition={{ duration: 0.1 }}
                  />
                ))}
              </div>
              <div className="voice-rec-badge">
                <span className="voice-rec-dot" />
                REC {formatTime(recSeconds)}
              </div>
              <p className="voice-rec-hint">Speak clearly about the topic. Take your time.</p>
              <motion.button
                className="voice-stop-btn"
                onClick={stopRecording}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.94 }}
              >
                <Square size={20} /> Stop Recording
              </motion.button>
            </motion.div>
          )}

          {/* ── PROCESSING ── */}
          {phase === PHASES.PROCESSING && (
            <motion.div key="processing" className="voice-processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="voice-proc-icon">
                <Loader2 size={32} className="spin" />
              </div>
              <p className="voice-proc-title">Analyzing Your Explanation…</p>
              <p className="voice-proc-sub">AI is evaluating concept coverage &amp; understanding</p>
              {transcript && (
                <div className="voice-transcript-preview">
                  <p className="voice-transcript-label">Transcript detected:</p>
                  <p className="voice-transcript-text">"{transcript.slice(0, 200)}{transcript.length > 200 ? '…' : ''}"</p>
                </div>
              )}
            </motion.div>
          )}

          {/* ── RESULT ── */}
          {phase === PHASES.RESULT && result && (
            <motion.div key="result" className="voice-result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              {/* Score ring */}
              <div className={`voice-score-ring ${result.verified ? 'pass' : 'fail'}`}>
                {result.verified
                  ? <CheckCircle size={28} color="#43E97B" />
                  : <XCircle size={28} color="#FF6584" />}
                <span className="voice-score-val">{result.score ?? 0}%</span>
              </div>

              <h3 className="voice-result-title">
                {result.verified ? '🎙️ Excellent Explanation!' : '💬 Almost There!'}
              </h3>
              <p className="voice-result-sub">{result.feedback}</p>

              {/* Understood / Missed */}
              {result.understood?.length > 0 && (
                <div className="voice-concepts-wrap">
                  <div className="voice-concepts-label understood">
                    <CheckCircle size={13} color="#43E97B" /> Concepts Covered
                  </div>
                  <div className="voice-concepts-list">
                    {result.understood.map((c, i) => (
                      <span key={i} className="voice-concept-chip understood">{c}</span>
                    ))}
                  </div>
                </div>
              )}
              {result.missed?.length > 0 && (
                <div className="voice-concepts-wrap">
                  <div className="voice-concepts-label missed">
                    <XCircle size={13} color="#FF6584" /> Missed Topics
                  </div>
                  <div className="voice-concepts-list">
                    {result.missed.map((c, i) => (
                      <span key={i} className="voice-concept-chip missed">{c}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Playback */}
              {audioURL && (
                <div className="voice-playback">
                  <audio ref={audioRef} src={audioURL} onEnded={() => setIsPlaying(false)} />
                  <button className="voice-play-btn" onClick={togglePlayback}>
                    {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                    {isPlaying ? 'Pause' : 'Play Recording'}
                  </button>
                  <span className="voice-playback-dur">{formatTime(recSeconds)}</span>
                </div>
              )}

              {/* Transcript */}
              {transcript && (
                <details className="voice-transcript-details">
                  <summary className="voice-transcript-toggle">View full transcript</summary>
                  <p className="voice-full-transcript">"{transcript}"</p>
                </details>
              )}

              {/* Actions */}
              <div className="voice-result-actions">
                <button className="voice-retry-btn" onClick={handleRetry}>
                  <RotateCcw size={15} /> Try Again
                </button>
                {result.verified ? (
                  <motion.button
                    className="voice-confirm-btn"
                    onClick={onClose}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Star size={16} /> Continue Journey
                  </motion.button>
                ) : (
                  <button className="voice-confirm-btn alt" onClick={handleRetry}>
                    <Zap size={16} /> Record Better Explanation
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <style>{`
        .voice-overlay {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(0,0,0,0.82); backdrop-filter: blur(10px);
          display: flex; align-items: center; justify-content: center; padding: 1rem;
        }
        .voice-modal {
          background: #12121A; border: 1px solid rgba(108,99,255,0.22);
          border-radius: 22px; padding: 2rem; width: 100%; max-width: 520px;
          max-height: 90vh; overflow-y: auto;
          box-shadow: 0 30px 80px rgba(0,0,0,0.65), 0 0 40px rgba(108,99,255,0.1);
        }
        .voice-header { display: flex; align-items: center; gap: 0.9rem; margin-bottom: 1.2rem; }
        .voice-header-icon {
          width: 42px; height: 42px; border-radius: 12px; flex-shrink: 0;
          background: linear-gradient(135deg, #6C63FF, #9c8dff);
          display: flex; align-items: center; justify-content: center; color: white;
        }
        .voice-header-info { flex: 1; min-width: 0; }
        .voice-title { font-size: 1.1rem; font-weight: 700; color: #fff; margin: 0; }
        .voice-level-name { font-size: 0.78rem; color: #777; margin: 0.2rem 0 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .voice-close {
          background: rgba(255,255,255,0.07); border: none; border-radius: 8px;
          width: 30px; height: 30px; color: #aaa; font-size: 1.1rem; cursor: pointer; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
        }
        .voice-close:hover { background: rgba(255,255,255,0.14); color: white; }
        .voice-topics {
          display: flex; flex-wrap: wrap; align-items: center; gap: 0.4rem;
          margin-bottom: 1.4rem; padding: 0.75rem 0.9rem;
          background: rgba(108,99,255,0.06); border: 1px solid rgba(108,99,255,0.15);
          border-radius: 12px;
        }
        .voice-topics-label { font-size: 0.72rem; font-weight: 600; color: #6C63FF; display: flex; align-items: center; gap: 0.3rem; }
        .voice-topic-chip {
          font-size: 0.72rem; color: #9c8dff; background: rgba(108,99,255,0.12);
          border-radius: 20px; padding: 0.2rem 0.6rem;
        }
        /* IDLE */
        .voice-idle { display: flex; flex-direction: column; align-items: center; gap: 0.8rem; padding: 1rem 0; }
        .voice-mic-container { position: relative; width: 110px; height: 110px; display: flex; align-items: center; justify-content: center; }
        .voice-mic-btn {
          width: 80px; height: 80px; border-radius: 50%; border: none; cursor: pointer;
          background: linear-gradient(135deg, #6C63FF, #9c8dff); color: white;
          display: flex; align-items: center; justify-content: center; z-index: 1; position: relative;
          box-shadow: 0 0 30px rgba(108,99,255,0.5);
          transition: box-shadow 0.2s;
        }
        .voice-mic-btn:hover { box-shadow: 0 0 45px rgba(108,99,255,0.7); }
        .voice-pulse-ring {
          position: absolute; inset: 0; border-radius: 50%;
          border: 2px solid rgba(108,99,255,0.4);
          animation: voicePulse 2s ease-out infinite;
        }
        .voice-pulse-ring.delay { animation-delay: 1s; }
        @keyframes voicePulse {
          0% { transform: scale(0.9); opacity: 0.8; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        .voice-idle-title { font-size: 1.05rem; font-weight: 700; color: #fff; margin: 0.2rem 0 0; }
        .voice-idle-sub { font-size: 0.85rem; color: #888; text-align: center; max-width: 320px; margin: 0; line-height: 1.5; }
        .voice-idle-limit { font-size: 0.75rem; color: #555; margin: 0; }
        .voice-perm-warn {
          display: flex; align-items: center; gap: 0.4rem;
          font-size: 0.78rem; color: #FFB800; background: rgba(255,184,0,0.08);
          border: 1px solid rgba(255,184,0,0.2); border-radius: 8px; padding: 0.5rem 0.8rem;
        }
        .voice-manual-toggle { width: 100%; display: flex; justify-content: center; }
        .voice-manual-btn {
          background: none; border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px; padding: 0.4rem 1rem; color: #777; font-size: 0.8rem;
          cursor: pointer; transition: all 0.18s;
        }
        .voice-manual-btn:hover { border-color: rgba(108,99,255,0.4); color: #9c8dff; }
        .voice-manual-wrap { width: 100%; display: flex; flex-direction: column; gap: 0.7rem; overflow: hidden; }
        .voice-manual-textarea {
          width: 100%; min-height: 100px; resize: vertical;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px; padding: 0.9rem; color: #f0f0f0; font-size: 0.9rem;
          font-family: inherit; line-height: 1.5; box-sizing: border-box;
        }
        .voice-manual-textarea:focus { outline: none; border-color: rgba(108,99,255,0.5); }
        .voice-submit-btn {
          width: 100%; padding: 0.85rem; border-radius: 12px; border: none;
          background: linear-gradient(135deg, #6C63FF, #9c8dff); color: white;
          font-size: 0.92rem; font-weight: 700; cursor: pointer; font-family: inherit;
          display: flex; align-items: center; justify-content: center; gap: 0.5rem;
          transition: opacity 0.2s;
        }
        .voice-submit-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        /* RECORDING */
        .voice-recording { display: flex; flex-direction: column; align-items: center; gap: 1.2rem; padding: 1.5rem 0; }
        .voice-waveform { display: flex; align-items: center; gap: 4px; height: 70px; }
        .voice-wave-bar {
          width: 5px; background: linear-gradient(180deg, #6C63FF, #9c8dff);
          border-radius: 99px; min-height: 4px; transition: height 0.1s;
        }
        .voice-rec-badge {
          display: flex; align-items: center; gap: 0.5rem;
          font-size: 0.82rem; font-weight: 700; color: #FF6584;
          background: rgba(255,101,132,0.1); border: 1px solid rgba(255,101,132,0.2);
          border-radius: 20px; padding: 0.35rem 0.9rem;
        }
        .voice-rec-dot {
          width: 8px; height: 8px; border-radius: 50%; background: #FF6584;
          animation: blink 1s ease-in-out infinite;
        }
        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0.2; } }
        .voice-rec-hint { font-size: 0.82rem; color: #777; margin: 0; }
        .voice-stop-btn {
          padding: 0.85rem 2rem; border-radius: 12px; border: 1px solid rgba(255,101,132,0.4);
          background: rgba(255,101,132,0.1); color: #FF6584; font-size: 0.92rem; font-weight: 700;
          cursor: pointer; display: flex; align-items: center; gap: 0.5rem; font-family: inherit;
          transition: all 0.18s;
        }
        .voice-stop-btn:hover { background: rgba(255,101,132,0.2); }
        /* PROCESSING */
        .voice-processing { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 2rem 0; }
        .voice-proc-icon {
          width: 70px; height: 70px; border-radius: 50%;
          background: linear-gradient(135deg, #6C63FF, #9c8dff);
          display: flex; align-items: center; justify-content: center; color: white;
        }
        .voice-proc-title { font-size: 1rem; font-weight: 700; color: #fff; margin: 0; }
        .voice-proc-sub { font-size: 0.82rem; color: #777; margin: 0; text-align: center; }
        .voice-transcript-preview {
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 10px; padding: 0.8rem; width: 100%;
        }
        .voice-transcript-label { font-size: 0.7rem; color: #555; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 0.3rem; }
        .voice-transcript-text { font-size: 0.82rem; color: #aaa; margin: 0; font-style: italic; line-height: 1.5; }
        /* RESULT */
        .voice-result { display: flex; flex-direction: column; align-items: center; gap: 0.9rem; }
        .voice-score-ring {
          width: 88px; height: 88px; border-radius: 50%; border: 3px solid;
          display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.2rem;
        }
        .voice-score-ring.pass { border-color: #43E97B; background: rgba(67,233,123,0.08); }
        .voice-score-ring.fail { border-color: #FF6584; background: rgba(255,101,132,0.08); }
        .voice-score-val { font-size: 1.1rem; font-weight: 800; color: white; }
        .voice-result-title { font-size: 1.1rem; font-weight: 800; color: #fff; margin: 0; }
        .voice-result-sub { font-size: 0.85rem; color: #888; text-align: center; margin: 0; max-width: 380px; line-height: 1.5; }
        .voice-concepts-wrap { width: 100%; }
        .voice-concepts-label {
          display: flex; align-items: center; gap: 0.4rem;
          font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;
          margin-bottom: 0.4rem;
        }
        .voice-concepts-label.understood { color: #43E97B; }
        .voice-concepts-label.missed { color: #FF6584; }
        .voice-concepts-list { display: flex; flex-wrap: wrap; gap: 0.35rem; }
        .voice-concept-chip { font-size: 0.72rem; border-radius: 20px; padding: 0.2rem 0.6rem; }
        .voice-concept-chip.understood { color: #43E97B; background: rgba(67,233,123,0.1); }
        .voice-concept-chip.missed { color: #FF6584; background: rgba(255,101,132,0.1); }
        .voice-playback {
          display: flex; align-items: center; gap: 0.8rem; width: 100%;
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 10px; padding: 0.7rem 1rem;
        }
        .voice-play-btn {
          display: flex; align-items: center; gap: 0.4rem;
          background: rgba(108,99,255,0.15); border: 1px solid rgba(108,99,255,0.3);
          border-radius: 8px; padding: 0.4rem 0.8rem; color: #9c8dff; font-size: 0.82rem;
          cursor: pointer; transition: all 0.18s;
        }
        .voice-play-btn:hover { background: rgba(108,99,255,0.25); }
        .voice-playback-dur { font-size: 0.78rem; color: #666; margin-left: auto; }
        .voice-transcript-details { width: 100%; }
        .voice-transcript-toggle {
          font-size: 0.78rem; color: #555; cursor: pointer; list-style: none;
          padding: 0.4rem 0;
        }
        .voice-transcript-toggle:hover { color: #888; }
        .voice-full-transcript {
          font-size: 0.8rem; color: #777; font-style: italic; line-height: 1.6;
          background: rgba(255,255,255,0.03); border-radius: 8px; padding: 0.7rem;
          margin: 0.4rem 0 0;
        }
        .voice-result-actions { display: flex; gap: 0.8rem; width: 100%; }
        .voice-retry-btn {
          flex: 1; padding: 0.8rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.05); color: #bbb; font-size: 0.88rem; font-weight: 600;
          cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.4rem;
          font-family: inherit; transition: all 0.18s;
        }
        .voice-retry-btn:hover { border-color: rgba(108,99,255,0.35); color: #9c8dff; }
        .voice-confirm-btn {
          flex: 2; padding: 0.85rem; border-radius: 12px; border: none;
          background: linear-gradient(135deg, #6C63FF, #9c8dff); color: white;
          font-size: 0.9rem; font-weight: 700; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 0.5rem;
          font-family: inherit; box-shadow: 0 0 20px rgba(108,99,255,0.3); transition: opacity 0.2s;
        }
        .voice-confirm-btn.alt { background: linear-gradient(135deg, #FF6584, #ff8fa3); box-shadow: 0 0 20px rgba(255,101,132,0.3); }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
