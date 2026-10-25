import { useState } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  GraduationCap,
  FileText,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  BookOpen,
  Users,
  Banknote,
  ScrollText,
  ClipboardList,
  ShieldCheck,
  Settings,
  BarChart2,
  ChevronLeft,
} from 'lucide-react';
import { getInitials } from '../utils/helpers';
import toast from 'react-hot-toast';

/* ─── Nav definitions per role ──────────────────────────────────────────────── */
const NAV_ITEMS = {
  student: [
    { path: '/student/dashboard',     icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/student/profile',       icon: User,            label: 'My Profile' },
    { path: '/student/scholarships',  icon: GraduationCap,   label: 'Browse Scholarships' },
    { path: '/student/applications',  icon: FileText,        label: 'My Applications' },
    { path: '/student/notifications', icon: Bell,            label: 'Notifications' },
  ],
  officer: [
    { path: '/officer/dashboard',     icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/officer/applications',  icon: ClipboardList,   label: 'Application Review' },
  ],
  admin: [
    { path: '/admin/dashboard',       icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/scholarships',    icon: GraduationCap,   label: 'Scholarships' },
    { path: '/admin/users',           icon: Users,           label: 'Users' },
    { path: '/admin/applications',    icon: FileText,        label: 'Applications' },
    { path: '/admin/disbursements',   icon: Banknote,        label: 'Disbursements' },
    { path: '/admin/audit-logs',      icon: ScrollText,      label: 'Audit Logs' },
  ],
};

const ROLE_LABELS = {
  student: 'Student Portal',
  officer: 'Officer Portal',
  admin:   'Admin Portal',
};

const ROLE_COLORS = {
  student: 'text-[#5B21B6] bg-[#F5F3FF] border border-[#DDD6FE]',
  officer: 'text-blue-700 bg-blue-50 border border-blue-200',
  admin:   'text-purple-700 bg-purple-50 border border-purple-200',
};

/* ─── Sidebar inner content ─────────────────────────────────────────────────── */
function SidebarContent({ user, items, role, onLinkClick, onLogout }) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-200">
        <div className="w-9 h-9 rounded-xl bg-[#5B21B6] flex items-center justify-center flex-shrink-0 shadow-xs">
          <BookOpen className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-slate-900 text-sm leading-tight">ScholarFlow</p>
          <p className="text-xs text-slate-500 font-medium">{ROLE_LABELS[role] || 'Portal'}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
          Navigation
        </p>
        <ul className="space-y-0.5">
          {items.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `sidebar-nav-item ${isActive ? 'active' : ''}`
                }
                onClick={onLinkClick}
                end
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Settings divider */}
        <div className="mt-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
            Account
          </p>
          <ul className="space-y-0.5">
            <li>
              <button
                onClick={onLogout}
                className="sidebar-nav-item w-full text-left text-gray-600 hover:bg-red-50 hover:text-red-600"
              >
                <LogOut className="w-4 h-4 flex-shrink-0" />
                <span>Logout</span>
              </button>
            </li>
          </ul>
        </div>
      </nav>

      {/* User info */}
      <div className="border-t border-slate-200 p-3">
        <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors">
          <div className="w-9 h-9 rounded-full bg-[#F5F3FF] text-[#5B21B6] flex items-center justify-center text-xs font-bold flex-shrink-0 border border-[#DDD6FE]">
            {getInitials(user?.name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900 truncate">{user?.name}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          </div>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${ROLE_COLORS[role] || ''}`}>
            {role}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── Main layout ───────────────────────────────────────────────────────────── */
const DashboardLayout = ({ children, contentContainerClassName = 'max-w-7xl mx-auto w-full' }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const role  = user?.role || 'student';
  const items = NAV_ITEMS[role] || [];

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully.');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ─── Sidebar ──────────────────────────────────────────────────────────── */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200
          flex flex-col transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Close btn — mobile only */}
        <button
          className="absolute top-4 right-4 lg:hidden p-1 text-slate-400 hover:text-slate-600"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>

        <SidebarContent
          user={user}
          items={items}
          role={role}
          onLinkClick={() => setSidebarOpen(false)}
          onLogout={handleLogout}
        />
      </aside>

      {/* ─── Main ─────────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 px-4 lg:px-6 py-3.5 flex items-center gap-3 flex-shrink-0">
          {/* Hamburger — mobile */}
          <button
            className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-[#5B21B6] transition-colors"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumb / logo for mobile */}
          <Link to="/" className="lg:hidden flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-[#5B21B6]" />
            <span className="font-bold text-slate-900 text-sm">ScholarFlow</span>
          </Link>

          <div className="flex-1" />

          {/* Right side: name + role badge */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-medium text-[#172033] leading-tight">{user?.name}</span>
              <span className={`text-xs font-medium capitalize ${ROLE_COLORS[role] || ''} px-2 py-0.5 rounded-full`}>
                {role}
              </span>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#ecfdf5] text-[#087443] flex items-center justify-center text-xs font-bold border border-[#d1fae5]">
              {getInitials(user?.name)}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className={`p-4 lg:p-6 ${contentContainerClassName}`}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
