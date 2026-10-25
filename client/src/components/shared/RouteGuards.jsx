import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PageLoader } from '../ui/LoadingSpinner';

// Protect any route — redirect to login if not authenticated
export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;

  return children;
};

// Role-specific route guard
export const RoleRoute = ({ children, roles }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;

  if (!roles.includes(user?.role)) {
    // Redirect to appropriate dashboard
    const dashboardMap = {
      student: '/student/dashboard',
      officer: '/officer/dashboard',
      admin: '/admin/dashboard',
    };
    return <Navigate to={dashboardMap[user?.role] || '/login'} replace />;
  }

  return children;
};

// Public-only route — redirect to dashboard if already logged in
export const PublicRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) return <PageLoader />;

  if (isAuthenticated) {
    const dashboardMap = {
      student: '/student/dashboard',
      officer: '/officer/dashboard',
      admin: '/admin/dashboard',
    };
    return <Navigate to={dashboardMap[user?.role] || '/student/dashboard'} replace />;
  }

  return children;
};
