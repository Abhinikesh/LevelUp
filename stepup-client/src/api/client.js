import axios from 'axios'
import useAuthStore from '../store/authStore'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
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

export default api
