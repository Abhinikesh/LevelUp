import { motion } from 'framer-motion'
import { Check, Lock } from 'lucide-react'

export default function MiniGameMap() {
  const nodes = [
    { id: 1, label: 'Arrays Basics', status: 'completed' },
    { id: 2, label: 'Strings', status: 'completed' },
    { id: 3, label: 'Linked Lists', status: 'active' },
    { id: 4, label: 'Trees', status: 'locked' },
    { id: 5, label: 'Graphs', status: 'locked' }
  ]

  return (
    <div className="relative w-full max-w-sm mx-auto min-h-[420px] flex flex-col items-center justify-center p-6 rounded-3xl overflow-hidden bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl shadow-2xl">
      
      {/* Curved connecting SVG path */}
      <div className="absolute inset-0 pointer-events-none flex justify-center">
        <svg className="w-48 h-full" viewBox="0 0 200 400" preserveAspectRatio="none">
          <path
            d="M100,20 C30,100 170,200 100,300 C75,340 100,380 100,390"
            fill="none"
            stroke="rgba(108, 99, 255, 0.15)"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M100,20 C30,100 170,200 100,300 C75,340 100,380 100,390"
            fill="none"
            stroke="url(#map-grad)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="8 6"
          />
          <defs>
            <linearGradient id="map-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#43E97B" />
              <stop offset="50%" stopColor="#6C63FF" />
              <stop offset="100%" stopColor="#1E1E2E" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Nodes list */}
      <div className="flex flex-col gap-10 relative z-10 w-full">
        {nodes.map((node, index) => {
          const isCompleted = node.status === 'completed'
          const isActive = node.status === 'active'
          const isLocked = node.status === 'locked'

          // Alternate alignment for curved/zig-zag pathway look
          const alignments = ['justify-center', 'justify-start pl-8', 'justify-end pr-8']
          const alignClass = alignments[index % alignments.length]

          return (
            <div key={node.id} className={`flex ${alignClass}`}>
              <div className="flex flex-col items-center gap-2">
                
                {/* Level Node Circle */}
                <div className="relative">
                  {/* Pulsing glow ring for active node */}
                  {isActive && (
                    <span className="absolute -inset-2 rounded-full bg-brand/35 animate-ping opacity-75" />
                  )}

                  <motion.div
                    whileHover={!isLocked ? { scale: 1.12, y: -2 } : {}}
                    className={`w-14 h-14 rounded-full flex items-center justify-center font-display font-black text-sm relative transition-all duration-300 ${
                      isCompleted
                        ? 'bg-gradient-to-br from-green to-[#38f9d7] text-[#0A0A0F] shadow-[0_0_15px_rgba(67,233,123,0.4)]'
                        : isActive
                        ? 'bg-gradient-to-br from-[#6C63FF] to-[#FF6584] text-white shadow-[0_0_20px_rgba(108,99,255,0.6)] border border-brand/45'
                        : 'bg-[#12121A] border border-border text-muted/60'
                    }`}
                  >
                    {isCompleted ? (
                      <Check size={18} className="stroke-[3]" />
                    ) : isLocked ? (
                      <Lock size={15} />
                    ) : (
                      <span>{node.id}</span>
                    )}

                    {/* Active XP Tag */}
                    {isActive && (
                      <div className="absolute -top-3.5 bg-gold text-bg text-[8px] font-black px-1.5 py-0.5 rounded-full tracking-wider shadow-md">
                        ACTIVE
                      </div>
                    )}
                  </motion.div>
                </div>

                {/* Level Name */}
                <div className="text-center max-w-[100px]">
                  <p className={`text-[11px] font-extrabold truncate ${isActive ? 'text-brand' : 'text-[#F0F0FF]'}`}>
                    {node.label}
                  </p>
                </div>

              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
