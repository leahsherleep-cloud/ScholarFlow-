import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatusBadge from '../../components/ui/StatusBadge';
import { applicationService } from '../../services/applicationService';
import { documentService } from '../../services/documentService';
import { formatDate, formatDateTime, formatCurrency, getDocumentTypeLabel } from '../../utils/helpers';
import { ArrowLeft, FileText, CheckCircle, Clock, AlertCircle, Upload, Eye, X } from 'lucide-react';
import toast from 'react-hot-toast';

const TIMELINE_STATUSES = [
  { status: 'DRAFT', label: 'Application Created', icon: FileText },
  { status: 'SUBMITTED', label: 'Application Submitted', icon: CheckCircle },
  { status: 'UNDER_VERIFICATION', label: 'Under Verification', icon: Clock },
  { status: 'VERIFIED', label: 'Verified', icon: CheckCircle },
  { status: 'UNDER_EVALUATION', label: 'Under Evaluation', icon: Clock },
  { status: 'APPROVED', label: 'Approved', icon: CheckCircle },
  { status: 'DISBURSED', label: 'Disbursed', icon: CheckCircle },
];

const ApplicationDetail = () => {
  const { id } = useParams();
  const [application, setApplication] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({ documentType: '', documentName: '', file: null });
  const [showUpload, setShowUpload] = useState(false);
  const [isEditingStatement, setIsEditingStatement] = useState(false);
  const [editedStatement, setEditedStatement] = useState('');
  const [savingStatement, setSavingStatement] = useState(false);

  const fetchData = async () => {
    try {
      const [appRes, docRes] = await Promise.all([
        applicationService.getById(id),
        documentService.getByApplication(id),
      ]);
      const appData = appRes.data.data.application;
      setApplication(appData);
      setEditedStatement(appData?.personalStatement || '');
      setDocuments(docRes.data.data.documents || []);
    } catch {
      toast.error('Failed to load application');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleSubmit = async () => {
    // Check required documents before sending
    const requiredDocs = application?.scholarship?.requiredDocuments || [];
    if (requiredDocs.length > 0) {
      const uploadedTypes = new Set(
        documents.filter((d) => d.verificationStatus !== 'REJECTED').map((d) => d.documentType)
      );
      const missing = requiredDocs.filter((type) => !uploadedTypes.has(type));
      if (missing.length > 0) {
        toast.error(
          `Please upload all required documents before submitting: ${missing.map(getDocumentTypeLabel).join(', ')}`
        );
        return;
      }
    }

    try {
      await applicationService.submit(id);
      toast.success('Application submitted successfully!');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit');
    }
  };

  const handleSaveStatement = async () => {
    setSavingStatement(true);
    try {
      await applicationService.update(id, { personalStatement: editedStatement });
      toast.success('Personal statement updated');
      setIsEditingStatement(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update statement');
    } finally {
      setSavingStatement(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadForm.file || !uploadForm.documentType || !uploadForm.documentName) {
      toast.error('All fields are required');
      return;
    }
    setUploading(true);
    const fd = new FormData();
    fd.append('document', uploadForm.file);
    fd.append('applicationId', id);
    fd.append('documentType', uploadForm.documentType);
    fd.append('documentName', uploadForm.documentName);
    try {
      await documentService.upload(fd);
      toast.success('Document uploaded!');
      setShowUpload(false);
      setUploadForm({ documentType: '', documentName: '', file: null });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // Find current status in timeline
  const getCurrentTimelineStep = () => {
    const statusOrder = TIMELINE_STATUSES.map((t) => t.status);
    const current = application?.status;
    if (current === 'REJECTED') return -1;
    if (current === 'CORRECTION_REQUIRED') return 2;
    if (current === 'RESUBMITTED') return 2;
    return statusOrder.indexOf(current);
  };

  if (loading) return <DashboardLayout><LoadingSpinner /></DashboardLayout>;
  if (!application) return <DashboardLayout><p className="text-red-500">Application not found.</p></DashboardLayout>;

  const currentStep = getCurrentTimelineStep();
  const canEdit = ['DRAFT', 'CORRECTION_REQUIRED'].includes(application.status);
  const canSubmit = ['DRAFT', 'CORRECTION_REQUIRED'].includes(application.status);

  return (
    <DashboardLayout>
      <div className="fade-in">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link to="/student/applications" className="btn-ghost">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {application.applicationNumber || 'Draft Application'}
            </h1>
            <p className="text-sm text-gray-500">{application.scholarship?.name}</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <StatusBadge status={application.status} />
            {canSubmit && (
              <button onClick={handleSubmit} className="btn-primary">
                Submit Application
              </button>
            )}
          </div>
        </div>

        {/* Correction required banner */}
        {application.status === 'CORRECTION_REQUIRED' && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-5">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0" />
              <div>
                <p className="font-medium text-orange-800">Correction Required</p>
                <p className="text-sm text-orange-700 mt-1">{application.correctionReason}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-5">
            {/* Scholarship info */}
            <div className="bg-white rounded-xl border border-gray-200 card-shadow p-5">
              <h2 className="font-semibold text-slate-900 mb-4">Scholarship Details</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Scholarship</p>
                  <p className="font-semibold text-slate-800 mt-1">{application.scholarship?.name}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Amount</p>
                  <p className="font-bold text-[#5B21B6] mt-1 text-lg">
                    {formatCurrency(application.scholarship?.amount)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Submitted On</p>
                  <p className="font-medium text-slate-700 mt-1">
                    {application.submittedAt ? formatDate(application.submittedAt) : 'Not submitted'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Last Updated</p>
                  <p className="font-medium text-slate-700 mt-1">{formatDate(application.updatedAt)}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-slate-500 text-xs font-medium">Personal Statement</p>
                  {canEdit && !isEditingStatement && (
                    <button
                      type="button"
                      onClick={() => setIsEditingStatement(true)}
                      className="text-xs text-[#5B21B6] hover:underline font-semibold"
                    >
                      Edit
                    </button>
                  )}
                </div>
                {isEditingStatement ? (
                  <div className="space-y-2 mt-2">
                    <textarea
                      value={editedStatement}
                      onChange={(e) => setEditedStatement(e.target.value)}
                      rows={4}
                      className="form-input text-sm resize-none"
                      placeholder="Write your personal statement..."
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingStatement(false);
                          setEditedStatement(application.personalStatement || '');
                        }}
                        className="btn-secondary text-xs"
                        disabled={savingStatement}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveStatement}
                        className="btn-primary text-xs"
                        disabled={savingStatement}
                      >
                        {savingStatement ? 'Saving...' : 'Save Statement'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-700">
                    {application.personalStatement || (
                      <span className="text-gray-400 italic">No personal statement provided</span>
                    )}
                  </p>
                )}
              </div>
            </div>

            {/* Documents */}
            <div className="bg-white rounded-xl border border-gray-200 card-shadow p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Documents</h2>
                {canEdit && (
                  <button onClick={() => setShowUpload(!showUpload)} className="btn-secondary text-xs">
                    <Upload className="w-3.5 h-3.5" />
                    Upload Document
                  </button>
                )}
              </div>

              {/* Required Documents Checklist */}
              {application.scholarship?.requiredDocuments?.length > 0 && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Required Documents Checklist</p>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {application.scholarship.requiredDocuments.map((reqType) => {
                      const isUploaded = documents.some(
                        (d) => d.documentType === reqType && d.verificationStatus !== 'REJECTED'
                      );
                      return (
                        <div key={reqType} className="flex items-center gap-2 text-xs">
                          {isUploaded ? (
                            <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                          ) : (
                            <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                          )}
                          <span className={isUploaded ? 'text-gray-700' : 'text-amber-700 font-medium'}>
                            {getDocumentTypeLabel(reqType)}
                          </span>
                          <span
                            className={`text-[10px] ml-auto px-1.5 py-0.5 rounded ${
                              isUploaded
                                ? 'bg-green-100 text-green-700 font-medium'
                                : 'bg-amber-100 text-amber-700 font-medium'
                            }`}
                          >
                            {isUploaded ? 'Uploaded' : 'Required'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Upload form */}
              {showUpload && (
                <form onSubmit={handleUpload} className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="form-label text-xs">Document Type</label>
                      <select
                        value={uploadForm.documentType}
                        onChange={(e) => setUploadForm({ ...uploadForm, documentType: e.target.value })}
                        className="form-input text-sm"
                        required
                      >
                        <option value="">Select type</option>
                        <option value="identity_proof">Identity Proof</option>
                        <option value="income_certificate">Income Certificate</option>
                        <option value="mark_sheet">Mark Sheet</option>
                        <option value="college_id">College ID</option>
                        <option value="community_certificate">Community Certificate</option>
                        <option value="bonafide_certificate">Bonafide Certificate</option>
                        <option value="bank_proof">Bank Proof</option>
                        <option value="scholarship_specific">Scholarship-Specific</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="form-label text-xs">Document Name</label>
                      <input
                        type="text"
                        value={uploadForm.documentName}
                        onChange={(e) => setUploadForm({ ...uploadForm, documentName: e.target.value })}
                        placeholder="e.g., Aadhaar Card"
                        className="form-input text-sm"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="form-label text-xs">File (PDF, JPG, PNG — Max 10MB)</label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files[0] })}
                      className="form-input text-sm"
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="btn-primary text-xs" disabled={uploading}>
                      {uploading ? 'Uploading...' : 'Upload'}
                    </button>
                    <button type="button" onClick={() => setShowUpload(false)} className="btn-secondary text-xs">
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {documents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <FileText className="w-10 h-10 text-gray-200 mb-2" />
                  <p className="text-gray-500 text-sm">No documents uploaded yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div key={doc._id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                      <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{doc.documentName}</p>
                        <p className="text-xs text-gray-500">{getDocumentTypeLabel(doc.documentType)}</p>
                      </div>
                      <StatusBadge status={doc.verificationStatus} size="xs" />
                      {doc.rejectionReason && (
                        <span className="text-xs text-red-600 max-w-[120px] truncate" title={doc.rejectionReason}>
                          {doc.rejectionReason}
                        </span>
                      )}
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-ghost text-xs py-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Remarks */}
            {application.remarks?.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 card-shadow p-5">
                <h2 className="font-semibold text-gray-900 mb-4">Officer Remarks</h2>
                <div className="space-y-3">
                  {application.remarks.map((r, i) => (
                    <div key={i} className="bg-blue-50 rounded-lg p-3">
                      <p className="text-sm text-blue-800">{r.text}</p>
                      <p className="text-xs text-blue-500 mt-1">{formatDateTime(r.addedAt)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right column — Timeline */}
          <div className="bg-white rounded-xl border border-gray-200 card-shadow p-5 h-fit">
            <h2 className="font-semibold text-gray-900 mb-5">Application Timeline</h2>

            {application.status === 'REJECTED' ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                  <X className="w-6 h-6 text-red-500" />
                </div>
                <p className="font-semibold text-red-600">Application Rejected</p>
                {application.rejectionReason && (
                  <p className="text-sm text-gray-500 mt-2">{application.rejectionReason}</p>
                )}
              </div>
            ) : (
              <div className="space-y-0">
                {TIMELINE_STATUSES.map((step, index) => {
                  const isCompleted = index < currentStep;
                  const isCurrent = index === currentStep;
                  const isPending = index > currentStep;

                  return (
                    <div key={step.status} className="timeline-step">
                      <div
                        className={`timeline-dot ${
                          isCompleted
                            ? 'bg-[#5B21B6] text-white'
                            : isCurrent
                            ? 'bg-purple-100 border-2 border-[#5B21B6] text-[#5B21B6]'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {isCompleted ? <CheckCircle className="w-3 h-3" /> : index + 1}
                      </div>
                      <div className="pl-2">
                        <p className={`text-sm font-semibold ${isCurrent ? 'text-[#5B21B6]' : isCompleted ? 'text-slate-700' : 'text-slate-400'}`}>
                          {step.label}
                        </p>
                        {isCurrent && (
                          <span className="text-xs text-[#5B21B6] font-medium">● Current</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Status history */}
            {application.statusHistory?.length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">History</p>
                <div className="space-y-2">
                  {[...application.statusHistory].reverse().slice(0, 5).map((h, i) => (
                    <div key={i} className="flex gap-2 text-xs">
                      <span className="text-gray-400 flex-shrink-0">{formatDate(h.changedAt)}</span>
                      <StatusBadge status={h.status} size="xs" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ApplicationDetail;
