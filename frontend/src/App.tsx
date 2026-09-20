import { lazy, Suspense, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

const Login = lazy(() => import('./pages/Login'));
const FarmsList = lazy(() => import('./pages/FarmsList'));
const FarmDashboard = lazy(() => import('./pages/FarmDashboard'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));

function ProtectedRoute({ children }: { children: ReactNode }) {
  return localStorage.getItem('access_token') ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="route-loading"><span className="spinner spinner-dark" /><span>Carregando...</span></div>}>
        <Routes>
          <Route path="/" element={<Login mode="login" />} />
          <Route path="/cadastro" element={<Login mode="register" />} />
          <Route path="/esqueci-senha" element={<ForgotPassword />} />
          <Route path="/verificar-email" element={<VerifyEmail />} />
          <Route path="/redefinir-senha" element={<ResetPassword />} />
          <Route path="/dashboard" element={<ProtectedRoute><FarmsList /></ProtectedRoute>} />
          <Route path="/dashboard/:farmId" element={<ProtectedRoute><FarmDashboard /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
