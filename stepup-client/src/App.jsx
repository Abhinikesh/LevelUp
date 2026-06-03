import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import CustomCursor from './components/ui/CustomCursor'
import AppLayout   from './components/layout/AppLayout'
import Landing     from './pages/Landing'
import Login       from './pages/Login'
import Signup      from './pages/Signup'
import DashboardPage from './pages/DashboardPage'
import useAuthStore from './store/authStore'

// Protected route wrapper
function ProtectedRoute({ children }) {
  const { user, token } = useAuthStore()
  if (!user || !token) return <Navigate to="/login" replace />
  return children
}

// Guest-only route wrapper (redirect logged-in users to dashboard)
function GuestRoute({ children }) {
  const { user, token } = useAuthStore()
  if (user && token) return <Navigate to="/dashboard" replace />
  return children
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
        {/* Public root: Landing Page */}
        <Route path="/" element={<Landing />} />

        {/* Auth routes (guest only) */}
        <Route
          path="/login"
          element={
            <GuestRoute>
              <Login />
            </GuestRoute>
          }
        />
        <Route
          path="/register"
          element={
            <GuestRoute>
              <Signup />
            </GuestRoute>
          }
        />

        {/* App routes (protected) */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
        </Route>

        {/* 404 fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
