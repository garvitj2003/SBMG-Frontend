import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { LocationProvider } from './context/LocationContext';
import { CEOLocationProvider } from './context/CEOLocationContext';
import Login from './pages/Login';
import UnifiedDashboard from './components/dashboards/UnifiedDashboard';
import UnifiedDashboardCEO from './components/dashboards/ceo/UnifiedDashboardCEO';
import { ROLES } from './utils/roleConfig';

import './App.css';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, role, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { user, role, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Redirect authenticated users to their respective dashboards
  if (user) {
    if (role === ROLES.CEO) {
      return <Navigate to="/dashboard/ceo" replace />;
    } else if (role === ROLES.SMD) {
      return <Navigate to="/dashboard" replace />;
    }
    // Default to main dashboard for any other roles
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={[ROLES.SMD]}>
              <LocationProvider>
                <UnifiedDashboard />
              </LocationProvider>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/ceo"
          element={
            <ProtectedRoute allowedRoles={[ROLES.CEO]}>
              <CEOLocationProvider>
                <UnifiedDashboardCEO />
              </CEOLocationProvider>
            </ProtectedRoute>
          }
        />
       
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
