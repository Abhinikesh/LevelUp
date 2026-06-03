import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '../api/client'
import useAuthStore from '../store/authStore'

export default function LoginPage() {
  const navigate        = useNavigate()
  const { setAuth }     = useAuthStore()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors,  setErrors]  = useState({})

  const validate = () => {
    const e = {}
    if (!form.email)    e.email    = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email'
    if (!form.password) e.password = 'Password is required'
    setErrors(e)
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
      const { data } = await authApi.login(form)
      setAuth(data.user, data.token)
      toast.success(data.message || 'Welcome back! 🔥')
      navigate('/dashboard')
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please try again.'
      toast.error(msg)
      if (err.response?.status === 401) {
        setErrors({ password: 'Invalid email or password' })
      }
    } finally {
      setLoading(false)
    }
  }

  const containerVariants = {
    hidden:  { opacity: 0, y: 24 },
    visible: {
      opacity: 1, y: 0,
      transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
    },
  }

  const fieldVariants = {
    hidden:  { opacity: 0, x: -16 },
    visible: (i) => ({
      opacity: 1, x: 0,
      transition: { delay: i * 0.08 + 0.2, duration: 0.4 },
    }),
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="glass-card p-8"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
          className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center text-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(108,99,255,0.2), rgba(108,99,255,0.05))',
            border: '1px solid rgba(108,99,255,0.3)',
            boxShadow: '0 0 24px rgba(108,99,255,0.2)',
          }}
        >
          ⚡
        </motion.div>
        <h1 className="text-2xl font-display font-black mb-1" style={{ color: '#F0F0FF' }}>
          Welcome Back
        </h1>
        <p className="text-sm" style={{ color: '#8B8BAE' }}>
          Continue your journey. Your streaks are waiting.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Email */}
        <motion.div custom={0} variants={fieldVariants} initial="hidden" animate="visible">
          <label htmlFor="login-email" className="block text-xs font-semibold mb-1.5 uppercase tracking-widest" style={{ color: '#8B8BAE' }}>
            Email
          </label>
          <div className="relative">
            <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: errors.email ? '#FF6584' : '#8B8BAE' }} />
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={handleChange('email')}
              placeholder="you@example.com"
              className="input pl-10"
              style={errors.email ? { borderColor: 'rgba(255,101,132,0.6)' } : {}}
            />
          </div>
          {errors.email && (
            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs mt-1.5" style={{ color: '#FF6584' }}>
              {errors.email}
            </motion.p>
          )}
        </motion.div>

        {/* Password */}
        <motion.div custom={1} variants={fieldVariants} initial="hidden" animate="visible">
          <label htmlFor="login-password" className="block text-xs font-semibold mb-1.5 uppercase tracking-widest" style={{ color: '#8B8BAE' }}>
            Password
          </label>
          <div className="relative">
            <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: errors.password ? '#FF6584' : '#8B8BAE' }} />
            <input
              id="login-password"
              type={showPw ? 'text' : 'password'}
              autoComplete="current-password"
              value={form.password}
              onChange={handleChange('password')}
              placeholder="••••••••"
              className="input pl-10 pr-10"
              style={errors.password ? { borderColor: 'rgba(255,101,132,0.6)' } : {}}
            />
            <button
              type="button"
              id="login-toggle-pw"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0.5"
              style={{ color: '#8B8BAE' }}
            >
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.password && (
            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs mt-1.5" style={{ color: '#FF6584' }}>
              {errors.password}
            </motion.p>
          )}
        </motion.div>

        {/* Submit */}
        <motion.div custom={2} variants={fieldVariants} initial="hidden" animate="visible" className="pt-2">
          <button
            id="login-submit-btn"
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full h-12 text-sm font-semibold rounded-xl disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                Signing in…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Zap size={16} />
                Sign In
              </span>
            )}
          </button>
        </motion.div>
      </form>

      {/* Divider */}
      <div className="divider my-6" />

      {/* Footer */}
      <p className="text-center text-sm" style={{ color: '#8B8BAE' }}>
        New to STEPUP?{' '}
        <Link
          to="/register"
          id="login-to-register"
          className="font-semibold transition-colors duration-150"
          style={{ color: '#6C63FF' }}
          onMouseEnter={(e) => (e.target.style.color = '#9c8dff')}
          onMouseLeave={(e) => (e.target.style.color = '#6C63FF')}
        >
          Create an account →
        </Link>
      </p>
    </motion.div>
  )
}
