import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, Navigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';
import { applicationService } from '../../services/applicationService';
import { documentService } from '../../services/documentService';
import { formatDate, formatDateTime, formatCurrency, getDocumentTypeLabel } from '../../utils/helpers';
import { ArrowLeft, CheckCircle, XCircle, FileText, AlertCircle, Eye, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

const OfficerApplicationReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // All hooks must be declared unconditionally (React Rules of Hooks)
  const [application, setApplication] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  // Action modals
  const [verifyModal, setVerifyModal] = useState(false);
  const [approveModal, setApproveModal] = useState(false);
  const [correctionModal, setCorrectionModal] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectDocModal, setRejectDocModal] = useState(null);
  const [reason, setReason] = useState('');
  const [remarks, setRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Redirect to dashboard if no ID (route /officer/applications without :id param)
  useEffect(() => {
    if (!id) navigate('/officer/dashboard', { replace: true });
  }, [id, navigate]);

  const fetchData = async () => {
    if (!id) return;
    setFetchError(false);
    try {
      const [appRes, docRes] = await Promise.all([
        applicationService.getById(id),
        documentService.getByApplication(id),
      ]);
      setApplication(appRes.data.data.application);
      setDocuments(docRes.data.data.documents || []);
    } catch {
      setFetchError(true);
      toast.error('Failed to load application');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (id) fetchData(); }, [id]);

  const action = async (fn, successMsg, onSuccess) => {
    setActionLoading(true);
    try {
      await fn();
      toast.success(successMsg);
      if (onSuccess) onSuccess();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Render redirect placeholder while useEffect fires
  if (!id) return <DashboardLayout><LoadingSpinner /></DashboardLayout>;


  if (loading) return <DashboardLayout><LoadingSpinner /></DashboardLayout>;
  if (fetchError) return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="w-12 h-12 text-red-300 mb-3" />
        <p className="text-gray-700 font-semibold">Failed to load application</p>
        <p className="text-gray-400 text-sm mt-1">The application may not exist or you may not have permission to view it.</p>
        <div className="flex gap-3 mt-4">
          <button onClick={fetchData} className="btn-secondary text-sm">Retry</button>
          <Link to="/officer/dashboard" className="btn-primary text-sm">Back to Dashboard</Link>
        </div>
      </div>
    </DashboardLayout>
  );
  if (!application) return <DashboardLayout><p>Application not found.</p></DashboardLayout>;

  const student = application.student;
  const canVerify = ['SUBMITTED', 'RESUBMITTED', 'UNDER_VERIFICATION'].includes(application.status);
  const canRequestCorrection = ['SUBMITTED', 'RESUBMITTED', 'UNDER_VERIFICATION'].includes(application.status);
  const canApproveReject = ['VERIFIED', 'UNDER_EVALUATION'].includes(application.status);

  return (
    <DashboardLayout contentContainerClassName="w-full max-w-none">
      <div className="fade-in w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/officer/applications" className="btn-ghost flex-shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 truncate">
                {application.applicationNumber || 'Application Review'}
              </h1>
              <p className="text-sm text-slate-500 truncate mt-0.5">
                {application.studentUser?.name} · {application.scholarship?.name}
              </p>
            </div>
          </div>
          <div className="flex-shrink-0">
            <StatusBadge status={application.status} />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2.5 mb-6">
          {canVerify && (
            <button
              onClick={() => { setRemarks(''); setVerifyModal(true); }}
              className="btn-primary"
              disabled={actionLoading}
            >
              <CheckCircle className="w-4 h-4" /> Verify Application
            </button>
          )}
          {canRequestCorrection && (
            <button onClick={() => setCorrectionModal(true)} className="btn-secondary text-orange-600 border-orange-200 hover:bg-orange-50">
              <AlertCircle className="w-4 h-4" /> Request Correction
            </button>
          )}
          {canApproveReject && (
            <>
              <button
                onClick={() => { setRemarks(''); setApproveModal(true); }}
                className="btn-primary"
                disabled={actionLoading}
              >
                <CheckCircle className="w-4 h-4" /> Approve Application
              </button>
              <button
                onClick={() => { setReason(''); setRejectModal(true); }}
                className="btn-danger"
                disabled={actionLoading}
              >
                <XCircle className="w-4 h-4" /> Reject
              </button>
            </>
          )}
        </div>

        {/* Responsive Two-Column Layout (~68% / ~32% on desktop) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-start">
          {/* Main Column (~67-70% width: 8 of 12 cols) */}
          <div className="lg:col-span-8 space-y-6 min-w-0 w-full">
            {/* Student info */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sm:p-6">
              <h2 className="font-semibold text-slate-900 text-base mb-4 pb-2 border-b border-slate-100">Student Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 text-sm">
                {[
                  ['Name', application.studentUser?.name],
                  ['Email', application.studentUser?.email],
                  ['Registration No.', student?.registrationNumber || '—'],
                  ['Phone', student?.phone || '—'],
                  ['Institution', student?.institution || '—'],
                  ['Course', student?.course || '—'],
                  ['Department', student?.department || '—'],
                  ['Year', student?.year ? `Year ${student.year}` : '—'],
                  ['CGPA', student?.cgpa || '—'],
                  ['Category', student?.category?.toUpperCase() || '—'],
                  ['Family Income', formatCurrency(student?.familyIncome)],
                  ['Gender', student?.gender || '—'],
                ].map(([label, val]) => (
                  <div key={label} className="min-w-0 bg-slate-50/60 rounded-lg p-3 border border-slate-100/80">
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</p>
                    <p className="font-semibold text-slate-800 mt-1 truncate" title={val}>{val}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Scholarship info & personal statement */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sm:p-6">
              <h2 className="font-semibold text-slate-900 text-base mb-4 pb-2 border-b border-slate-100">Scholarship Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm mb-4">
                <div className="min-w-0 bg-purple-50/50 rounded-lg p-3 border border-purple-100">
                  <p className="text-xs text-purple-700 font-semibold uppercase tracking-wider">Scholarship</p>
                  <p className="font-bold text-slate-900 mt-1 truncate" title={application.scholarship?.name}>
                    {application.scholarship?.name}
                  </p>
                </div>
                <div className="min-w-0 bg-purple-50/50 rounded-lg p-3 border border-purple-100">
                  <p className="text-xs text-purple-700 font-semibold uppercase tracking-wider">Amount</p>
                  <p className="font-extrabold text-[#5B21B6] text-xl mt-1">
                    {formatCurrency(application.scholarship?.amount)}
                  </p>
                </div>
                <div className="min-w-0 bg-slate-50/60 rounded-lg p-3 border border-slate-100">
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Submitted At</p>
                  <p className="font-semibold text-slate-700 mt-1">
                    {formatDateTime(application.submittedAt)}
                  </p>
                </div>
              </div>
              {application.personalStatement && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Personal Statement</p>
                  <p className="text-sm text-slate-700 bg-slate-50 border border-slate-200/70 rounded-xl p-4 leading-relaxed whitespace-pre-line break-words">
                    {application.personalStatement}
                  </p>
                </div>
              )}
            </div>

            {/* Uploaded Documents */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                <h2 className="font-semibold text-slate-900 text-base">Uploaded Documents ({documents.length})</h2>
                <span className="text-xs font-medium text-slate-400">Verify each document</span>
              </div>
              {documents.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-8">No documents uploaded for this application.</p>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div key={doc._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-purple-50 text-[#5B21B6] flex items-center justify-center flex-shrink-0 border border-purple-100">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-900 truncate" title={doc.documentName}>{doc.documentName}</p>
                          <p className="text-xs text-slate-500">{getDocumentTypeLabel(doc.documentType)}</p>
                          {doc.rejectionReason && (
                            <p className="text-xs font-medium text-red-600 mt-1 bg-red-50 px-2 py-0.5 rounded border border-red-100 inline-block">
                              Reason: {doc.rejectionReason}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                        <StatusBadge status={doc.verificationStatus} size="xs" />
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-ghost text-xs py-1.5 px-2.5 flex items-center gap-1 border border-slate-200"
                        >
                          <Eye className="w-3.5 h-3.5" /> View
                        </a>
                        {doc.verificationStatus === 'PENDING' && (
                          <div className="flex items-center gap-1.5 ml-1">
                            <button
                              onClick={() => action(() => documentService.verify(doc._id), 'Document verified')}
                              disabled={actionLoading}
                              className="text-xs px-2.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors font-medium"
                            >
                              ✓ Verify
                            </button>
                            <button
                              onClick={() => setRejectDocModal(doc._id)}
                              className="text-xs px-2.5 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors font-medium"
                            >
                              ✗ Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Secondary Column (~30-33% width: 4 of 12 cols) */}
          <div className="lg:col-span-4 space-y-6 min-w-0 w-full">
            {/* Bank details */}
            {student?.bankDetails?.accountNumber && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sm:p-6">
                <h2 className="font-semibold text-slate-900 text-base mb-3 pb-2 border-b border-slate-100">Bank Details</h2>
                <div className="space-y-3 text-sm">
                  {[
                    ['Account Holder', student.bankDetails.accountHolderName],
                    ['Account No.', student.bankDetails.accountNumber],
                    ['IFSC Code', student.bankDetails.ifscCode],
                    ['Bank Name', student.bankDetails.bankName],
                  ].map(([label, val]) => (
                    <div key={label} className="flex justify-between items-center py-1.5 border-b border-slate-50 last:border-0">
                      <span className="text-xs font-medium text-slate-400">{label}</span>
                      <span className="font-semibold text-slate-800 text-right truncate ml-2" title={val}>{val || '—'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Status history timeline */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sm:p-6">
              <h2 className="font-semibold text-slate-900 text-base mb-4 pb-2 border-b border-slate-100">Status History</h2>
              {application.statusHistory?.length > 0 ? (
                <div className="space-y-3.5">
                  {[...application.statusHistory].reverse().map((h, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-purple-50 text-[#5B21B6] border border-purple-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="w-2 h-2 rounded-full bg-[#5B21B6]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <StatusBadge status={h.status} size="xs" />
                          <span className="text-[11px] text-slate-400 flex-shrink-0">{formatDateTime(h.changedAt)}</span>
                        </div>
                        {h.note && <p className="text-xs text-slate-600 mt-1.5 bg-slate-50 p-2 rounded-lg border border-slate-100">{h.note}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 text-center py-4">No history recorded yet.</p>
              )}
            </div>

            {/* Remarks */}
            {application.remarks?.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sm:p-6">
                <h2 className="font-semibold text-slate-900 text-base mb-3 pb-2 border-b border-slate-100">Review Remarks</h2>
                <div className="space-y-2.5">
                  {application.remarks.map((r, i) => (
                    <div key={i} className="bg-purple-50/50 border border-purple-100 rounded-xl p-3.5">
                      <p className="text-sm text-slate-800 leading-relaxed">{r.text}</p>
                      <p className="text-[11px] text-purple-700/70 font-medium mt-1.5">{formatDateTime(r.addedAt)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Verify Modal — with optional remarks */}
      <Modal isOpen={verifyModal} onClose={() => { setVerifyModal(false); setRemarks(''); }} title="Verify Application" size="md">
        <div className="space-y-4">
          <div className="bg-green-50 rounded-lg p-3 text-sm text-green-700">
            Verifying confirms that all submitted documents and information are correct.
          </div>
          <div>
            <label className="form-label">Remarks (optional)</label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={3}
              placeholder="Add verification notes for internal record..."
              className="form-input"
            />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setVerifyModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button
              onClick={() => {
                action(() => applicationService.verify(id, remarks), 'Application verified', () => setVerifyModal(false));
                setRemarks('');
              }}
              disabled={actionLoading}
              className="btn-primary flex-1"
            >
              {actionLoading ? 'Verifying...' : 'Confirm Verification'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Approve Application Modal */}
      <Modal isOpen={approveModal} onClose={() => { setApproveModal(false); setRemarks(''); }} title="Approve Application" size="md">
        <div className="space-y-4">
          <div className="bg-emerald-50 rounded-lg p-3 text-sm text-emerald-800 border border-emerald-200">
            You are about to approve this scholarship application for <strong>{application.studentUser?.name}</strong> for <strong>{formatCurrency(application.scholarship?.amount)}</strong>.
          </div>
          <div>
            <label className="form-label">Approval Remarks (Optional)</label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={3}
              placeholder="Add any notes or justification for approval..."
              className="form-input"
            />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setApproveModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button
              onClick={() => {
                action(() => applicationService.approve(id, remarks), 'Application approved successfully!', () => setApproveModal(false));
                setRemarks('');
              }}
              disabled={actionLoading}
              className="btn-primary flex-1"
            >
              {actionLoading ? 'Approving...' : 'Confirm Approval'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Correction Modal */}
      <Modal isOpen={correctionModal} onClose={() => { setCorrectionModal(false); setReason(''); }} title="Request Correction" size="md">
        <div className="space-y-4">
          <div>
            <label className="form-label">Reason for Correction *</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              placeholder="Describe what needs to be corrected..."
              className="form-input"
            />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setCorrectionModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button
              onClick={() => {
                if (!reason.trim()) { toast.error('Reason is required'); return; }
                action(() => applicationService.requestCorrection(id, reason), 'Correction requested');
                setCorrectionModal(false);
                setReason('');
              }}
              disabled={actionLoading}
              className="btn-primary flex-1 bg-orange-500 hover:bg-orange-600"
            >
              Request Correction
            </button>
          </div>
        </div>
      </Modal>

      {/* Reject Application Modal */}
      <Modal isOpen={rejectModal} onClose={() => { setRejectModal(false); setReason(''); }} title="Reject Application" size="md">
        <div className="space-y-4">
          <div className="bg-red-50 rounded-lg p-3 text-sm text-red-700">
            This action cannot be undone. The student will be notified of the rejection.
          </div>
          <div>
            <label className="form-label">Rejection Reason *</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              placeholder="Provide a clear reason for rejection..."
              className="form-input"
            />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setRejectModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button
              onClick={() => {
                if (!reason.trim()) { toast.error('Rejection reason is required'); return; }
                action(() => applicationService.reject(id, reason), 'Application rejected');
                setRejectModal(false);
                setReason('');
              }}
              disabled={actionLoading}
              className="btn-danger flex-1"
            >
              Confirm Rejection
            </button>
          </div>
        </div>
      </Modal>

      {/* Reject Document Modal */}
      <Modal isOpen={!!rejectDocModal} onClose={() => { setRejectDocModal(null); setReason(''); }} title="Reject Document" size="sm">
        <div className="space-y-4">
          <div>
            <label className="form-label">Rejection Reason *</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Why is this document rejected?"
              className="form-input"
            />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setRejectDocModal(null)} className="btn-secondary flex-1">Cancel</button>
            <button
              onClick={() => {
                if (!reason.trim()) { toast.error('Reason required'); return; }
                action(() => documentService.reject(rejectDocModal, reason), 'Document rejected');
                setRejectDocModal(null);
                setReason('');
              }}
              disabled={actionLoading}
              className="btn-danger flex-1"
            >
              Reject
            </button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
};

export default OfficerApplicationReview;
