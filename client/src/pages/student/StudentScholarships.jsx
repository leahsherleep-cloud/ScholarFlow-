import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatusBadge from '../../components/ui/StatusBadge';
import { scholarshipService } from '../../services/scholarshipService';
import { studentService } from '../../services/studentService';
import { applicationService } from '../../services/applicationService';
import { formatDate, formatCurrency, truncate } from '../../utils/helpers';
import { Search, GraduationCap, Calendar, DollarSign, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../../components/ui/Modal';
import SearchBar from '../../components/ui/SearchBar';

const ScholarshipCard = ({ scholarship, appliedApp }) => {
  const now = new Date();
  const isOpen =
    scholarship.status === 'active' &&
    new Date(scholarship.applicationStartDate) <= now &&
    new Date(scholarship.applicationEndDate) >= now;

  return (
    <div className="bg-white rounded-xl border border-slate-200 card-shadow hover:shadow-md transition-all duration-200 fade-in flex flex-col">
      <div className="p-5 flex-1">
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="font-semibold text-slate-900 text-base leading-snug flex-1">
            {scholarship.name}
          </h3>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {appliedApp && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#F5F3FF] text-[#5B21B6] border border-[#DDD6FE]">
                Applied
              </span>
            )}
            <StatusBadge status={scholarship.status} size="xs" />
          </div>
        </div>
        <p className="text-xs text-slate-500 mb-4 line-clamp-2 leading-relaxed">{scholarship.description}</p>

        <div className="space-y-2.5 bg-slate-50/70 p-3 rounded-lg border border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Award Amount</span>
            <span className="font-bold text-emerald-700 text-base">{formatCurrency(scholarship.amount)}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-400" /> Deadline</span>
            <span className="font-medium text-slate-700">{formatDate(scholarship.applicationEndDate)}</span>
          </div>
          {scholarship.eligibilityCriteria?.minimumCgpa > 0 && (
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5 text-slate-400" /> Min CGPA</span>
              <span className="font-semibold text-slate-800">{scholarship.eligibilityCriteria.minimumCgpa}</span>
            </div>
          )}
          {scholarship.eligibilityCriteria?.maximumFamilyIncome > 0 && (
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Max Annual Income</span>
              <span className="font-semibold text-slate-800">{formatCurrency(scholarship.eligibilityCriteria.maximumFamilyIncome)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="px-5 py-3 border-t border-slate-100 flex gap-2 bg-white rounded-b-xl">
        <Link
          to={`/student/scholarships/${scholarship._id}`}
          className="btn-secondary flex-1 text-xs justify-center"
        >
          View Details
        </Link>
        {appliedApp ? (
          <Link
            to={`/student/applications/${appliedApp._id}`}
            className="btn-secondary flex-1 text-xs justify-center font-semibold text-[#5B21B6] bg-[#F5F3FF] border-[#DDD6FE] hover:bg-[#EDE9FE]"
          >
            View Application
          </Link>
        ) : isOpen ? (
          <Link
            to={`/student/apply/${scholarship._id}`}
            className="btn-primary flex-1 text-xs justify-center shadow-xs"
          >
            Apply Now
          </Link>
        ) : (
          <button className="btn-secondary flex-1 text-xs opacity-50 cursor-not-allowed" disabled>
            {scholarship.status === 'closed' ? 'Closed' : 'Not Open'}
          </button>
        )}
      </div>
    </div>
  );
};

const StudentScholarships = () => {
  const navigate = useNavigate();                          // BUG-4 fix
  const [scholarships, setScholarships] = useState([]);
  const [appliedMap, setAppliedMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [applyModal, setApplyModal] = useState(null);
  const [applying, setApplying] = useState(false);
  const [statement, setStatement] = useState('');

  const fetchScholarships = async () => {
    setLoading(true);
    try {
      const [schRes, appRes] = await Promise.all([
        scholarshipService.getAll({ limit: 50 }),
        studentService.getMyApplications().catch(() => ({ data: { data: { applications: [] } } })),
      ]);
      setScholarships(schRes.data.data || []);
      const map = {};
      (appRes.data?.data?.applications || []).forEach((a) => {
        const schId = a.scholarship?._id || a.scholarship;
        if (schId) map[schId] = a;
      });
      setAppliedMap(map);
    } catch {
      toast.error('Failed to load scholarships');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchScholarships(); }, []);

  const filtered = scholarships.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleApply = async () => {
    if (!statement.trim() || statement.trim().length < 50) {
      toast.error('Please write at least 50 characters explaining why you are applying.');
      return;
    }

    setApplying(true);
    try {
      const res = await applicationService.create({
        scholarshipId: applyModal._id,
        personalStatement: statement.trim(),
      });
      const newAppId = res.data.data.application._id;     // BUG-4 fix: use returned ID
      toast.success('Application created! Upload documents and submit.');
      setApplyModal(null);
      navigate(`/student/applications/${newAppId}`);       // BUG-4 fix: go to draft
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create application');
    } finally {
      setApplying(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="fade-in">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Scholarships</h1>
          <p className="text-gray-500 text-sm mt-1">Discover and apply for available scholarships</p>
        </div>

        {/* Search */}
        <div className="mb-6 max-w-lg">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search scholarships by name or description..."
            className="w-full"
          />
        </div>

        {loading ? (
          <LoadingSpinner text="Loading scholarships..." />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <GraduationCap className="w-12 h-12 text-gray-200 mb-3" />
            <p className="text-gray-500 font-medium">No Scholarships Found</p>
            <p className="text-gray-400 text-sm mt-1">
              {search ? 'Try a different search term.' : 'Check back later for new scholarships.'}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((sch) => (
              <ScholarshipCard
                key={sch._id}
                scholarship={sch}
                appliedApp={appliedMap[sch._id]}
                onApply={(s) => { setApplyModal(s); setStatement(''); }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Apply Modal */}
      <Modal
        isOpen={!!applyModal}
        onClose={() => setApplyModal(null)}
        title="Apply for Scholarship"
        size="md"
      >
        {applyModal && (
          <div className="space-y-4">
            <div className="bg-green-50 rounded-lg p-4">
              <p className="font-semibold text-gray-900">{applyModal.name}</p>
              <p className="text-green-700 font-bold text-lg mt-1">{formatCurrency(applyModal.amount)}</p>
            </div>
            <div>
              <label className="form-label">Personal Statement (Optional)</label>
              <textarea
                value={statement}
                onChange={(e) => setStatement(e.target.value)}
                rows={4}
                placeholder="Briefly explain why you deserve this scholarship and how it will help you..."
                className="form-input"
              />
            </div>
            <p className="text-xs text-gray-500">
              Your application will be saved as a draft. You can upload documents and submit it from My Applications.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setApplyModal(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleApply} disabled={applying} className="btn-primary flex-1">
                {applying ? 'Creating...' : 'Create Application'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
};

export default StudentScholarships;
