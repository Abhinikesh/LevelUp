import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Settings as SettingsIcon, Shield, Sliders, RefreshCcw, LogOut, Check, Sparkles, User, Key, Bell } from 'lucide-react'
import useAuthStore from '../store/authStore'
import { authApi, notificationApi } from '../api/client'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

export default function Settings() {
  const { user, logout, setUser } = useAuthStore()
  const navigate = useNavigate()
  
  // Settings Form States
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' })
  const [updatingPw, setUpdatingPw] = useState(false)

  // Simulation preferences states
  const [soundEffects, setSoundEffects] = useState(true)
  const [particles, setParticles] = useState(true)
  const [particleIntensity, setParticleIntensity] = useState(50)

  // Notifications preferences states
  const [notifPrefs, setNotifPrefs] = useState({
    dailyStreakReminder: true,
    weeklyProgressReport: true,
    newFriendRequests: true,
    examUrgencyAlerts: true,
  })

  useEffect(() => {
    async function loadNotifs() {
      try {
        const { data } = await notificationApi.getPrefs()
        if (data.success && data.notificationPrefs) {
          setNotifPrefs(data.notificationPrefs)
        }
      } catch (err) {
        console.error('Failed to load notification settings:', err)
      }
    }
    loadNotifs()
  }, [])

  const handleToggleNotifPref = async (key) => {
    const updated = { ...notifPrefs, [key]: !notifPrefs[key] }
    setNotifPrefs(updated)
    try {
      await notificationApi.updatePrefs(updated)
      toast.success('Notification settings updated! 🔔', { id: 'notif-pref' })
    } catch (err) {
      toast.error('Failed to save preferences.')
    }
  }
  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      toast.error('Both password fields are required')
      return
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters')
      return
    }

    setUpdatingPw(true)
    try {
      await authApi.changePassword(passwordForm)
      toast.success('Password updated successfully! 🔒')
      setPasswordForm({ currentPassword: '', newPassword: '' })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password update failed')
    } finally {
      setUpdatingPw(false)
    }
  }

  const handleResetProgress = () => {
    const doubleCheck = confirm('⚠️ WARNING: This will permanently wipe all your roadmaps, completed levels, badges, and reset your XP to 0. This cannot be undone.\n\nType "RESET" to confirm.')
    if (doubleCheck) {
      toast.error('Simulation: Full progress reset is disabled in demo mode. Contact Administrator.')
    }
  }

  const handleTogglePreference = (type) => {
    if (type === 'sound') {
      setSoundEffects(v => !v)
      toast.success(`Sound effects ${!soundEffects ? 'enabled' : 'disabled'}`, { id: 'pref' })
    } else if (type === 'particles') {
      setParticles(v => !v)
      toast.success(`Constellation particles ${!particles ? 'enabled' : 'disabled'}`, { id: 'pref' })
    }
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-8" style={{ background: '#0A0A0F' }}>
      <div className="max-w-2xl mx-auto">
        
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="font-display font-black text-3xl text-white">Settings</h1>
          <p className="text-muted text-sm mt-1">Manage credentials, gaming layout, and account safety</p>
        </motion.div>

        <div className="space-y-6">

          {/* Section 1: Security & Credentials */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 border border-border"
          >
            <div className="flex items-center gap-2 mb-6 border-b border-border/40 pb-3">
              <Shield size={18} className="text-brand" />
              <h3 className="font-display font-black text-base text-white">Security</h3>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-widest text-muted mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={e => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                  placeholder="••••••••"
                  className="input w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-widest text-muted mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={e => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="At least 8 characters"
                  className="input w-full text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={updatingPw}
                className="btn btn-primary text-xs py-2.5 px-4 rounded-xl flex items-center gap-1.5 self-start"
              >
                {updatingPw ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Key size={13} /> Update Password
                  </>
                )}
              </button>
            </form>
          </motion.div>

          {/* Section 2: Gamification Preferences */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="glass-card p-6 border border-border"
          >
            <div className="flex items-center gap-2 mb-6 border-b border-border/40 pb-3">
              <Sliders size={18} className="text-gold" />
              <h3 className="font-display font-black text-base text-white">System & Visuals</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-white">Interface Audio</h4>
                  <p className="text-[10px] text-muted mt-0.5">Play motivational cues and ding SFX on audit approvals</p>
                </div>
                <button
                  onClick={() => handleTogglePreference('sound')}
                  className={`w-12 h-6 rounded-full relative transition-all duration-300 ${
                    soundEffects ? 'bg-brand' : 'bg-border'
                  }`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all duration-300 ${
                      soundEffects ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-white">Dynamic Constellation Particles</h4>
                  <p className="text-[10px] text-muted mt-0.5">Render interactive canvas particles on login & dashboard</p>
                </div>
                <button
                  onClick={() => handleTogglePreference('particles')}
                  className={`w-12 h-6 rounded-full relative transition-all duration-300 ${
                    particles ? 'bg-brand' : 'bg-border'
                  }`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all duration-300 ${
                      particles ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {particles && (
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between items-center text-[10px] font-bold text-muted">
                    <span>Particle Density & Intensity</span>
                    <span>{particleIntensity}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={particleIntensity}
                    onChange={e => setParticleIntensity(parseInt(e.target.value))}
                    className="w-full accent-brand bg-border h-1 rounded-lg outline-none cursor-pointer"
                  />
                </div>
              )}
            </div>
          </motion.div>

          {/* Section 2b: Notification Settings */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="glass-card p-6 border border-border"
          >
            <div className="flex items-center gap-2 mb-6 border-b border-border/40 pb-3">
              <Bell size={18} className="text-brand" />
              <h3 className="font-display font-black text-base text-white">Notifications</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-white">Daily Streak Reminders</h4>
                  <p className="text-[10px] text-muted mt-0.5">Get warned by ARIA at 8 PM if you haven't cleared a node today</p>
                </div>
                <button
                  onClick={() => handleToggleNotifPref('dailyStreakReminder')}
                  className={`w-12 h-6 rounded-full relative transition-all duration-300 ${
                    notifPrefs.dailyStreakReminder ? 'bg-brand' : 'bg-border'
                  }`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all duration-300 ${
                      notifPrefs.dailyStreakReminder ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-white">Exam Urgency Warnings</h4>
                  <p className="text-[10px] text-muted mt-0.5">Receive reminders when your study target schedules are slipping</p>
                </div>
                <button
                  onClick={() => handleToggleNotifPref('examUrgencyAlerts')}
                  className={`w-12 h-6 rounded-full relative transition-all duration-300 ${
                    notifPrefs.examUrgencyAlerts ? 'bg-brand' : 'bg-border'
                  }`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all duration-300 ${
                      notifPrefs.examUrgencyAlerts ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-white">Weekly Progress Reports</h4>
                  <p className="text-[10px] text-muted mt-0.5">Receive summary stats of XP earned and campaigns completed</p>
                </div>
                <button
                  onClick={() => handleToggleNotifPref('weeklyProgressReport')}
                  className={`w-12 h-6 rounded-full relative transition-all duration-300 ${
                    notifPrefs.weeklyProgressReport ? 'bg-brand' : 'bg-border'
                  }`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all duration-300 ${
                      notifPrefs.weeklyProgressReport ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-white">New Friend Requests</h4>
                  <p className="text-[10px] text-muted mt-0.5">Get notified when a learner requests to be your study partner</p>
                </div>
                <button
                  onClick={() => handleToggleNotifPref('newFriendRequests')}
                  className={`w-12 h-6 rounded-full relative transition-all duration-300 ${
                    notifPrefs.newFriendRequests ? 'bg-brand' : 'bg-border'
                  }`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all duration-300 ${
                      notifPrefs.newFriendRequests ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Section 3: Reset / Danger Zone */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6 border border-coral/20 bg-coral/5"
          >
            <div className="flex items-center gap-2 mb-2">
              <RefreshCcw size={18} className="text-coral" />
              <h3 className="font-display font-black text-base text-coral">Danger Zone</h3>
            </div>
            <p className="text-xs text-muted mb-4">
              Permanently wipe all stats, levels completed, active roadmaps, and badges from your account. This action is irreversible.
            </p>
            <button
              onClick={handleResetProgress}
              className="btn bg-coral/10 hover:bg-coral/20 border border-coral/30 hover:border-coral/50 text-coral text-xs py-2.5 px-4 rounded-xl font-bold transition-all"
            >
              Reset All Progress
            </button>
          </motion.div>

        </div>

      </div>
    </div>
  )
}
