const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');
const Roadmap = require('../models/Roadmap');
const Level = require('../models/Level');
const User = require('../models/User');
const LevelCompletion = require('../models/LevelCompletion');
const { checkAndAwardBadges } = require('./userController');
const {
  generateRoadmapFromText,
  generateRoadmapFromImage,
  generateQuizForLevel,
  verifyPhotoProof,
  evaluateVoiceExplanation
} = require('../utils/aiService');

// Helper to safely convert file to base64
function fileToBase64(filePath) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    return fileBuffer.toString('base64');
  } catch (err) {
    console.error('[aiController] fileToBase64 conversion failed:', err.message);
    return '';
  }
}

/**
 * POST /api/ai/generate-roadmap
 * Body: { userInput, deadline, type }
 */
const generateRoadmap = async (req, res) => {
  try {
    const { userInput, deadline, type } = req.body;
    if (!userInput) {
      return res.status(400).json({ success: false, message: 'userInput is required' });
    }

    // Call AI service
    const roadmapData = await generateRoadmapFromText(userInput, deadline, type);

    // Save Roadmap to DB
    const roadmap = await Roadmap.create({
      userId: req.user._id,
      title: roadmapData.title || 'AI Roadmap',
      description: userInput.slice(0, 480),
      type: roadmapData.type || type || 'custom',
      source: 'ai',
      totalLevels: roadmapData.levels?.length || 0,
      currentLevel: 1,
      isCompleted: false,
      deadline: deadline ? new Date(deadline) : null
    });

    // Save Levels to DB
    const levels = [];
    if (roadmapData.levels && Array.isArray(roadmapData.levels)) {
      for (const l of roadmapData.levels) {
        const quizQuestions = l.quizQuestions?.map((q, idx) => ({
          question: q.question,
          options: q.options || [],
          correctIndex: typeof q.correctAnswer === 'string' 
            ? ['A', 'B', 'C', 'D'].indexOf(q.correctAnswer.toUpperCase())
            : q.correctIndex || 0,
          explanation: q.explanation || ''
        })) || [];

        const createdLvl = await Level.create({
          roadmapId: roadmap._id,
          levelNumber: l.levelNumber,
          title: l.title,
          description: l.description || '',
          proofType: l.proofType || 'text',
          estimatedMinutes: l.estimatedMinutes || 45,
          xpReward: l.xpReward || 100,
          topics: l.topics || [],
          quizQuestions: quizQuestions,
          isLocked: l.levelNumber === 1 ? false : true
        });
        levels.push(createdLvl);
      }
    }

    return res.status(200).json({ success: true, roadmap, levels });
  } catch (err) {
    console.error('[aiController] generate-roadmap failed:', err);
    return res.status(500).json({ success: false, message: err.message || 'AI generation failed' });
  }
};

/**
 * POST /api/ai/generate-from-image
 * Multipart upload: image file
 */
const generateFromImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an image file.' });
    }

    const imageBase64 = fileToBase64(req.file.path);
    const mimeType = req.file.mimetype;

    // Call OCR Image generation
    const roadmapData = await generateRoadmapFromImage(imageBase64, mimeType);

    // Save Roadmap to DB
    const roadmap = await Roadmap.create({
      userId: req.user._id,
      title: roadmapData.title || 'OCR Generated Roadmap',
      description: 'Extracted from image: ' + (req.file.originalname || ''),
      type: roadmapData.type || 'custom',
      source: 'ocr',
      totalLevels: roadmapData.levels?.length || 0,
      currentLevel: 1,
      isCompleted: false
    });

    // Save Levels
    const levels = [];
    if (roadmapData.levels && Array.isArray(roadmapData.levels)) {
      for (const l of roadmapData.levels) {
        const quizQuestions = l.quizQuestions?.map((q) => ({
          question: q.question,
          options: q.options || [],
          correctIndex: typeof q.correctAnswer === 'string'
            ? ['A', 'B', 'C', 'D'].indexOf(q.correctAnswer.toUpperCase())
            : q.correctIndex || 0,
          explanation: q.explanation || ''
        })) || [];

        const createdLvl = await Level.create({
          roadmapId: roadmap._id,
          levelNumber: l.levelNumber,
          title: l.title,
          description: l.description || '',
          proofType: l.proofType || 'text',
          estimatedMinutes: l.estimatedMinutes || 45,
          xpReward: l.xpReward || 100,
          topics: l.topics || [],
          quizQuestions,
          isLocked: l.levelNumber === 1 ? false : true
        });
        levels.push(createdLvl);
      }
    }

    // Clean up uploaded file
    try { fs.unlinkSync(req.file.path); } catch {}

    return res.status(200).json({ success: true, roadmap, levels });
  } catch (err) {
    console.error('[aiController] generate-from-image failed:', err);
    // Cleanup if file exists
    if (req.file) { try { fs.unlinkSync(req.file.path); } catch {} }
    return res.status(500).json({ success: false, message: err.message || 'Image processing failed' });
  }
};

/**
 * POST /api/ai/generate-quiz/:levelId
 */
const generateQuiz = async (req, res) => {
  try {
    const level = await Level.findById(req.params.levelId);
    if (!level) {
      return res.status(404).json({ success: false, message: 'Level not found' });
    }

    // Verify ownership
    const roadmap = await Roadmap.findOne({ _id: level.roadmapId, userId: req.user._id });
    if (!roadmap) {
      return res.status(403).json({ success: false, message: 'Unauthorized access' });
    }

    // Generate
    const questions = await generateQuizForLevel(level.title, level.description, level.topics);

    // Format for DB insertion
    const dbQuizQuestions = questions.map((q) => ({
      question: q.question,
      options: q.options || [],
      correctIndex: typeof q.correctAnswer === 'string'
        ? ['A', 'B', 'C', 'D'].indexOf(q.correctAnswer.toUpperCase())
        : q.correctIndex || 0,
      explanation: q.explanation || ''
    }));

    // Cache quiz in level
    level.quizCache = questions;
    level.quizQuestions = dbQuizQuestions;
    await level.save();

    return res.status(200).json({ success: true, questions });
  } catch (err) {
    console.error('[aiController] generate-quiz failed:', err);
    return res.status(500).json({ success: false, message: err.message || 'Quiz generation failed' });
  }
};

/**
 * POST /api/ai/verify-photo
 * Multipart body: { levelId, image }
 */
const verifyPhoto = async (req, res) => {
  try {
    const { levelId } = req.body;
    if (!levelId || !req.file) {
      return res.status(400).json({ success: false, message: 'levelId and image are required' });
    }

    const level = await Level.findById(levelId);
    if (!level) {
      return res.status(404).json({ success: false, message: 'Level not found' });
    }

    const roadmap = await Roadmap.findOne({ _id: level.roadmapId, userId: req.user._id });
    if (!roadmap) {
      return res.status(403).json({ success: false, message: 'Unauthorized access' });
    }

    const base64 = fileToBase64(req.file.path);
    
    // Call Vision check
    const verification = await verifyPhotoProof(base64, level.title, level.description);

    let completion = null;
    let userStats = null;
    let nextLevelUnlocked = false;
    let roadmapCompleted = false;
    let newBadges = [];

    if (verification.verified) {
      // Execute clearance logic
      level.isCompleted = true;
      level.completedAt = new Date();
      await level.save();

      // Create completion log
      completion = await LevelCompletion.create({
        levelId: level._id,
        userId: req.user._id,
        roadmapId: roadmap._id,
        proofUrl: `/uploads/${req.file.filename}`,
        proofType: 'photo',
        proofData: { verification },
        aiVerified: true,
        aiVerificationScore: verification.confidence || 95,
        aiVerificationNotes: verification.reason || 'Approved by AI Auditing System',
        xpEarned: level.xpReward
      });

      // Update User XP & Streak
      const user = await User.findById(req.user._id);
      user.xpTotal += level.xpReward;
      
      const now = new Date();
      user.lastActiveDate = now;
      await user.save();

      // Check Badges
      newBadges = await checkAndAwardBadges(user);

      // Unlock next
      const nextLevel = await Level.findOne({
        roadmapId: roadmap._id,
        levelNumber: level.levelNumber + 1
      });

      if (nextLevel) {
        nextLevel.isLocked = false;
        await nextLevel.save();
        roadmap.currentLevel = level.levelNumber + 1;
        await roadmap.save();
        nextLevelUnlocked = true;
      } else {
        roadmap.isCompleted = true;
        roadmap.completedAt = now;
        await roadmap.save();
        roadmapCompleted = true;
      }

      userStats = {
        xpTotal: user.xpTotal,
        streakCount: user.streakCount,
        level: Math.floor(user.xpTotal / 500) + 1
      };
    }

    // Clean up uploaded file if not verified (if verified, we keep it under uploads)
    if (!verification.verified) {
      try { fs.unlinkSync(req.file.path); } catch {}
    }

    return res.status(200).json({
      success: true,
      verified: verification.verified,
      confidence: verification.confidence,
      reason: verification.reason,
      feedback: verification.feedback,
      xpEarned: verification.verified ? level.xpReward : 0,
      completion,
      user: userStats,
      nextLevelUnlocked,
      roadmapCompleted,
      newBadges
    });

  } catch (err) {
    console.error('[aiController] verify-photo failed:', err);
    if (req.file) { try { fs.unlinkSync(req.file.path); } catch {} }
    return res.status(500).json({ success: false, message: err.message || 'Photo verification failed' });
  }
};

/**
 * POST /api/ai/verify-voice
 * Body: { transcript, levelId }
 */
const verifyVoice = async (req, res) => {
  try {
    const { transcript, levelId } = req.body;
    if (!levelId || !transcript) {
      return res.status(400).json({ success: false, message: 'levelId and transcript are required' });
    }

    const level = await Level.findById(levelId);
    if (!level) {
      return res.status(404).json({ success: false, message: 'Level not found' });
    }

    const roadmap = await Roadmap.findOne({ _id: level.roadmapId, userId: req.user._id });
    if (!roadmap) {
      return res.status(403).json({ success: false, message: 'Unauthorized access' });
    }

    // Evaluate
    const evaluation = await evaluateVoiceExplanation(transcript, level.title, level.topics || []);

    let completion = null;
    let userStats = null;
    let nextLevelUnlocked = false;
    let roadmapCompleted = false;
    let newBadges = [];

    if (evaluation.verified) {
      level.isCompleted = true;
      level.completedAt = new Date();
      await level.save();

      completion = await LevelCompletion.create({
        levelId: level._id,
        userId: req.user._id,
        roadmapId: roadmap._id,
        proofType: 'voice',
        proofData: { transcript, evaluation },
        aiVerified: true,
        aiVerificationScore: evaluation.score || 80,
        aiVerificationNotes: evaluation.feedback || 'Voice explained and verified.',
        xpEarned: level.xpReward
      });

      const user = await User.findById(req.user._id);
      user.xpTotal += level.xpReward;
      const now = new Date();
      user.lastActiveDate = now;
      await user.save();

      newBadges = await checkAndAwardBadges(user);

      const nextLevel = await Level.findOne({
        roadmapId: roadmap._id,
        levelNumber: level.levelNumber + 1
      });

      if (nextLevel) {
        nextLevel.isLocked = false;
        await nextLevel.save();
        roadmap.currentLevel = level.levelNumber + 1;
        await roadmap.save();
        nextLevelUnlocked = true;
      } else {
        roadmap.isCompleted = true;
        roadmap.completedAt = now;
        await roadmap.save();
        roadmapCompleted = true;
      }

      userStats = {
        xpTotal: user.xpTotal,
        streakCount: user.streakCount,
        level: Math.floor(user.xpTotal / 500) + 1
      };
    }

    return res.status(200).json({
      success: true,
      verified: evaluation.verified,
      score: evaluation.score,
      understood: evaluation.understood,
      missed: evaluation.missed,
      feedback: evaluation.feedback,
      completion,
      user: userStats,
      nextLevelUnlocked,
      roadmapCompleted,
      newBadges
    });

  } catch (err) {
    console.error('[aiController] verify-voice failed:', err);
    return res.status(500).json({ success: false, message: err.message || 'Voice verification failed' });
  }
};

/**
 * POST /api/ai/transcribe-voice
 * Multipart body: { audio }
 */
const transcribeVoice = async (asyncReq, res) => {
  // Rename req to asyncReq to avoid conflict
  try {
    if (!asyncReq.file) {
      return res.status(400).json({ success: false, message: 'Audio file is required.' });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    const isWhisperActive = apiKey && apiKey !== 'your_key_here';

    let transcript = '';

    if (isWhisperActive) {
      const openaiInstance = new OpenAI({ apiKey });
      const transcriptionResponse = await openaiInstance.audio.transcriptions.create({
        file: fs.createReadStream(asyncReq.file.path),
        model: 'whisper-1'
      });
      transcript = transcriptionResponse.text;
    } else {
      // Mock Whisper transcription
      transcript = 'This is my verbal response explaining binary trees traversal algorithms in depth. Stacks are used in DFS preorder traversals and dynamic arrays help allocate target pivot nodes efficiently.';
    }

    // Clean up uploaded file
    try { fs.unlinkSync(asyncReq.file.path); } catch {}

    return res.status(200).json({ success: true, transcript });
  } catch (err) {
    console.error('[aiController] transcribe-voice failed:', err);
    if (asyncReq.file) { try { fs.unlinkSync(asyncReq.file.path); } catch {} }
    return res.status(500).json({ success: false, message: err.message || 'Speech-to-Text translation failed' });
  }
};

module.exports = {
  generateRoadmap,
  generateFromImage,
  generateQuiz,
  verifyPhoto,
  verifyVoice,
  transcribeVoice
};
