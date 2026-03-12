import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import RouteCardManagement from './pages/RouteCardManagement';
import AdminDashboard from './pages/dashboards/AdminDashboard';
import EmployeeDashboard from './pages/dashboards/EmployeeDashboard';
import VendorDashboard from './pages/dashboards/VendorDashboard';
import DriverDashboard from './pages/dashboards/DriverDashboard';
import './App.css';

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return isAuthenticated ? children : <Navigate to="/" />;
}

function RoleBasedDashboard() {
  const { user } = useAuth();

  if (!user?.role) {
    return <Navigate to="/" />;
  }

  switch (user.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'employee':
      return <EmployeeDashboard />;
    case 'vendor':
      return <VendorDashboard />;
    case 'driver':
      return <DriverDashboard />;
    default:
      return <Dashboard />;
  }
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<AuthPage />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <RoleBasedDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              }
            />
            <Route
              path="/route-cards"
              element={
                <PrivateRoute>
                  <RouteCardManagement />
                </PrivateRoute>
              }
            />
            <Route path="/unauthorized" element={<div className="unauthorized">Access Denied</div>} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
