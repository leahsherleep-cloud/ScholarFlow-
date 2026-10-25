import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';
import { adminService } from '../../services/adminService';
import { formatDate } from '../../utils/helpers';
import { Users, Plus, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';
import Pagination from '../../components/ui/Pagination';
import SearchBar from '../../components/ui/SearchBar';
import FilterDropdown from '../../components/ui/FilterDropdown';
import toast from 'react-hot-toast';

const ROLES = [
  { value: '', label: 'All Roles' },
  { value: 'student', label: 'Student' },
  { value: 'officer', label: 'Officer' },
  { value: 'admin', label: 'Admin' },
];

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ role: '', search: '', page: 1, limit: 15 });
  const [officerModal, setOfficerModal] = useState(false);
  const [officerForm, setOfficerForm] = useState({ name: '', email: '', password: '' });
  const [creating, setCreating] = useState(false);
  const [toggling, setToggling] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = { ...filters };
      if (!params.role) delete params.role;
      if (!params.search) delete params.search;
      const res = await adminService.getUsers(params);
      setUsers(res.data.data || []);
      setPagination(res.data.pagination);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, [filters.role, filters.page]);

  const handleSearch = (e) => {
    if (e.key === 'Enter') fetchUsers();
  };

  const createOfficer = async () => {
    if (!officerForm.name || !officerForm.email || !officerForm.password) {
      toast.error('All fields required');
      return;
    }
    setCreating(true);
    try {
      await adminService.createOfficer(officerForm);
      toast.success('Officer account created');
      setOfficerModal(false);
      setOfficerForm({ name: '', email: '', password: '' });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create officer');
    } finally { setCreating(false); }
  };

  const toggleStatus = async (id) => {
    setToggling(id);
    try {
      const res = await adminService.toggleUserStatus(id);
      toast.success(res.data.message);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally { setToggling(null); }
  };

  const roleColors = {
    student: 'bg-purple-50 text-[#5B21B6] border border-purple-200/60',
    officer: 'bg-indigo-50 text-indigo-700 border border-indigo-200/60',
    admin: 'bg-slate-100 text-slate-800 border border-slate-300',
  };

  return (
    <DashboardLayout>
      <div className="fade-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-500 text-sm mt-1">Manage students, officers and administrators</p>
          </div>
          <button onClick={() => setOfficerModal(true)} className="btn-primary" id="create-officer-btn">
            <Plus className="w-4 h-4" /> Create Officer
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-5 flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-[240px]">
            <SearchBar
              placeholder="Search name or email..."
              value={filters.search}
              onChange={(val) => setFilters({ ...filters, search: val })}
              className="w-full"
            />
          </div>
          <div className="w-full sm:w-auto sm:min-w-[170px]">
            <FilterDropdown
              options={ROLES}
              value={filters.role}
              onChange={(val) => setFilters({ ...filters, role: val, page: 1 })}
              label="Filter by role"
              className="w-full"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 card-shadow overflow-hidden">
          {loading ? <LoadingSpinner text="Loading users..." /> : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Users className="w-12 h-12 text-gray-200 mb-3" />
              <p className="text-gray-500">No users found</p>
            </div>
          ) : (
            <>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Joined</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user._id}>
                        <td className="font-medium text-gray-900">{user.name}</td>
                        <td className="text-gray-500 text-sm">{user.email}</td>
                        <td>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${roleColors[user.role] || 'bg-gray-100 text-gray-600'}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="text-sm text-gray-500">{formatDate(user.createdAt)}</td>
                        <td>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          {user.role !== 'admin' && (
                            <button
                              onClick={() => toggleStatus(user._id)}
                              disabled={toggling === user._id}
                              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                                user.isActive
                                  ? 'border-red-200 text-red-600 hover:bg-red-50'
                                  : 'border-green-200 text-green-600 hover:bg-green-50'
                              }`}
                            >
                              {toggling === user._id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : user.isActive ? (
                                <ToggleLeft className="w-3 h-3" />
                              ) : (
                                <ToggleRight className="w-3 h-3" />
                              )}
                              {user.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination pagination={pagination} onPageChange={(p) => setFilters({ ...filters, page: p })} />
            </>
          )}
        </div>
      </div>

      {/* Create Officer Modal */}
      <Modal isOpen={officerModal} onClose={() => setOfficerModal(false)} title="Create Officer Account" size="md">
        <div className="space-y-4">
          <div>
            <label className="form-label">Full Name *</label>
            <input
              className="form-input"
              value={officerForm.name}
              onChange={(e) => setOfficerForm({ ...officerForm, name: e.target.value })}
              placeholder="Officer full name"
            />
          </div>
          <div>
            <label className="form-label">Email Address *</label>
            <input
              type="email"
              className="form-input"
              value={officerForm.email}
              onChange={(e) => setOfficerForm({ ...officerForm, email: e.target.value })}
              placeholder="officer@institution.edu"
            />
          </div>
          <div>
            <label className="form-label">Password *</label>
            <input
              type="password"
              className="form-input"
              value={officerForm.password}
              onChange={(e) => setOfficerForm({ ...officerForm, password: e.target.value })}
              placeholder="Min. 8 characters"
            />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setOfficerModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={createOfficer} disabled={creating} className="btn-primary flex-1">
              {creating ? 'Creating...' : 'Create Officer'}
            </button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
};

export default AdminUsers;
