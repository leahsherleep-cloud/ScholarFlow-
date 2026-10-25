import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../layouts/DashboardLayout';
import StatsCard from '../../components/ui/StatsCard';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import { studentService } from '../../services/studentService';
import { scholarshipService } from '../../services/scholarshipService';
import { notificationService } from '../../services/notificationService';
import {
  FileText, Clock, CheckCircle, XCircle, GraduationCap, AlertCircle,
  Eye, ArrowRight, User, Bell, Calendar,
} from 'lucide-react';
import { formatDate, formatCurrency, formatDateTime } from '../../utils/helpers';

/* ─── Component ──────────────────────────────────────────────────────────────── */

const StudentDashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile]           = useState(null);
  const [applications, setApplications] = useState([]);
  const [scholarships, setScholarships] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(false);      // BUG-1: real error flag
  const [notifLoading, setNotifLoading] = useState(true);
  const [notifError, setNotifError]     = useState(false);      // BUG-2: notification error flag

  const fetchData = async () => {
    setError(false);
    setLoading(true);
    try {
      const [profileRes, appRes, schRes] = await Promise.all([
        studentService.getProfile(),
        studentService.getMyApplications(),
        scholarshipService.getAll({ limit: 4 }),
      ]);
      setProfile(profileRes.data.data.student);
      setApplications(appRes.data.data.applications || []);
      setScholarships(schRes.data.data || []);
    } catch {
      // BUG-1 fix: real error state — no fake IDs, no misleading data
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    setNotifError(false);
    setNotifLoading(true);
    try {
      const res = await notificationService.getAll({ limit: 3 });
      setNotifications(res.data.data?.notifications || []);
    } catch {
      // BUG-2 fix: surface the error so the widget shows a distinct banner
      setNotifError(true);
      setNotifications([]);
    } finally {
      setNotifLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchNotifications();
  }, []);

  const stats = {
    total:    applications.length,
    pending:  applications.filter((a) => ['SUBMITTED', 'UNDER_VERIFICATION', 'RESUBMITTED'].includes(a.status)).length,
    approved: applications.filter((a) => ['APPROVED', 'DISBURSED'].includes(a.status)).length,
    rejected: applications.filter((a) => a.status === 'REJECTED').length,
  };

  const recentApps = applications.slice(0, 5);

  return (
    <DashboardLayout>
      <div className="fade-in space-y-6">

        {/* ─── Page header ────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Welcome back, {user?.name?.split(' ')[0] || 'Student'}
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Track your scholarship applications and discover new funding opportunities.
            </p>
          </div>
          <Link to="/student/scholarships" className="btn-primary self-start sm:self-auto shadow-sm">
            Browse Scholarships <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* ─── Profile incomplete alert ────────────────────────────────────────── */}
        {profile && profile.profileCompletionStatus < 80 && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-xs">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-900">Profile Incomplete ({profile.profileCompletionStatus}%)</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Your profile is {profile.profileCompletionStatus}% complete. Complete it to improve eligibility for more scholarships.
              </p>
            </div>
            <Link to="/student/profile" className="btn-secondary text-xs py-1.5 px-3 flex-shrink-0 border-amber-300 text-amber-900 hover:bg-amber-100/50">
              Complete Profile
            </Link>
          </div>
        )}

        {/* ─── Data fetch error banner ──────────────────────────────── */}
        {error && !loading && (
          <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-xl p-4 shadow-xs">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-rose-900">Could not load dashboard data</p>
              <p className="text-xs text-rose-600 mt-0.5">Check your connection and try again.</p>
            </div>
            <button
              onClick={fetchData}
              className="btn-secondary text-xs py-1.5 px-3 flex-shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {/* ─── Stats ──────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard icon={FileText}    title="Total Applications"    value={stats.total}    color="violet" loading={loading} />
          <StatsCard icon={Clock}       title="Pending"               value={stats.pending}  color="yellow" loading={loading} />
          <StatsCard icon={CheckCircle} title="Approved"              value={stats.approved} color="green"  loading={loading} />
          <StatsCard icon={XCircle}     title="Rejected"              value={stats.rejected} color="red"    loading={loading} />
        </div>

        {/* ─── Main grid ──────────────────────────────────────────────────────── */}
        <div className="grid lg:grid-cols-5 gap-5">

          {/* Recent Applications */}
          <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 card-shadow overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="font-semibold text-slate-900 text-sm">Recent Applications</h2>
              <Link to="/student/applications" className="text-xs text-[#5B21B6] font-semibold hover:underline flex items-center gap-1">
                View All <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {loading ? (
              <LoadingSpinner text="Loading applications..." />
            ) : recentApps.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No Applications Yet"
                description="Browse available scholarships and start your first application."
                action={
                  <Link to="/student/scholarships" className="btn-primary text-xs">
                    Browse Scholarships
                  </Link>
                }
              />
            ) : (
              <div className="divide-y divide-slate-100">
                {recentApps.map((app) => (
                  <div key={app._id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50/80 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-[#F5F3FF] flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-[#5B21B6]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {app.scholarship?.name || 'Scholarship'}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        <span className="font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[11px] mr-2">
                          {app.applicationNumber || 'DRAFT'}
                        </span>
                        {formatDate(app.submittedAt || app.createdAt)}
                      </p>
                    </div>
                    <StatusBadge status={app.status} size="xs" />
                    <Link
                      to={`/student/applications/${app._id}`}
                      className="p-1.5 text-slate-400 hover:text-[#5B21B6] hover:bg-[#F5F3FF] rounded-lg transition-colors ml-1"
                      aria-label="View application"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="lg:col-span-2 flex flex-col gap-5">

            {/* Available Scholarships */}
            <div className="bg-white rounded-xl border border-slate-200 card-shadow overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                <h2 className="font-semibold text-slate-900 text-sm">Available Scholarships</h2>
                <Link to="/student/scholarships" className="text-xs text-[#5B21B6] font-semibold hover:underline flex items-center gap-1">
                  View All <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              {loading ? (
                <LoadingSpinner text="Loading..." />
              ) : scholarships.length === 0 ? (
                <EmptyState icon={GraduationCap} title="No scholarships available" />
              ) : (
                <div className="divide-y divide-slate-100">
                  {scholarships.slice(0, 4).map((sch) => (
                    <div key={sch._id} className="px-5 py-3 hover:bg-slate-50/80 transition-colors">
                      <p className="text-sm font-semibold text-slate-900 truncate">{sch.name}</p>
                      <p className="text-xs font-bold text-emerald-700 mt-1">{formatCurrency(sch.amount)}</p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(sch.applicationEndDate)}
                        </span>
                        <Link to={`/student/scholarships/${sch._id}`} className="text-xs text-[#5B21B6] font-semibold hover:underline">
                          View Details →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Notifications */}
            <div className="bg-white rounded-xl border border-slate-200 card-shadow overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                <h2 className="font-semibold text-slate-900 text-sm">Notifications</h2>
                <Link to="/student/notifications" className="text-xs text-[#5B21B6] font-semibold hover:underline flex items-center gap-1">
                  View All <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              {notifLoading ? (
                <div className="px-5 py-6 flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-[#5B21B6] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : notifError ? (
                <div className="px-5 py-6 text-center">
                  <AlertCircle className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">Could not load notifications</p>
                  <button
                    onClick={fetchNotifications}
                    className="mt-2 text-xs text-[#5B21B6] font-semibold hover:underline"
                  >
                    Retry
                  </button>
                </div>
              ) : notifications.length === 0 ? (
                <div className="px-5 py-6 text-center">
                  <Bell className="w-7 h-7 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {notifications.map((n) => (
                    <div
                      key={n._id}
                      className={`px-5 py-3 flex items-start gap-3 hover:bg-slate-50/80 transition-colors ${
                        !n.isRead ? 'bg-[#F5F3FF]/40' : ''
                      }`}
                    >
                      <div
                        className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${
                          n.isRead ? 'bg-transparent' : 'bg-[#7C3AED]'
                        }`}
                      />
                      <div className="min-w-0">
                        <p className={`text-xs leading-relaxed ${
                          n.isRead ? 'text-slate-500' : 'text-slate-800 font-semibold'
                        }`}>
                          {n.title}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed line-clamp-2">
                          {n.message}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          {formatDateTime(n.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── Profile completion bar ──────────────────────────────────────────── */}
        {profile && (
          <div className="bg-white rounded-xl border border-slate-200 card-shadow p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-[#F5F3FF] rounded-lg flex items-center justify-center">
                <User className="w-4 h-4 text-[#5B21B6]" />
              </div>
              <h2 className="font-semibold text-slate-900 text-sm">Profile Completion</h2>
              <span className="ml-auto text-sm font-bold text-[#5B21B6]">
                {profile.profileCompletionStatus}%
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div
                className="bg-[#5B21B6] h-2 rounded-full transition-all duration-700"
                style={{ width: `${profile.profileCompletionStatus}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-slate-400">
              <span>Personal Info</span>
              <span>Academic Info</span>
              <span>Bank Details</span>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
