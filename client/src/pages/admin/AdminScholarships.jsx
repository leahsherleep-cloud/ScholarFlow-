import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';
import { ConfirmModal } from '../../components/ui/Modal';
import { scholarshipService } from '../../services/scholarshipService';
import { formatDate, formatCurrency } from '../../utils/helpers';
import { Plus, Pencil, Trash2, GraduationCap, ToggleLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const INITIAL_FORM = {
  name: '', description: '', amount: '',
  eligibilityCriteria: {
    minimumCgpa: '', maximumFamilyIncome: '',
    eligibleCourses: '', eligibleCategories: ['all'], eligibleYears: '',
  },
  requiredDocuments: [],
  applicationStartDate: '', applicationEndDate: '',
  status: 'draft', totalSlots: '',
};

const DOC_TYPES = [
  'identity_proof', 'income_certificate', 'mark_sheet', 'college_id',
  'community_certificate', 'bonafide_certificate', 'bank_proof', 'scholarship_specific',
];

const AdminScholarships = () => {
  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formModal, setFormModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchScholarships = async () => {
    setLoading(true);
    try {
      const res = await scholarshipService.getAll({ limit: 50, status: '' });
      setScholarships(res.data.data || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchScholarships(); }, []);

  const openCreate = () => {
    setEditTarget(null);
    setForm(INITIAL_FORM);
    setFormModal(true);
  };

  const openEdit = (sch) => {
    setEditTarget(sch);
    setForm({
      name: sch.name || '',
      description: sch.description || '',
      amount: sch.amount || '',
      eligibilityCriteria: {
        minimumCgpa: sch.eligibilityCriteria?.minimumCgpa || '',
        maximumFamilyIncome: sch.eligibilityCriteria?.maximumFamilyIncome || '',
        eligibleCourses: (sch.eligibilityCriteria?.eligibleCourses || []).join(', '),
        eligibleCategories: sch.eligibilityCriteria?.eligibleCategories || ['all'],
        eligibleYears: (sch.eligibilityCriteria?.eligibleYears || []).join(', '),
      },
      requiredDocuments: sch.requiredDocuments || [],
      applicationStartDate: sch.applicationStartDate ? new Date(sch.applicationStartDate).toISOString().split('T')[0] : '',
      applicationEndDate: sch.applicationEndDate ? new Date(sch.applicationEndDate).toISOString().split('T')[0] : '',
      status: sch.status || 'draft',
      totalSlots: sch.totalSlots || '',
    });
    setFormModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.description || !form.amount || !form.applicationStartDate || !form.applicationEndDate) {
      toast.error('Fill all required fields');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        amount: Number(form.amount),
        totalSlots: Number(form.totalSlots) || 0,
        eligibilityCriteria: {
          minimumCgpa: Number(form.eligibilityCriteria.minimumCgpa) || 0,
          maximumFamilyIncome: Number(form.eligibilityCriteria.maximumFamilyIncome) || 0,
          eligibleCourses: form.eligibilityCriteria.eligibleCourses
            ? form.eligibilityCriteria.eligibleCourses.split(',').map(s => s.trim()).filter(Boolean)
            : [],
          eligibleCategories: form.eligibilityCriteria.eligibleCategories,
          eligibleYears: form.eligibilityCriteria.eligibleYears
            ? form.eligibilityCriteria.eligibleYears.split(',').map(s => Number(s.trim())).filter(Boolean)
            : [],
        },
      };

      if (editTarget) {
        await scholarshipService.update(editTarget._id, payload);
        toast.success('Scholarship updated');
      } else {
        await scholarshipService.create(payload);
        toast.success('Scholarship created');
      }
      setFormModal(false);
      fetchScholarships();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await scholarshipService.delete(deleteTarget._id);
      toast.success('Scholarship deleted');
      setDeleteTarget(null);
      fetchScholarships();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally { setDeleting(false); }
  };

  const toggleStatus = async (sch) => {
    const newStatus = sch.status === 'active' ? 'inactive' : 'active';
    try {
      await scholarshipService.updateStatus(sch._id, newStatus);
      toast.success(`Scholarship ${newStatus}`);
      fetchScholarships();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Status update failed');
    }
  };

  const toggleDoc = (doc) => {
    setForm((p) => ({
      ...p,
      requiredDocuments: p.requiredDocuments.includes(doc)
        ? p.requiredDocuments.filter((d) => d !== doc)
        : [...p.requiredDocuments, doc],
    }));
  };

  return (
    <DashboardLayout>
      <div className="fade-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Scholarship Management</h1>
            <p className="text-slate-500 text-sm mt-1">Create, edit, and configure institutional scholarship programs</p>
          </div>
          <button onClick={openCreate} className="btn-primary" id="create-scholarship-btn">
            <Plus className="w-4 h-4" /> Create Scholarship
          </button>
        </div>

        {loading ? <LoadingSpinner text="Loading scholarships..." /> : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {scholarships.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-slate-200">
                <GraduationCap className="w-12 h-12 text-slate-300 mb-3" />
                <p className="text-slate-600 font-medium">No scholarships found.</p>
                <p className="text-slate-400 text-sm mt-1">Get started by creating your first scholarship program.</p>
              </div>
            ) : scholarships.map((sch) => (
              <div key={sch._id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:border-purple-200 transition-all">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="font-semibold text-slate-900 text-sm leading-snug flex-1">{sch.name}</h3>
                  <StatusBadge status={sch.status} size="xs" />
                </div>
                <p className="text-xs text-slate-500 line-clamp-2 mb-3">{sch.description}</p>
                <div className="flex items-center justify-between text-sm mb-4">
                  <span className="font-bold text-[#5B21B6] text-base">{formatCurrency(sch.amount)}</span>
                  <span className="text-xs text-slate-400">Ends: {formatDate(sch.applicationEndDate)}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(sch)} className="btn-ghost text-xs flex-1 py-1.5">
                    <Pencil className="w-3 h-3" /> Edit
                  </button>
                  <button
                    onClick={() => toggleStatus(sch)}
                    className={`text-xs flex-1 py-1.5 px-3 rounded-lg border transition-colors ${
                      sch.status === 'active'
                        ? 'border-orange-200 text-orange-600 hover:bg-orange-50'
                        : 'border-purple-200 text-[#5B21B6] hover:bg-purple-50'
                    }`}
                  >
                    {sch.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => setDeleteTarget(sch)}
                    className="btn-ghost text-xs text-red-500 hover:bg-red-50 py-1.5 px-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={formModal}
        onClose={() => setFormModal(false)}
        title={editTarget ? 'Edit Scholarship' : 'Create Scholarship'}
        size="2xl"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="form-label">Scholarship Name *</label>
              <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Scholarship name" />
            </div>
            <div className="md:col-span-2">
              <label className="form-label">Description *</label>
              <textarea className="form-input" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Scholarship description" />
            </div>
            <div>
              <label className="form-label">Amount (₹) *</label>
              <input type="number" className="form-input" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="e.g., 50000" min={0} />
            </div>
            <div>
              <label className="form-label">Total Slots</label>
              <input type="number" className="form-input" value={form.totalSlots} onChange={e => setForm({ ...form, totalSlots: e.target.value })} placeholder="0 = unlimited" min={0} />
            </div>
            <div>
              <label className="form-label">Start Date *</label>
              <input type="date" className="form-input" value={form.applicationStartDate} onChange={e => setForm({ ...form, applicationStartDate: e.target.value })} />
            </div>
            <div>
              <label className="form-label">End Date *</label>
              <input type="date" className="form-input" value={form.applicationEndDate} onChange={e => setForm({ ...form, applicationEndDate: e.target.value })} />
            </div>
          </div>

          <div>
            <p className="form-label text-gray-700 font-semibold mb-2">Eligibility Criteria</p>
            <div className="grid md:grid-cols-2 gap-3 bg-gray-50 rounded-lg p-4">
              <div>
                <label className="form-label text-xs">Minimum CGPA</label>
                <input type="number" className="form-input text-sm" value={form.eligibilityCriteria.minimumCgpa} onChange={e => setForm({ ...form, eligibilityCriteria: { ...form.eligibilityCriteria, minimumCgpa: e.target.value } })} placeholder="0 = no requirement" min={0} max={10} step={0.1} />
              </div>
              <div>
                <label className="form-label text-xs">Max Family Income (₹)</label>
                <input type="number" className="form-input text-sm" value={form.eligibilityCriteria.maximumFamilyIncome} onChange={e => setForm({ ...form, eligibilityCriteria: { ...form.eligibilityCriteria, maximumFamilyIncome: e.target.value } })} placeholder="0 = no limit" min={0} />
              </div>
              <div>
                <label className="form-label text-xs">Eligible Courses (comma-separated)</label>
                <input className="form-input text-sm" value={form.eligibilityCriteria.eligibleCourses} onChange={e => setForm({ ...form, eligibilityCriteria: { ...form.eligibilityCriteria, eligibleCourses: e.target.value } })} placeholder="B.Tech, B.E, B.Sc (blank = all)" />
              </div>
              <div>
                <label className="form-label text-xs">Eligible Years (comma-separated)</label>
                <input className="form-input text-sm" value={form.eligibilityCriteria.eligibleYears} onChange={e => setForm({ ...form, eligibilityCriteria: { ...form.eligibilityCriteria, eligibleYears: e.target.value } })} placeholder="1, 2, 3, 4 (blank = all)" />
              </div>
            </div>
          </div>

          <div>
            <label className="form-label">Required Documents</label>
            <div className="grid grid-cols-2 gap-2 bg-gray-50 rounded-lg p-3">
              {DOC_TYPES.map((doc) => (
                <label key={doc} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.requiredDocuments.includes(doc)}
                    onChange={() => toggleDoc(doc)}
                    className="w-4 h-4 text-green-600 rounded"
                  />
                  <span className="text-gray-600">{doc.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="form-label">Status</label>
            <select className="form-input w-auto" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-5 pt-4 border-t border-gray-100">
          <button onClick={() => setFormModal(false)} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
            {saving ? 'Saving...' : editTarget ? 'Update Scholarship' : 'Create Scholarship'}
          </button>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Scholarship"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmVariant="danger"
        loading={deleting}
      />
    </DashboardLayout>
  );
};

export default AdminScholarships;
