import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Pagination from '../../components/ui/Pagination';
import { adminService } from '../../services/adminService';
import { formatDateTime } from '../../utils/helpers';
import { ScrollText } from 'lucide-react';

const AdminAuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ page: 1, limit: 20 });

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await adminService.getAuditLogs(filters);
      setLogs(res.data.data || []);
      setPagination(res.data.pagination);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchLogs(); }, [filters.page]);

  const actionColors = {
    APPLICATION_APPROVED: 'text-[#5B21B6] bg-purple-50 border border-purple-100',
    APPLICATION_REJECTED: 'text-red-600 bg-red-50 border border-red-100',
    APPLICATION_SUBMITTED: 'text-blue-600 bg-blue-50 border border-blue-100',
    DOCUMENT_VERIFIED: 'text-teal-600 bg-teal-50 border border-teal-100',
    SCHOLARSHIP_CREATED: 'text-purple-700 bg-purple-50 border border-purple-100',
    USER_DEACTIVATED: 'text-red-600 bg-red-50 border border-red-100',
    DISBURSEMENT_COMPLETED: 'text-[#5B21B6] bg-purple-50 border border-purple-100',
    STUDENT_REGISTERED: 'text-indigo-600 bg-indigo-50 border border-indigo-100',
  };

  return (
    <DashboardLayout>
      <div className="fade-in">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Audit Logs</h1>
          <p className="text-slate-500 text-sm mt-1">Complete immutable audit trail of all system actions</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? <LoadingSpinner text="Loading audit logs..." /> : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <ScrollText className="w-12 h-12 text-gray-200 mb-3" />
              <p className="text-gray-500">No audit logs yet</p>
            </div>
          ) : (
            <>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>User</th>
                      <th>Action</th>
                      <th>Entity</th>
                      <th>Status Change</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log._id}>
                        <td className="text-xs text-gray-500 whitespace-nowrap">{formatDateTime(log.createdAt)}</td>
                        <td>
                          <p className="text-sm font-medium text-gray-900">{log.userId?.name || 'System'}</p>
                          <p className="text-xs text-gray-400 capitalize">{log.userId?.role}</p>
                        </td>
                        <td>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${actionColors[log.action] || 'text-gray-600 bg-gray-100'}`}>
                            {log.action?.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="text-xs text-gray-500 capitalize">{log.entityType}</td>
                        <td className="text-xs">
                          {log.previousStatus && log.newStatus ? (
                            <span className="text-gray-500">
                              {log.previousStatus} → <span className="text-green-600 font-medium">{log.newStatus}</span>
                            </span>
                          ) : '—'}
                        </td>
                        <td className="text-xs text-gray-500 max-w-[150px] truncate" title={log.remarks}>
                          {log.remarks || '—'}
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

export default AdminAuditLogs;
