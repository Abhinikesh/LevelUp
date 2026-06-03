import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '../api/client'
import useAuthStore from '../store/authStore'
import MiniGameMap from '../components/map/MiniGameMap'

export default function Login() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  // Shake animation trigger
  const [shake, setShake] = useState(false)

  const validate = () => {
    const e = {}
    if (!form.email) {
      e.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      e.email = 'Enter a valid email'
    }
    if (!form.password) {
      e.password = 'Password is required'
    }
    setErrors(e)
    if (Object.keys(e).length > 0) {
      triggerShake()
    }
    return Object.keys(e).length === 0
  }

  const triggerShake = () => {
    setShake(true)
    setTimeout(() => setShake(false), 500)
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
      const { data } = await authApi.login(form)
      setAuth(data.user, data.token)
      toast.success(data.message || 'Welcome back! 🔥')
      navigate('/dashboard')
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please try again.'
      toast.error(msg)
      setErrors({ password: 'Invalid email or password' })
      triggerShake()
    } finally {
      setLoading(false)
    }
  }

  const formAnimation = {
    hidden: { opacity: 0, x: 50 },
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
      transition: { delay: i * 0.08 + 0.15, duration: 0.4 }
    })
  }

  return (
    <div className="min-h-screen bg-bg grid grid-cols-1 lg:grid-cols-2 relative overflow-hidden">
      
      {/* LEFT SIDE (hidden on mobile) */}
      <div className="hidden lg:flex flex-col items-center justify-center bg-[#12121A] relative border-r border-border px-12">
        <div className="absolute top-[10%] left-[10%] w-[350px] h-[350px] rounded-full pointer-events-none opacity-20 filter blur-[50px] bg-brand" />
        
        <motion.div
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
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
      <div className="flex items-center justify-center p-6 md:p-12 relative z-10">
        
        {/* Glow orb background on right column */}
        <div className="absolute bottom-[10%] right-[10%] w-[250px] h-[250px] rounded-full pointer-events-none opacity-10 filter blur-[40px] bg-coral" />

        <motion.div
          variants={formAnimation}
          initial="hidden"
          animate="visible"
          style={{ x: shake ? [-10, 10, -10, 10, 0] : 0 }}
          transition={shake ? { duration: 0.4 } : {}}
          className="w-full max-w-md bg-[#12121A] border border-border rounded-3xl p-8 md:p-12 shadow-card"
        >
          {/* Form Header */}
          <div className="mb-8">
            <h1 className="font-display font-black text-2xl text-white mb-2">Welcome Back</h1>
            <p className="text-muted text-xs">Continue your journey</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            
            {/* Email Field */}
            <motion.div custom={0} variants={fieldStagger} initial="hidden" animate="visible">
              <label className="block text-[10px] font-extrabold uppercase tracking-widest text-muted mb-2">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={form.email}
                  onChange={handleChange('email')}
                  placeholder="you@example.com"
                  className="w-full bg-[#0A0A0F] border border-border focus:border-brand rounded-xl py-3.5 px-4 text-[#F0F0FF] text-xs outline-none transition-all duration-200 focus:shadow-[0_0_0_3px_rgba(108,99,255,0.15)]"
                  style={errors.email ? { borderColor: '#FF6584' } : {}}
                />
              </div>
              {errors.email && (
                <p className="text-[10px] text-coral mt-1.5 font-bold">{errors.email}</p>
              )}
            </motion.div>

            {/* Password Field */}
            <motion.div custom={1} variants={fieldStagger} initial="hidden" animate="visible">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-[10px] font-extrabold uppercase tracking-widest text-muted">
                  Password
                </label>
                <Link to="/login" className="text-[10px] font-bold text-brand hover:text-brand/80">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange('password')}
                  placeholder="••••••••"
                  className="w-full bg-[#0A0A0F] border border-border focus:border-brand rounded-xl py-3.5 px-4 text-[#F0F0FF] text-xs outline-none transition-all duration-200 focus:shadow-[0_0_0_3px_rgba(108,99,255,0.15)] pr-10"
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
            </motion.div>

            {/* Submit Button */}
            <motion.div custom={2} variants={fieldStagger} initial="hidden" animate="visible" className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-gradient hover:scale-[1.02] active:scale-[0.98] rounded-xl py-3.5 px-4 font-bold text-xs tracking-wider text-white shadow-brand transition-all duration-200 flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                {loading ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <>
                    <Zap size={14} /> Sign In
                  </>
                )}
              </button>
            </motion.div>

          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <span className="h-[1px] flex-1 bg-border" />
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">or</span>
            <span className="h-[1px] flex-1 bg-border" />
          </div>

          {/* Google SSO Button */}
          <button
            type="button"
            onClick={() => toast.success('Google authentication simulator initiated.')}
            className="w-full bg-white hover:bg-white/95 rounded-xl py-3.5 px-4 font-bold text-xs text-[#0A0A0F] transition-all duration-200 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5.04c1.62 0 3.08.56 4.22 1.64l3.15-3.15C17.45 1.68 14.9 1 12 1 7.35 1 3.39 3.65 1.5 7.5l3.6 2.8C6.01 7.22 8.78 5.04 12 5.04z" />
              <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.27H12v4.51h6.48c-.28 1.48-1.12 2.73-2.38 3.58l3.6 2.8c2.1-1.94 3.79-5.12 3.79-8.62z" />
              <path fill="#FBBC05" d="M5.1 14.8c-.25-.75-.39-1.55-.39-2.38s.14-1.63.39-2.38l-3.6-2.8C.54 8.77 0 10.33 0 12s.54 3.23 1.5 4.6l3.6-2.8z" />
              <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.6-2.8c-1.1.74-2.52 1.18-4.36 1.18-3.22 0-5.99-2.18-6.9-5.26l-3.6 2.8C3.39 20.35 7.35 23 12 23z" />
            </svg>
            Continue with Google
          </button>

          {/* Bottom links */}
          <p className="text-center text-xs text-muted mt-8">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand font-bold hover:underline">
              Sign Up
            </Link>
          </p>

        </motion.div>
      </div>

    </div>
  )
}
