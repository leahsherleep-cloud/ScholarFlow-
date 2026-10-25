import api from './api';

export const scholarshipService = {
  getAll: (params) => api.get('/scholarships', { params }),
  getById: (id) => api.get(`/scholarships/${id}`),
  checkEligibility: (id) => api.get(`/scholarships/${id}/eligibility`),
  create: (data) => api.post('/scholarships', data),
  update: (id, data) => api.put(`/scholarships/${id}`, data),
  updateStatus: (id, status) => api.patch(`/scholarships/${id}/status`, { status }),
  delete: (id) => api.delete(`/scholarships/${id}`),
};
