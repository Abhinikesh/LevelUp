import { useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { 
  Compass, 
  ArrowRight, 
  Sparkles, 
  Camera, 
  ShieldCheck, 
  Map, 
  Zap, 
  Tv, 
  Flame, 
  Users, 
  Sliders 
} from 'lucide-react'
import FloatingSpheres from '../components/ui/FloatingSpheres'
import ConstellationParticles from '../components/ui/ConstellationParticles'
import MiniGameMap from '../components/map/MiniGameMap'

gsap.registerPlugin(ScrollTrigger)

export default function Landing() {
  const navigate = useNavigate()
  
  // Refs for animations
  const heroHeadingRef = useRef(null)
  const statsSectionRef = useRef(null)
  
  // Stats refs
  const stat1Ref = useRef(null)
  const stat2Ref = useRef(null)
  const stat3Ref = useRef(null)

  useEffect(() => {
    // ── Hero Stagger Animation with GSAP ──
    const heading = heroHeadingRef.current
    if (heading) {
      const lines = heading.querySelectorAll('.heading-line')
      lines.forEach((line) => {
        const words = line.innerText.split(' ')
        line.innerHTML = words
          .map(w => `<span class="inline-block translate-y-[100%] opacity-0 mr-3">${w}</span>`)
          .join('')
      })

      const targetSpans = heading.querySelectorAll('span')
      gsap.to(targetSpans, {
        y: 0,
        opacity: 1,
        stagger: 0.08,
        duration: 0.8,
        ease: 'power3.out',
        delay: 0.4
      })
    }

    // ── Stats Counter Animation with GSAP ──
    const statsSection = statsSectionRef.current
    if (statsSection) {
      const stats = [
        { ref: stat1Ref, end: 10000, suffix: '+' },
        { ref: stat2Ref, end: 50000, suffix: '+' },
        { ref: stat3Ref, end: 98, suffix: '%' }
      ]

      stats.forEach((item) => {
        const element = item.ref.current
        if (!element) return

        gsap.fromTo(element, 
          { textContent: 0 },
          {
            textContent: item.end,
            duration: 2,
            ease: 'power2.out',
            snap: { textContent: 1 },
            scrollTrigger: {
              trigger: statsSection,
              start: 'top 80%',
              toggleActions: 'play none none none'
            },
            onUpdate: function() {
              const val = Math.floor(this.targets()[0].textContent)
              element.textContent = val.toLocaleString() + item.suffix
            }
          }
        )
      })
    }
  }, [])

  return (
    <div className="relative min-h-screen bg-bg text-textprimary overflow-x-hidden">
      
      {/* CSS Styles for Animated Gradient Borders */}
      <style>{`
        .glowing-card {
          position: relative;
          background: #12121A;
          border-radius: 20px;
          overflow: hidden;
          z-index: 1;
        }
        .glowing-card::before {
          content: '';
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          background: linear-gradient(135deg, #6C63FF, #FF6584, #43E97B, #FFB800);
          background-size: 400% 400%;
          z-index: -1;
          border-radius: 22px;
          opacity: 0;
          transition: opacity 0.5s ease;
          animation: borderGlow 6s linear infinite;
        }
        .glowing-card:hover::before {
          opacity: 1;
        }
        @keyframes borderGlow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .noise-cta {
          position: relative;
        }
        .noise-cta::after {
          content: '';
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E");
          pointer-events: none;
          mix-blend-mode: overlay;
        }
      `}</style>

      {/* ── SECTION 1: HERO ── */}
      <section className="relative w-full min-h-screen flex flex-col items-center justify-center pt-20 px-6 overflow-hidden">
        
        {/* Floating ThreeJS spheres backdrop */}
        <FloatingSpheres />

        {/* tsParticles Constellations */}
        <ConstellationParticles />

        {/* Content wrapper */}
        <div className="relative z-20 text-center max-w-4xl flex flex-col items-center gap-6 mt-10">
          
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="px-4 py-1.5 rounded-full border border-brand/40 bg-brand/10 text-brand text-xs font-extrabold uppercase tracking-widest flex items-center gap-1.5"
          >
            <Sparkles size={12} className="animate-spin-slow" />
            <span>AI Powered • Gamified</span>
          </motion.div>

          {/* Heading */}
          <div ref={heroHeadingRef} className="font-display font-black text-center select-none">
            <h1 className="heading-line text-[42px] sm:text-[76px] leading-[1.1] font-black text-white">
              Turn Any Goal
            </h1>
            <h1 className="heading-line text-[42px] sm:text-[76px] leading-[1.1] font-black gradient-text py-1">
              Into a Game
            </h1>
            <h1 className="heading-line text-[42px] sm:text-[76px] leading-[1.1] font-black text-white">
              You Actually Win
            </h1>
          </div>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-base sm:text-lg text-muted max-w-xl font-normal leading-relaxed mt-2"
          >
            Level up through your tasks like Candy Crush. AI verifies every step. No fake progress.
          </motion.p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-4">
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.7 }}
              onClick={() => navigate('/register')}
              className="px-8 py-4 rounded-xl bg-brand-gradient hover:scale-105 hover:shadow-brand text-white font-bold text-sm tracking-wide transition-all duration-200"
            >
              Start For Free
            </motion.button>
            <motion.a
              href="#preview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.8 }}
              className="px-8 py-4 rounded-xl border border-brand/50 hover:bg-brand/10 text-white font-bold text-sm tracking-wide transition-all duration-200"
            >
              See How It Works
            </motion.a>
          </div>

        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 pointer-events-none">
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            className="w-5 h-9 rounded-full border-2 border-muted flex justify-center p-1"
          >
            <div className="w-1 h-2 bg-brand rounded-full" />
          </motion.div>
          <span className="text-[10px] text-muted font-bold uppercase tracking-widest">Scroll to explore</span>
        </div>

      </section>

      {/* ── SECTION 2: LIVE GAME MAP PREVIEW ── */}
      <section id="preview" className="w-full section-padding px-6 bg-gradient-to-b from-transparent to-[#12121A]/20">
        <div className="container max-w-5xl">
          
          <motion.div 
            initial={{ opacity: 0, x: 100 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center p-8 sm:p-12 rounded-[24px] bg-white/[0.02] border border-white/[0.06] backdrop-blur-[20px] shadow-2xl relative overflow-hidden"
          >
            {/* Ambient inner glow */}
            <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-brand/10 blur-[60px] pointer-events-none" />

            {/* Left text column */}
            <div className="md:col-span-6 flex flex-col gap-4 text-left z-10">
              <span className="text-xs font-bold text-brand uppercase tracking-widest">Visual Roadmap</span>
              <h2 className="font-display font-black text-3xl sm:text-4xl text-white">This is your DSA journey. Visualized.</h2>
              <p className="text-muted text-sm leading-relaxed">
                Every topic becomes a level. Complete one, unlock the next.
              </p>
            </div>

            {/* Right Map Preview Column with slow auto-scroll loop */}
            <div className="md:col-span-6 flex justify-center z-10 overflow-hidden py-4">
              <motion.div
                animate={{ y: [15, -15, 15] }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="w-full max-w-sm"
              >
                <MiniGameMap />
              </motion.div>
            </div>

          </motion.div>

        </div>
      </section>

      {/* ── SECTION 3: HOW IT WORKS ── */}
      <section className="w-full section-padding px-6 bg-[#12121A]/10">
        <div className="container max-w-5xl text-center">
          
          <span className="text-xs font-bold text-coral uppercase tracking-widest mb-2 block">Our Mechanism</span>
          <h2 className="font-display font-black text-3xl sm:text-4xl text-white mb-12">How STEPUP Works</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Step 1 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="relative bg-card border border-border p-8 rounded-2xl text-left overflow-hidden group hover:border-brand/40 transition-all duration-300"
            >
              <div className="absolute -right-4 -bottom-6 font-display font-black text-9xl text-brand/5 pointer-events-none group-hover:scale-105 transition-transform duration-300">
                01
              </div>
              <div className="w-12 h-12 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center mb-6">
                <Camera className="text-brand" size={20} />
              </div>
              <h3 className="font-bold text-lg text-white mb-3">Create or Scan Your Goal</h3>
              <p className="text-muted text-xs leading-relaxed">
                Type a goal, scan handwritten notes, or upload your syllabus. AI builds the roadmap.
              </p>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="relative bg-card border border-border p-8 rounded-2xl text-left overflow-hidden group hover:border-brand/40 transition-all duration-300"
            >
              <div className="absolute -right-4 -bottom-6 font-display font-black text-9xl text-brand/5 pointer-events-none group-hover:scale-105 transition-transform duration-300">
                02
              </div>
              <div className="w-12 h-12 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center mb-6">
                <Sparkles className="text-brand" size={20} />
              </div>
              <h3 className="font-bold text-lg text-white mb-3">AI Builds Your Level Map</h3>
              <p className="text-muted text-xs leading-relaxed">
                Watch your goal transform into a visual level map. Each topic becomes a level to unlock.
              </p>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="relative bg-card border border-border p-8 rounded-2xl text-left overflow-hidden group hover:border-brand/40 transition-all duration-300"
            >
              <div className="absolute -right-4 -bottom-6 font-display font-black text-9xl text-brand/5 pointer-events-none group-hover:scale-105 transition-transform duration-300">
                03
              </div>
              <div className="w-12 h-12 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center mb-6">
                <ShieldCheck className="text-brand" size={20} />
              </div>
              <h3 className="font-bold text-lg text-white mb-3">Level Up With Real Proof</h3>
              <p className="text-muted text-xs leading-relaxed">
                Complete quizzes, submit code, or upload photos. AI verifies you actually learned it.
              </p>
            </motion.div>

          </div>

        </div>
      </section>

      {/* ── SECTION 4: FEATURES GRID ── */}
      <section className="w-full section-padding px-6">
        <div className="container max-w-5xl text-center">
          
          <span className="text-xs font-bold text-green uppercase tracking-widest mb-2 block">Features Suite</span>
          <h2 className="font-display font-black text-3xl sm:text-4xl text-white mb-12">
            Everything You Need to Actually Finish Your Goals
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Feature 1 */}
            <div className="glowing-card p-6 text-left flex flex-col gap-4">
              <div className="w-11 h-11 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center">
                <Map className="text-brand" size={18} />
              </div>
              <div>
                <h4 className="font-bold text-base text-white mb-1.5">Candy Crush Map</h4>
                <p className="text-muted text-xs leading-relaxed">Visual level by level progression.</p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="glowing-card p-6 text-left flex flex-col gap-4">
              <div className="w-11 h-11 rounded-lg bg-coral/10 border border-coral/20 flex items-center justify-center">
                <ShieldCheck className="text-coral" size={18} />
              </div>
              <div>
                <h4 className="font-bold text-base text-white mb-1.5">AI Verification</h4>
                <p className="text-muted text-xs leading-relaxed">Prove it to unlock it, no faking.</p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="glowing-card p-6 text-left flex flex-col gap-4">
              <div className="w-11 h-11 rounded-lg bg-green/10 border border-green/20 flex items-center justify-center">
                <Camera className="text-green" size={18} />
              </div>
              <div>
                <h4 className="font-bold text-base text-white mb-1.5">OCR Scanner</h4>
                <p className="text-muted text-xs leading-relaxed">Scan handwritten notes instantly.</p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="glowing-card p-6 text-left flex flex-col gap-4">
              <div className="w-11 h-11 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center">
                <Tv className="text-brand" size={18} />
              </div>
              <div>
                <h4 className="font-bold text-base text-white mb-1.5">Exam Mode</h4>
                <p className="text-muted text-xs leading-relaxed">Countdown timer with daily scheduling.</p>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="glowing-card p-6 text-left flex flex-col gap-4">
              <div className="w-11 h-11 rounded-lg bg-coral/10 border border-coral/20 flex items-center justify-center">
                <Flame className="text-coral" size={18} />
              </div>
              <div>
                <h4 className="font-bold text-base text-white mb-1.5">Gym Mode</h4>
                <p className="text-muted text-xs leading-relaxed">Workout progression gamified.</p>
              </div>
            </div>

            {/* Feature 6 */}
            <div className="glowing-card p-6 text-left flex flex-col gap-4">
              <div className="w-11 h-11 rounded-lg bg-green/10 border border-green/20 flex items-center justify-center">
                <Users className="text-green" size={18} />
              </div>
              <div>
                <h4 className="font-bold text-base text-white mb-1.5">Friends & Leaderboard</h4>
                <p className="text-muted text-xs leading-relaxed">Compete with friends.</p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ── SECTION 5: STATS COUNTER ── */}
      <section ref={statsSectionRef} className="w-full section-padding px-6 border-t border-brand/10 bg-gradient-to-b from-brand/5 to-transparent">
        <div className="container max-w-5xl">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            
            <div>
              <div ref={stat1Ref} className="font-display font-black text-4xl sm:text-5xl gradient-text-gold py-1">
                0
              </div>
              <p className="text-muted text-xs font-semibold uppercase tracking-wider mt-2">Goals Completed</p>
            </div>

            <div>
              <div ref={stat2Ref} className="font-display font-black text-4xl sm:text-5xl gradient-text py-1">
                0
              </div>
              <p className="text-muted text-xs font-semibold uppercase tracking-wider mt-2">Levels Unlocked</p>
            </div>

            <div>
              <div ref={stat3Ref} className="font-display font-black text-4xl sm:text-5xl gradient-text-green py-1">
                0
              </div>
              <p className="text-muted text-xs font-semibold uppercase tracking-wider mt-2">Users Stayed Consistent</p>
            </div>

          </div>

        </div>
      </section>

      {/* ── SECTION 6: FINAL CTA ── */}
      <section className="w-full py-20 px-6">
        <div className="container max-w-4xl">
          
          <div className="noise-cta bg-brand-gradient rounded-3xl p-8 sm:p-12 text-center flex flex-col items-center gap-6 shadow-brand-lg">
            <h2 className="font-display font-black text-3xl sm:text-4xl text-white">
              Ready to Level Up Your Life?
            </h2>
            <p className="text-white/80 text-sm max-w-md">
              Join thousands already beating their goals. Stop the fake progress loops.
            </p>
            <button
              onClick={() => navigate('/register')}
              className="px-8 py-3.5 rounded-xl bg-white hover:bg-white/95 text-brand font-black text-sm tracking-wide shadow-lg transition-transform duration-200 hover:scale-105 mt-2"
            >
              Get Started Free
            </button>
          </div>

        </div>
      </section>

      {/* ── SECTION 7: FOOTER ── */}
      <footer className="w-full py-12 px-6 border-t border-border bg-[#0A0A0F]">
        <div className="container max-w-5xl flex flex-col md:flex-row justify-between items-center gap-6">
          
          <div className="flex flex-col gap-2 items-center md:items-start text-center md:text-left">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-brand-gradient flex items-center justify-center font-display font-black text-white text-xs">
                S
              </div>
              <span className="font-display font-black text-base text-white">STEPUP</span>
            </div>
            <p className="text-xs text-muted max-w-[200px]">Level up through your tasks like Candy Crush.</p>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-xs font-semibold text-muted">
            <a href="#" className="hover:text-brand transition-colors">Features</a>
            <a href="#" className="hover:text-brand transition-colors">Pricing</a>
            <a href="#" className="hover:text-brand transition-colors">Privacy</a>
            <a href="#" className="hover:text-brand transition-colors">Terms</a>
          </div>

          <p className="text-[10px] text-muted text-center md:text-right">
            © 2026 STEPUP. Built for people who finish things.
          </p>

        </div>
      </footer>

    </div>
  )
}
