import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';
import { adminService } from '../../services/adminService';
import { applicationService } from '../../services/applicationService';
import { formatDate, formatCurrency, formatDateTime } from '../../utils/helpers';
import { Banknote, Plus, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminDisbursements = () => {
  const [disbursements, setDisbursements] = useState([]);
  const [approvedApps, setApprovedApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ applicationId: '', transactionReference: '', remarks: '' });
  const [processing, setProcessing] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [disbRes, appRes] = await Promise.all([
        adminService.getDisbursements(),
        applicationService.getAll({ status: 'APPROVED', limit: 100 }),
      ]);
      setDisbursements(disbRes.data.data.disbursements || []);
      setApprovedApps(appRes.data.data || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDisburse = async () => {
    if (!form.applicationId) { toast.error('Select an application'); return; }
    setProcessing(true);
    try {
      await adminService.initiateDisbursement(form);
      toast.success('Disbursement completed!');
      setModal(false);
      setForm({ applicationId: '', transactionReference: '', remarks: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Disbursement failed');
    } finally { setProcessing(false); }
  };

  return (
    <DashboardLayout>
      <div className="fade-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Disbursements</h1>
            <p className="text-slate-500 text-sm mt-1">Process and track scholarship fund payouts for approved candidates</p>
          </div>
          <button onClick={() => setModal(true)} className="btn-primary" id="disburse-btn">
            <Plus className="w-4 h-4" /> Process Disbursement
          </button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? <LoadingSpinner text="Loading disbursements..." /> : disbursements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Banknote className="w-12 h-12 text-slate-200 mb-3" />
              <p className="text-slate-500">No disbursements yet</p>
              {approvedApps.length > 0 && (
                <p className="text-[#5B21B6] font-medium text-sm mt-2">{approvedApps.length} approved application(s) ready for disbursement</p>
              )}
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Application</th>
                    <th>Student</th>
                    <th>Scholarship</th>
                    <th>Amount</th>
                    <th>Transaction Ref.</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {disbursements.map((d) => (
                    <tr key={d._id}>
                      <td className="font-mono text-xs">{d.applicationId?.applicationNumber}</td>
                      <td className="text-sm font-medium text-slate-900">{d.studentUserId?.name}</td>
                      <td className="text-sm text-slate-600 max-w-[150px] truncate">{d.scholarshipId?.name}</td>
                      <td className="font-semibold text-[#5B21B6]">{formatCurrency(d.amount)}</td>
                      <td className="text-xs font-mono text-slate-600">{d.transactionReference || '—'}</td>
                      <td><StatusBadge status={d.status} /></td>
                      <td className="text-xs text-slate-500">{formatDate(d.disbursedAt || d.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Process Disbursement" size="md">
        <div className="space-y-4">
          <div>
            <label className="form-label">Select Approved Application *</label>
            <select
              className="form-input"
              value={form.applicationId}
              onChange={e => setForm({ ...form, applicationId: e.target.value })}
            >
              <option value="">Choose application...</option>
              {approvedApps.map((app) => (
                <option key={app._id} value={app._id}>
                  {app.applicationNumber} — {app.studentUser?.name} — {formatCurrency(app.scholarship?.amount)}
                </option>
              ))}
            </select>
            {approvedApps.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">No approved applications available for disbursement</p>
            )}
          </div>
          <div>
            <label className="form-label">Transaction Reference</label>
            <input
              className="form-input"
              value={form.transactionReference}
              onChange={e => setForm({ ...form, transactionReference: e.target.value })}
              placeholder="e.g., TXN-2026-001234"
            />
          </div>
          <div>
            <label className="form-label">Remarks</label>
            <textarea
              className="form-input"
              rows={2}
              value={form.remarks}
              onChange={e => setForm({ ...form, remarks: e.target.value })}
              placeholder="Optional remarks"
            />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleDisburse} disabled={processing} className="btn-primary flex-1">
              <CheckCircle className="w-4 h-4" />
              {processing ? 'Processing...' : 'Process Disbursement'}
            </button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
};

export default AdminDisbursements;
