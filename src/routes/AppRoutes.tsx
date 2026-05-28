import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from '../stores/useAuthStore';
import RootLayout from '../layouts/RootLayout';
import AuthLayout from '../layouts/AuthLayout';
import Login from '../pages/Login';
import AdminDashboard from '../pages/Admin/AdminDashboard';
import ReceptionistDashboard from '../pages/Receptions/ReceptionistDashboard';
import DoctorDashboard from '../pages/Doctors/DoctorDashboard';

const RoleRoute: React.FC<{ children: React.ReactNode, allowedRole: string }> = ({ children, allowedRole }) => {
  const { user, loading } = useAuthStore();

  if (loading) return null;
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== allowedRole) {
    return <Navigate to={`/${user.role}`} replace />;
  }

  return <>{children}</>;
};

// Private Route Wrapper to enforce login check
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">
        Loading Clinic Portal...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Public Route Wrapper to restrict logged-in users from visiting login
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">
        Loading Clinic Portal...
      </div>
    );
  }

  if (user) {
    return <Navigate to={`/${user.role}`} replace />;
  }

  return <>{children}</>;
};

// Redirect root to role specific dashboard
const RootRedirect: React.FC = () => {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={`/${user.role}`} replace />;
};

export const AppRoutes: React.FC = () => {
  const { initAuth, loading } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">
        Initializing...
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route element={<PublicRoute><AuthLayout /></PublicRoute>}>
        <Route path="/login" element={<Login />} />
      </Route>

      {/* Protected Main Routes */}
      <Route element={<ProtectedRoute><RootLayout /></ProtectedRoute>}>
        <Route path="/" element={<RootRedirect />} />
        
        <Route 
          path="/admin" 
          element={
            <RoleRoute allowedRole="admin">
              <AdminDashboard />
            </RoleRoute>
          } 
        />
        <Route 
          path="/receptionist" 
          element={
            <RoleRoute allowedRole="receptionist">
              <ReceptionistDashboard />
            </RoleRoute>
          } 
        />
        <Route 
          path="/doctor" 
          element={
            <RoleRoute allowedRole="doctor">
              <DoctorDashboard />
            </RoleRoute>
          } 
        />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
