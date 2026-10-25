import api from './api';

export const applicationService = {
  create: (data) => api.post('/applications', data),
  getAll: (params) => api.get('/applications', { params }),
  getById: (id) => api.get(`/applications/${id}`),
  update: (id, data) => api.put(`/applications/${id}`, data),
  submit: (id) => api.post(`/applications/${id}/submit`),
  requestCorrection: (id, correctionReason) =>
    api.patch(`/applications/${id}/request-correction`, { correctionReason }),
  verify: (id, remarks) => api.patch(`/applications/${id}/verify`, { remarks }),
  approve: (id, remarks) => api.patch(`/applications/${id}/approve`, { remarks }),
  reject: (id, rejectionReason) => api.patch(`/applications/${id}/reject`, { rejectionReason }),
};
