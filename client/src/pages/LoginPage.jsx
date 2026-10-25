import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  GraduationCap, Eye, EyeOff, Lock, Mail, Loader2, AlertCircle, CheckCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm]         = useState({ email: '', password: '', remember: false });
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const from = location.state?.from?.pathname;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}!`);
      const dashMap = { student: '/student/dashboard', officer: '/officer/dashboard', admin: '/admin/dashboard' };
      navigate(from || dashMap[user.role] || '/student/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const demoLogins = [
    { label: 'Admin Demo',   email: 'admin@scholarflow.dev',   pw: 'Admin@1234'   },
    { label: 'Officer Demo', email: 'officer@scholarflow.dev', pw: 'Officer@1234' },
    { label: 'Student Demo', email: 'student@scholarflow.dev', pw: 'Student@1234' },
  ];

  const demoLogin = async (email, pw) => {
    setForm({ ...form, email, password: pw });
    setError('');
    setLoading(true);
    try {
      const user = await login(email, pw);
      toast.success(`Welcome back, ${user.name}!`);
      const dashMap = { student: '/student/dashboard', officer: '/officer/dashboard', admin: '/admin/dashboard' };
      navigate(dashMap[user.role], { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center bg-[#F8FAFC] py-10 px-4 sm:px-6">
      {/* Brand logo & title above card */}
      <Link to="/" className="flex items-center gap-2.5 mb-6 focus:outline-none group">
        <div className="w-11 h-11 rounded-2xl bg-[#5B21B6] text-white flex items-center justify-center shadow-md shadow-purple-900/10 transition-transform group-hover:scale-105">
          <GraduationCap className="w-6 h-6" />
        </div>
        <div className="flex flex-col">
          <span className="text-2xl font-bold tracking-tight text-slate-900">ScholarFlow</span>
          <span className="text-[11px] font-semibold text-[#5B21B6] tracking-wider uppercase">Scholarship Portal</span>
        </div>
      </Link>

      {/* Main Login Card (400-440px wide, vertically and horizontally centered) */}
      <div className="w-full max-w-[440px] bg-white rounded-2xl border border-slate-200/90 shadow-lg shadow-slate-200/50 p-6 sm:p-8 fade-in">
        {/* Header */}
        <div className="mb-6 text-center sm:text-left">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sign In</h1>
          <p className="text-sm text-slate-500 mt-1">Access your scholarship dashboard</p>
        </div>

        {/* Authentication Error Banner */}
        {error && (
          <div
            className="flex items-start gap-3 bg-red-50/90 border border-red-200 rounded-xl p-4 mb-6 text-sm text-red-700 leading-relaxed shadow-xs"
            role="alert"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-red-800 text-xs uppercase tracking-wider mb-0.5">Authentication Notice</p>
              <p className="text-red-700 break-words">{error}</p>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* Email Address */}
          <div>
            <label htmlFor="login-email" className="block text-sm font-semibold text-slate-700 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
                <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
              </div>
              <input
                id="login-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                className="w-full pl-11 pr-3.5 py-2.5 h-11 border border-slate-200 rounded-xl text-sm text-slate-900 bg-white placeholder-slate-400 transition-all focus:outline-none focus:border-[#5B21B6] focus:ring-2 focus:ring-[#EDE9FE]"
                required
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="login-password" className="text-sm font-semibold text-slate-700">
                Password
              </label>
              <button
                type="button"
                className="text-xs text-[#5B21B6] hover:text-[#4C1D95] hover:underline font-semibold transition-colors"
                tabIndex={-1}
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
                <Lock className="w-4 h-4 text-slate-400 flex-shrink-0" />
              </div>
              <input
                id="login-password"
                type={showPw ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="w-full pl-11 pr-11 py-2.5 h-11 border border-slate-200 rounded-xl text-sm text-slate-900 bg-white placeholder-slate-400 transition-all focus:outline-none focus:border-[#5B21B6] focus:ring-2 focus:ring-[#EDE9FE]"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors focus:outline-none z-10"
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? <EyeOff className="w-4 h-4 flex-shrink-0" /> : <Eye className="w-4 h-4 flex-shrink-0" />}
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center pt-0.5">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.remember}
                onChange={(e) => setForm({ ...form, remember: e.target.checked })}
                className="w-4 h-4 rounded border-slate-300 text-[#5B21B6] focus:ring-[#5B21B6] transition-colors"
                id="remember-me"
              />
              <span className="text-sm text-slate-600 font-medium">Remember me</span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            id="login-submit-btn"
            className="btn-primary w-full h-11 py-2.5 text-sm font-semibold rounded-xl shadow-sm transition-all"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Create Account link */}
        <p className="text-center text-sm text-slate-500 mt-6 pt-5 border-t border-slate-100">
          Don't have an account?{' '}
          <Link to="/register" className="text-[#5B21B6] font-semibold hover:underline">
            Create Account
          </Link>
        </p>

        {/* Quick Demo Login Section */}
        <div className="mt-6 pt-5 border-t border-slate-200/80">
          <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider text-center mb-3">
            Quick Demo Login
          </p>
          <div className="grid grid-cols-3 gap-2">
            {demoLogins.map((d) => (
              <button
                key={d.label}
                onClick={() => demoLogin(d.email, d.pw)}
                disabled={loading}
                id={`demo-${d.label.toLowerCase().replace(' ', '-')}`}
                className="text-xs py-2.5 px-2 rounded-xl border border-slate-200 text-slate-700 bg-slate-50/50 hover:bg-purple-50 hover:border-purple-200 hover:text-[#5B21B6] transition-all text-center disabled:opacity-50 font-semibold shadow-2xs"
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer copyright */}
      <p className="text-xs text-slate-400 text-center mt-6">
        © {new Date().getFullYear()} ScholarFlow · Digital Scholarship Application and Management System
      </p>
    </div>
  );
};

export default LoginPage;
