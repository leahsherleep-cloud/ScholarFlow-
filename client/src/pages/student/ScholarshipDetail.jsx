import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatusBadge from '../../components/ui/StatusBadge';
import { scholarshipService } from '../../services/scholarshipService';
import { studentService } from '../../services/studentService';
import { formatDate, formatCurrency, getDocumentTypeLabel } from '../../utils/helpers';
import { ArrowLeft, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const ScholarshipDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [scholarship, setScholarship] = useState(null);
  const [eligibility, setEligibility] = useState(null);
  const [existingApplication, setExistingApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingEligibility, setCheckingEligibility] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [schRes, appRes] = await Promise.all([
          scholarshipService.getById(id),
          studentService.getMyApplications().catch(() => ({ data: { data: { applications: [] } } })),
        ]);
        setScholarship(schRes.data.data.scholarship);
        const myApps = appRes.data?.data?.applications || [];
        const existing = myApps.find((a) => (a.scholarship?._id || a.scholarship) === id);
        setExistingApplication(existing || null);
      } catch { toast.error('Scholarship not found'); }
      finally { setLoading(false); }
    };
    fetch();
  }, [id]);

  const handleCheckEligibility = async () => {
    setCheckingEligibility(true);
    try {
      const res = await scholarshipService.checkEligibility(id);
      setEligibility(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not check eligibility');
    } finally {
      setCheckingEligibility(false);
    }
  };

  const handleApply = () => {
    navigate(`/student/apply/${id}`);
  };

  if (loading) return <DashboardLayout><LoadingSpinner /></DashboardLayout>;
  if (!scholarship) return <DashboardLayout><p>Scholarship not found.</p></DashboardLayout>;

  const crit = scholarship.eligibilityCriteria || {};

  return (
    <DashboardLayout>
      <div className="fade-in space-y-6">
        <div className="flex items-center gap-3">
          <Link to="/student/scholarships" className="btn-ghost p-2 rounded-lg text-slate-500 hover:text-slate-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight truncate">{scholarship.name}</h1>
            <p className="text-slate-500 text-sm mt-0.5">Program Overview and Application Requirements</p>
          </div>
          <StatusBadge status={scholarship.status} size="lg" />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            {/* Overview */}
            <div className="bg-white rounded-xl border border-slate-200 card-shadow p-6">
              <h2 className="font-semibold text-slate-900 text-base mb-3">Program Description</h2>
              <p className="text-slate-600 text-sm leading-relaxed">{scholarship.description}</p>
              <div className="grid sm:grid-cols-2 gap-4 mt-6">
                <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-4">
                  <p className="text-xs text-emerald-800 font-semibold uppercase tracking-wider">Scholarship Award</p>
                  <p className="text-2xl font-extrabold text-emerald-700 mt-1">{formatCurrency(scholarship.amount)}</p>
                  <p className="text-xs text-emerald-600 mt-1">Direct bank transfer upon approval</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Application Window</p>
                  <p className="font-bold text-slate-900 mt-1 text-sm">Closes: {formatDate(scholarship.applicationEndDate)}</p>
                  <p className="text-xs text-slate-500 mt-1">Opened: {formatDate(scholarship.applicationStartDate)}</p>
                </div>
              </div>
            </div>

            {/* Eligibility criteria */}
            <div className="bg-white rounded-xl border border-slate-200 card-shadow p-6">
              <h2 className="font-semibold text-slate-900 text-base mb-4">Eligibility Requirements</h2>
              <div className="divide-y divide-slate-100">
                {crit.minimumCgpa > 0 && (
                  <div className="py-2.5 flex items-center justify-between text-sm">
                    <span className="text-slate-500">Minimum CGPA Required</span>
                    <span className="font-bold text-slate-800">{crit.minimumCgpa} / 10.0</span>
                  </div>
                )}
                {crit.maximumFamilyIncome > 0 && (
                  <div className="py-2.5 flex items-center justify-between text-sm">
                    <span className="text-slate-500">Maximum Annual Family Income</span>
                    <span className="font-bold text-slate-800">{formatCurrency(crit.maximumFamilyIncome)}</span>
                  </div>
                )}
                {crit.eligibleCategories?.length > 0 && !crit.eligibleCategories.includes('all') && (
                  <div className="py-2.5 flex items-center justify-between text-sm">
                    <span className="text-slate-500">Eligible Categories</span>
                    <span className="font-bold text-slate-800 uppercase">{crit.eligibleCategories.join(', ')}</span>
                  </div>
                )}
                {crit.eligibleCourses?.length > 0 && (
                  <div className="py-2.5 flex items-center justify-between text-sm">
                    <span className="text-slate-500">Eligible Courses</span>
                    <span className="font-bold text-slate-800">{crit.eligibleCourses.join(', ')}</span>
                  </div>
                )}
                {crit.eligibleYears?.length > 0 && (
                  <div className="py-2.5 flex items-center justify-between text-sm">
                    <span className="text-slate-500">Eligible Academic Years</span>
                    <span className="font-bold text-slate-800">Year {crit.eligibleYears.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Required documents */}
            {scholarship.requiredDocuments?.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 card-shadow p-6">
                <h2 className="font-semibold text-slate-900 text-base mb-4">Required Supporting Documents</h2>
                <div className="grid sm:grid-cols-2 gap-2.5">
                  {scholarship.requiredDocuments.map((doc) => (
                    <div key={doc} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs font-medium text-slate-700">
                      <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      {getDocumentTypeLabel(doc)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right panel */}
          <div className="space-y-5">
            {/* Action card */}
            <div className="bg-white rounded-xl border border-slate-200 card-shadow p-5">
              <h3 className="font-semibold text-slate-900 text-sm mb-3">Apply for this Award</h3>
              <div className="space-y-3">
                <button
                  onClick={handleCheckEligibility}
                  disabled={checkingEligibility}
                  className="btn-secondary w-full justify-center"
                  id="check-eligibility-btn"
                >
                  {checkingEligibility ? 'Evaluating profile...' : 'Check My Eligibility'}
                </button>
                {existingApplication ? (
                  <Link
                    to={`/student/applications/${existingApplication._id}`}
                    className="btn-primary w-full justify-center text-center font-semibold shadow-sm"
                    id="view-application-btn"
                  >
                    View Application ({existingApplication.status})
                  </Link>
                ) : (
                  <button
                    onClick={handleApply}
                    disabled={scholarship.status !== 'active'}
                    className="btn-primary w-full justify-center shadow-sm"
                    id="apply-btn"
                  >
                    Apply Now
                  </button>
                )}
              </div>
            </div>

            {/* Eligibility result */}
            {eligibility && (
              <div className={`bg-white rounded-xl border card-shadow p-5 ${eligibility.eligible ? 'border-emerald-200 bg-emerald-50/20' : 'border-rose-200 bg-rose-50/20'}`}>
                <div className={`flex items-center gap-2 mb-3 ${eligibility.eligible ? 'text-emerald-800' : 'text-rose-800'}`}>
                  {eligibility.eligible ? <CheckCircle className="w-5 h-5 text-emerald-600" /> : <XCircle className="w-5 h-5 text-rose-600" />}
                  <span className="font-bold text-sm">
                    {eligibility.eligible ? 'You Meet All Criteria!' : 'Criteria Incomplete'}
                  </span>
                </div>
                <div className="space-y-2">
                  {Object.entries(eligibility.criteria || {}).map(([key, val]) => (
                    <div key={key} className="flex items-start gap-2 text-xs">
                      {val.met ? (
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0 mt-0.5" />
                      )}
                      <span className={val.met ? 'text-slate-600' : 'text-rose-700 font-medium'}>{val.message}</span>
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

export default ScholarshipDetail;
