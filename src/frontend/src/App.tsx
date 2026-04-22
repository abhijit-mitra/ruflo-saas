import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import ForgotPasswordPage from '@/pages/ForgotPassword';
import Dashboard from '@/pages/Dashboard';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
