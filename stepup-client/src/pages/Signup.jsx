import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, User, Eye, EyeOff, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import confetti from 'canvas-confetti'
import { registerUser } from '../api/auth.api'
import useStore from '../store/useStore'
import MiniGameMap from '../components/map/MiniGameMap'

export default function Signup() {
  const navigate = useNavigate()
  const { setAuth } = useStore()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  
  // Shake animation state
  const [shake, setShake] = useState(false)

  // Password strength scoring
  const calculateStrength = (pwd) => {
    if (!pwd) return 0
    let score = 0
    if (pwd.length >= 8) score += 25
    if (/[A-Z]/.test(pwd)) score += 25
    if (/[0-9]/.test(pwd)) score += 25
    if (/[^A-Za-z0-9]/.test(pwd)) score += 25
    return score
  }

  const strengthScore = calculateStrength(form.password)

  const getStrengthLabel = (score) => {
    if (score === 0) return { label: 'None', color: 'bg-border', text: 'text-muted' }
    if (score <= 25) return { label: 'Weak', color: 'bg-coral', text: 'text-coral' }
    if (score <= 50) return { label: 'Fair', color: 'bg-gold', text: 'text-gold' }
    if (score <= 75) return { label: 'Good', color: 'bg-brand', text: 'text-brand' }
    return { label: 'Strong', color: 'bg-green', text: 'text-green' }
  }

  const strengthDetails = getStrengthLabel(strengthScore)

  const triggerShake = () => {
    setShake(true)
    setTimeout(() => setShake(false), 500)
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) {
      e.name = 'Full name is required'
    } else if (form.name.trim().length < 2) {
      e.name = 'Name must be at least 2 characters'
    }

    if (!form.email) {
      e.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      e.email = 'Enter a valid email'
    }

    if (!form.password) {
      e.password = 'Password is required'
    } else if (form.password.length < 8) {
      e.password = 'Password must be at least 8 characters'
    }

    if (form.password !== form.confirmPassword) {
      e.confirmPassword = 'Passwords do not match'
    }

    setErrors(e)
    if (Object.keys(e).length > 0) {
      triggerShake()
    }
    return Object.keys(e).length === 0
  }

  const handleChange = (field) => (ev) => {
    setForm((f) => ({ ...f, [field]: ev.target.value }))
    if (errors[field]) setErrors((e) => ({ ...e, [field]: '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const response = await registerUser({
        name: form.name,
        email: form.email,
        password: form.password
      })
      const { user, token } = response.data

      // Confetti burst on successful signup
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      })

      toast.success('Account registered successfully! Welcome to the game! 🎮')
      
      setTimeout(() => {
        setAuth(user, token)
        navigate('/home/dashboard')
      }, 1500)

    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Try again.'
      toast.error(msg)
      if (err.response?.status === 409) {
        setErrors({ email: 'An account with this email already exists' })
      }
      triggerShake()
    } finally {
      setLoading(false)
    }
  }

  const formAnimation = {
    hidden: { opacity: 0, x: 100 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }
    }
  }

  const fieldStagger = {
    hidden: { opacity: 0, x: 20 },
    visible: (i) => ({
      opacity: 1,
      x: 0,
      transition: { delay: i * 0.1 + 0.15, duration: 0.4 }
    })
  }

  // Exact class according to input styling specifications
  const inputClass = "w-full bg-[#0A0A0F] border border-[#1E1E2E] focus:border-[#6C63FF] rounded-[10px] py-[14px] px-[16px] text-[#F0F0FF] text-xs outline-none transition-all duration-[0.2s] ease focus:shadow-[0_0_0_3px_rgba(108,99,255,0.15)]"

  return (
    <div className="min-h-screen bg-bg grid grid-cols-1 lg:grid-cols-2 relative overflow-hidden">
      
      {/* LEFT SIDE (hidden on mobile) */}
      <div className="hidden lg:flex flex-col items-center justify-center bg-[#12121A] relative border-r border-border px-12">
        <div className="absolute bottom-[10%] right-[10%] w-[350px] h-[350px] rounded-full pointer-events-none opacity-20 filter blur-[50px] bg-coral" />
        
        <motion.div
          animate={{ y: [0, 15, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          className="relative z-10 w-full max-w-sm mb-8"
        >
          <MiniGameMap />
        </motion.div>
        
        <div className="text-center relative z-10">
          <h2 className="font-display font-black text-2xl text-white mb-2">Your goals are waiting.</h2>
          <p className="text-muted text-xs">Unlock your level roadmap and start climbing the ranks.</p>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center justify-center p-6 md:p-12 relative z-10 overflow-y-auto">
        <div className="absolute top-[10%] left-[10%] w-[250px] h-[250px] rounded-full pointer-events-none opacity-10 filter blur-[40px] bg-brand" />

        <motion.div
          variants={formAnimation}
          initial="hidden"
          animate="visible"
          style={{ x: shake ? [-10, 10, -10, 10, 0] : 0 }}
          transition={shake ? { duration: 0.4 } : {}}
          className="w-full max-w-md bg-[#12121A] border border-border rounded-3xl p-8 md:p-12 shadow-card my-8"
        >
          {/* Header */}
          <div className="mb-6">
            <h1 className="font-display font-black text-2xl text-white mb-2">Start Your Journey</h1>
            <p className="text-muted text-xs">Transform any goal into a game you actually win</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            
            {/* Full Name */}
            <motion.div custom={0} variants={fieldStagger} initial="hidden" animate="visible">
              <label className="block text-[10px] font-extrabold uppercase tracking-widest text-muted mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={handleChange('name')}
                placeholder="Alex Mercer"
                className={inputClass}
                style={errors.name ? { borderColor: '#FF6584' } : {}}
              />
              {errors.name && (
                <p className="text-[10px] text-coral mt-1.5 font-bold">{errors.name}</p>
              )}
            </motion.div>

            {/* Email */}
            <motion.div custom={1} variants={fieldStagger} initial="hidden" animate="visible">
              <label className="block text-[10px] font-extrabold uppercase tracking-widest text-muted mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={form.email}
                onChange={handleChange('email')}
                placeholder="you@example.com"
                className={inputClass}
                style={errors.email ? { borderColor: '#FF6584' } : {}}
              />
              {errors.email && (
                <p className="text-[10px] text-coral mt-1.5 font-bold">{errors.email}</p>
              )}
            </motion.div>

            {/* Password */}
            <motion.div custom={2} variants={fieldStagger} initial="hidden" animate="visible">
              <label className="block text-[10px] font-extrabold uppercase tracking-widest text-muted mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange('password')}
                  placeholder="At least 8 characters"
                  className={`${inputClass} pr-10`}
                  style={errors.password ? { borderColor: '#FF6584' } : {}}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white"
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[10px] text-coral mt-1.5 font-bold">{errors.password}</p>
              )}

              {/* Password Strength Indicator */}
              {form.password && (
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-[9px] font-bold">
                    <span className="text-muted">Password Strength:</span>
                    <span className={strengthDetails.text}>{strengthDetails.label}</span>
                  </div>
                  <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${strengthDetails.color}`}
                      style={{ width: `${strengthScore}%` }}
                    />
                  </div>
                </div>
              )}
            </motion.div>

            {/* Confirm Password */}
            <motion.div custom={3} variants={fieldStagger} initial="hidden" animate="visible">
              <label className="block text-[10px] font-extrabold uppercase tracking-widest text-muted mb-2">
                Confirm Password
              </label>
              <input
                type={showPw ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={handleChange('confirmPassword')}
                placeholder="••••••••"
                className={inputClass}
                style={errors.confirmPassword ? { borderColor: '#FF6584' } : {}}
              />
              {errors.confirmPassword && (
                <p className="text-[10px] text-coral mt-1.5 font-bold">{errors.confirmPassword}</p>
              )}
            </motion.div>

            {/* Submit */}
            <motion.div custom={4} variants={fieldStagger} initial="hidden" animate="visible" className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-gradient hover:scale-[1.02] active:scale-[0.98] rounded-xl py-3.5 px-4 font-bold text-xs tracking-wider text-white shadow-brand transition-all duration-200 flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                {loading ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <>
                    <Sparkles size={14} /> Start Campaign
                  </>
                )}
              </button>
            </motion.div>

          </form>

          {/* Bottom Link */}
          <p className="text-center text-xs text-muted mt-8">
            Already have an account?{' '}
            <Link to="/login" className="text-brand font-bold hover:underline">
              Login
            </Link>
          </p>

        </motion.div>
      </div>

    </div>
  )
}
