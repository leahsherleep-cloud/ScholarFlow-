import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import StatsCard from '../../components/ui/StatsCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { adminService } from '../../services/adminService';
import { formatCurrency, getMonthName } from '../../utils/helpers';
import {
  Users, GraduationCap, FileText, CheckCircle, XCircle, Clock, Banknote,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';

const COLORS = ['#5B21B6', '#7C3AED', '#A78BFA', '#0D9488', '#F59E0B', '#EF4444', '#64748B'];

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await adminService.getDashboard();
        setData(res.data.data);
      } catch {} finally { setLoading(false); }
    };
    fetch();
  }, []);

  const stats = data?.stats || {};
  const charts = data?.charts || {};

  // Format monthly data for chart
  const monthlyData = (charts.applicationsByMonth || []).map((d) => ({
    name: `${getMonthName(d._id.month)} ${d._id.year}`,
    Applications: d.count,
  }));

  // Status distribution for pie
  const statusData = (charts.statusDistribution || []).map((d) => ({
    name: d._id,
    value: d.count,
  }));

  // Scholarship wise
  const scholarshipData = (charts.applicationsByScholarship || []).map((d) => ({
    name: d.name?.length > 20 ? d.name.substring(0, 20) + '...' : d.name,
    Applications: d.count,
  }));

  return (
    <DashboardLayout>
      <div className="fade-in">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">System overview and real-time scholarship analytics</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatsCard icon={Users} title="Total Students" value={stats.totalStudents} color="blue" loading={loading} />
          <StatsCard icon={Users} title="Officers" value={stats.totalOfficers} color="purple" loading={loading} />
          <StatsCard icon={GraduationCap} title="Scholarships" value={stats.totalScholarships} color="purple" loading={loading} />
          <StatsCard icon={FileText} title="Total Applications" value={stats.totalApplications} color="indigo" loading={loading} />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatsCard icon={Clock} title="Pending" value={stats.pendingApplications} color="yellow" loading={loading} />
          <StatsCard icon={CheckCircle} title="Approved" value={stats.approvedApplications} color="green" loading={loading} />
          <StatsCard icon={XCircle} title="Rejected" value={stats.rejectedApplications} color="red" loading={loading} />
          <StatsCard
            icon={Banknote}
            title="Total Disbursed"
            value={formatCurrency(stats.totalDisbursedAmount)}
            color="purple"
            loading={loading}
          />
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Monthly applications */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h2 className="font-semibold text-slate-900 mb-4">Applications by Month</h2>
            {loading ? <div className="skeleton h-48 rounded-lg" /> : monthlyData.length === 0 ? (
              <p className="text-center text-slate-400 text-sm py-10">No data available</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                  <Tooltip />
                  <Bar dataKey="Applications" fill="#5B21B6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Status distribution */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h2 className="font-semibold text-slate-900 mb-4">Application Status Distribution</h2>
            {loading ? <div className="skeleton h-48 rounded-lg" /> : statusData.length === 0 ? (
              <p className="text-center text-slate-400 text-sm py-10">No data available</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                    {statusData.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Scholarship-wise applications */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Applications by Scholarship</h2>
          {loading ? <div className="skeleton h-48 rounded-lg" /> : scholarshipData.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-10">No data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={scholarshipData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} width={140} />
                <Tooltip />
                <Bar dataKey="Applications" fill="#7C3AED" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
