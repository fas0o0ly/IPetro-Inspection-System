// src/routes/AppRoutes.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Layout
import MainLayout from '../components/layout/MainLayout';

// Pages
import Login from '../pages/auth/Login';
import Dashboard from '../pages/dashboard/Dashboard';
import VesselList from '../pages/vessels/VesselList';
import InspectionList from '../pages/inspections/InspectionList';
import PhotoList from '../pages/photos/PhotoList';
import ObservationList from '../pages/observations/ObservationList';
import ReportsPage from '../pages/reports/ReportsPage';
import Settings from '../pages/settings/Settings';
import UsersPage from '../pages/users/UsersPage';
import UserProfile from '../components/users/UserProfile';
import AIAnalysisPage from '../pages/ai/AIAnalysisPage';

// Protected Route wrapper
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check admin requirement
  if (requireAdmin && user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />

        {/* ✅ ALL Protected routes inside MainLayout */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          {/* Dashboard */}
          <Route index element={<Dashboard />} />
          
          {/* Vessels */}
          <Route path="vessels" element={<VesselList />} />
          
          {/* Inspections */}
          <Route path="inspections" element={<InspectionList />} />
          
          {/* Photos */}
          <Route path="photos" element={<PhotoList />} />
          
          {/* Observations */}
          <Route path="observations" element={<ObservationList />} />
          
          {/*  Reports*/}
          <Route path="reports" element={<ReportsPage />} />
          
          {/*  AI Analysis */}
          <Route path="ai-analysis" element={<AIAnalysisPage />} />
          
          {/*  Users (Admin Only) */}
          <Route 
            path="users" 
            element={
              <ProtectedRoute requireAdmin>
                <UsersPage />
              </ProtectedRoute>
            } 
          />
          
          {/*  Profile  */}
          <Route path="profile" element={<UserProfile />} />
          
          {/* Settings */}
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;