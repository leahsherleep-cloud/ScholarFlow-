import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatusBadge from '../../components/ui/StatusBadge';
import Pagination from '../../components/ui/Pagination';
import { applicationService } from '../../services/applicationService';
import { formatDate, formatCurrency } from '../../utils/helpers';
import { FileText, Eye, Search, Filter } from 'lucide-react';
import FilterDropdown from '../../components/ui/FilterDropdown';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'UNDER_VERIFICATION', label: 'Under Verification' },
  { value: 'CORRECTION_REQUIRED', label: 'Correction Required' },
  { value: 'RESUBMITTED', label: 'Resubmitted' },
  { value: 'VERIFIED', label: 'Verified' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'DISBURSED', label: 'Disbursed' },
];

const StudentApplications = () => {
  const [applications, setApplications] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);             // BUG-3 fix
  const [filters, setFilters] = useState({ status: '', page: 1, limit: 10 });

  const fetchApplications = async () => {
    setLoading(true);
    setError(false);                                       // BUG-3 fix: reset on retry
    try {
      const params = { ...filters };
      if (!params.status) delete params.status;
      const res = await applicationService.getAll(params);
      setApplications(res.data.data || []);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error(err);
      setError(true);                                      // BUG-3 fix: surface error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [filters.status, filters.page]);

  return (
    <DashboardLayout>
      <div className="fade-in space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Applications</h1>
            <p className="text-slate-500 text-sm mt-0.5">Track your submitted and in-progress scholarship applications</p>
          </div>
          <Link to="/student/scholarships" className="btn-primary self-start sm:self-auto shadow-sm">
            + Apply for Scholarship
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 card-shadow flex flex-wrap gap-3 items-center">
          <div className="w-full sm:w-auto min-w-[240px]">
            <FilterDropdown
              options={STATUS_OPTIONS}
              value={filters.status}
              onChange={(val) => setFilters({ ...filters, status: val, page: 1 })}
              label="Filter by status"
              className="w-full"
            />
          </div>
          {filters.status && (
            <button
              onClick={() => setFilters({ ...filters, status: '', page: 1 })}
              className="btn-ghost text-xs text-[#5B21B6] hover:bg-[#F5F3FF]"
            >
              Clear Filter
            </button>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 card-shadow overflow-hidden">
          {loading ? (
            <LoadingSpinner text="Loading applications..." />
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="w-10 h-10 text-rose-300 mb-3" />
              <p className="text-slate-700 font-semibold">Failed to Load Applications</p>
              <p className="text-slate-400 text-sm mt-1">Could not connect to the server. Please try again.</p>
              <button onClick={fetchApplications} className="btn-secondary mt-4 text-sm">
                Retry
              </button>
            </div>
          ) : applications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-slate-700 font-semibold text-base">No Applications Found</p>
              <p className="text-slate-400 text-sm mt-1">
                {filters.status ? 'Try changing the status filter.' : 'Browse scholarships and start your first application.'}
              </p>
              <Link to="/student/scholarships" className="btn-primary mt-4 text-xs shadow-sm">
                Browse Scholarships
              </Link>
            </div>
          ) : (
            <>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Application ID</th>
                      <th>Scholarship</th>
                      <th>Amount</th>
                      <th>Submitted Date</th>
                      <th>Current Status</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((app) => (
                      <tr key={app._id}>
                        <td>
                          <span className="font-mono text-xs bg-slate-100 text-slate-700 font-semibold px-2 py-1 rounded-md border border-slate-200">
                            {app.applicationNumber || 'DRAFT'}
                          </span>
                        </td>
                        <td>
                          <p className="font-semibold text-slate-900 text-sm">
                            {app.scholarship?.name || '—'}
                          </p>
                        </td>
                        <td className="text-emerald-700 font-bold text-sm">
                          {formatCurrency(app.scholarship?.amount)}
                        </td>
                        <td className="text-sm text-slate-500">
                          {formatDate(app.submittedAt || app.createdAt)}
                        </td>
                        <td>
                          <StatusBadge status={app.status} size="xs" />
                        </td>
                        <td className="text-right">
                          <Link
                            to={`/student/applications/${app._id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#5B21B6] bg-[#F5F3FF] hover:bg-[#EDE9FE] transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" /> Details
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                pagination={pagination}
                onPageChange={(p) => setFilters({ ...filters, page: p })}
              />
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentApplications;
