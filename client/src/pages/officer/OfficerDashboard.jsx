import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import StatsCard from '../../components/ui/StatsCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import SearchBar from '../../components/ui/SearchBar';
import FilterDropdown from '../../components/ui/FilterDropdown';
import Pagination from '../../components/ui/Pagination';
import { applicationService } from '../../services/applicationService';
import { formatDate, formatCurrency } from '../../utils/helpers';
import {
  ClipboardList, Clock, ShieldCheck, CheckCircle, XCircle, Eye, AlertCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const STATUS_OPTIONS = [
  { value: '',                    label: 'All Applications'   },
  { value: 'SUBMITTED',           label: 'Submitted'          },
  { value: 'UNDER_VERIFICATION',  label: 'Under Verification' },
  { value: 'CORRECTION_REQUIRED', label: 'Correction Required'},
  { value: 'RESUBMITTED',         label: 'Resubmitted'        },
  { value: 'VERIFIED',            label: 'Verified'           },
  { value: 'UNDER_EVALUATION',    label: 'Under Evaluation'   },
  { value: 'APPROVED',            label: 'Approved'           },
  { value: 'REJECTED',            label: 'Rejected'           },
];

const OfficerDashboard = () => {
  const [applications, setApplications] = useState([]);
  const [pagination, setPagination]     = useState(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(false);
  const [search, setSearch]             = useState('');
  const [filters, setFilters]           = useState({ status: '', page: 1, limit: 10 });

  const fetchApplications = async () => {
    setLoading(true);
    setError(false);
    try {
      const params = { ...filters };
      if (!params.status) delete params.status;
      const res = await applicationService.getAll(params);
      setApplications(res.data.data || []);
      setPagination(res.data.pagination);
    } catch {
      setError(true);
      setApplications([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchApplications(); }, [filters.status, filters.page]);

  const filtered = applications.filter((a) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      a.applicationNumber?.toLowerCase().includes(s) ||
      a.studentUser?.name?.toLowerCase().includes(s) ||
      a.scholarship?.name?.toLowerCase().includes(s)
    );
  });

  // Compute stats from the real applications state.
  // When loading, StatsCard shows skeleton; when API falls back to MOCK_APPS
  // the computation is identical — no separate mock stats needed.
  const stats = {
    total:      applications.length,
    pending:    applications.filter((a) => ['SUBMITTED', 'RESUBMITTED'].includes(a.status)).length,
    correction: applications.filter((a) => a.status === 'CORRECTION_REQUIRED').length,
    verified:   applications.filter((a) => a.status === 'VERIFIED').length,
    approved:   applications.filter((a) => a.status === 'APPROVED').length,
    rejected:   applications.filter((a) => a.status === 'REJECTED').length,
  };

  return (
    <DashboardLayout contentContainerClassName="w-full max-w-none">
      <div className="fade-in space-y-6 w-full">

        {/* ─── Header ─────────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Officer Dashboard</h1>
            <p className="text-slate-500 text-sm mt-0.5">Review, verify, and manage incoming scholarship applications across all categories.</p>
          </div>
        </div>

        {/* ─── Stats KPI Grid ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 w-full">
          <StatsCard icon={ClipboardList} title="Total Applications"  value={stats.total}      color="blue"   loading={loading} />
          <StatsCard icon={Clock}         title="Pending Verification" value={stats.pending}    color="yellow" loading={loading} />
          <StatsCard icon={AlertCircle}   title="Correction Requests"  value={stats.correction} color="orange" loading={loading} />
          <StatsCard icon={ShieldCheck}   title="Verified"             value={stats.verified}   color="teal"   loading={loading} />
          <StatsCard icon={CheckCircle}   title="Approved"             value={stats.approved}   color="green"  loading={loading} />
          <StatsCard icon={XCircle}       title="Rejected"             value={stats.rejected}   color="red"    loading={loading} />
        </div>

        {/* ─── Filters bar ────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center w-full">
          <div className="flex-1 min-w-0">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search by student name, email, application number, or scholarship…"
              className="w-full"
            />
          </div>
          <div className="w-full sm:w-auto sm:min-w-[220px]">
            <FilterDropdown
              options={STATUS_OPTIONS}
              value={filters.status}
              onChange={(v) => setFilters({ ...filters, status: v, page: 1 })}
              label="Filter by status"
              className="w-full"
            />
          </div>
        </div>

        {/* ─── Applications Table ──────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden w-full">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="font-semibold text-slate-900 text-sm">Applications Queue</h2>
              <p className="text-xs text-slate-400 mt-0.5">Real-time candidate submissions awaiting administrative action</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-purple-50 text-[#5B21B6] rounded-full border border-purple-100">
              {pagination?.total ?? filtered.length} Applications
            </span>
          </div>

          {loading ? (
            <LoadingSpinner text="Loading applications..." />
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <AlertCircle className="w-10 h-10 text-rose-400 mb-3" />
              <p className="text-slate-800 font-semibold">Failed to load applications</p>
              <p className="text-slate-400 text-sm mt-1">Could not connect to the server. Please try again.</p>
              <button onClick={fetchApplications} className="btn-secondary mt-4 text-sm">
                Retry
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No Applications Found"
              description="Try adjusting your search query or status filter criteria."
            />
          ) : (
            <>
              <div className="table-container">
                <table className="data-table w-full">
                  <thead>
                    <tr>
                      <th className="w-[14%]">Application ID</th>
                      <th className="w-[22%]">Student</th>
                      <th className="w-[24%]">Scholarship</th>
                      <th className="w-[12%]">Amount</th>
                      <th className="w-[12%]">Submitted</th>
                      <th className="w-[10%]">Status</th>
                      <th className="w-[6%] text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((app) => (
                      <tr key={app._id} className="hover:bg-slate-50/80 transition-colors">
                        <td>
                          <span className="font-mono text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200/80 px-2.5 py-1 rounded-lg inline-block">
                            {app.applicationNumber || 'DRAFT'}
                          </span>
                        </td>
                        <td>
                          <div className="min-w-0 pr-3">
                            <p className="text-sm font-semibold text-slate-900 truncate" title={app.studentUser?.name || '—'}>
                              {app.studentUser?.name || '—'}
                            </p>
                            <p className="text-xs text-slate-400 truncate mt-0.5" title={app.studentUser?.email}>
                              {app.studentUser?.email}
                            </p>
                          </div>
                        </td>
                        <td>
                          <div className="min-w-0 pr-3">
                            <p className="text-sm font-medium text-slate-800 truncate" title={app.scholarship?.name || '—'}>
                              {app.scholarship?.name || '—'}
                            </p>
                          </div>
                        </td>
                        <td>
                          <span className="text-sm font-bold text-[#5B21B6]">
                            {formatCurrency(app.scholarship?.amount)}
                          </span>
                        </td>
                        <td className="text-sm text-slate-500 whitespace-nowrap">
                          {formatDate(app.submittedAt || app.createdAt)}
                        </td>
                        <td>
                          <StatusBadge status={app.status} size="xs" />
                        </td>
                        <td className="text-right whitespace-nowrap">
                          <Link
                            to={`/officer/applications/${app._id}`}
                            className="btn-ghost text-xs py-1.5 px-3 gap-1.5 font-semibold text-[#5B21B6] hover:bg-purple-50 hover:text-[#4C1D95] border border-slate-200/80 rounded-lg inline-flex items-center whitespace-nowrap"
                          >
                            <Eye className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>Review</span>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {pagination && (
                <div className="border-t border-slate-100 px-4 py-3 bg-slate-50/30">
                  <Pagination
                    pagination={pagination}
                    onPageChange={(p) => setFilters({ ...filters, page: p })}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default OfficerDashboard;
