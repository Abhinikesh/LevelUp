import axios from 'axios'
import useAuthStore from '../store/authStore'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// Longer timeout instance for AI calls (GPT-4o can be slow)
const aiAxios = axios.create({
  baseURL: API_BASE_URL,
  timeout: 90000,
  headers: { 'Content-Type': 'application/json' },
})

// ── Request interceptor: attach JWT ────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ── Response interceptor: handle 401 globally ──────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — log the user out
      useAuthStore.getState().logout()
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// ── Auth endpoints ─────────────────────────────────────────────────────────────
export const authApi = {
  register:       (data) => api.post('/auth/register', data),
  login:          (data) => api.post('/auth/login', data),
  getMe:          ()     => api.get('/auth/me'),
  updateProfile:  (data) => api.patch('/auth/update-profile', data),
  changePassword: (data) => api.patch('/auth/change-password', data),
}

// ── Roadmap endpoints ──────────────────────────────────────────────────────────
export const roadmapApi = {
  getAll:    ()           => api.get('/roadmaps'),
  getById:   (id)         => api.get(`/roadmaps/${id}`),
  create:    (data)       => api.post('/roadmaps', data),
  update:    (id, data)   => api.patch(`/roadmaps/${id}`, data),
  remove:    (id)         => api.delete(`/roadmaps/${id}`),
}

// ── Level endpoints ────────────────────────────────────────────────────────────
export const levelApi = {
  getByRoadmap: (roadmapId)        => api.get(`/levels?roadmapId=${roadmapId}`),
  getById:      (id)               => api.get(`/levels/${id}`),
  create:       (data)             => api.post('/levels', data),
  complete:     (id, proofData)    => api.post(`/levels/${id}/complete`, proofData),
}

// ── Social endpoints ─────────────────────────────────────────────────────────────
export const socialApi = {
  search:        (q)       => api.get(`/social/search?q=${encodeURIComponent(q)}`),
  getFriends:    ()        => api.get('/social/friends'),
  addFriend:     (data)    => api.post('/social/friends/add', data),
  acceptFriend:  (userId)  => api.put(`/social/friends/accept/${userId}`),
  removeFriend:  (userId)  => api.delete(`/social/friends/${userId}`),
  leaderboard:   (params)  => api.get('/social/leaderboard', { params }),
}

// ── User endpoints ────────────────────────────────────────────────────────────────
export const userApi = {
  getProfile:    ()       => api.get('/users/profile'),
  updateProfile: (data)   => api.put('/users/profile', data),
  getHistory:    (page)   => api.get(`/users/history?page=${page}&limit=20`),
  getBadges:     ()       => api.get('/users/badges'),
  getTrophies:   ()       => api.get('/users/trophies'),
}

// ── Coach endpoints ───────────────────────────────────────────────────────────────
export const coachApi = {
  chat: (messages, levelId) => api.post('/coach/chat', { messages, levelId }),
}

// ── Gym endpoints ─────────────────────────────────────────────────────────────────
export const gymApi = {
  getChallenge: (levelId, type) => api.get(`/levels/${levelId}/gym`, { params: { type } }),
}

// ── Notification endpoints ────────────────────────────────────────────────────────
export const notificationApi = {
  getHistory:    ()           => api.get('/notifications'),
  markRead:      (id)         => api.post(`/notifications/${id}/read`),
  markAllRead:   ()           => api.post('/notifications/read-all'),
  registerToken: (token)      => api.post('/notifications/token', { token }),
  getPrefs:      ()           => api.get('/notifications/prefs'),
  updatePrefs:   (prefs)      => api.put('/notifications/prefs', prefs),
}

// ── AI axios interceptors (same auth token) ───────────────────────────────────
aiAxios.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

aiAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      if (window.location.pathname !== '/login') window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ── AI endpoints ───────────────────────────────────────────────────────────────
export const aiApi = {
  // Generate roadmap from text description
  generateRoadmap: (data) =>
    aiAxios.post('/ai/generate-roadmap', data),

  // Generate roadmap from image (OCR) — FormData upload
  generateFromImage: (formData) =>
    aiAxios.post('/ai/generate-from-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // Generate / refresh quiz questions for a level
  generateQuiz: (levelId) =>
    aiAxios.post(`/ai/generate-quiz/${levelId}`),

  // Submit photo proof for AI verification — FormData upload
  verifyPhoto: (formData) =>
    aiAxios.post('/ai/verify-photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // Submit voice transcript for evaluation
  verifyVoice: (data) =>
    aiAxios.post('/ai/verify-voice', data),

  // Upload audio recording for Whisper STT transcription
  transcribeVoice: (formData) =>
    aiAxios.post('/ai/transcribe-voice', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
}

export default api

