import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { User, Mail, Lock, Eye, EyeOff, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '../api/client'
import useAuthStore from '../store/authStore'

export default function RegisterPage() {
  const navigate        = useNavigate()
  const { setAuth }     = useAuthStore()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors,  setErrors]  = useState({})

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    else if (form.name.trim().length < 2) e.name = 'Name must be at least 2 characters'

    if (!form.email) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email'

    if (!form.password) e.password = 'Password is required'
    else if (form.password.length < 8) e.password = 'Password must be at least 8 characters'

    if (form.password !== form.confirmPassword) {
      e.confirmPassword = 'Passwords do not match'
    }
    
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
      const { data } = await authApi.register({
        name: form.name,
        email: form.email,
        password: form.password
      })
      setAuth(data.user, data.token)
      toast.success(data.message || 'Account created! Welcome to STEPUP 🚀')
      navigate('/dashboard')
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.'
      toast.error(msg)
      if (err.response?.status === 49 || err.response?.status === 409) {
        setErrors({ email: 'An account with this email already exists' })
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
      transition: { delay: i * 0.06 + 0.15, duration: 0.4 },
    }),
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="glass-card p-8 my-8"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0, rotate: 10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
          className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center text-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(255,101,132,0.2), rgba(255,101,132,0.05))',
            border: '1px solid rgba(255,101,132,0.3)',
            boxShadow: '0 0 24px rgba(255,101,132,0.2)',
          }}
        >
          🏆
        </motion.div>
        <h1 className="text-2xl font-display font-black mb-1" style={{ color: '#F0F0FF' }}>
          Create Account
        </h1>
        <p className="text-sm" style={{ color: '#8B8BAE' }}>
          Start your adventure and build healthy habits.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Name */}
        <motion.div custom={0} variants={fieldVariants} initial="hidden" animate="visible">
          <label htmlFor="reg-name" className="block text-xs font-semibold mb-1.5 uppercase tracking-widest" style={{ color: '#8B8BAE' }}>
            Full Name
          </label>
          <div className="relative">
            <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: errors.name ? '#FF6584' : '#8B8BAE' }} />
            <input
              id="reg-name"
              type="text"
              autoComplete="name"
              value={form.name}
              onChange={handleChange('name')}
              placeholder="Alex Mercer"
              className="input pl-10"
              style={errors.name ? { borderColor: 'rgba(255,101,132,0.6)' } : {}}
            />
          </div>
          {errors.name && (
            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs mt-1.5" style={{ color: '#FF6584' }}>
              {errors.name}
            </motion.p>
          )}
        </motion.div>

        {/* Email */}
        <motion.div custom={1} variants={fieldVariants} initial="hidden" animate="visible">
          <label htmlFor="reg-email" className="block text-xs font-semibold mb-1.5 uppercase tracking-widest" style={{ color: '#8B8BAE' }}>
            Email
          </label>
          <div className="relative">
            <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: errors.email ? '#FF6584' : '#8B8BAE' }} />
            <input
              id="reg-email"
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
        <motion.div custom={2} variants={fieldVariants} initial="hidden" animate="visible">
          <label htmlFor="reg-password" className="block text-xs font-semibold mb-1.5 uppercase tracking-widest" style={{ color: '#8B8BAE' }}>
            Password
          </label>
          <div className="relative">
            <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: errors.password ? '#FF6584' : '#8B8BAE' }} />
            <input
              id="reg-password"
              type={showPw ? 'text' : 'password'}
              autoComplete="new-password"
              value={form.password}
              onChange={handleChange('password')}
              placeholder="At least 8 characters"
              className="input pl-10 pr-10"
              style={errors.password ? { borderColor: 'rgba(255,101,132,0.6)' } : {}}
            />
            <button
              type="button"
              id="reg-toggle-pw"
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

        {/* Confirm Password */}
        <motion.div custom={3} variants={fieldVariants} initial="hidden" animate="visible">
          <label htmlFor="reg-confirm-password" className="block text-xs font-semibold mb-1.5 uppercase tracking-widest" style={{ color: '#8B8BAE' }}>
            Confirm Password
          </label>
          <div className="relative">
            <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: errors.confirmPassword ? '#FF6584' : '#8B8BAE' }} />
            <input
              id="reg-confirm-password"
              type={showPw ? 'text' : 'password'}
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={handleChange('confirmPassword')}
              placeholder="••••••••"
              className="input pl-10"
              style={errors.confirmPassword ? { borderColor: 'rgba(255,101,132,0.6)' } : {}}
            />
          </div>
          {errors.confirmPassword && (
            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs mt-1.5" style={{ color: '#FF6584' }}>
              {errors.confirmPassword}
            </motion.p>
          )}
        </motion.div>

        {/* Submit */}
        <motion.div custom={4} variants={fieldVariants} initial="hidden" animate="visible" className="pt-2">
          <button
            id="register-submit-btn"
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
                Creating account…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles size={16} />
                Create Account
              </span>
            )}
          </button>
        </motion.div>
      </form>

      {/* Divider */}
      <div className="divider my-6" />

      {/* Footer */}
      <p className="text-center text-sm" style={{ color: '#8B8BAE' }}>
        Already have an account?{' '}
        <Link
          to="/login"
          id="register-to-login"
          className="font-semibold transition-colors duration-150"
          style={{ color: '#6C63FF' }}
          onMouseEnter={(e) => (e.target.style.color = '#9c8dff')}
          onMouseLeave={(e) => (e.target.style.color = '#6C63FF')}
        >
          Sign in →
        </Link>
      </p>
    </motion.div>
  )
}
