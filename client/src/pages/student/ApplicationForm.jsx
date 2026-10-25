import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatusBadge from '../../components/ui/StatusBadge';
import { scholarshipService } from '../../services/scholarshipService';
import { studentService } from '../../services/studentService';
import { applicationService } from '../../services/applicationService';
import {
  formatDate,
  formatCurrency,
  getDocumentTypeLabel,
} from '../../utils/helpers';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
  GraduationCap,
  User,
  Banknote,
  FileText,
  Loader2,
  Info,
  BookOpen,
  ShieldCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';

/* ─── Section wrapper ──────────────────────────────────────────────────────── */
const Section = ({ icon: Icon, title, children }) => (
  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-200">
    <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100 bg-slate-50/70">
      <div className="w-7 h-7 rounded-lg bg-purple-50 text-[#5B21B6] flex items-center justify-center">
        <Icon className="w-4 h-4" />
      </div>
      <h2 className="font-semibold text-slate-800 text-sm tracking-tight">{title}</h2>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

/* ─── Read-only info row ───────────────────────────────────────────────────── */
const InfoRow = ({ label, value }) => (
  <div className="flex flex-col sm:flex-row sm:items-center py-2.5 border-b border-slate-100 last:border-0">
    <span className="text-xs font-medium text-slate-400 sm:w-44 flex-shrink-0">{label}</span>
    <span className="text-sm font-medium text-slate-700 mt-0.5 sm:mt-0">{value || <span className="text-slate-300 font-normal">—</span>}</span>
  </div>
);

/* ─── Eligibility result card ──────────────────────────────────────────────── */
const EligibilityResult = ({ eligibility, checking }) => {
  if (checking) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500 py-3">
        <Loader2 className="w-4 h-4 animate-spin text-[#5B21B6]" />
        Checking your eligibility…
      </div>
    );
  }
  if (!eligibility) return null;

  return (
    <div
      className={`rounded-xl border p-4 ${
        eligibility.eligible
          ? 'border-green-200 bg-green-50'
          : 'border-red-200 bg-red-50'
      }`}
    >
      <div
        className={`flex items-center gap-2 mb-3 font-semibold text-sm ${
          eligibility.eligible ? 'text-green-700' : 'text-red-700'
        }`}
      >
        {eligibility.eligible ? (
          <CheckCircle className="w-4 h-4" />
        ) : (
          <XCircle className="w-4 h-4" />
        )}
        {eligibility.eligible
          ? 'You are eligible for this scholarship'
          : 'You do not currently meet all eligibility criteria'}
      </div>
      <div className="space-y-1.5">
        {Object.entries(eligibility.criteria || {}).map(([key, val]) => (
          <div key={key} className="flex items-start gap-2 text-xs">
            {val.met ? (
              <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
            )}
            <span className={val.met ? 'text-gray-600' : 'text-red-600'}>
              {val.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─── Main component ───────────────────────────────────────────────────────── */
const ApplicationForm = () => {
  const { scholarshipId } = useParams();
  const navigate = useNavigate();

  // Data states
  const [scholarship, setScholarship] = useState(null);
  const [profile, setProfile] = useState(null);
  const [eligibility, setEligibility] = useState(null);
  const [existingApplication, setExistingApplication] = useState(null);

  // UI states
  const [pageLoading, setPageLoading] = useState(true);
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pageError, setPageError] = useState('');

  // Form state
  const [personalStatement, setPersonalStatement] = useState('');
  const [formErrors, setFormErrors] = useState({});

  /* ── Load scholarship + student profile ─────────────────────────────────── */
  const loadPageData = useCallback(async () => {
    setPageLoading(true);
    setPageError('');
    try {
      const [schRes, profileRes, myAppsRes] = await Promise.all([
        scholarshipService.getById(scholarshipId),
        studentService.getProfile(),
        studentService.getMyApplications().catch(() => ({ data: { data: { applications: [] } } })),
      ]);
      setScholarship(schRes.data.data.scholarship);
      setProfile(profileRes.data.data.student);
      const apps = myAppsRes.data?.data?.applications || [];
      const found = apps.find((a) => (a.scholarship?._id || a.scholarship) === scholarshipId);
      setExistingApplication(found || null);
    } catch (err) {
      setPageError(
        err.response?.data?.message ||
          'Failed to load scholarship or profile data. Please try again.'
      );
    } finally {
      setPageLoading(false);
    }
  }, [scholarshipId]);

  /* ── Auto-run eligibility check once profile is loaded ─────────────────── */
  const runEligibilityCheck = useCallback(async () => {
    if (!scholarshipId) return;
    setCheckingEligibility(true);
    try {
      const res = await scholarshipService.checkEligibility(scholarshipId);
      setEligibility(res.data.data);
    } catch {
      // Non-fatal — profile may be incomplete
      setEligibility(null);
    } finally {
      setCheckingEligibility(false);
    }
  }, [scholarshipId]);

  useEffect(() => {
    loadPageData();
  }, [loadPageData]);

  useEffect(() => {
    if (profile) runEligibilityCheck();
  }, [profile, runEligibilityCheck]);

  /* ── Validation ─────────────────────────────────────────────────────────── */
  const validate = () => {
    const errs = {};
    if (!personalStatement.trim()) {
      errs.personalStatement = 'Personal statement is required.';
    } else if (personalStatement.trim().length < 50) {
      errs.personalStatement =
        'Please write at least 50 characters explaining why you are applying.';
    }
    return errs;
  };

  /* ── Submit ─────────────────────────────────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }
    setFormErrors({});

    if (existingApplication) {
      toast.error('You have already applied for this scholarship.');
      return;
    }

    // Block ineligible submission when eligibility is confirmed false
    if (eligibility && !eligibility.eligible) {
      toast.error(
        'You are not eligible for this scholarship. Please review the eligibility criteria.'
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await applicationService.create({
        scholarshipId,
        personalStatement: personalStatement.trim(),
      });
      const newAppId = res.data.data.application._id;
      toast.success(
        'Application draft created! Upload your documents and submit.'
      );
      navigate(`/student/applications/${newAppId}`, { replace: true });
    } catch (err) {
      toast.error(
        err.response?.data?.message || 'Failed to create application.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Render: loading ────────────────────────────────────────────────────── */
  if (pageLoading) {
    return (
      <DashboardLayout>
        <LoadingSpinner text="Loading scholarship details…" />
      </DashboardLayout>
    );
  }

  /* ── Render: error ──────────────────────────────────────────────────────── */
  if (pageError || !scholarship) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertCircle className="w-12 h-12 text-red-300 mb-3" />
          <p className="text-gray-700 font-semibold">Failed to Load</p>
          <p className="text-gray-400 text-sm mt-1 max-w-sm">
            {pageError || 'Scholarship not found.'}
          </p>
          <Link
            to="/student/scholarships"
            className="btn-secondary mt-5 text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Scholarships
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const crit = scholarship.eligibilityCriteria || {};
  const student = profile || {};
  const userInfo = student.userId || {};

  /* ── Render: main form ──────────────────────────────────────────────────── */
  return (
    <DashboardLayout>
      <form onSubmit={handleSubmit} noValidate>
        <div className="fade-in space-y-6">

          {/* Page header */}
          <div className="flex items-center gap-3">
            <Link
              to={`/student/scholarships/${scholarshipId}`}
              className="btn-ghost p-2"
              aria-label="Back to scholarship details"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-[#172033] truncate">
                Apply — {scholarship.name}
              </h1>
              <p className="text-gray-400 text-sm mt-0.5">
                Review your information, write a personal statement, then create your draft.
              </p>
            </div>
            <StatusBadge status={scholarship.status} />
          </div>

          {/* Layout grid */}
          <div className="grid xl:grid-cols-3 gap-6">

            {/* Left column */}
            <div className="xl:col-span-2 space-y-5">

              {/* A. Scholarship information */}
              <Section icon={GraduationCap} title="Scholarship Information">
                <div className="grid sm:grid-cols-2 gap-4 mb-4">
                  <div className="bg-purple-50/70 border border-purple-100 rounded-xl p-4">
                    <p className="text-xs text-purple-700 font-semibold uppercase tracking-wider">Scholarship Amount</p>
                    <p className="text-2xl font-bold text-[#5B21B6] mt-1">
                      {formatCurrency(scholarship.amount)}
                    </p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Application Deadline</p>
                    <p className="text-sm font-semibold text-slate-800 mt-1">
                      {formatDate(scholarship.applicationEndDate)}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Opens: {formatDate(scholarship.applicationStartDate)}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {scholarship.description}
                </p>

                {/* Eligibility criteria summary */}
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Eligibility Criteria
                  </p>
                  {crit.minimumCgpa > 0 && (
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#5B21B6]" />
                      Minimum CGPA: <strong className="text-slate-800">{crit.minimumCgpa}</strong>
                    </div>
                  )}
                  {crit.maximumFamilyIncome > 0 && (
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#5B21B6]" />
                      Maximum Family Income:{' '}
                      <strong className="text-slate-800">{formatCurrency(crit.maximumFamilyIncome)}</strong>
                    </div>
                  )}
                  {crit.eligibleCategories?.length > 0 &&
                    !crit.eligibleCategories.includes('all') && (
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#5B21B6]" />
                        Categories:{' '}
                        <strong className="text-slate-800">
                          {crit.eligibleCategories
                            .map((c) => c.toUpperCase())
                            .join(', ')}
                        </strong>
                      </div>
                    )}
                  {crit.eligibleCourses?.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#5B21B6]" />
                      Eligible Courses: <strong className="text-slate-800">{crit.eligibleCourses.join(', ')}</strong>
                    </div>
                  )}
                  {crit.eligibleYears?.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#5B21B6]" />
                      Year of Study: <strong className="text-slate-800">{crit.eligibleYears.join(', ')}</strong>
                    </div>
                  )}
                  {!crit.minimumCgpa &&
                    !crit.maximumFamilyIncome &&
                    !crit.eligibleCourses?.length &&
                    !crit.eligibleYears?.length && (
                      <p className="text-xs text-slate-400 italic">
                        No specific eligibility criteria — open to all students.
                      </p>
                    )}
                </div>
              </Section>

              {/* B. Personal information (read-only from profile) */}
              <Section icon={User} title="B. Personal Information">
                <div className="mb-4 flex items-start gap-2 bg-purple-50/60 border border-purple-100 rounded-lg px-3 py-2.5">
                  <Info className="w-3.5 h-3.5 text-[#5B21B6] flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-purple-900">
                    This information is from your student profile. To update it,{' '}
                    <Link
                      to="/student/profile"
                      className="font-semibold underline text-[#5B21B6]"
                    >
                      edit your profile
                    </Link>{' '}
                    before applying.
                  </p>
                </div>
                <InfoRow label="Full Name" value={userInfo.name} />
                <InfoRow label="Email Address" value={userInfo.email} />
                <InfoRow label="Phone Number" value={student.phone} />
                <InfoRow
                  label="Date of Birth"
                  value={
                    student.dateOfBirth ? formatDate(student.dateOfBirth) : null
                  }
                />
                <InfoRow label="Gender" value={student.gender} />
                {student.address && (
                  <InfoRow
                    label="Address"
                    value={[
                      student.address.street,
                      student.address.city,
                      student.address.state,
                      student.address.pincode,
                    ]
                      .filter(Boolean)
                      .join(', ')}
                  />
                )}
              </Section>

              {/* C. Academic information */}
              <Section icon={BookOpen} title="C. Academic Information">
                <InfoRow label="Institution" value={student.institution} />
                <InfoRow label="Course" value={student.course} />
                <InfoRow label="Department" value={student.department} />
                <InfoRow
                  label="Year of Study"
                  value={student.year ? `Year ${student.year}` : null}
                />
                <InfoRow
                  label="CGPA / Percentage"
                  value={student.cgpa ? String(student.cgpa) : null}
                />
                <InfoRow
                  label="Registration Number"
                  value={student.registrationNumber}
                />
              </Section>

              {/* D. Financial information */}
              <Section icon={Banknote} title="D. Financial Information">
                <InfoRow
                  label="Annual Family Income"
                  value={
                    student.familyIncome
                      ? formatCurrency(student.familyIncome)
                      : null
                  }
                />
                <InfoRow
                  label="Category"
                  value={
                    student.category
                      ? student.category.toUpperCase()
                      : null
                  }
                />
              </Section>

              {/* E. Personal statement */}
              <Section icon={FileText} title="E. Personal Statement">
                <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                  Explain why you are applying for this scholarship, how it will
                  support your studies, and what makes you a deserving candidate.
                  <span className="text-red-500 ml-1 font-semibold">*</span> Minimum 50 characters.
                </p>
                <textarea
                  id="personal-statement"
                  value={personalStatement}
                  onChange={(e) => {
                    setPersonalStatement(e.target.value);
                    if (formErrors.personalStatement) {
                      setFormErrors((prev) => ({
                        ...prev,
                        personalStatement: '',
                      }));
                    }
                  }}
                  rows={7}
                  placeholder="Write about your academic achievements, financial need, and how this scholarship will help you achieve your educational goals…"
                  className={`form-input resize-none text-slate-800 ${
                    formErrors.personalStatement ? 'border-red-400' : ''
                  }`}
                  maxLength={2000}
                />
                <div className="flex items-start justify-between mt-1.5">
                  <div>
                    {formErrors.personalStatement && (
                      <p className="form-error flex items-center gap-1 text-xs text-red-500 mt-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {formErrors.personalStatement}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 flex-shrink-0 ml-3">
                    {personalStatement.length} / 2000
                  </p>
                </div>
              </Section>

              {/* F. Document checklist (informational) */}
              {scholarship.requiredDocuments?.length > 0 && (
                <Section icon={FileText} title="F. Required Documents">
                  <div className="mb-4 flex items-start gap-2 bg-purple-50/60 border border-purple-100 rounded-lg px-3 py-2.5">
                    <AlertCircle className="w-3.5 h-3.5 text-[#5B21B6] flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-purple-900">
                      Prepare these documents before submitting. You will upload
                      them on the next screen after your draft is created.
                    </p>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {scholarship.requiredDocuments.map((doc) => (
                      <div
                        key={doc}
                        className="flex items-center gap-2.5 text-sm text-slate-700 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2.5"
                      >
                        <CheckCircle className="w-4 h-4 text-purple-400 flex-shrink-0" />
                        {getDocumentTypeLabel(doc)}
                      </div>
                    ))}
                  </div>
                </Section>
              )}
            </div>

            {/* Right column — eligibility + action */}
            <div className="space-y-4">

              {/* Eligibility result */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck className="w-4 h-4 text-[#5B21B6]" />
                  <h2 className="font-semibold text-slate-800 text-sm">
                    Eligibility Check
                  </h2>
                </div>
                <EligibilityResult
                  eligibility={eligibility}
                  checking={checkingEligibility}
                />
                {!checkingEligibility && !eligibility && (
                  <p className="text-xs text-slate-400">
                    Complete your student profile to see eligibility results.{' '}
                    <Link
                      to="/student/profile"
                      className="text-[#5B21B6] underline font-medium"
                    >
                      Update profile
                    </Link>
                  </p>
                )}
              </div>

              {/* Action card — sticky on desktop */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 xl:sticky xl:top-6">
                <h2 className="font-semibold text-gray-800 text-sm mb-1">
                  Ready to Apply?
                </h2>
                <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                  Clicking the button below creates a draft. You can then upload
                  documents and submit for officer review.
                </p>

                {/* Already applied warning */}
                {existingApplication && (
                  <div className="mb-4 flex flex-col gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-900">
                      Already Applied ({existingApplication.applicationNumber || 'Application'})
                    </p>
                    <p className="text-xs text-blue-700">
                      You already have an application in {existingApplication.status} status.
                    </p>
                    <Link
                      to={`/student/applications/${existingApplication._id}`}
                      className="btn-primary text-xs justify-center py-2 mt-1"
                    >
                      View Existing Application
                    </Link>
                  </div>
                )}

                {/* Ineligible warning */}
                {eligibility && !eligibility.eligible && (
                  <div className="mb-4 flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
                    <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-700">
                      You do not meet all eligibility criteria. Your application
                      cannot be submitted for review.
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  id="create-application-btn"
                  disabled={
                    submitting ||
                    !!existingApplication ||
                    (eligibility !== null && !eligibility.eligible)
                  }
                  className="btn-primary w-full py-3"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating Application…
                    </>
                  ) : (
                    'Create Application Draft'
                  )}
                </button>

                <Link
                  to={`/student/scholarships/${scholarshipId}`}
                  className="btn-secondary w-full mt-3 justify-center"
                >
                  Cancel
                </Link>

                <p className="text-xs text-gray-400 text-center mt-4 leading-relaxed">
                  By applying you confirm that the information provided is
                  accurate and complete to the best of your knowledge.
                </p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </DashboardLayout>
  );
};

export default ApplicationForm;
