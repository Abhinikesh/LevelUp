import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import CustomCursor from './components/ui/CustomCursor'
import AppLayout   from './components/layout/AppLayout'
import AuthLayout  from './components/layout/AuthLayout'
import LoginPage    from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
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
        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Auth routes (guest only) */}
        <Route element={<AuthLayout />}>
          <Route
            path="/login"
            element={
              <GuestRoute>
                <LoginPage />
              </GuestRoute>
            }
          />
          <Route
            path="/register"
            element={
              <GuestRoute>
                <RegisterPage />
              </GuestRoute>
            }
          />
        </Route>

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
