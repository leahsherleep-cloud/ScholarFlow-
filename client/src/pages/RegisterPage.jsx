import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  GraduationCap, Eye, EyeOff, Lock, Mail, User, Loader2, AlertCircle, CheckCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

/* ─── Password strength ─────────────────────────────────────────────────────── */
const getStrength = (pw) => {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8)          score++;
  if (/[A-Z]/.test(pw))        score++;
  if (/[0-9]/.test(pw))        score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score; // 0-4
};

const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLORS = ['', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-[#10B981]'];

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPw, setShowPw]     = useState(false);
  const [showCpw, setShowCpw]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState({});

  const strength = getStrength(form.password);

  const validate = () => {
    const errs = {};
    if (!form.name.trim())             errs.name = 'Full name is required.';
    if (!form.email.trim())            errs.email = 'Email address is required.';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Please enter a valid email address.';
    if (!form.password)                errs.password = 'Password is required.';
    else if (form.password.length < 8) errs.password = 'Password must be at least 8 characters.';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match.';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      await register({ name: form.name, email: form.email, password: form.password });
      toast.success('Account created! Welcome to ScholarFlow.');
      navigate('/student/dashboard', { replace: true });
    } catch (err) {
      setErrors({ general: err.response?.data?.message || 'Registration failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#F8FAFC]">

      {/* ─── Left panel ─────────────────────────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col w-[44%] bg-gradient-to-br from-[#4C1D95] via-[#5B21B6] to-[#6D28D9] px-12 py-10 shadow-xl">
        <Link to="/" className="flex items-center gap-2.5 mb-auto">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm border border-white/20 flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">ScholarFlow</span>
        </Link>

        <div className="mb-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-purple-200 text-xs font-semibold uppercase tracking-wider mb-5">
            Student Onboarding
          </div>
          <h1 className="text-4xl font-extrabold text-white leading-tight mb-4 tracking-tight">
            Start Your Scholarship<br />Journey Today
          </h1>
          <p className="text-purple-100 text-base leading-relaxed mb-10 max-w-md">
            Create your student profile and unlock institutional scholarship programs in minutes.
          </p>
          <div className="space-y-3.5">
            {[
              'Direct access to matched scholarships',
              'Fast profile-based eligibility checks',
              'Guided document upload and submission',
              'Transparent timeline tracking & officer feedback',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm text-purple-50">
                <CheckCircle className="w-4 h-4 text-purple-300 flex-shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>

        <p className="text-purple-300 text-xs leading-relaxed">
          Student registration only. Officers and Administrators are registered by system administrators.
        </p>
      </div>

      {/* ─── Right panel ────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md fade-in">
          {/* Mobile logo */}
          <Link to="/" className="flex items-center justify-center gap-2.5 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-[#5B21B6] flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">ScholarFlow</span>
          </Link>

          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <div className="mb-7">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Create Account</h2>
              <p className="text-slate-500 text-sm mt-1">Register as a student to apply for scholarships.</p>
            </div>

            {/* General error */}
            {errors.general && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl p-3.5 mb-5 text-sm text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {errors.general}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Full name */}
              <div>
                <label htmlFor="reg-name" className="form-label">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none flex-shrink-0 z-10" />
                  <input
                    id="reg-name"
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Your full name"
                    className={`form-input form-input-with-icon ${errors.name ? 'border-red-400' : ''}`}
                    autoComplete="name"
                  />
                </div>
                {errors.name && <p className="form-error"><AlertCircle className="w-3.5 h-3.5" />{errors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="reg-email" className="form-label">Email Address</label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none flex-shrink-0 z-10" />
                  <input
                    id="reg-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="you@example.com"
                    className={`form-input form-input-with-icon ${errors.email ? 'border-red-400' : ''}`}
                    autoComplete="email"
                  />
                </div>
                {errors.email && <p className="form-error"><AlertCircle className="w-3.5 h-3.5" />{errors.email}</p>}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="reg-password" className="form-label">Password</label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none flex-shrink-0 z-10" />
                  <input
                    id="reg-password"
                    type={showPw ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Min. 8 characters"
                    className={`form-input form-input-with-icon pr-11 ${errors.password ? 'border-red-400' : ''}`}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 flex-shrink-0 z-10"
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {/* Strength bar */}
                {form.password && (
                  <div className="mt-2">
                    <div className="flex gap-1">
                      {[1,2,3,4].map((i) => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength ? STRENGTH_COLORS[strength] : 'bg-slate-100'}`} />
                      ))}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Strength: <span className="font-semibold text-slate-600">{STRENGTH_LABELS[strength]}</span>
                    </p>
                  </div>
                )}
                {errors.password && <p className="form-error mt-1"><AlertCircle className="w-3.5 h-3.5" />{errors.password}</p>}
              </div>

              {/* Confirm password */}
              <div>
                <label htmlFor="reg-confirm-password" className="form-label">Confirm Password</label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none flex-shrink-0 z-10" />
                  <input
                    id="reg-confirm-password"
                    type={showCpw ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    placeholder="Re-enter your password"
                    className={`form-input form-input-with-icon pr-11 ${errors.confirmPassword ? 'border-red-400' : ''}`}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCpw(!showCpw)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 flex-shrink-0 z-10"
                    aria-label={showCpw ? 'Hide password' : 'Show password'}
                  >
                    {showCpw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="form-error"><AlertCircle className="w-3.5 h-3.5" />{errors.confirmPassword}</p>}
              </div>

              {/* Note */}
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs text-slate-600 leading-relaxed">
                <span className="font-semibold text-slate-800 block mb-0.5">Student Registration Only</span>
                This portal creates student applicant accounts. Officer and Administrator accounts are provisioned securely by system administrators.
              </div>

              <button
                type="submit"
                id="register-submit-btn"
                className="btn-primary w-full py-3"
                disabled={loading}
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Creating Account...</>
                ) : 'Create Account'}
              </button>
            </form>

            <p className="text-center text-sm text-slate-500 mt-5">
              Already have an account?{' '}
              <Link to="/login" className="text-[#5B21B6] font-semibold hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
