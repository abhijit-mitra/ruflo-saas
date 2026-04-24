import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import ForgotPasswordPage from '@/pages/ForgotPassword';
import Dashboard from '@/pages/Dashboard';
import Projects from '@/pages/Projects';
import ProjectDetail from '@/pages/ProjectDetail';
import QuoteBuilder from '@/pages/QuoteBuilder';
import ChangeOrder from '@/pages/ChangeOrder';
import Invoice from '@/pages/Invoice';
import PurchaseOrder from '@/pages/PurchaseOrder';
import SalesOrder from '@/pages/SalesOrder';
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
      <Route
        path="/projects"
        element={
          <ProtectedRoute>
            <Projects />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:id"
        element={
          <ProtectedRoute>
            <ProjectDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:id/quotes/new"
        element={
          <ProtectedRoute>
            <QuoteBuilder />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:id/quotes/:quoteId"
        element={
          <ProtectedRoute>
            <QuoteBuilder />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:id/change-orders/:coId"
        element={
          <ProtectedRoute>
            <ChangeOrder />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:id/invoices/:invoiceId"
        element={
          <ProtectedRoute>
            <Invoice />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:id/purchase-orders/:poId"
        element={
          <ProtectedRoute>
            <PurchaseOrder />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:id/sales-orders/:soId"
        element={
          <ProtectedRoute>
            <SalesOrder />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
