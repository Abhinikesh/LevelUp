import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Map, LayoutDashboard, Settings, Trophy, BarChart3, Compass, FileText, ArrowRight, CornerDownLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import useStore from '../../store/useStore'

export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  
  const { roadmaps, activeRoadmap, setActiveRoadmap } = useStore()
  const inputRef = useRef(null)

  // Listen to CMD+K or CTRL+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
    }
  }, [isOpen]);

  const handleNavigate = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  const handleSelectRoadmap = (rm) => {
    setActiveRoadmap(rm);
    navigate('/home/map');
    setIsOpen(false);
  };

  // Filter shortcuts and roadmaps
  const shortcuts = [
    { name: 'Dashboard', path: '/home/dashboard', icon: LayoutDashboard, category: 'Navigation' },
    { name: 'Game Map', path: '/home/map', icon: Map, category: 'Navigation' },
    { name: 'Leaderboard', path: '/home/leaderboard', icon: Trophy, category: 'Navigation' },
    { name: 'Analytics', path: '/home/analytics', icon: BarChart3, category: 'Navigation' },
    { name: 'Settings & Credentials', path: '/home/settings', icon: Settings, category: 'Navigation' },
  ];

  const filteredShortcuts = shortcuts.filter(s =>
    s.name.toLowerCase().includes(query.toLowerCase())
  );

  const filteredRoadmaps = roadmaps.filter(r =>
    r.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1200] flex items-start justify-center p-4 pt-[12vh]">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
          />

          {/* Dialog Body */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -20 }}
            transition={{ duration: 0.2 }}
            className="relative z-10 w-full max-w-lg rounded-2xl border flex flex-col overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, #12121B 0%, #0A0A0F 100%)',
              borderColor: '#23233C',
              boxShadow: '0 25px 60px rgba(0,0,0,0.85)',
            }}
          >
            {/* Search Input bar */}
            <div className="p-4 border-b border-border/40 flex items-center gap-3 bg-card/10">
              <Search size={16} className="text-muted" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search campaigns, navigations, files..."
                className="w-full bg-transparent border-none outline-none text-xs text-white placeholder-muted-foreground"
              />
              <span className="text-[9px] font-black border border-border px-2 py-0.5 rounded-lg text-muted uppercase tracking-wider select-none bg-card">
                esc
              </span>
            </div>

            {/* Results */}
            <div className="overflow-y-auto no-scrollbar" style={{ maxHeight: '350px' }}>
              <div className="p-3 space-y-4">
                
                {/* Navigation Category */}
                {filteredShortcuts.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-muted uppercase tracking-widest px-3 block mb-1">
                      Menu Navigation
                    </span>
                    {filteredShortcuts.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleNavigate(s.path)}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white/5 text-xs text-muted-foreground hover:text-white transition-all text-left"
                      >
                        <div className="flex items-center gap-2.5">
                          <s.icon size={13} className="text-brand" />
                          <span className="font-semibold">{s.name}</span>
                        </div>
                        <span className="text-[9px] text-muted flex items-center gap-0.5">
                          Go <CornerDownLeft size={8} />
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Campaigns Category */}
                {filteredRoadmaps.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-muted uppercase tracking-widest px-3 block mb-1">
                      Campaigns ({filteredRoadmaps.length})
                    </span>
                    {filteredRoadmaps.map((rm) => (
                      <button
                        key={rm._id}
                        onClick={() => handleSelectRoadmap(rm)}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white/5 text-xs text-muted-foreground hover:text-white transition-all text-left"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-sm">{rm.coverEmoji || '🗺️'}</span>
                          <span className="font-semibold truncate">{rm.title}</span>
                          {activeRoadmap?._id === rm._id && (
                            <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-brand/20 border border-brand/40 text-brand font-bold">
                              active
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] text-muted flex items-center gap-0.5">
                          Open Map <ArrowRight size={8} />
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {filteredShortcuts.length === 0 && filteredRoadmaps.length === 0 && (
                  <div className="text-center py-8 text-xs text-muted">
                    No results matching "{query}"
                  </div>
                )}

              </div>
            </div>

            {/* Footer tips */}
            <div className="p-3 border-t border-border/40 bg-card/25 flex justify-between items-center text-[9px] text-muted font-bold">
              <span>Use arrow keys to browse, Enter to select</span>
              <span>Cmd+K to close</span>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
