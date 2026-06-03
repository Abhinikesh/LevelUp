import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import ErrorBoundary from './components/ui/ErrorBoundary'
import AppLayout from './components/layout/AppLayout'
import useAuthStore from './store/authStore'

/* ── Lazy-loaded pages ── */
const Landing        = lazy(() => import('./pages/Landing'))
const Login          = lazy(() => import('./pages/Login'))
const Signup         = lazy(() => import('./pages/Signup'))
const DashboardPage  = lazy(() => import('./pages/DashboardPage'))
const MapView        = lazy(() => import('./pages/MapView'))
const CreateRoadmap  = lazy(() => import('./pages/CreateRoadmap'))
const Social         = lazy(() => import('./pages/Social'))
const Profile        = lazy(() => import('./pages/Profile'))
const NotFound       = lazy(() => import('./pages/NotFound'))

/* ── Page loading fallback ── */
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: '#0A0A0F' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-2 border-brand/20" />
          <div className="absolute inset-0 rounded-full border-2 border-t-brand border-r-transparent border-b-transparent border-l-transparent animate-spin" />
          <div className="absolute inset-2 rounded-full"
            style={{ background: 'linear-gradient(135deg,#6C63FF22,#FF658422)' }} />
        </div>
        <p className="text-xs text-muted font-semibold tracking-widest uppercase">Loading</p>
      </div>
    </div>
  )
}

/* ── Page transition wrapper ── */
function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{ minHeight: '100%' }}
    >
      {children}
    </motion.div>
  )
}

/* ── Coming Soon stub ── */
function ComingSoon({ title, icon = '🚧' }) {
  return (
    <PageTransition>
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4 px-8 text-center">
        <motion.div
          animate={{ rotate: [0, -8, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl"
          style={{ background: 'linear-gradient(135deg,#6C63FF,#FF6584)',
                   boxShadow: '0 0 30px rgba(108,99,255,0.4)' }}>
          {icon}
        </motion.div>
        <h2 className="font-display font-black text-2xl text-white">{title}</h2>
        <p className="text-sm text-muted max-w-xs">This feature is coming soon. Keep levelling up!</p>
      </div>
    </PageTransition>
  )
}

/* ── Route guards ── */
function ProtectedRoute({ children }) {
  const { user, token } = useAuthStore()
  if (!user || !token) return <Navigate to="/login" replace />
  return children
}

function GuestRoute({ children }) {
  const { user, token } = useAuthStore()
  if (user && token) return <Navigate to="/dashboard" replace />
  return children
}

/* ── Root App ── */
export default function App() {
  const { initialize } = useAuthStore()
  const location = useLocation()

  useEffect(() => { initialize() }, [initialize])

  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <AnimatePresence mode="wait" initial={false}>
          <Routes location={location} key={location.pathname}>
            {/* ── Public ── */}
            <Route path="/" element={
              <PageTransition><Landing /></PageTransition>
            } />

            {/* ── Auth (guest only) ── */}
            <Route path="/login" element={
              <GuestRoute><PageTransition><Login /></PageTransition></GuestRoute>
            } />
            <Route path="/register" element={
              <GuestRoute><PageTransition><Signup /></PageTransition></GuestRoute>
            } />

            {/* ── Protected app shell ── */}
            <Route element={
              <ProtectedRoute><AppLayout /></ProtectedRoute>
            }>
              <Route path="/dashboard" element={
                <PageTransition><DashboardPage /></PageTransition>
              } />
              <Route path="/map" element={
                <PageTransition><MapView /></PageTransition>
              } />
              <Route path="/create" element={
                <PageTransition><CreateRoadmap /></PageTransition>
              } />
              <Route path="/social" element={
                <PageTransition><Social /></PageTransition>
              } />
              <Route path="/profile" element={
                <PageTransition><Profile /></PageTransition>
              } />
              <Route path="/leaderboard" element={
                <ComingSoon title="Leaderboard" icon="🏆" />
              } />
              <Route path="/analytics" element={
                <ComingSoon title="Analytics" icon="📊" />
              } />
              <Route path="/settings" element={
                <ComingSoon title="Settings" icon="⚙️" />
              } />
            </Route>

            {/* ── 404 ── */}
            <Route path="*" element={
              <PageTransition><NotFound /></PageTransition>
            } />
          </Routes>
        </AnimatePresence>
      </Suspense>
    </ErrorBoundary>
  )
}
