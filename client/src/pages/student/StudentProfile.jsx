import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { studentService } from '../../services/studentService';
import { User, Save, Loader2, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const GENDERS = ['male', 'female', 'other', 'prefer_not_to_say'];
const CATEGORIES = ['general', 'obc', 'sc', 'st', 'ews', 'other'];

const StudentProfile = () => {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await studentService.getProfile();
        const student = res.data.data.student;
        setProfile(student);
        setForm({
          registrationNumber: student.registrationNumber || '',
          dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth).toISOString().split('T')[0] : '',
          gender: student.gender || '',
          phone: student.phone || '',
          institution: student.institution || '',
          course: student.course || '',
          department: student.department || '',
          year: student.year || '',
          cgpa: student.cgpa || '',
          familyIncome: student.familyIncome || '',
          category: student.category || '',
          address: student.address || {},
          bankDetails: student.bankDetails || {},
        });
      } catch { toast.error('Failed to load profile'); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const handleChange = (field, value) => setForm((p) => ({ ...p, [field]: value }));
  const handleAddress = (field, value) => setForm((p) => ({ ...p, address: { ...p.address, [field]: value } }));
  const handleBank = (field, value) => setForm((p) => ({ ...p, bankDetails: { ...p.bankDetails, [field]: value } }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await studentService.updateProfile(form);
      setProfile(res.data.data.student);
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <DashboardLayout><LoadingSpinner /></DashboardLayout>;

  const tabs = [
    { id: 'personal', label: 'Personal Info' },
    { id: 'academic', label: 'Academic Info' },
    { id: 'address', label: 'Address' },
    { id: 'bank', label: 'Bank Details' },
  ];

  return (
    <DashboardLayout>
      <div className="fade-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
            <p className="text-slate-500 text-sm mt-1">Keep your information up to date for scholarship eligibility</p>
          </div>
          <div className="flex items-center gap-3">
            {profile && (
              <div className="flex items-center gap-2 text-sm text-slate-600 bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-100">
                <CheckCircle className="w-4 h-4 text-[#5B21B6]" />
                <span className="font-semibold text-[#5B21B6]">{profile.profileCompletionStatus}% Complete</span>
              </div>
            )}
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : <><Save className="w-4 h-4" />Save Changes</>}
            </button>
          </div>
        </div>

        {/* Profile completion bar */}
        {profile && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-5 flex items-center gap-5">
            <div className="w-14 h-14 rounded-full bg-purple-50 text-[#5B21B6] border border-purple-100 flex items-center justify-center text-lg font-bold">
              {profile.profileCompletionStatus}%
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1.5">
                <p className="text-sm font-semibold text-slate-800">Profile Completion</p>
                <span className="text-xs text-slate-400 font-medium">Auto-updated based on profile details</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-[#5B21B6] h-2 rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${profile.profileCompletionStatus}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1.5 bg-slate-100/80 rounded-xl p-1.5 mb-5 w-fit overflow-x-auto border border-slate-200/60">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === tab.id ? 'bg-white text-[#5B21B6] shadow-sm border border-slate-200/50' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 card-shadow p-6">
          {activeTab === 'personal' && (
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Registration Number</label>
                <input className="form-input" value={form.registrationNumber} onChange={e => handleChange('registrationNumber', e.target.value)} placeholder="e.g., REG-2024-001234" />
              </div>
              <div>
                <label className="form-label">Date of Birth</label>
                <input type="date" className="form-input" value={form.dateOfBirth} onChange={e => handleChange('dateOfBirth', e.target.value)} />
              </div>
              <div>
                <label className="form-label">Gender</label>
                <select className="form-input" value={form.gender} onChange={e => handleChange('gender', e.target.value)}>
                  <option value="">Select gender</option>
                  {GENDERS.map(g => <option key={g} value={g}>{g.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Phone Number</label>
                <input className="form-input" value={form.phone} onChange={e => handleChange('phone', e.target.value)} placeholder="10-digit mobile number" maxLength={10} />
              </div>
              <div>
                <label className="form-label">Category</label>
                <select className="form-input" value={form.category} onChange={e => handleChange('category', e.target.value)}>
                  <option value="">Select category</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Annual Family Income (₹)</label>
                <input type="number" className="form-input" value={form.familyIncome} onChange={e => handleChange('familyIncome', e.target.value)} placeholder="e.g., 250000" min={0} />
              </div>
            </div>
          )}

          {activeTab === 'academic' && (
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Institution Name</label>
                <input className="form-input" value={form.institution} onChange={e => handleChange('institution', e.target.value)} placeholder="Your college/university name" />
              </div>
              <div>
                <label className="form-label">Course</label>
                <input className="form-input" value={form.course} onChange={e => handleChange('course', e.target.value)} placeholder="e.g., B.Tech" />
              </div>
              <div>
                <label className="form-label">Department</label>
                <input className="form-input" value={form.department} onChange={e => handleChange('department', e.target.value)} placeholder="e.g., Computer Science" />
              </div>
              <div>
                <label className="form-label">Current Year</label>
                <select className="form-input" value={form.year} onChange={e => handleChange('year', Number(e.target.value))}>
                  <option value="">Select year</option>
                  {[1,2,3,4,5,6,7].map(y => <option key={y} value={y}>Year {y}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">CGPA (out of 10)</label>
                <input type="number" className="form-input" value={form.cgpa} onChange={e => handleChange('cgpa', e.target.value)} placeholder="e.g., 8.5" min={0} max={10} step={0.01} />
              </div>
            </div>
          )}

          {activeTab === 'address' && (
            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="form-label">Street Address</label>
                <input className="form-input" value={form.address?.street || ''} onChange={e => handleAddress('street', e.target.value)} placeholder="Street address" />
              </div>
              <div>
                <label className="form-label">City</label>
                <input className="form-input" value={form.address?.city || ''} onChange={e => handleAddress('city', e.target.value)} placeholder="City" />
              </div>
              <div>
                <label className="form-label">State</label>
                <input className="form-input" value={form.address?.state || ''} onChange={e => handleAddress('state', e.target.value)} placeholder="State" />
              </div>
              <div>
                <label className="form-label">PIN Code</label>
                <input className="form-input" value={form.address?.pincode || ''} onChange={e => handleAddress('pincode', e.target.value)} placeholder="6-digit PIN code" maxLength={6} />
              </div>
              <div>
                <label className="form-label">Country</label>
                <input className="form-input" value={form.address?.country || 'India'} onChange={e => handleAddress('country', e.target.value)} />
              </div>
            </div>
          )}

          {activeTab === 'bank' && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
                ⚠️ Bank details are required for scholarship disbursement. Ensure the information is accurate.
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Account Holder Name</label>
                  <input className="form-input" value={form.bankDetails?.accountHolderName || ''} onChange={e => handleBank('accountHolderName', e.target.value)} placeholder="As per bank records" />
                </div>
                <div>
                  <label className="form-label">Account Number</label>
                  <input className="form-input" value={form.bankDetails?.accountNumber || ''} onChange={e => handleBank('accountNumber', e.target.value)} placeholder="Bank account number" />
                </div>
                <div>
                  <label className="form-label">IFSC Code</label>
                  <input className="form-input" value={form.bankDetails?.ifscCode || ''} onChange={e => handleBank('ifscCode', e.target.value)} placeholder="e.g., SBIN0001234" />
                </div>
                <div>
                  <label className="form-label">Bank Name</label>
                  <input className="form-input" value={form.bankDetails?.bankName || ''} onChange={e => handleBank('bankName', e.target.value)} placeholder="Bank name" />
                </div>
                <div>
                  <label className="form-label">Branch Name</label>
                  <input className="form-input" value={form.bankDetails?.branchName || ''} onChange={e => handleBank('branchName', e.target.value)} placeholder="Branch name" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentProfile;
