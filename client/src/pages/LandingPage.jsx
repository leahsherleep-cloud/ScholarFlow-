import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  BookOpen,
  ShieldCheck,
  BarChart3,
  FileText,
  Bell,
  ArrowRight,
  CheckCircle,
  ChevronDown,
  Menu,
  X,
  Search,
  ClipboardCheck,
  UserCheck,
  Upload,
  Activity,
  Users,
  Settings,
} from 'lucide-react';

/* ─── Data ──────────────────────────────────────────────────────────────────── */
const NAV_LINKS = [
  { label: 'Home', href: '#home' },
  { label: 'Scholarships', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'About', href: '#about' },
];

const FEATURES = [
  {
    icon: Search,
    title: 'Scholarship Discovery',
    desc: 'Browse a curated list of scholarships matched to your academic profile and financial background.',
  },
  {
    icon: FileText,
    title: 'Online Applications',
    desc: 'Complete and submit scholarship applications through a guided, step-by-step digital form.',
  },
  {
    icon: Upload,
    title: 'Secure Document Submission',
    desc: 'Upload and manage required documents securely with encrypted storage and version control.',
  },
  {
    icon: Activity,
    title: 'Application Tracking',
    desc: 'Monitor your application status in real time, from submission through to final decision.',
  },
  {
    icon: ShieldCheck,
    title: 'Transparent Verification',
    desc: 'Document verification is handled by qualified officers with clear audit trails at every step.',
  },
  {
    icon: BarChart3,
    title: 'Faster Administrative Processing',
    desc: 'Automated workflows and role-based dashboards significantly reduce processing time.',
  },
];

const STEPS = [
  { step: '01', title: 'Create Your Account', desc: 'Register as a student in minutes. All you need is a valid email address.' },
  { step: '02', title: 'Complete Your Profile', desc: 'Fill in your academic details, income information, and personal background.' },
  { step: '03', title: 'Discover Scholarships', desc: 'Browse all available scholarships and view eligibility criteria before applying.' },
  { step: '04', title: 'Check Eligibility', desc: 'Review detailed criteria for each scholarship to confirm you qualify.' },
  { step: '05', title: 'Apply and Upload Documents', desc: 'Submit your application and upload required supporting documents securely.' },
  { step: '06', title: 'Track Your Application', desc: 'Follow your application through verification, evaluation, and final decision.' },
];

const PORTALS = [
  {
    icon: GraduationCap,
    title: 'Student Portal',
    color: 'border-[#087443]',
    iconBg: 'bg-[#ecfdf5]',
    iconColor: 'text-[#087443]',
    features: [
      'Browse available scholarships',
      'Submit and manage applications',
      'Upload supporting documents',
      'Track application status',
      'Receive notifications and updates',
    ],
    cta: 'Register as Student',
    ctaLink: '/register',
    primary: true,
  },
  {
    icon: ClipboardCheck,
    title: 'Scholarship Officer Portal',
    color: 'border-gray-200',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    features: [
      'Review submitted applications',
      'Verify uploaded documents',
      'Request correction from students',
      'Mark applications as verified',
      'Access application history',
    ],
    cta: 'Officer Login',
    ctaLink: '/login',
    primary: false,
  },
  {
    icon: Settings,
    title: 'Administrator Portal',
    color: 'border-gray-200',
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-600',
    features: [
      'Manage scholarships and deadlines',
      'Manage students and officers',
      'Approve or reject applications',
      'Process fund disbursements',
      'View audit logs and reports',
    ],
    cta: 'Admin Login',
    ctaLink: '/login',
    primary: false,
  },
];

const FAQS = [
  {
    q: 'How do I apply for a scholarship?',
    a: 'Register as a student, complete your profile, then browse available scholarships. Click "Apply Now" on any open scholarship to start your application. You can save as a draft and submit once all documents are uploaded.',
  },
  {
    q: 'How can I check my eligibility?',
    a: 'Each scholarship listing shows detailed eligibility criteria including minimum CGPA, income limits, category requirements, and program restrictions. Review these carefully before applying.',
  },
  {
    q: 'What documents are required?',
    a: 'Commonly required documents include an identity proof, income certificate, mark sheets or transcripts, a college ID, a bonafide certificate, and bank account proof. Specific scholarships may require additional documents.',
  },
  {
    q: 'How do I track my application?',
    a: 'Log in to your student dashboard and go to "My Applications." You will see the current status of every application along with a timeline of all status changes and officer notes.',
  },
  {
    q: 'How are applications verified?',
    a: 'Scholarship officers review your documents and application details. They may request corrections if something is missing or unclear. Once verified, applications move to the evaluation stage for final approval.',
  },
];

const FOOTER_LINKS = {
  Platform: [
    { label: 'Home', href: '#home' },
    { label: 'Scholarships', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'About', href: '#about' },
  ],
  Account: [
    { label: 'Login', href: '/login' },
    { label: 'Register', href: '/register' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms and Conditions', href: '#' },
  ],
  Support: [
    { label: 'Help and Support', href: '#' },
    { label: 'Contact Us', href: '#' },
  ],
};

/* ─── FAQ Item ──────────────────────────────────────────────────────────────── */
function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-[#E5E7EB] rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-left bg-white hover:bg-[#F8FAFC] transition-colors"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="font-medium text-[#172033] text-sm pr-4">{q}</span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="px-5 pb-4 bg-white">
          <p className="text-sm text-gray-600 leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}

/* ─── Main Component ────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div id="home" className="min-h-screen bg-white" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ─── Navbar ─────────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-[#087443] rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-[#172033] tracking-tight">
                Scholar<span className="text-[#087443]">Flow</span>
              </span>
            </div>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-7 text-sm font-medium text-gray-600">
              {NAV_LINKS.map(({ label, href }) => (
                <a key={label} href={href} className="hover:text-[#087443] transition-colors">
                  {label}
                </a>
              ))}
            </div>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-3">
              <Link to="/login" className="text-sm font-medium text-gray-700 hover:text-[#087443] transition-colors px-3 py-1.5">
                Login
              </Link>
              <Link to="/register" className="btn-primary text-sm">
                Register <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 text-gray-600 hover:text-[#087443] hover:bg-[#ecfdf5] rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-[#E5E7EB] px-4 py-4 space-y-1">
            {NAV_LINKS.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-[#087443] hover:bg-[#ecfdf5] rounded-lg transition-colors"
              >
                {label}
              </a>
            ))}
            <div className="pt-3 border-t border-[#E5E7EB] flex flex-col gap-2 mt-2">
              <Link to="/login" className="btn-secondary w-full justify-center text-sm" onClick={() => setMobileMenuOpen(false)}>
                Login
              </Link>
              <Link to="/register" className="btn-primary w-full justify-center text-sm" onClick={() => setMobileMenuOpen(false)}>
                Register
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* ─── Hero ───────────────────────────────────────────────────────────────── */}
      <section className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: text */}
            <div className="fade-in">
              <span className="section-label mb-5 inline-flex">Digital Scholarship Platform</span>
              <h1 className="text-4xl sm:text-5xl font-bold text-[#172033] leading-tight tracking-tight mt-4 mb-5">
                Your Scholarship Journey,{' '}
                <span className="text-[#087443]">Simplified.</span>
              </h1>
              <p className="text-gray-600 text-lg leading-relaxed mb-8 max-w-lg">
                Discover opportunities, apply digitally, and track your scholarship applications through one transparent platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <Link
                  to="/student/scholarships"
                  id="hero-explore-btn"
                  className="btn-secondary px-6 py-3 text-sm"
                >
                  Explore Scholarships
                </Link>
                <Link
                  to="/register"
                  id="hero-getstarted-btn"
                  className="btn-primary px-6 py-3 text-sm"
                >
                  Get Started <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500">
                {['Free to register', 'No hidden fees', 'Secure and encrypted'].map((item) => (
                  <span key={item} className="flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-[#10B981]" />
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: illustration */}
            <div className="hidden lg:block fade-in">
              <div className="bg-[#F8FAFC] rounded-2xl p-8 border border-[#E5E7EB]">
                {/* Process diagram */}
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6">Application Workflow</p>
                <div className="space-y-3">
                  {[
                    { icon: UserCheck,    label: 'Create Account & Complete Profile', done: true },
                    { icon: Search,       label: 'Discover & Check Eligibility',      done: true },
                    { icon: FileText,     label: 'Submit Application',                done: true },
                    { icon: Upload,       label: 'Upload Documents',                  done: false, active: true },
                    { icon: ShieldCheck,  label: 'Officer Verification',              done: false },
                    { icon: CheckCircle,  label: 'Approval & Disbursement',           done: false },
                  ].map(({ icon: Icon, label, done, active }, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                        active  ? 'border-[#087443] bg-[#ecfdf5]' :
                        done    ? 'border-[#E5E7EB] bg-white' :
                                  'border-[#E5E7EB] bg-white opacity-60'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        active ? 'bg-[#087443]' : done ? 'bg-[#ecfdf5]' : 'bg-gray-100'
                      }`}>
                        <Icon className={`w-4 h-4 ${active ? 'text-white' : done ? 'text-[#087443]' : 'text-gray-400'}`} />
                      </div>
                      <span className={`text-sm font-medium ${active ? 'text-[#087443]' : done ? 'text-[#172033]' : 'text-gray-400'}`}>
                        {label}
                      </span>
                      {done && !active && (
                        <CheckCircle className="w-4 h-4 text-[#10B981] ml-auto" />
                      )}
                      {active && (
                        <span className="ml-auto text-xs font-semibold text-[#087443] bg-white border border-[#087443] px-2 py-0.5 rounded-full">
                          In Progress
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Platform Features ───────────────────────────────────────────────────── */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="section-label mb-4 inline-flex">Platform Features</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#172033] mt-4 mb-3">
              Everything You Need in One Place
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto text-base">
              ScholarFlow provides a complete end-to-end solution for students, officers, and administrators.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="bg-white rounded-xl p-5 border border-[#E5E7EB] hover:border-[#10B981] hover:shadow-sm transition-all duration-200"
              >
                <div className="w-10 h-10 bg-[#ecfdf5] rounded-xl flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-[#087443]" />
                </div>
                <h3 className="font-semibold text-[#172033] mb-2 text-sm">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ───────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="section-label mb-4 inline-flex">Process</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#172033] mt-4 mb-3">How It Works</h2>
            <p className="text-gray-500 max-w-xl mx-auto text-base">
              From registration to receiving your scholarship — a simple, guided process.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {STEPS.map(({ step, title, desc }) => (
              <div key={step} className="bg-[#F8FAFC] rounded-xl p-5 border border-[#E5E7EB]">
                <div className="w-10 h-10 bg-[#087443] text-white rounded-xl flex items-center justify-center text-sm font-bold mb-4">
                  {step}
                </div>
                <h3 className="font-semibold text-[#172033] mb-2 text-sm">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── User Roles ─────────────────────────────────────────────────────────── */}
      <section id="about" className="py-20 px-4 sm:px-6 lg:px-8 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="section-label mb-4 inline-flex">User Roles</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#172033] mt-4 mb-3">
              A Portal for Every Stakeholder
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto text-base">
              ScholarFlow is designed for three distinct user roles, each with a dedicated experience.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {PORTALS.map(({ icon: Icon, title, color, iconBg, iconColor, features, cta, ctaLink, primary }) => (
              <div
                key={title}
                className={`bg-white rounded-xl border-2 ${color} p-6 flex flex-col`}
              >
                <div className={`w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon className={`w-6 h-6 ${iconColor}`} />
                </div>
                <h3 className="font-bold text-[#172033] text-base mb-4">{title}</h3>
                <ul className="space-y-2.5 flex-1 mb-6">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to={ctaLink}
                  className={primary ? 'btn-primary w-full justify-center' : 'btn-secondary w-full justify-center'}
                >
                  {cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ────────────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <span className="section-label mb-4 inline-flex">FAQ</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#172033] mt-4 mb-3">
              Frequently Asked Questions
            </h2>
            <p className="text-gray-500 text-base">
              Common questions about the ScholarFlow platform.
            </p>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <FaqItem key={i} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Banner ─────────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[#087443]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Start Your Application?
          </h2>
          <p className="text-green-100 mb-8 text-base max-w-xl mx-auto">
            Create your free student account and explore available scholarships today.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/register"
              id="cta-register-btn"
              className="inline-flex items-center justify-center gap-2 bg-white text-[#087443] font-semibold px-6 py-3 rounded-lg hover:bg-[#ecfdf5] transition-colors text-sm"
            >
              Create Free Account <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              id="cta-login-btn"
              className="inline-flex items-center justify-center gap-2 bg-transparent border border-white/40 text-white font-medium px-6 py-3 rounded-lg hover:bg-white/10 transition-colors text-sm"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ─────────────────────────────────────────────────────────────── */}
      <footer className="bg-[#172033] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
            {/* Brand */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 bg-[#087443] rounded-lg flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold">
                  Scholar<span className="text-[#10B981]">Flow</span>
                </span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
                A modern digital scholarship management platform connecting students with academic funding opportunities.
              </p>
            </div>

            {/* Link groups */}
            {Object.entries(FOOTER_LINKS).map(([group, links]) => (
              <div key={group}>
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">{group}</p>
                <ul className="space-y-2.5">
                  {links.map(({ label, href }) => (
                    <li key={label}>
                      {href.startsWith('/') ? (
                        <Link to={href} className="text-sm text-gray-300 hover:text-white transition-colors">
                          {label}
                        </Link>
                      ) : (
                        <a href={href} className="text-sm text-gray-300 hover:text-white transition-colors">
                          {label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} ScholarFlow — Digital Scholarship Management System
            </p>
            <div className="flex gap-5 text-sm text-gray-500">
              <a href="#" className="hover:text-gray-300 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-gray-300 transition-colors">Terms</a>
              <a href="#" className="hover:text-gray-300 transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
