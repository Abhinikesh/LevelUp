const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/auth');
const {
  generateRoadmap,
  generateFromImage,
  generateQuiz,
  verifyPhoto,
  verifyVoice,
  transcribeVoice
} = require('../controllers/aiController');

// ── Ensure uploads directory exists ─────────────────────────────────────────
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ── Multer storage config for images ────────────────────────────────────────
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `img_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`);
  }
});

const imageFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, WebP, and GIF images are allowed.'), false);
  }
};

const uploadImage = multer({
  storage: imageStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB
});

// ── Multer storage config for audio ─────────────────────────────────────────
const audioStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.webm';
    cb(null, `audio_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`);
  }
});

const audioFilter = (req, file, cb) => {
  const allowed = ['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/x-m4a', 'application/octet-stream'];
  if (allowed.includes(file.mimetype) || file.originalname.match(/\.(webm|mp4|mp3|wav|ogg|m4a)$/i)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported audio format.'), false);
  }
};

const uploadAudio = multer({
  storage: audioStorage,
  fileFilter: audioFilter,
  limits: { fileSize: 25 * 1024 * 1024 } // 25 MB for audio
});

// ── Multer error middleware ───────────────────────────────────────────────────
function handleMulterError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'File too large. Max allowed size exceeded.' });
    }
    return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
  }
  if (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next();
}

// ─────────────────────────────────────────────────────────────────────────────
// AI Routes — All protected
// ─────────────────────────────────────────────────────────────────────────────

// @route   POST /api/ai/generate-roadmap
// @desc    Generate a roadmap from a text goal via AI
// @access  Protected
router.post('/generate-roadmap', protect, generateRoadmap);

// @route   POST /api/ai/generate-from-image
// @desc    Upload an image (syllabus/notes) and generate a roadmap via OCR+AI
// @access  Protected
router.post(
  '/generate-from-image',
  protect,
  (req, res, next) => uploadImage.single('image')(req, res, (err) => handleMulterError(err, req, res, next)),
  generateFromImage
);

// @route   POST /api/ai/generate-quiz/:levelId
// @desc    Generate or refresh AI quiz questions for a specific level
// @access  Protected
router.post('/generate-quiz/:levelId', protect, generateQuiz);

// @route   POST /api/ai/verify-photo
// @desc    Submit a photo proof image to be verified by AI
// @access  Protected
router.post(
  '/verify-photo',
  protect,
  (req, res, next) => uploadImage.single('image')(req, res, (err) => handleMulterError(err, req, res, next)),
  verifyPhoto
);

// @route   POST /api/ai/verify-voice
// @desc    Submit a speech transcript to be evaluated by AI
// @access  Protected
router.post('/verify-voice', protect, verifyVoice);

// @route   POST /api/ai/transcribe-voice
// @desc    Upload an audio recording and transcribe it with Whisper AI
// @access  Protected
router.post(
  '/transcribe-voice',
  protect,
  (req, res, next) => uploadAudio.single('audio')(req, res, (err) => handleMulterError(err, req, res, next)),
  transcribeVoice
);

module.exports = router;
