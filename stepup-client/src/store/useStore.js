import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useStore = create(
  persist(
    (set, get) => ({
      // Auth
      user: null,
      token: null,
      isAuthenticated: false,
      
      // Data
      roadmaps: [],
      activeRoadmap: null,
      levels: [],
      
      // Auth actions
      setAuth: (user, token) => {
        localStorage.setItem('stepup_token', token);
        localStorage.setItem('stepup_user', 
          JSON.stringify(user));
        set({ user, token, isAuthenticated: true });
      },
      
      logout: () => {
        localStorage.removeItem('stepup_token');
        localStorage.removeItem('stepup_user');
        set({ 
          user: null, token: null, 
          isAuthenticated: false,
          roadmaps: [], activeRoadmap: null, levels: []
        });
      },
      
      updateUser: (userData) => 
        set({ user: { ...get().user, ...userData } }),
      
      // Data actions
      setRoadmaps: (roadmaps) => set({ roadmaps }),
      
      addRoadmap: (roadmap) => 
        set({ roadmaps: [roadmap, ...get().roadmaps] }),
      
      setActiveRoadmap: (roadmap) => 
        set({ activeRoadmap: roadmap }),
      
      setLevels: (levels) => set({ levels }),
      
      addXP: (amount) => set({ 
        user: { 
          ...get().user, 
          xpTotal: (get().user?.xpTotal || 0) + amount 
        } 
      }),
      
      markLevelComplete: (levelId) => set({
        levels: get().levels.map(l => 
          l._id === levelId 
            ? { ...l, isCompleted: true } 
            : l
        )
      }),
      
      unlockNextLevel: (levelNumber) => set({
        levels: get().levels.map(l =>
          l.levelNumber === levelNumber + 1
            ? { ...l, isLocked: false }
            : l
        )
      })
    }),
    {
      name: 'stepup-store',
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);

export default useStore;
