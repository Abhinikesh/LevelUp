import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

const useAuthStore = create(
  persist(
    (set, get) => ({
      user:          null,
      token:         null,
      isLoading:     false,
      isInitialized: false,

      // ── Actions ────────────────────────────────────────────
      setAuth: (user, token) => set({ user, token }),

      setUser: (user) => set({ user }),

      setLoading: (isLoading) => set({ isLoading }),

      logout: () => set({ user: null, token: null }),

      initialize: () => set({ isInitialized: true }),

      // ── Selectors (derived state) ──────────────────────────
      isAuthenticated: () => {
        const { user, token } = get()
        return !!(user && token)
      },

      getLevel: () => {
        const { user } = get()
        if (!user) return 1
        return Math.floor((user.xpTotal || 0) / 500) + 1
      },

      getXpProgress: () => {
        const { user } = get()
        if (!user) return 0
        return ((user.xpTotal || 0) % 500) / 500
      },

      addXp: (amount) => {
        const { user } = get()
        if (!user) return
        const newXpTotal = (user.xpTotal || 0) + amount
        set({ user: { ...user, xpTotal: newXpTotal } })
      },

      updateStreak: (streakCount, longestStreak) => {
        const { user } = get()
        if (!user) return
        set({ user: { ...user, streakCount, longestStreak } })
      },
    }),
    {
      name:    'stepup-auth',
      storage: createJSONStorage(() => localStorage),
      // Only persist token + user, not transient state
      partialize: (state) => ({
        user:  state.user,
        token: state.token,
      }),
    }
  )
)

export default useAuthStore
