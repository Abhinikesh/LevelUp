import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

const useStore = create(
  persist(
    (set, get) => ({
      // ── State ────────────────────────────────────────────────
      user:          null,
      roadmaps:      [],
      activeRoadmap: null,
      levels:        [],
      xp:            0,
      streak:        0,

      // ── User Actions ─────────────────────────────────────────
      setUser: (user) => set({ user }),

      // ── Roadmap Actions ──────────────────────────────────────
      setRoadmaps: (roadmaps) => set({ roadmaps }),

      setActiveRoadmap: (roadmap) => set({ activeRoadmap: roadmap }),

      addRoadmap: (roadmap) =>
        set((state) => ({ roadmaps: [roadmap, ...state.roadmaps] })),

      updateRoadmap: (id, updates) =>
        set((state) => ({
          roadmaps: state.roadmaps.map((r) =>
            r._id === id ? { ...r, ...updates } : r
          ),
          activeRoadmap:
            state.activeRoadmap?._id === id
              ? { ...state.activeRoadmap, ...updates }
              : state.activeRoadmap,
        })),

      removeRoadmap: (id) =>
        set((state) => ({
          roadmaps: state.roadmaps.filter((r) => r._id !== id),
          activeRoadmap:
            state.activeRoadmap?._id === id ? null : state.activeRoadmap,
        })),

      // ── Level Actions ─────────────────────────────────────────
      setLevels: (levels) => set({ levels }),

      updateLevel: (levelId, updates) =>
        set((state) => ({
          levels: state.levels.map((l) =>
            l._id === levelId ? { ...l, ...updates } : l
          ),
        })),

      // ── XP & Streak Actions ───────────────────────────────────
      addXP: (amount) =>
        set((state) => ({ xp: state.xp + amount })),

      setXP: (xp) => set({ xp }),

      setStreak: (streak) => set({ streak }),

      // ── Reset (on logout) ─────────────────────────────────────
      resetStore: () =>
        set({
          user:          null,
          roadmaps:      [],
          activeRoadmap: null,
          levels:        [],
          xp:            0,
          streak:        0,
        }),
    }),
    {
      name:    'stepup-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user:          state.user,
        activeRoadmap: state.activeRoadmap,
        xp:            state.xp,
        streak:        state.streak,
      }),
    }
  )
)

export default useStore
