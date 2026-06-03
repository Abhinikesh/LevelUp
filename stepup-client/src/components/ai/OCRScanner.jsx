import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Camera, Upload, Scan, Loader2, ImagePlus,
  CheckCircle, AlertCircle, X, FileImage, Sparkles, ZoomIn
} from 'lucide-react'
import { aiApi } from '../../api/client'
import toast from 'react-hot-toast'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_MB = 10

export default function OCRScanner({ onRoadmapGenerated, onClose }) {
  const [file, setFile]         = useState(null)
  const [preview, setPreview]   = useState(null)
  const [dragging, setDragging] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [phase, setPhase]       = useState('idle') // idle | scanning | done | error
  const [errorMsg, setErrorMsg] = useState('')
  const inputRef                = useRef(null)
  const cameraRef               = useRef(null)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [stream, setStream]     = useState(null)

  const resetFile = () => {
    setFile(null)
    setPreview(null)
    setPhase('idle')
    setErrorMsg('')
  }

  const processFile = (f) => {
    if (!f) return
    if (!ACCEPTED_TYPES.includes(f.type)) {
      toast.error('Please upload a JPEG, PNG, or WebP image.')
      return
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      toast.error(`Image must be under ${MAX_MB}MB.`)
      return
    }
    setFile(f)
    setPhase('idle')
    const reader = new FileReader()
    reader.onloadend = () => setPreview(reader.result)
    reader.readAsDataURL(f)
  }

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) processFile(dropped)
  }, [])

  const handleDragOver = (e) => { e.preventDefault(); setDragging(true) }
  const handleDragLeave = () => setDragging(false)

  // Camera capture
  const openCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      setStream(mediaStream)
      setCameraOpen(true)
      setTimeout(() => {
        if (cameraRef.current) cameraRef.current.srcObject = mediaStream
      }, 100)
    } catch {
      toast.error('Camera access denied or unavailable.')
    }
  }

  const closeCamera = () => {
    stream?.getTracks().forEach(t => t.stop())
    setStream(null)
    setCameraOpen(false)
  }

  const capturePhoto = () => {
    const video = cameraRef.current
    if (!video) return
    const canvas = document.createElement('canvas')
    canvas.width  = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    canvas.toBlob((blob) => {
      if (!blob) return
      const captured = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' })
      processFile(captured)
      closeCamera()
    }, 'image/jpeg', 0.92)
  }

  const handleScan = async () => {
    if (!file) { toast.error('Please upload or capture an image first.'); return }
    setScanning(true)
    setPhase('scanning')
    try {
      const formData = new FormData()
      formData.append('image', file)
      const res = await aiApi.generateFromImage(formData)
      const { roadmap, levels } = res.data
      setPhase('done')
      toast.success(`📖 Scanned & generated "${roadmap.title}" with ${levels.length} levels!`)
      setTimeout(() => onRoadmapGenerated({ roadmap, levels }), 700)
    } catch (err) {
      console.error(err)
      const msg = err.response?.data?.message || 'OCR scan failed. Please try again.'
      setErrorMsg(msg)
      setPhase('error')
      toast.error(msg)
    } finally {
      setScanning(false)
    }
  }

  return (
    <div className="ocr-overlay">
      <motion.div
        className="ocr-modal"
        initial={{ opacity: 0, scale: 0.93, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 30 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      >
        {/* Header */}
        <div className="ocr-header">
          <div className="ocr-header-icon">
            <Scan size={22} />
          </div>
          <div>
            <h2 className="ocr-title">OCR Scanner</h2>
            <p className="ocr-subtitle">Scan a syllabus, notes, or textbook. AI extracts & builds your roadmap.</p>
          </div>
          <button className="ocr-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        {/* Drop zone / preview */}
        <AnimatePresence mode="wait">
          {!preview ? (
            <motion.div
              key="dropzone"
              className={`ocr-dropzone ${dragging ? 'dragging' : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => inputRef.current?.click()}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={e => processFile(e.target.files[0])}
              />
              <div className="ocr-dropzone-icon">
                <ImagePlus size={32} />
              </div>
              <p className="ocr-dropzone-main">Drop your image here or click to upload</p>
              <p className="ocr-dropzone-sub">JPEG, PNG, WebP · Max {MAX_MB}MB</p>
              <div className="ocr-dropzone-actions">
                <button
                  className="ocr-btn-secondary"
                  onClick={e => { e.stopPropagation(); inputRef.current?.click() }}
                >
                  <Upload size={15} /> Upload File
                </button>
                <button
                  className="ocr-btn-secondary"
                  onClick={e => { e.stopPropagation(); openCamera() }}
                >
                  <Camera size={15} /> Use Camera
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="preview"
              className="ocr-preview-wrap"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="ocr-preview-img-wrap">
                <img src={preview} alt="Uploaded scan" className="ocr-preview-img" />
                {phase === 'scanning' && (
                  <div className="ocr-scan-overlay">
                    <motion.div
                      className="ocr-scan-line"
                      initial={{ top: '0%' }}
                      animate={{ top: '100%' }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    />
                    <div className="ocr-scan-label">
                      <Scan size={14} /> Scanning…
                    </div>
                  </div>
                )}
                {phase === 'done' && (
                  <div className="ocr-done-overlay">
                    <CheckCircle size={40} color="#43E97B" />
                    <span>Extracted!</span>
                  </div>
                )}
                {phase === 'error' && (
                  <div className="ocr-error-overlay">
                    <AlertCircle size={40} color="#FF6584" />
                    <span>{errorMsg}</span>
                  </div>
                )}
              </div>
              <div className="ocr-preview-meta">
                <FileImage size={14} />
                <span>{file?.name}</span>
                <span className="ocr-file-size">({(file?.size / 1024).toFixed(0)} KB)</span>
                <button className="ocr-remove-btn" onClick={resetFile}><X size={13} /></button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scan button */}
        <motion.button
          className="ocr-scan-btn"
          onClick={handleScan}
          disabled={!file || scanning || phase === 'done'}
          whileHover={file && !scanning ? { scale: 1.03, y: -1 } : {}}
          whileTap={file && !scanning ? { scale: 0.97 } : {}}
        >
          {scanning ? (
            <><Loader2 size={20} className="spin" /> Scanning &amp; Building Roadmap…</>
          ) : phase === 'done' ? (
            <><CheckCircle size={20} /> Roadmap Generated!</>
          ) : (
            <><Sparkles size={20} /> Scan &amp; Generate Roadmap</>
          )}
        </motion.button>

        <p className="ocr-hint">
          <ZoomIn size={12} /> Works best with clear, well-lit syllabi or handwritten notes
        </p>
      </motion.div>

      {/* Camera modal */}
      <AnimatePresence>
        {cameraOpen && (
          <motion.div
            className="ocr-camera-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="ocr-camera-inner">
              <video ref={cameraRef} autoPlay playsInline className="ocr-camera-video" />
              <div className="ocr-camera-controls">
                <button className="ocr-camera-close" onClick={closeCamera}><X size={20} /></button>
                <button className="ocr-camera-capture" onClick={capturePhoto}>
                  <Camera size={24} />
                </button>
              </div>
              <p className="ocr-camera-hint">Point at your notes, then tap the button</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .ocr-overlay {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(0,0,0,0.78);
          backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center; padding: 1rem;
        }
        .ocr-modal {
          background: #12121A; border: 1px solid rgba(67,233,123,0.2);
          border-radius: 20px; padding: 2rem; width: 100%; max-width: 520px;
          max-height: 90vh; overflow-y: auto;
          box-shadow: 0 30px 80px rgba(0,0,0,0.6), 0 0 40px rgba(67,233,123,0.08);
        }
        .ocr-header { display: flex; align-items: flex-start; gap: 1rem; margin-bottom: 1.6rem; }
        .ocr-header-icon {
          width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;
          background: linear-gradient(135deg, #43E97B, #38f9d7);
          display: flex; align-items: center; justify-content: center;
          color: #0A0A0F; box-shadow: 0 0 20px rgba(67,233,123,0.35);
        }
        .ocr-title { font-size: 1.2rem; font-weight: 700; color: #fff; margin: 0 0 0.2rem; }
        .ocr-subtitle { font-size: 0.82rem; color: #777; margin: 0; }
        .ocr-close {
          margin-left: auto; background: rgba(255,255,255,0.07);
          border: none; border-radius: 8px; width: 32px; height: 32px;
          color: #aaa; font-size: 1.2rem; cursor: pointer; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.2s;
        }
        .ocr-close:hover { background: rgba(255,255,255,0.14); color: white; }
        .ocr-dropzone {
          border: 2px dashed rgba(67,233,123,0.25); border-radius: 16px;
          padding: 2.5rem 1.5rem; cursor: pointer; text-align: center;
          transition: all 0.2s; margin-bottom: 1.2rem;
          background: rgba(67,233,123,0.03);
        }
        .ocr-dropzone:hover, .ocr-dropzone.dragging {
          border-color: rgba(67,233,123,0.6); background: rgba(67,233,123,0.07);
        }
        .ocr-dropzone-icon { color: #43E97B; margin-bottom: 0.8rem; opacity: 0.7; }
        .ocr-dropzone-main { color: #ccc; font-size: 0.95rem; margin: 0 0 0.3rem; }
        .ocr-dropzone-sub { color: #555; font-size: 0.78rem; margin: 0 0 1rem; }
        .ocr-dropzone-actions { display: flex; gap: 0.8rem; justify-content: center; flex-wrap: wrap; }
        .ocr-btn-secondary {
          display: flex; align-items: center; gap: 0.4rem;
          padding: 0.55rem 1rem; border-radius: 10px; border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.05); color: #bbb; font-size: 0.82rem;
          cursor: pointer; transition: all 0.18s; font-family: inherit;
        }
        .ocr-btn-secondary:hover { border-color: rgba(67,233,123,0.4); color: #43E97B; background: rgba(67,233,123,0.08); }
        .ocr-preview-wrap { margin-bottom: 1.2rem; }
        .ocr-preview-img-wrap { position: relative; border-radius: 12px; overflow: hidden; max-height: 260px; }
        .ocr-preview-img { width: 100%; object-fit: cover; max-height: 260px; display: block; }
        .ocr-scan-overlay {
          position: absolute; inset: 0; background: rgba(0,0,0,0.35);
          display: flex; align-items: center; justify-content: center;
        }
        .ocr-scan-line {
          position: absolute; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, transparent, #43E97B, transparent);
          box-shadow: 0 0 12px rgba(67,233,123,0.8);
        }
        .ocr-scan-label {
          position: absolute; bottom: 0.8rem; left: 50%; transform: translateX(-50%);
          background: rgba(0,0,0,0.7); color: #43E97B; font-size: 0.78rem;
          padding: 0.3rem 0.8rem; border-radius: 20px; display: flex; gap: 0.3rem; align-items: center;
        }
        .ocr-done-overlay {
          position: absolute; inset: 0; background: rgba(0,0,0,0.55);
          display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.5rem;
          color: #43E97B; font-weight: 700;
        }
        .ocr-error-overlay {
          position: absolute; inset: 0; background: rgba(0,0,0,0.55);
          display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.5rem;
          color: #FF6584; font-size: 0.82rem; padding: 1rem; text-align: center;
        }
        .ocr-preview-meta {
          display: flex; align-items: center; gap: 0.5rem; margin-top: 0.6rem;
          font-size: 0.78rem; color: #777;
        }
        .ocr-file-size { color: #555; }
        .ocr-remove-btn {
          margin-left: auto; background: rgba(255,101,132,0.12); border: none;
          border-radius: 6px; color: #FF6584; padding: 0.25rem 0.4rem; cursor: pointer;
          display: flex; align-items: center; transition: background 0.2s;
        }
        .ocr-remove-btn:hover { background: rgba(255,101,132,0.25); }
        .ocr-scan-btn {
          width: 100%; padding: 0.95rem; border-radius: 14px; border: none;
          background: linear-gradient(135deg, #43E97B, #38f9d7);
          color: #0A0A0F; font-size: 1rem; font-weight: 700; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 0.6rem;
          margin-bottom: 0.8rem; font-family: inherit; box-shadow: 0 0 25px rgba(67,233,123,0.3);
          transition: opacity 0.2s;
        }
        .ocr-scan-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .ocr-hint {
          display: flex; align-items: center; justify-content: center; gap: 0.3rem;
          font-size: 0.72rem; color: #444; margin: 0;
        }
        .ocr-camera-modal {
          position: fixed; inset: 0; z-index: 2000;
          background: rgba(0,0,0,0.9); display: flex; align-items: center; justify-content: center;
        }
        .ocr-camera-inner { position: relative; width: 100%; max-width: 480px; }
        .ocr-camera-video { width: 100%; border-radius: 16px; display: block; }
        .ocr-camera-controls {
          display: flex; justify-content: center; gap: 1.5rem; margin-top: 1.2rem; align-items: center;
        }
        .ocr-camera-capture {
          width: 64px; height: 64px; border-radius: 50%; border: 3px solid white;
          background: white; color: #0A0A0F; cursor: pointer; display: flex;
          align-items: center; justify-content: center; transition: transform 0.15s;
        }
        .ocr-camera-capture:active { transform: scale(0.92); }
        .ocr-camera-close {
          width: 44px; height: 44px; border-radius: 50%; border: none;
          background: rgba(255,255,255,0.12); color: white; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
        }
        .ocr-camera-hint { color: #777; font-size: 0.8rem; text-align: center; margin-top: 0.8rem; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
