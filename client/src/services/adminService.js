import api from './api';

export const adminService = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  createOfficer: (data) => api.post('/admin/users/officer', data),
  toggleUserStatus: (id) => api.patch(`/admin/users/${id}/toggle-status`),
  getAuditLogs: (params) => api.get('/admin/audit-logs', { params }),
  getStatistics: () => api.get('/admin/statistics'),
  // Disbursements
  getDisbursements: () => api.get('/disbursements'),
  initiateDisbursement: (data) => api.post('/disbursements', data),
  updateDisbursement: (id, data) => api.patch(`/disbursements/${id}`, data),
};
