import { BrowserRouter, Routes, Route } from 'react-router-dom'
import DemoOne from './demo'
import StudentSignup from '@/pages/student/Signup'
import StudentLogin from '@/pages/student/Login'
import StudentDashboard from '@/pages/student/Dashboard'
import AdminLogin from '@/pages/admin/Login'
import AdminDashboard from '@/pages/admin/Dashboard'
import AuthCallback from '@/pages/AuthCallback'
import ForgotPassword from '@/pages/ForgotPassword'
import ProtectedRoute from '@/components/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Main landing page */}
        <Route
          path="/"
          element={
            <main className="min-h-screen bg-background">
              <DemoOne />
            </main>
          }
        />

        {/* OAuth callback route */}
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Forgot password */}
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Student auth routes */}
        <Route path="/student/signup" element={<StudentSignup />} />
        <Route path="/student/login" element={<StudentLogin />} />
        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute requiredRole="student" redirectTo="/student/login">
              <StudentDashboard />
            </ProtectedRoute>
          }
        />

        {/* Admin auth routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute requiredRole="admin" redirectTo="/admin/login">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
