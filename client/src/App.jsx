import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, RoleRoute, PublicRoute } from './components/shared/RouteGuards';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import LandingPage from './pages/LandingPage';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import StudentProfile from './pages/student/StudentProfile';
import StudentScholarships from './pages/student/StudentScholarships';
import ScholarshipDetail from './pages/student/ScholarshipDetail';
import ApplicationForm from './pages/student/ApplicationForm';
import StudentApplications from './pages/student/StudentApplications';
import ApplicationDetail from './pages/student/ApplicationDetail';
import StudentNotifications from './pages/student/StudentNotifications';

// Officer Pages
import OfficerDashboard from './pages/officer/OfficerDashboard';
import OfficerApplicationReview from './pages/officer/OfficerApplicationReview';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminScholarships from './pages/admin/AdminScholarships';
import AdminUsers from './pages/admin/AdminUsers';
import AdminApplications from './pages/admin/AdminApplications';
import AdminAuditLogs from './pages/admin/AdminAuditLogs';
import AdminDisbursements from './pages/admin/AdminDisbursements';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: '10px',
              background: '#fff',
              color: '#1e293b',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              fontSize: '14px',
            },
            success: {
              iconTheme: { primary: '#16a34a', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#dc2626', secondary: '#fff' },
            },
          }}
        />

        <Routes>
          {/* Root — public landing page */}
          <Route path="/" element={<LandingPage />} />

          {/* Auth routes (redirect to dashboard if logged in) */}
          <Route
            path="/login"
            element={<PublicRoute><LoginPage /></PublicRoute>}
          />
          <Route
            path="/register"
            element={<PublicRoute><RegisterPage /></PublicRoute>}
          />

          {/* ─── Student Routes ─────────────────────────────────── */}
          <Route
            path="/student/dashboard"
            element={<RoleRoute roles={['student']}><StudentDashboard /></RoleRoute>}
          />
          <Route
            path="/student/profile"
            element={<RoleRoute roles={['student']}><StudentProfile /></RoleRoute>}
          />
          <Route
            path="/student/scholarships"
            element={<RoleRoute roles={['student']}><StudentScholarships /></RoleRoute>}
          />
          <Route
            path="/student/scholarships/:id"
            element={<RoleRoute roles={['student']}><ScholarshipDetail /></RoleRoute>}
          />
          <Route
            path="/student/apply/:scholarshipId"
            element={<RoleRoute roles={['student']}><ApplicationForm /></RoleRoute>}
          />
          <Route
            path="/student/applications"
            element={<RoleRoute roles={['student']}><StudentApplications /></RoleRoute>}
          />
          <Route
            path="/student/applications/:id"
            element={<RoleRoute roles={['student']}><ApplicationDetail /></RoleRoute>}
          />
          <Route
            path="/student/notifications"
            element={<RoleRoute roles={['student']}><StudentNotifications /></RoleRoute>}
          />

          {/* ─── Officer Routes ─────────────────────────────────── */}
          <Route
            path="/officer/dashboard"
            element={<RoleRoute roles={['officer', 'admin']}><OfficerDashboard /></RoleRoute>}
          />
          <Route
            path="/officer/applications"
            element={<RoleRoute roles={['officer', 'admin']}><OfficerApplicationReview /></RoleRoute>}
          />
          <Route
            path="/officer/applications/:id"
            element={<RoleRoute roles={['officer', 'admin']}><OfficerApplicationReview /></RoleRoute>}
          />


          {/* ─── Admin Routes ───────────────────────────────────── */}
          <Route
            path="/admin/dashboard"
            element={<RoleRoute roles={['admin']}><AdminDashboard /></RoleRoute>}
          />
          <Route
            path="/admin/scholarships"
            element={<RoleRoute roles={['admin']}><AdminScholarships /></RoleRoute>}
          />
          <Route
            path="/admin/users"
            element={<RoleRoute roles={['admin']}><AdminUsers /></RoleRoute>}
          />
          <Route
            path="/admin/applications"
            element={<RoleRoute roles={['admin']}><AdminApplications /></RoleRoute>}
          />
          <Route
            path="/admin/audit-logs"
            element={<RoleRoute roles={['admin']}><AdminAuditLogs /></RoleRoute>}
          />
          <Route
            path="/admin/disbursements"
            element={<RoleRoute roles={['admin']}><AdminDisbursements /></RoleRoute>}
          />

          {/* 404 */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
