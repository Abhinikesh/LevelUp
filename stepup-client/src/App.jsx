import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import CustomCursor    from './components/ui/CustomCursor'
import AppLayout       from './components/layout/AppLayout'
import Landing         from './pages/Landing'
import Login           from './pages/Login'
import Signup          from './pages/Signup'
import DashboardPage   from './pages/DashboardPage'
import MapView         from './pages/MapView'
import useAuthStore    from './store/authStore'

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

/* ── Placeholder for routes not yet built ── */
function ComingSoon({ title }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-8 text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl"
        style={{ background: 'linear-gradient(135deg, #6C63FF, #FF6584)', boxShadow: '0 0 30px rgba(108,99,255,0.4)' }}
      >
        🚧
      </div>
      <h2 className="font-display font-black text-2xl text-white">{title}</h2>
      <p className="text-sm text-muted max-w-xs">This page is coming soon. Stay tuned!</p>
    </div>
  )
}

export default function App() {
  const { initialize } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  return (
    <>
      <CustomCursor />

      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />

        {/* Auth (guest-only) */}
        <Route path="/login"    element={<GuestRoute><Login  /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><Signup /></GuestRoute>} />

        {/* Protected app shell */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard"   element={<DashboardPage />} />
          <Route path="/map"         element={<MapView />} />
          <Route path="/leaderboard" element={<ComingSoon title="Leaderboard" />} />
          <Route path="/analytics"   element={<ComingSoon title="Analytics" />} />
          <Route path="/goals"       element={<ComingSoon title="Goals" />} />
          <Route path="/settings"    element={<ComingSoon title="Settings" />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
