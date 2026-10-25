import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatusBadge from '../../components/ui/StatusBadge';
import Pagination from '../../components/ui/Pagination';
import { applicationService } from '../../services/applicationService';
import { formatDate, formatCurrency } from '../../utils/helpers';
import { FileText, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import SearchBar from '../../components/ui/SearchBar';
import FilterDropdown from '../../components/ui/FilterDropdown';

const STATUS_OPTS = [
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

const AdminApplications = () => {
  const [applications, setApplications] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', search: '', page: 1, limit: 15 });

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const params = { ...filters };
      if (!params.status) delete params.status;
      if (!params.search) delete params.search;
      const res = await applicationService.getAll(params);
      setApplications(res.data.data || []);
      setPagination(res.data.pagination);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchApplications(); }, [filters.status, filters.page]);

  return (
    <DashboardLayout>
      <div className="fade-in">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Applications</h1>
          <p className="text-slate-500 text-sm mt-1">Monitor all scholarship applications in the system</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-5 flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-[240px]">
            <SearchBar
              placeholder="Search by application number..."
              value={filters.search}
              onChange={(val) => setFilters({ ...filters, search: val })}
              className="w-full"
            />
          </div>
          <div className="w-full sm:w-auto sm:min-w-[200px]">
            <FilterDropdown
              options={STATUS_OPTS}
              value={filters.status}
              onChange={(val) => setFilters({ ...filters, status: val, page: 1 })}
              label="Filter by status"
              className="w-full"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? <LoadingSpinner text="Loading..." /> : applications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <FileText className="w-12 h-12 text-slate-200 mb-3" />
              <p className="text-slate-500">No applications found</p>
            </div>
          ) : (
            <>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Application ID</th>
                      <th>Student</th>
                      <th>Scholarship</th>
                      <th>Amount</th>
                      <th>Submitted</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((app) => (
                      <tr key={app._id}>
                        <td><span className="font-mono text-xs bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg">{app.applicationNumber || 'DRAFT'}</span></td>
                        <td>
                          <p className="text-sm font-medium text-slate-900">{app.studentUser?.name}</p>
                          <p className="text-xs text-slate-400">{app.studentUser?.email}</p>
                        </td>
                        <td className="text-sm text-slate-700 max-w-[160px] truncate">{app.scholarship?.name}</td>
                        <td className="text-sm font-semibold text-[#5B21B6]">{formatCurrency(app.scholarship?.amount)}</td>
                        <td className="text-sm text-slate-500">{formatDate(app.submittedAt || app.createdAt)}</td>
                        <td><StatusBadge status={app.status} /></td>
                        <td>
                          <Link to={`/officer/applications/${app._id}`} className="btn-ghost text-xs py-1.5">
                            <Eye className="w-3.5 h-3.5" /> Review
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination pagination={pagination} onPageChange={(p) => setFilters({ ...filters, page: p })} />
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminApplications;
